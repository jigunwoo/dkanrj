import React, { useState } from 'react';

interface ApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ApiModal: React.FC<ApiModalProps> = ({ isOpen, onClose, onSave }) => {
  const [spitfireKey, setSpitfireKey] = useState('sp_live_9948271a0fd1829e8471');
  const [kontaktToken, setKontaktToken] = useState('kt_live_03928198f82aa74e892c');
  const [rolandHook, setRolandHook] = useState('rc_auth_78319082be8217319f01');
  const [wasmUrl, setWasmUrl] = useState('https://audio-node.soundcraft.internal/v1/dsp');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-low rounded-xl w-full max-w-xl p-6 shadow-2xl relative space-y-5 border border-surface-variant/40">
        <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">vpn_key</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              가상 악기 API 키 & 클라우드 VST 설정
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant">
          연동된 클라우드 샘플러 API 키를 등록하면 브라우저 내에서 무제한 고음질 로열티 프리 라이브러리를 스트리밍합니다.
        </p>

        <div className="space-y-3.5">
          <div className="p-3 rounded-lg bg-surface-container space-y-1.5 border border-surface-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                Spitfire Audio Orchestral API
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-primary">Connected</span>
            </div>
            <input
              type="password"
              value={spitfireKey}
              onChange={(e) => setSpitfireKey(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface font-label-mono-sm text-label-mono-sm px-3 py-1.5 rounded outline-none border border-surface-variant/20 focus:border-primary"
            />
          </div>

          <div className="p-3 rounded-lg bg-surface-container space-y-1.5 border border-surface-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                Kontakt Web Sampler Token
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-primary">Connected</span>
            </div>
            <input
              type="password"
              value={kontaktToken}
              onChange={(e) => setKontaktToken(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface font-label-mono-sm text-label-mono-sm px-3 py-1.5 rounded outline-none border border-surface-variant/20 focus:border-primary"
            />
          </div>

          <div className="p-3 rounded-lg bg-surface-container space-y-1.5 border border-surface-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                Roland Cloud SoundFont Hook
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-secondary">Authorized</span>
            </div>
            <input
              type="password"
              value={rolandHook}
              onChange={(e) => setRolandHook(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface font-label-mono-sm text-label-mono-sm px-3 py-1.5 rounded outline-none border border-surface-variant/20 focus:border-secondary"
            />
          </div>

          <div className="p-3 rounded-lg bg-surface-container space-y-1.5 border border-surface-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                Custom WASM WebAudio Endpoint URL
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-outline">Custom Node</span>
            </div>
            <input
              type="text"
              value={wasmUrl}
              onChange={(e) => setWasmUrl(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface font-label-mono-sm text-label-mono-sm px-3 py-1.5 rounded outline-none border border-surface-variant/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-body-sm text-body-sm hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            닫기
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm font-semibold hover:bg-primary-fixed transition-colors shadow-[0_0_12px_rgba(78,222,163,0.3)] cursor-pointer"
          >
            설정 저장 및 동기화
          </button>
        </div>
      </div>
    </div>
  );
};
