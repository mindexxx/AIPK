import React, { useState, useEffect } from 'react';
import { SimulationRule, ExpectedResultQuery, Language, LABELS } from '../types';
import { Plus, Trash2, Play, Sliders, HelpCircle } from 'lucide-react';

interface SimulationFormProps {
  modelA: string;
  modelB: string;
  initialRules?: SimulationRule[];
  initialQueries?: ExpectedResultQuery[];
  onRunSimulation: (rules: SimulationRule[], results: ExpectedResultQuery[]) => void;
  lang: Language;
}

export const SimulationForm: React.FC<SimulationFormProps> = ({ 
  modelA, 
  modelB, 
  initialRules = [], 
  initialQueries = [], 
  onRunSimulation,
  lang
}) => {
  const t = LABELS[lang];
  const [rules, setRules] = useState<SimulationRule[]>(
    initialRules.length > 0 
      ? initialRules 
      : [{ id: '1', name: 'Load / Usage', value: '100', unit: '%' }]
  );

  const [queries, setQueries] = useState<ExpectedResultQuery[]>(
    initialQueries.length > 0
      ? initialQueries
      : [{ id: '1', query: 'Which is more efficient?' }]
  );

  useEffect(() => {
    if (initialRules.length > 0) setRules(initialRules);
    if (initialQueries.length > 0) setQueries(initialQueries);
  }, [initialRules, initialQueries]);

  const addRule = () => setRules([...rules, { id: Date.now().toString(), name: '', value: '', unit: '' }]);
  const removeRule = (id: string) => setRules(rules.filter(r => r.id !== id));
  const updateRule = (id: string, field: keyof SimulationRule, value: string) => setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));

  const addQuery = () => setQueries([...queries, { id: Date.now().toString(), query: '' }]);
  const removeQuery = (id: string) => setQueries(queries.filter(q => q.id !== id));
  const updateQuery = (id: string, value: string) => setQueries(queries.map(q => q.id === id ? { ...q, query: value } : q));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunSimulation(rules, queries);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.configTitle}</h2>
        <p className="text-gray-500">
          {t.configDesc}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Rules Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-gray-400" />
              {t.params}
            </h3>
            <button type="button" onClick={addRule} className="text-xs font-medium flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Parameter (e.g. Load)"
                    value={rule.name}
                    onChange={(e) => updateRule(rule.id, 'name', e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 text-gray-900 placeholder-gray-400 text-sm font-medium"
                    required
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="w-24">
                        <input
                        type="text"
                        placeholder="Value"
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                        className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 text-gray-900 placeholder-gray-400 text-sm text-right"
                        required
                        />
                    </div>
                    <div className="w-16">
                      <input
                      type="text"
                      placeholder="Unit"
                      value={rule.unit}
                      onChange={(e) => updateRule(rule.id, 'unit', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 text-gray-500 placeholder-gray-300 text-sm"
                      />
                    </div>
                </div>
                {rules.length > 1 && (
                  <button type="button" onClick={() => removeRule(rule.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 md:mt-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expected Results Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              {t.queries}
            </h3>
            <button type="button" onClick={addQuery} className="text-xs font-medium flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          <div className="space-y-3">
            {queries.map((q) => (
              <div key={q.id} className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                <span className="text-gray-400 text-xs font-semibold px-2">Q</span>
                <input
                  type="text"
                  placeholder="What is your specific question?"
                  value={q.query}
                  onChange={(e) => updateQuery(q.id, e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-sm"
                  required
                />
                {queries.length > 1 && (
                   <button type="button" onClick={() => removeQuery(q.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button 
            type="submit"
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium shadow-sm transition-all hover:scale-[1.01]"
          >
            <Play className="w-4 h-4 fill-current" />
            {t.run}
          </button>
        </div>
      </form>
    </div>
  );
};