import React, { useState } from 'react';
import { X, Globe, Cpu, Zap, MessageSquare, Shield, Check, Activity, Save, AlertTriangle } from 'lucide-react';
import { Language, LABELS } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  lang: Language;
}

type Provider = 'gemini' | 'chatgpt' | 'claude' | 'deepseek' | 'doubao' | 'qwen';

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, lang }) => {
  const [activeProvider, setActiveProvider] = useState<Provider>('gemini');
  const [keys, setKeys] = useState<Record<Provider, string>>(() => {
    const saved = localStorage.getItem('inducomp_api_keys');
    return saved ? JSON.parse(saved) : {
      gemini: '',
      chatgpt: '',
      claude: '',
      deepseek: '',
      doubao: '',
      qwen: ''
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const t = LABELS[lang];

  const providers = [
    { id: 'gemini', name: 'Google Gemini', icon: Globe, color: 'text-blue-600', desc: 'Google DeepMind' },
    { id: 'chatgpt', name: 'OpenAI ChatGPT', icon: MessageSquare, color: 'text-green-600', desc: 'OpenAI GPT-4o' },
    { id: 'claude', name: 'Anthropic Claude', icon: Shield, color: 'text-orange-600', desc: 'Claude 3.5 Sonnet' },
    { id: 'deepseek', name: 'DeepSeek', icon: Cpu, color: 'text-purple-600', desc: 'DeepSeek V3' },
    { id: 'qwen', name: 'Alibaba Qwen', icon: Zap, color: 'text-indigo-600', desc: 'Qwen 2.5' },
    { id: 'doubao', name: 'ByteDance Doubao', icon: Activity, color: 'text-cyan-600', desc: 'Doubao Pro' },
  ] as const;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('inducomp_api_keys', JSON.stringify(keys));
      localStorage.setItem('inducomp_active_provider', activeProvider);
      setIsSaving(false);
      setStatus(t.saved);
      setTimeout(() => setStatus(null), 3000);
    }, 800);
  };

  const handleKeyChange = (provider: Provider, value: string) => {
    setKeys(prev => ({ ...prev, [provider]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-4xl shadow-xl flex flex-col md:flex-row overflow-hidden max-h-[80vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-2 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">{t.provider}</h3>
          {providers.map((p) => {
            const Icon = p.icon;
            const isActive = activeProvider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveProvider(p.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? p.color : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className={isActive ? 'text-gray-900' : 'text-gray-500'}>{p.name}</div>
                </div>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {t.settings}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {providers.map((p) => {
              if (p.id !== activeProvider) return null;
              const Icon = p.icon;
              return (
                <div key={p.id} className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100 ${p.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                      <p className="text-sm text-gray-500">{p.desc}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t.apiKey}</label>
                      <input
                        type="password"
                        value={keys[p.id]}
                        onChange={(e) => handleKeyChange(p.id, e.target.value)}
                        placeholder={`sk-...`}
                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        {p.id === 'gemini' && <span className="text-blue-600 ml-1">Default key available.</span>}
                      </p>
                    </div>

                    {p.id !== 'gemini' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-amber-900 text-xs leading-relaxed">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                            <div>
                                {t.providerWarning}
                            </div>
                        </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="text-sm">
              {status && (
                <span className="text-green-600 flex items-center gap-2 animate-fade-in font-medium">
                  <Check className="w-4 h-4" /> {status}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                {t.close}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : t.save}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};