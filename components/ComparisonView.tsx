import React from 'react';
import { ComparisonResult, Language, LABELS } from '../types';
import { Check, Trophy, ArrowRight, Minus, AlertTriangle, AlertOctagon, Download } from 'lucide-react';
import { generatePDFFromDOM } from '../services/pdfService';

interface ComparisonViewProps {
  data: ComparisonResult;
  modelA: string;
  modelB: string;
  onStartSimulation: () => void;
  lang: Language;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ data, modelA, modelB, onStartSimulation, lang }) => {
  const isWinnerA = data.powerWinner === 'A';
  const isWinnerB = data.powerWinner === 'B';
  const t = LABELS[lang];

  // Safe access helpers
  const productA = data.productA || { pros: [], category: 'Unknown' };
  const productB = data.productB || { pros: [], category: 'Unknown' };
  
  const prosA = Array.isArray(productA.pros) ? productA.pros : [];
  const prosB = Array.isArray(productB.pros) ? productB.pros : [];
  const specs = Array.isArray(data.sharedSpecs) ? data.sharedSpecs : [];
  const diffs = Array.isArray(data.differences) ? data.differences : [];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">Specification</span>
             <span className="text-xs text-gray-500">{productA.category || 'General'}</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{modelA} <span className="text-gray-400 font-light">vs</span> {modelB}</h2>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
            onClick={onStartSimulation}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm"
            >
            {t.proceed}
            <ArrowRight className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* CONTENT TO CAPTURE */}
      <div id="comparison-report-container" className="space-y-8 bg-white p-4">
        
        {/* WARNING ALERTS */}
        {data.warning && data.warning.type !== 'NONE' && (
            <div className={`rounded-xl p-6 border-l-4 shadow-sm ${
                data.warning.type === 'IDENTICAL' 
                    ? 'bg-amber-50 border-amber-400 text-amber-900' 
                    : 'bg-red-50 border-red-500 text-red-900'
            }`}>
                <div className="flex items-start gap-4">
                    {data.warning.type === 'IDENTICAL' ? <AlertTriangle className="w-8 h-8 shrink-0" /> : <AlertOctagon className="w-8 h-8 shrink-0" />}
                    <div>
                        <h3 className="text-lg font-bold uppercase tracking-wide mb-1">
                            {data.warning.type === 'IDENTICAL' ? 'Identical Products Detected' : 'Incompatible Categories'}
                        </h3>
                        <p className="font-medium text-sm leading-relaxed opacity-90">
                            {data.warning.message}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* Verdict */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">{t.verdict}</h3>
            <p className="text-gray-600 leading-relaxed text-lg">{data.verdict}</p>
        </div>

        {/* Side-by-Side Specs Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{t.specs}</h3>
            </div>
            <div className="grid grid-cols-3 bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider py-2 px-6 border-b border-gray-200">
                <div>Parameter</div>
                <div>{modelA}</div>
                <div>{modelB}</div>
            </div>
            <div className="divide-y divide-gray-100">
                {specs.map((spec, idx) => (
                    <div key={idx} className="grid grid-cols-3 py-3 px-6 hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-medium text-gray-500">{spec.name}</div>
                        <div className="text-sm font-semibold text-blue-900">{spec.valueA}</div>
                        <div className="text-sm font-semibold text-purple-900">{spec.valueB}</div>
                    </div>
                ))}
                {specs.length === 0 && <div className="p-6 text-center text-gray-400 italic">No shared specs available.</div>}
            </div>
        </div>

        {/* Highlights */}
        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-900">{modelA} {t.highlights}</h3>
                    {isWinnerA && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Trophy className="w-3 h-3"/> Winner</span>}
                </div>
                <ul className="space-y-2">
                    {prosA.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            {pro}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-900">{modelB} {t.highlights}</h3>
                    {isWinnerB && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Trophy className="w-3 h-3"/> Winner</span>}
                </div>
                <ul className="space-y-2">
                    {prosB.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            {pro}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        
        {/* Key Differences */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Notable Differences</h4>
            <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                {diffs.slice(0, 4).map((diff, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        {diff}
                    </li>
                ))}
            </ul>
            {diffs.length === 0 && <div className="text-gray-400 text-sm italic">No differences found.</div>}
        </div>

      </div>
    </div>
  );
};