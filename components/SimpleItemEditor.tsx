import React, { useState, useEffect } from 'react';
import { Save, FileText, Database, FolderOpen } from 'lucide-react';
import { Language, LABELS } from '../types';

interface SimpleItemEditorProps {
  initialName: string;
  initialDescription?: string;
  type: 'database' | 'series';
  onSave: (name: string, description: string) => void;
  lang: Language;
}

export const SimpleItemEditor: React.FC<SimpleItemEditorProps> = ({ 
  initialName, 
  initialDescription = '', 
  type, 
  onSave, 
  lang 
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSaved, setIsSaved] = useState(false);
  const t = LABELS[lang];

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription || '');
    setIsSaved(false);
  }, [initialName, initialDescription]);

  const updateParent = (newName: string, newDesc: string) => {
      onSave(newName, newDesc);
  };

  const handleNameChange = (val: string) => {
      setName(val);
      updateParent(val, description);
  };

  const handleDescChange = (val: string) => {
      setDescription(val);
      updateParent(name, val);
  };

  const manualSave = () => {
    onSave(name, description);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const Icon = type === 'database' ? Database : FolderOpen;
  const title = type === 'database' ? t.dbEditor : t.seriesEditor;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 p-6 flex justify-between items-center bg-opacity-95 backdrop-blur-sm shadow-sm">
         <div className="flex items-center gap-4 flex-1">
            <div className={`p-3 rounded-xl ${type === 'database' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'}`}>
                <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</div>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="text-3xl font-black text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 w-full"
                    placeholder={t.enterName}
                />
            </div>
         </div>
         <button 
            onClick={manualSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
         >
            <Save className="w-5 h-5" />
            {isSaved ? t.saved : t.save}
         </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-bold text-gray-800">{t.description}</h3>
            </div>
            
            <textarea 
                value={description}
                onChange={(e) => handleDescChange(e.target.value)}
                className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y text-lg leading-relaxed text-gray-700 placeholder-gray-300"
                placeholder={`Write a description for this ${type}...`}
            />
        </div>
      </div>
    </div>
  );
};