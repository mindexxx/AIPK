import React, { useState } from 'react';
import { Plus, Minus, Save, FileText, Upload, Settings, Trash2 } from 'lucide-react';
import { CustomProductModel, CustomIndex, Language, LABELS } from '../types';

const truncate = (str: string, n: number) => {
  if (!str) return '';
  return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
};

// Inline Delete Button Component
const DeleteIndexButton = ({ onDelete, t }: { onDelete: (e: React.MouseEvent) => void, t: any }) => {
    const [confirm, setConfirm] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (confirm) {
            onDelete(e);
        } else {
            setConfirm(true);
            setTimeout(() => setConfirm(false), 3000);
        }
    };

    return (
        <button 
            type="button"
            onClick={handleClick}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg transition-all ${confirm ? 'bg-red-500 text-white shadow-sm scale-105' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
            title="Delete Index"
        >
            <Trash2 className="w-4 h-4" />
            {confirm ? t.confirm : t.delete}
        </button>
    );
};

interface ProductModelEditorProps {
  model: CustomProductModel;
  onSave: (updatedModel: CustomProductModel) => void;
  lang: Language;
}

export const ProductModelEditor: React.FC<ProductModelEditorProps> = ({ model, onSave, lang }) => {
  const [localModel, setLocalModel] = useState<CustomProductModel>(model);
  const [isSaved, setIsSaved] = useState(false);
  const t = LABELS[lang];

  // Sync state ONLY when switching to a different model ID
  React.useEffect(() => {
    setLocalModel(model);
    setIsSaved(false);
  }, [model.id]);

  // Update Parent immediately on any change to persist data
  const updateModel = (newModel: CustomProductModel) => {
    setLocalModel(newModel);
    onSave(newModel); // Auto-save to parent
  };

  const manualSave = () => {
    onSave(localModel);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const addIndex = () => {
    const newIndex: CustomIndex = {
        id: Date.now().toString(),
        name: 'New Index',
        value: '',
        type: 'text'
    };
    updateModel({ ...localModel, indexes: [...localModel.indexes, newIndex] });
  };

  const removeIndex = (id: string, e: React.MouseEvent) => {
    updateModel({ ...localModel, indexes: localModel.indexes.filter(i => i.id !== id) });
  };

  const updateIndex = (id: string, field: keyof CustomIndex, value: any) => {
    updateModel({
        ...localModel,
        indexes: localModel.indexes.map(idx => idx.id === id ? { ...idx, [field]: value } : idx)
    });
  };

  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
             const updated = {
                ...localModel,
                indexes: localModel.indexes.map(idx => {
                    if (idx.id === id) {
                        return { ...idx, fileData: reader.result as string, value: file.name, type: 'file' as const };
                    }
                    return idx;
                })
            };
            updateModel(updated);
        };
        reader.readAsDataURL(file);
     }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 p-6 flex justify-between items-center bg-opacity-95 backdrop-blur-sm shadow-sm">
         <div className="flex-1 mr-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.modelEditor}</div>
            <input 
                type="text" 
                value={localModel.name}
                onChange={(e) => updateModel({...localModel, name: e.target.value})}
                className="text-3xl font-black text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 w-full"
            />
         </div>
         <button 
            onClick={manualSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
         >
            <Save className="w-5 h-5" />
            {isSaved ? t.saved : t.save}
         </button>
      </div>

      <div className="px-6 grid gap-4 max-w-4xl mx-auto">
         <div className="flex justify-between items-center mt-4 mb-2">
            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t.indexes}
            </h3>
            <button onClick={addIndex} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition-colors">
                <Plus className="w-4 h-4" /> {t.createIndex}
            </button>
         </div>

         {localModel.indexes.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                <p>{t.noIndexes}</p>
                <button onClick={addIndex} className="text-blue-600 font-bold hover:underline mt-2">{t.createIndex}</button>
            </div>
         )}

         {/* Index List */}
         {localModel.indexes.map((idx, index) => (
             <div key={idx.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
                 {/* Card Header with Delete Button */}
                 <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Index #{index + 1}</span>
                    <DeleteIndexButton onDelete={(e) => removeIndex(idx.id, e)} t={t} />
                 </div>

                 <div className="flex flex-col md:flex-row gap-6">
                    {/* Index Definition */}
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">{t.indexName}</label>
                        <input 
                            type="text" 
                            value={idx.name}
                            onChange={(e) => updateIndex(idx.id, 'name', e.target.value)}
                            className="w-full text-lg font-bold text-gray-900 border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                            placeholder="e.g. Power Output"
                        />
                    </div>

                    {/* Value Input */}
                    <div className="flex-[2] space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase">{t.valueData}</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateIndex(idx.id, 'type', 'text')}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${idx.type === 'text' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                                >
                                    TEXT
                                </button>
                                <button 
                                    onClick={() => updateIndex(idx.id, 'type', 'file')}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${idx.type === 'file' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                                >
                                    FILE
                                </button>
                            </div>
                        </div>

                        {idx.type === 'text' ? (
                            <input 
                                type="text"
                                value={idx.value}
                                onChange={(e) => updateIndex(idx.id, 'value', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="e.g. 1200 kW"
                            />
                        ) : (
                            <div className="flex items-center gap-3">
                                <label className="flex-1 bg-gray-50 border border-gray-200 border-dashed rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-100 flex items-center justify-center gap-2 text-gray-500 text-sm">
                                    <Upload className="w-4 h-4" />
                                    {idx.value ? truncate(idx.value, 20) : t.clickUpload}
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(idx.id, e)} />
                                </label>
                                {idx.fileData && (
                                    <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center text-green-600" title="File Uploaded">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
};