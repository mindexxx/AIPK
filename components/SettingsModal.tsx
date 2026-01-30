
import React, { useState, useEffect } from 'react';
import { X, Globe, Cpu, Zap, MessageSquare, Shield, Check, Activity, Save, AlertTriangle, RotateCcw } from 'lucide-react';
import { Language, LABELS } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  lang: Language;
}

type Provider = 'gemini' | 'chatgpt' | 'claude' | 'deepseek' | 'doubao' | 'qwen';

interface ProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

// Default configurations
const DEFAULTS: Record<Provider, { baseURL: string, model: string, desc: string }> = {
  gemini: { baseURL: '', model: 'gemini-2.0-flash-exp', desc: 'Google DeepMind' },
  chatgpt: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o', desc: 'OpenAI GPT-4o' },
  claude: { baseURL: 'https://api.anthropic.com/v1/messages', model: 'claude-3-5-sonnet-20240620', desc: 'Claude 3.5 Sonnet' },
  deepseek: { baseURL: 'https://api.deepseek.com', model: 'deepseek-chat', desc: 'DeepSeek V3' },
  qwen: { baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', desc: 'Alibaba Qwen 2.5' },
  doubao: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'ep-2024123456-abcde', desc: 'Doubao Pro (Use Endpoint ID)' },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, lang }) => {
  const [activeProvider, setActiveProvider] = useState<Provider>('gemini');
  
  // Load saved configs or fallback to empty structure
  const [configs, setConfigs] = useState<Record<Provider, ProviderConfig>>(() => {
    const saved = localStorage.getItem('inducomp_provider_configs');
    // Migration: Check for old simple key storage
    const oldKeys = localStorage.getItem('inducomp_api_keys');
    let parsedOldKeys: any = {};
    if (oldKeys) {
        try { parsedOldKeys = JSON.parse(oldKeys); } catch(e) {}
    }

    if (saved) {
        return JSON.parse(saved);
    } else {
        // Initialize with defaults + any old keys found
        const initial: any = {};
        (Object.keys(DEFAULTS) as Provider[]).forEach(key => {
            initial[key] = {
                apiKey: parsedOldKeys[key] || '',
                baseURL: DEFAULTS[key].baseURL,
                model: DEFAULTS[key].model
            };
        });
        return initial;
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
     // Load active provider
     const savedActive = localStorage.getItem('inducomp_active_provider');
     if (savedActive && DEFAULTS[savedActive as Provider]) {
         setActiveProvider(savedActive as Provider);
     }
  }, []);

  const t = LABELS[lang];

  const providers = [
    { id: 'gemini', name: 'Google Gemini', icon: Globe, color: 'text-blue-600' },
    { id: 'chatgpt', name: 'OpenAI ChatGPT', icon: MessageSquare, color: 'text-green-600' },
    { id: 'claude', name: 'Anthropic Claude', icon: Shield, color: 'text-orange-600' },
    { id: 'deepseek', name: 'DeepSeek', icon: Cpu, color: 'text-purple-600' },
    { id: 'qwen', name: 'Alibaba Qwen', icon: Zap, color: 'text-indigo-600' },
    { id: 'doubao', name: 'ByteDance Doubao', icon: Activity, color: 'text-cyan-600' },
  ] as const;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('inducomp_provider_configs', JSON.stringify(configs));
      localStorage.setItem('inducomp_active_provider', activeProvider);
      
      // Also sync to old key for backward compatibility if needed, though mostly we use new config now
      const keysOnly: any = {};
      Object.keys(configs).forEach((k) => keysOnly[k] = configs[k as Provider].apiKey);
      localStorage.setItem('inducomp_api_keys', JSON.stringify(keysOnly));

      setIsSaving(false);
      setStatus(t.saved);
      setTimeout(() => setStatus(null), 3000);
    }, 500);
  };

  const updateConfig = (provider: Provider, field: keyof ProviderConfig, value: string) => {
    setConfigs(prev => ({
        ...prev,
        [provider]: {
            ...prev[provider],
            [field]: value
        }
    }));
  };

  const resetToDefault = (provider: Provider) => {
      if (confirm("Reset this provider to default settings?")) {
          setConfigs(prev => ({
              ...prev,
              [provider]: {
                  apiKey: prev[provider].apiKey, // Keep key
                  baseURL: DEFAULTS[provider].baseURL,
                  model: DEFAULTS[provider].model
              }
          }));
      }
  };

  const currentConfig = configs[activeProvider];
  const defaultDesc = DEFAULTS[activeProvider].desc;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-4xl shadow-xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
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
        <div className="flex-1 flex flex-col bg-white">
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

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6 animate-fade-in">
                
                {/* Header Info */}
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100`}>
                        {(() => {
                            const P = providers.find(p => p.id === activeProvider)!;
                            const Icon = P.icon;
                            return <Icon className={`w-6 h-6 ${P.color}`} />;
                        })()}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {providers.find(p => p.id === activeProvider)?.name}
                        </h3>
                        <p className="text-sm text-gray-500">{defaultDesc}</p>
                    </div>
                    <div className="ml-auto">
                         <button 
                            onClick={() => resetToDefault(activeProvider)}
                            className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                         >
                            <RotateCcw className="w-3 h-3" /> Reset Defaults
                         </button>
                    </div>
                </div>

                <div className="space-y-5">
                    
                    {/* API Key Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            {t.apiKey} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={currentConfig?.apiKey || ''}
                            onChange={(e) => updateConfig(activeProvider, 'apiKey', e.target.value)}
                            placeholder={`sk-...`}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500">
                            Your key is stored locally in your browser.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        {/* Model Name Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Model Name</label>
                            <input
                                type="text"
                                value={currentConfig?.model || ''}
                                onChange={(e) => updateConfig(activeProvider, 'model', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            />
                             {activeProvider === 'doubao' && (
                                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                    <strong>Important:</strong> For Doubao, enter your specific <strong>Endpoint ID</strong> here (e.g. <code>ep-20250215...</code>), not "doubao-pro".
                                </p>
                            )}
                        </div>

                        {/* Base URL Input */}
                        {activeProvider !== 'gemini' && (
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">API Base URL</label>
                                <input
                                    type="text"
                                    value={currentConfig?.baseURL || ''}
                                    onChange={(e) => updateConfig(activeProvider, 'baseURL', e.target.value)}
                                    placeholder="https://api..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {activeProvider !== 'gemini' && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 text-blue-900 text-xs leading-relaxed">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                            <div>
                                <strong>CORS Warning:</strong> If you see network errors, the provider might block browser requests. You may need a local proxy or allow-list your domain.
                            </div>
                        </div>
                    )}
                </div>
            </div>
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
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 shadow-sm"
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
