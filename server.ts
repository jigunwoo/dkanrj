import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Search Grounded Music Production Tips & Track Research
app.post('/api/search-music-info', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        text: `검색 정보 (${query}): 최신 음악 제작 트렌드와 믹싱 테크닉을 적용할 수 있습니다. 템포와 스케일을 분석하여 최적의 사운드를 구성하세요.`,
        sources: [],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an expert music producer and audio engineer. Answer the user query using up-to-date music production and sound design knowledge: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    res.json({
      text: response.text || '검색 결과를 가져왔습니다.',
      sources: response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [],
    });
  } catch (error: any) {
    console.error('Search grounding error:', error);
    res.status(500).json({
      error: error.message || 'Error executing search grounded music info',
    });
  }
});

// API: Generate Music with Lyria
app.post('/api/generate-music', async (req, res) => {
  try {
    const { prompt, model = 'lyria-3-clip-preview' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured in environment secrets.',
      });
    }

    const responseStream = await ai.models.generateContentStream({
      model: model, // 'lyria-3-clip-preview' or 'lyria-3-pro-preview'
      contents: prompt,
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    res.json({
      audioBase64,
      mimeType,
      lyrics,
      prompt,
    });
  } catch (error: any) {
    console.error('Lyria generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate music with Lyria',
    });
  }
});

// Setup Vite in Development or Static Serve in Production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Obsidian Soundcraft DAW running at http://localhost:${PORT}`);
  });
}

startServer();
