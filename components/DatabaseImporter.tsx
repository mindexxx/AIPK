import React, { useState } from 'react';
import { Upload, FileText, Check, Loader2, X, AlertTriangle, Database, Folder, Box, FileSpreadsheet, FileType } from 'lucide-react';
import { extractTextFromFile } from '../services/documentParser';
import { parseProductManual } from '../services/geminiService';
import { CustomProductDatabase, Language, LABELS } from '../types';

interface DatabaseImporterProps {
  onClose: () => void;
  onImport: (db: CustomProductDatabase) => void;
  lang: Language;
}

export const DatabaseImporter: React.FC<DatabaseImporterProps> = ({ onClose, onImport, lang }) => {
  const t = LABELS[lang];
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<CustomProductDatabase | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (e.g. 10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        setError(lang === 'cn' ? '文件过大 (最大 10MB)' : 'File too large (Max 10MB)');
        return;
    }

    setStep('processing');
    setProcessingStatus(lang === 'cn' ? `正在读取文件: ${file.name}` : `Reading file: ${file.name}`);
    setError(null);

    try {
      // 1. Extract Text from any supported file
      const text = await extractTextFromFile(file);
      
      // 2. Parse with AI
      setProcessingStatus(lang === 'cn' ? 'AI 正在分析数据结构...' : 'AI Analyzing Data Structure...');
      const dbStructure = await parseProductManual(text, lang);
      
      setExtractedData(dbStructure);
      setStep('review');
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.importError);
      setStep('upload');
    }
  };

  const handleConfirmImport = () => {
    if (extractedData) {
      onImport(extractedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            {lang === 'cn' ? '导入数据文件' : 'Import Data File'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-2 animate-bounce">
                <FileSpreadsheet className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t.uploadTitle}</h3>
              <p className="text-gray-500 text-center max-w-sm">
                {lang === 'cn' 
                    ? '支持 PDF, Excel, Word, CSV, TXT 等格式。上传产品手册或参数表，AI 将自动整理。' 
                    : 'Supports PDF, Excel, Word, CSV, TXT. Upload manuals or spec sheets, AI will organize them.'}
              </p>
              
              <label className="mt-6 inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium cursor-pointer transition-all shadow-sm">
                <Upload className="w-4 h-4" />
                {lang === 'cn' ? '选择文件' : 'Select File'}
                <input 
                    type="file" 
                    accept=".pdf,.xlsx,.xls,.csv,.docx,.txt,.md,.json" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                />
              </label>

              <div className="flex gap-4 mt-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1"><FileType className="w-3 h-3"/> PDF</div>
                  <div className="flex items-center gap-1"><FileSpreadsheet className="w-3 h-3"/> Excel</div>
                  <div className="flex items-center gap-1"><FileText className="w-3 h-3"/> Word</div>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-gray-900">{t.analyzingDoc}</h3>
                <p className="text-sm text-gray-500">{processingStatus}</p>
              </div>
            </div>
          )}

          {step === 'review' && extractedData && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                 <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <Check className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="font-bold text-green-900">{t.analysisComplete}</h4>
                    <p className="text-sm text-green-700">{t.reviewImport}</p>
                 </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                 <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2 font-bold text-gray-800">
                    <Database className="w-4 h-4 text-blue-600" />
                    {extractedData.name}
                 </div>
                 <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-500 italic mb-2">{extractedData.description || "No description found."}</p>
                    
                    {extractedData.series.map((series, sIdx) => (
                        <div key={sIdx} className="ml-2 border-l-2 border-yellow-200 pl-4 space-y-2">
                             <div className="flex items-center gap-2 font-semibold text-gray-800">
                                <Folder className="w-4 h-4 text-yellow-500" />
                                {series.name}
                             </div>
                             <div className="ml-2 space-y-2">
                                {series.models.map((model, mIdx) => (
                                    <div key={mIdx} className="bg-gray-50 rounded border border-gray-100 p-2 text-sm">
                                        <div className="flex items-center gap-2 font-medium text-blue-900 mb-1">
                                            <Box className="w-3 h-3 text-blue-500" />
                                            {model.name}
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 pl-5">
                                            {model.indexes.map((idx, iIdx) => (
                                                <div key={iIdx} className="text-xs text-gray-600 flex justify-between border-b border-gray-200 border-dashed pb-0.5">
                                                    <span>{idx.name}:</span>
                                                    <span className="font-mono">{idx.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {step === 'review' && (
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-3">
             <button onClick={() => setStep('upload')} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">
                {t.cancel}
             </button>
             <button onClick={handleConfirmImport} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm">
                {t.confirmImport}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};