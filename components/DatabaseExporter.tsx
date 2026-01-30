import React, { useState, useEffect } from 'react';
import { DownloadCloud, Database, X, Check, FileSpreadsheet, CheckSquare, Square } from 'lucide-react';
import { CustomProductDatabase, Language, LABELS } from '../types';
import { exportDatabasesToExcel } from '../services/excelExportService';

interface DatabaseExporterProps {
  databases: CustomProductDatabase[];
  onClose: () => void;
  lang: Language;
}

export const DatabaseExporter: React.FC<DatabaseExporterProps> = ({ databases, onClose, lang }) => {
  const t = LABELS[lang];
  // Multi-selection state: Start with the first one selected for convenience if exists
  const [selectedDbIds, setSelectedDbIds] = useState<Set<string>>(() => {
    return new Set(databases.length > 0 ? [databases[0].id] : []);
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleDb = (id: string) => {
    const newSet = new Set(selectedDbIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedDbIds(newSet);
  };

  const toggleAll = () => {
    if (selectedDbIds.size === databases.length) {
        setSelectedDbIds(new Set()); // Deselect all
    } else {
        setSelectedDbIds(new Set(databases.map(d => d.id))); // Select all
    }
  };

  const handleExport = () => {
    const selectedDbs = databases.filter(d => selectedDbIds.has(d.id));
    if (selectedDbs.length === 0) return;

    setIsExporting(true);
    
    // Small delay to allow UI to update
    setTimeout(() => {
        try {
            exportDatabasesToExcel(selectedDbs);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Export failed:", error);
            setIsExporting(false);
            alert("Export failed. See console for details.");
        }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-green-600" />
            {t.exportDbTitle}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-500 text-sm">
                    {t.exportDbDesc}
                </p>
            </div>

            {databases.length === 0 ? (
                <div className="text-center text-red-500 font-medium py-4">
                    {lang === 'cn' ? '暂无数据库可导出' : 'No databases available to export'}
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-700">{t.selectDbToExport}</label>
                        <button 
                            onClick={toggleAll}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            {selectedDbIds.size === databases.length 
                                ? (lang === 'cn' ? '取消全选' : 'Deselect All') 
                                : (lang === 'cn' ? '全选' : 'Select All')}
                        </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar border border-gray-100 rounded-lg p-1">
                        {databases.map(db => {
                            const isSelected = selectedDbIds.has(db.id);
                            return (
                                <button
                                    key={db.id}
                                    onClick={() => toggleDb(db.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-left ${
                                        isSelected 
                                            ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-sm' 
                                            : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                                    }`}
                                >
                                    {isSelected 
                                        ? <CheckSquare className="w-5 h-5 text-blue-600 shrink-0" /> 
                                        : <Square className="w-5 h-5 text-gray-300 shrink-0" />
                                    }
                                    <Database className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <span className="font-medium text-sm truncate">{db.name}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="text-right text-xs text-gray-400">
                        {selectedDbIds.size} {lang === 'cn' ? '个已选择' : 'selected'}
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-3">
             <button 
                onClick={onClose} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
                disabled={isExporting}
            >
                {t.cancel}
             </button>
             <button 
                onClick={handleExport}
                disabled={selectedDbIds.size === 0 || isExporting || success}
                className={`px-6 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all ${
                    success 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
             >
                {success ? (
                    <><Check className="w-4 h-4" /> {t.exportSuccess}</>
                ) : isExporting ? (
                    <span className="animate-pulse">{t.downloading}</span>
                ) : (
                    <><DownloadCloud className="w-4 h-4" /> {t.exportConfirm}</>
                )}
             </button>
        </div>
      </div>
    </div>
  );
};
