import React, { useState } from 'react';
import { InstrumentPreset } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface VirtualInstrumentsProps {
  onLoadToPianoRoll: (instrumentName: string) => void;
  onOpenApiModal: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const VirtualInstruments: React.FC<VirtualInstrumentsProps> = ({
  onLoadToPianoRoll,
  onOpenApiModal,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [currentInst, setCurrentInst] = useState({
    title: 'Steinway Studio Grand',
    engine: 'Spitfire Web VST • Bank A',
    icon: 'piano',
    ram: '348 MB',
    layers: '16 Layers',
  });

  // Sounding states for toggle sound ("눌러서 소리를 나타내는 기능에서 한번 더 누르면 그 소리가 사라지게")
  const [auditioningPresetId, setAuditioningPresetId] = useState<string | null>(null);
  const [isTestKeyPlaying, setIsTestKeyPlaying] = useState<boolean>(false);

  // 4 Rotary Tone Shaper Knobs
  const [toneVal, setToneVal] = useState<number>(68);
  const [spaceVal, setSpaceVal] = useState<number>(50);
  const [attackVal, setAttackVal] = useState<number>(25);
  const [warmthVal, setWarmthVal] = useState<number>(60);

  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [spectrumHeights, setSpectrumHeights] = useState<number[]>([
    16, 32, 56, 80, 64, 48, 36, 24, 32, 44, 28, 16, 12,
  ]);

  const triggerSpectrumBurst = () => {
    setIsTransmitting(true);
    setSpectrumHeights([
      Math.floor(Math.random() * 60 + 20),
      Math.floor(Math.random() * 70 + 25),
      Math.floor(Math.random() * 80 + 20),
      Math.floor(Math.random() * 85 + 25),
      Math.floor(Math.random() * 75 + 20),
      Math.floor(Math.random() * 65 + 15),
      Math.floor(Math.random() * 55 + 15),
      Math.floor(Math.random() * 50 + 15),
      Math.floor(Math.random() * 65 + 20),
      Math.floor(Math.random() * 70 + 20),
      Math.floor(Math.random() * 55 + 15),
      Math.floor(Math.random() * 40 + 10),
      Math.floor(Math.random() * 30 + 10),
    ]);

    setTimeout(() => {
      setSpectrumHeights([16, 32, 56, 80, 64, 48, 36, 24, 32, 44, 28, 16, 12]);
      setIsTransmitting(false);
    }, 1200);
  };

  const presets: InstrumentPreset[] = [
    {
      id: 'steinway',
      name: 'Steinway Studio Grand',
      category: 'keys',
      categoryLabel: 'Keyboards & Pianos',
      engine: 'Spitfire Web VST',
      badge: 'Spitfire API',
      badgeColor: 'bg-primary/10 text-primary',
      description: '마이애미 스튜디오 룸 앰비언스를 온전히 캡처한 88건반 고해상도 콘서트 그랜드 피아노 음원.',
      icon: 'piano',
      soundType: 'piano',
      ramUsage: '348 MB',
      velocityLayers: '16 Layers',
    },
    {
      id: 'rhodes',
      name: 'Rhodes Electric 73',
      category: 'keys',
      categoryLabel: 'Vintage Tine E-Piano',
      engine: 'Roland Cloud VST',
      badge: 'Roland Cloud',
      badgeColor: 'bg-secondary/10 text-secondary',
      description: '1970년대 빈티지 톤 제너레이터와 오리지널 진공관 프리앰프 오버드라이브가 가미된 온기 있는 사운드.',
      icon: 'music_note',
      soundType: 'rhodes',
      ramUsage: '210 MB',
      velocityLayers: '12 Layers',
    },
    {
      id: 'felt',
      name: 'Neo Felt Piano',
      category: 'keys',
      categoryLabel: 'Cinematic Soft Upright',
      engine: 'Kontakt Web Engine',
      badge: 'Kontakt Web',
      badgeColor: 'bg-tertiary/10 text-tertiary',
      description: '펠트 천을 덧대어 먹먹하면서도 감성적인 로우파이 및 영화 배경음악 특화 업라이트 음색.',
      icon: 'nightlife',
      soundType: 'felt',
      ramUsage: '280 MB',
      velocityLayers: '10 Layers',
    },
    {
      id: 'violin',
      name: 'Solo Violin Staccato',
      category: 'strings',
      categoryLabel: 'Concert Hall Soloist',
      engine: 'Spitfire Orchestral',
      badge: 'Spitfire API',
      badgeColor: 'bg-primary/10 text-primary',
      description: '민첩한 보잉 테크닉과 섬세한 레가토 트랜지션을 지원하는 프리미엄 솔로 바이올린 가상 악기.',
      icon: 'audiotrack',
      soundType: 'violin',
      ramUsage: '520 MB',
      velocityLayers: '18 Layers',
    },
    {
      id: 'cellos',
      name: 'Cellos Ensemble',
      category: 'strings',
      categoryLabel: 'Symphonic Low Register',
      engine: 'Kontakt Orchestral',
      badge: 'Kontakt Web',
      badgeColor: 'bg-primary/10 text-primary',
      description: '12인 첼로 앙상블의 묵직하고 웅장한 저음역대 서스테인과 다이내믹 익스프레션 레이어.',
      icon: 'graphic_eq',
      soundType: 'cello',
      ramUsage: '640 MB',
      velocityLayers: '20 Layers',
    },
    {
      id: 'moog',
      name: 'Analog Moog Bass',
      category: 'synths',
      categoryLabel: '24dB Ladder Monosynth',
      engine: 'WebAudio WASM',
      badge: 'WASM Engine',
      badgeColor: 'bg-primary/10 text-primary',
      description: '사다리꼴 로우패스 필터의 펀치감 넘치는 팻(Fat) 베이스. 서브 베이스 튠과 완벽 조화.',
      icon: 'speaker_group',
      soundType: 'bass',
      ramUsage: '94 MB',
      velocityLayers: 'Direct Synth',
    },
    {
      id: 'cs80',
      name: 'Blade Runner Poly',
      category: 'synths',
      categoryLabel: 'CS-80 Cinematic Lead',
      engine: 'Roland Cloud VST',
      badge: 'Roland Cloud',
      badgeColor: 'bg-secondary/10 text-secondary',
      description: '네온 사이버펑크 감성의 광활한 리버브와 아날로그 드리프트 오실레이터 패드 리드.',
      icon: 'electric_bolt',
      soundType: 'poly',
      ramUsage: '145 MB',
      velocityLayers: '8 Poly Voices',
    },
    {
      id: 'tr808',
      name: 'TR-808 Classic',
      category: 'drums',
      categoryLabel: 'Legendary Rhythm Machine',
      engine: 'Roland Rhythm Core',
      badge: 'Roland Cloud',
      badgeColor: 'bg-tertiary-container/20 text-tertiary',
      description: '트랩, 힙합의 심장인 딥 붐 킥과 스내피한 스네어, 클랩, 핑 하이햇 오리지널 샘플링 세트.',
      icon: 'grid_view',
      soundType: 'drums',
      ramUsage: '64 MB',
      velocityLayers: '16 Drum Pads',
    },
  ];

  const filteredPresets = presets.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Sound Toggle: Click once to audition, click again to stop
  const handleAuditionToggle = (preset: InstrumentPreset) => {
    const voiceId = `audition-${preset.id}`;

    if (auditioningPresetId === preset.id) {
      audioEngine.stopSound(voiceId);
      setAuditioningPresetId(null);
      onShowToast(`'${preset.name}' 소리 정지됨`);
    } else {
      if (auditioningPresetId) {
        audioEngine.stopSound(`audition-${auditioningPresetId}`);
      }
      audioEngine.playSound(preset.soundType, preset.category === 'drums' ? 'C3' : 'C4', 3.0, 115, voiceId);
      setAuditioningPresetId(preset.id);
      triggerSpectrumBurst();
      onShowToast(`'${preset.name}' 오디션 재생 중 (한번 더 누르면 소리 멈춤)`, 'volume_up');
    }
  };

  const handleLoadInstrument = (preset: InstrumentPreset) => {
    setCurrentInst({
      title: preset.name,
      engine: `${preset.engine} • Ready`,
      icon: preset.icon,
      ram: preset.ramUsage,
      layers: preset.velocityLayers,
    });
    onLoadToPianoRoll(preset.name);
    triggerSpectrumBurst();
    onShowToast(`'${preset.name}' 악기가 피아노 롤 시퀀서에 로드되었습니다!`, 'check_circle');
  };

  const handleToneChange = () => {
    const next = (toneVal + 15) % 105 || 15;
    setToneVal(next);
    audioEngine.setTone(next / 100);
    triggerSpectrumBurst();
  };

  const handleSpaceChange = () => {
    const next = (spaceVal + 15) % 105 || 15;
    setSpaceVal(next);
    audioEngine.setSpace(next / 100);
    triggerSpectrumBurst();
  };

  const handleAttackChange = () => {
    const next = (attackVal + 15) % 105 || 10;
    setAttackVal(next);
    audioEngine.setAttack(next / 100);
    triggerSpectrumBurst();
  };

  const handleWarmthChange = () => {
    const next = (warmthVal + 15) % 105 || 15;
    setWarmthVal(next);
    audioEngine.setWarmth(next / 100);
    triggerSpectrumBurst();
  };

  const handleResetMacros = () => {
    setToneVal(50);
    setSpaceVal(30);
    setAttackVal(10);
    setWarmthVal(40);
    audioEngine.setTone(0.5);
    audioEngine.setSpace(0.3);
    audioEngine.setAttack(0.1);
    audioEngine.setWarmth(0.4);
    onShowToast('모든 사운드 매크로 노브가 초기화되었습니다.');
  };

  // Sound Toggle: Test Key
  const handleTestKeyToggle = () => {
    const testVoiceId = 'macro-test-c3';
    if (isTestKeyPlaying) {
      audioEngine.stopAllSounds();
      setIsTestKeyPlaying(false);
      onShowToast('테스트 건반 타건 정지됨');
    } else {
      setIsTestKeyPlaying(true);
      audioEngine.playEasyToneTest('C3');
      triggerSpectrumBurst();
      onShowToast('C3 화음 타건 테스트 재생 중 (다시 누르면 정지)', 'piano');
      setTimeout(() => setIsTestKeyPlaying(false), 2000);
    }
  };

  return (
    <div className="flex flex-col w-full select-none">
      <div className="px-6 py-5 space-y-6">
        {/* Top API Engine Connection Status Banner */}
        <section className="bg-surface-container-low rounded-xl p-5 shadow-xl relative overflow-hidden border border-surface-variant/30">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-2xl">hub</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-headline-md text-on-surface">
                    가상 악기 API 연동 센터
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-label-mono-sm text-label-mono-sm flex items-center gap-1 border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    ACTIVE CLUSTER
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  클라우드 VST 샘플러 및 WebAudio DSP 파이프라인 실시간 동기화 상태
                </p>
              </div>
            </div>

            {/* Telemetry Pill Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-lg bg-surface-container-lowest flex items-center gap-2 shadow-sm border border-surface-variant/30">
                <span className="material-symbols-outlined text-primary text-base">speed</span>
                <div className="flex flex-col">
                  <span className="font-label-ui text-label-ui text-outline">LATENCY</span>
                  <span className="font-label-mono-md text-label-mono-md text-primary font-semibold">
                    4.2ms <span className="text-on-surface-variant font-normal text-xs">(Ultra Low)</span>
                  </span>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-surface-container-lowest flex items-center gap-2 shadow-sm border border-surface-variant/30">
                <span className="material-symbols-outlined text-secondary text-base">graphic_eq</span>
                <div className="flex flex-col">
                  <span className="font-label-ui text-label-ui text-outline">ENGINE STREAM</span>
                  <span className="font-label-mono-md text-label-mono-md text-secondary font-semibold">
                    48kHz / 24-bit
                  </span>
                </div>
              </div>

              <button
                onClick={onOpenApiModal}
                className="px-3.5 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-all shadow-md border border-surface-variant/30 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-base">settings_input_component</span>
                <span>API 키 엔드포인트 관리</span>
              </button>
            </div>
          </div>
        </section>

        {/* Main Section: Browser & Preset Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-4 flex flex-col space-y-4">
            <div className="bg-surface-container-low rounded-xl p-4 shadow-md space-y-3 border border-surface-variant/30">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-lg">tune</span>
                  카테고리 탐색기
                </span>
                <span className="font-label-mono-sm text-label-mono-sm text-outline px-2 py-0.5 rounded bg-surface-container-high">
                  총 {presets.length}개 악기
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: '전체 (All)', count: 12, colSpan: '' },
                  { id: 'keys', label: '건반 & 피아노', count: 3, colSpan: '' },
                  { id: 'strings', label: '오케스트라 스트링', count: 3, colSpan: '' },
                  { id: 'synths', label: '신디사이저', count: 3, colSpan: '' },
                  { id: 'drums', label: '비트 & 드럼 키트', count: 3, colSpan: 'col-span-2' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-lg text-left font-body-sm text-body-sm flex items-center justify-between transition-all cursor-pointer ${
                      cat.colSpan
                    } ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-on-primary font-semibold shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="font-label-mono-sm text-label-mono-sm opacity-80">{cat.count}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant/30">
                  <span className="material-symbols-outlined text-outline text-lg">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="악기 명칭, 음색 태그 검색..."
                    className="bg-transparent border-0 outline-none text-on-surface font-body-sm text-body-sm placeholder:text-outline w-full"
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 shadow-md space-y-3 relative overflow-hidden border border-surface-variant/30">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-label-ui uppercase tracking-wider text-outline">
                  현재 랙 장착 악기
                </span>
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(78,222,163,0.9)] animate-pulse" />
              </div>

              <div className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-lg border border-surface-variant/20">
                <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-2xl">{currentInst.icon}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                    {currentInst.title}
                  </span>
                  <span className="font-label-mono-sm text-label-mono-sm text-primary">{currentInst.engine}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2 rounded bg-surface-container border border-surface-variant/20">
                  <span className="font-label-ui text-label-ui text-outline block">RAM 점유율</span>
                  <span className="font-label-mono-md text-label-mono-md text-on-surface">{currentInst.ram}</span>
                </div>
                <div className="p-2 rounded bg-surface-container border border-surface-variant/20">
                  <span className="font-label-ui text-label-ui text-outline block">벨로시티 레이어</span>
                  <span className="font-label-mono-md text-label-mono-md text-on-surface">{currentInst.layers}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Preset Cards Grid with Toggle Sound Audition */}
          <section className="lg:col-span-8 flex flex-col space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="font-headline-md text-headline-md text-on-surface">악기 프리셋 라이브러리</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  오디션 버튼을 한번 누르면 재생되고, 다시 누르면 소리가 즉시 멈춥니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPresets.map((preset) => {
                const isAuditioning = auditioningPresetId === preset.id;

                return (
                  <article
                    key={preset.id}
                    className="bg-surface-container-low hover:bg-surface-container rounded-xl p-4 shadow-lg transition-all flex flex-col justify-between group border border-surface-variant/30"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-xl">{preset.icon}</span>
                          </div>
                          <div>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors">
                              {preset.name}
                            </h3>
                            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                              {preset.categoryLabel}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-label-mono-sm ${preset.badgeColor}`}>
                          {preset.badge}
                        </span>
                      </div>

                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-2.5 line-clamp-2">
                        {preset.description}
                      </p>

                      <div className="my-3 h-8 bg-surface-container-lowest rounded-md p-1.5 flex items-center justify-center gap-1 border border-surface-variant/20">
                        <span className={`w-1 h-3 rounded-full ${isAuditioning ? 'bg-primary animate-bounce' : 'bg-primary/70'}`} />
                        <span className={`w-1 h-6 rounded-full ${isAuditioning ? 'bg-primary animate-bounce' : 'bg-primary'}`} />
                        <span className={`w-1 h-4 rounded-full ${isAuditioning ? 'bg-primary animate-bounce' : 'bg-primary/80'}`} />
                        <span className={`w-1 h-7 rounded-full ${isAuditioning ? 'bg-primary animate-bounce' : 'bg-primary'}`} />
                        <span className="w-1 h-5 bg-primary/70 rounded-full" />
                        <span className="w-1 h-2 bg-primary/50 rounded-full" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      {/* Audition Button with Toggle Sound Functionality */}
                      <button
                        onClick={() => handleAuditionToggle(preset)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-mono-sm text-label-mono-sm transition-all cursor-pointer border active:scale-95 ${
                          isAuditioning
                            ? 'bg-tertiary-container text-on-tertiary-container border-tertiary-container ring-1 ring-tertiary shadow-[0_0_10px_rgba(255,114,177,0.7)]'
                            : 'bg-surface-container-high hover:bg-surface-variant text-on-surface border-surface-variant/30'
                        }`}
                        title="한번 누르면 재생, 다시 누르면 정지"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isAuditioning ? 'stop_circle' : 'volume_up'}
                        </span>
                        <span>{isAuditioning ? '소리 정지' : '오디션'}</span>
                      </button>

                      <button
                        onClick={() => handleLoadInstrument(preset)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:bg-primary-fixed transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">queue_music</span>
                        <span>피아노 롤에 로드</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        {/* Bottom Section: Easy Tone Shaper & Test Key Toggle */}
        <section className="bg-surface-container-low rounded-xl p-5 shadow-2xl relative overflow-hidden border border-surface-variant/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-surface-variant/30 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-xl">instant_mix</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  초보자 사운드 셰이핑 매크로 (Easy Tone Shaper)
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  건반 타건 버튼을 한번 누르면 소리가 재생되고, 다시 누르면 즉시 멈춥니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetMacros}
                className="px-3 py-1.5 rounded-lg bg-surface-container text-outline hover:text-on-surface font-label-mono-sm text-label-mono-sm transition-colors border border-surface-variant/30 cursor-pointer"
              >
                기본값 복원
              </button>
              <button
                onClick={handleTestKeyToggle}
                className={`px-4 py-1.5 rounded-lg font-body-sm text-body-sm font-semibold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer ${
                  isTestKeyPlaying
                    ? 'bg-tertiary-container text-on-tertiary-container ring-2 ring-tertiary'
                    : 'bg-primary-container text-on-primary-container hover:bg-primary'
                }`}
                title="한번 누르면 재생, 다시 누르면 멈춤"
              >
                <span className="material-symbols-outlined text-base">
                  {isTestKeyPlaying ? 'stop_circle' : 'piano'}
                </span>
                <span>{isTestKeyPlaying ? '소리 정지 (Stop)' : '테스트 건반 타건 (C3)'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-center">
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-3 rounded-xl bg-surface-container-lowest/80 text-center relative group border border-surface-variant/20">
                <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider mb-2">TONE / 밝기</span>
                <div onClick={handleToneChange} className="relative w-24 h-24 flex items-center justify-center cursor-pointer select-none">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle className="text-surface-variant" cx="48" cy="48" r="38" fill="transparent" stroke="currentColor" strokeWidth="6" />
                    <circle className="text-primary transition-all duration-75" cx="48" cy="48" r="38" fill="transparent" stroke="currentColor" strokeDasharray="238.76" strokeDashoffset={238.76 - (toneVal / 100) * 238.76} strokeLinecap="round" strokeWidth="6" />
                  </svg>
                  <div className="absolute inset-2.5 rounded-full bg-surface-container flex flex-col items-center justify-center shadow-lg group-hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-primary text-lg">wb_sunny</span>
                    <span className="font-label-mono-md text-label-mono-md text-on-surface font-semibold">{toneVal}%</span>
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-2">Dark ↔ Bright</span>
              </div>

              <div className="flex flex-col items-center p-3 rounded-xl bg-surface-container-lowest/80 text-center relative group border border-surface-variant/20">
                <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider mb-2">SPACE / 공간감</span>
                <div onClick={handleSpaceChange} className="relative w-24 h-24 flex items-center justify-center cursor-pointer select-none">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle className="text-surface-variant" cx="48" cy="48" r="38" fill="transparent" stroke="currentColor" strokeWidth="6" />
                    <circle className="text-secondary transition-all duration-75" cx="48" cy="48" r="38" fill="transparent" stroke="currentColor" strokeDasharray="238.76" strokeDashoffset={238.76 - (spaceVal / 100) * 238.76} strokeLinecap="round" strokeWidth="6" />
                  </svg>
                  <div className="absolute inset-2.5 rounded-full bg-surface-container flex flex-col items-center justify-center shadow-lg group-hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-secondary text-lg">blur_on</span>
                    <span className="font-label-mono-md text-label-mono-md text-on-surface font-semibold">{spaceVal}%</span>
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-2">Dry ↔ Reverb</span>
              </div>

              <div className="flex flex-col items-center p-3 rounded-xl bg-surface-container-lowest/80 text-center relative group border border-surface-variant/20">
                <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider mb-2">ATTACK / 반응속도</span>
                <div onClick={handleAttackChange} className="relative w-24 h-24 flex items-center justify-center cursor-pointer select-none">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle className="text-surface-variant" cx="48" cy="48" r="38" fill="transparent" stroke="currentColor" strokeWidth="6" />
                    <circle className="text-tertiary transition-all duration-75" cx="48" cy="48" r="38" fill="transparent" stroke="currentColor" strokeDasharray="238.76" strokeDashoffset={238.76 - (attackVal / 100) * 238.76} strokeLinecap="round" strokeWidth="6" />
                  </svg>
                  <div className="absolute inset-2.5 rounded-full bg-surface-container flex flex-col items-center justify-center shadow-lg group-hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-tertiary text-lg">speed</span>
                    <span className="font-label-mono-md text-label-mono-md text-on-surface font-semibold">{attackVal}%</span>
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-2">Pluck ↔ Pad</span>
              </div>

              <div className="flex flex-col items-center p-3 rounded-xl bg-surface-container-lowest/80 text-center relative group border border-surface-variant/20">
                <span className="font-label-ui text-label-ui text-outline uppercase tracking-wider mb-2">WARMTH / 질감</span>
                <div onClick={handleWarmthChange} className="relative w-24 h-24 flex items-center justify-center cursor-pointer select-none">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle className="text-surface-variant" cx="48" cy="48" r="38" fill="transparent" stroke="currentColor" strokeWidth="6" />
                    <circle className="text-primary-fixed-dim transition-all duration-75" cx="48" cy="48" r="38" fill="transparent" stroke="currentColor" strokeDasharray="238.76" strokeDashoffset={238.76 - (warmthVal / 100) * 238.76} strokeLinecap="round" strokeWidth="6" />
                  </svg>
                  <div className="absolute inset-2.5 rounded-full bg-surface-container flex flex-col items-center justify-center shadow-lg group-hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-lg">local_fire_department</span>
                    <span className="font-label-mono-md text-label-mono-md text-on-surface font-semibold">{warmthVal}%</span>
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-2">Clean ↔ Saturation</span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-4 flex flex-col justify-between h-full min-h-[160px] shadow-inner border border-surface-variant/30">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base animate-pulse">equalizer</span>
                  <span className="font-label-ui text-label-ui text-on-surface-variant uppercase tracking-wider">
                    실시간 주파수 반응 (Spectrum)
                  </span>
                </div>
                <span className={`font-label-mono-sm text-label-mono-sm font-bold ${isTransmitting ? 'text-secondary animate-pulse' : 'text-primary'}`}>
                  {isTransmitting ? 'TRANSMITTING' : 'IDLE'}
                </span>
              </div>

              <div className="h-24 w-full flex items-end justify-between gap-1 py-1 px-2">
                {spectrumHeights.map((h, i) => (
                  <div key={i} style={{ height: `${h}px` }} className={`w-1.5 rounded-t transition-all duration-150 ${i < 5 ? 'bg-primary' : i < 8 ? 'bg-secondary' : 'bg-tertiary'}`} />
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 text-outline font-label-mono-sm text-label-mono-sm">
                <span>20 Hz</span>
                <span>1 kHz</span>
                <span>20 kHz</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
