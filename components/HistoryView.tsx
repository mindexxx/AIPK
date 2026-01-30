import React, { useState, useEffect } from 'react';
import { HistoryItem, Language, LABELS } from '../types';
import { Clock, ArrowRight, Trash2, FileText, Activity, AlertCircle, Download } from 'lucide-react';

interface HistoryViewProps {
  onLoadItem: (item: HistoryItem) => void;
  lang: Language;
  onExportItem?: (item: HistoryItem) => void; // New prop for PDF export
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onLoadItem, lang, onExportItem }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const t = LABELS[lang];

  useEffect(() => {
    const saved = localStorage.getItem('inducomp_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('inducomp_history', JSON.stringify(newHistory));
  };

  const handleExport = (item: HistoryItem, e: React.MouseEvent) => {
      e.stopPropagation();
      if (onExportItem) {
          onExportItem(item);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.historyTitle}</h2>
            <p className="text-sm text-gray-500 mt-1">{t.historyDesc}</p>
         </div>
         <div className="bg-blue-50 text-blue-800 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
             <AlertCircle className="w-3.5 h-3.5" />
             {t.maxHistory}
         </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl border-dashed">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t.noHistory}</p>
        </div>
      ) : (
        <div className="grid gap-4">
            {history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => onLoadItem(item)}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'COMPARISON' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                {item.type === 'COMPARISON' ? <FileText className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    {item.modelA} <span className="text-gray-400 font-light text-sm">vs</span> {item.modelB}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.timestamp).toLocaleString()}
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span className="uppercase tracking-wider font-semibold">{item.type}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             <button 
                                onClick={(e) => handleExport(item, e)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                title={t.exportPdf}
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title={t.delete}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="bg-gray-100 group-hover:bg-blue-600 group-hover:text-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                {t.load}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};