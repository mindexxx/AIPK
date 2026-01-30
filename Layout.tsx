import React, { useState, useEffect } from 'react';
import { Cpu, Settings, Activity, GitCompare, User as UserIcon, LogIn, ChevronDown, ChevronRight, Building2, Database, FolderOpen, Box, Plus, Minus, Trash2 } from 'lucide-react';
import { Language, LABELS, UserProfile, CustomProductDatabase, CustomProductSeries, CustomProductModel } from '../types';
import { customDataService } from '../services/customDataService';

interface LayoutProps {
  children: React.ReactNode;
  onReset: () => void;
  onOpenSettings: () => void;
  onOpenHistory?: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  // Customization Props
  user: UserProfile | null;
  onSelectCompanyProfile: () => void;
  onSelectModel: (dbId: string, seriesId: string, modelId: string) => void;
  onDatabasesChange: (dbs: CustomProductDatabase[]) => void;
  databases: CustomProductDatabase[]; // Passed from App to keep state sync
  lang: Language;
  setLang: (l: Language) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, onReset, onOpenSettings, onOpenHistory, onOpenAuth, onOpenProfile, 
    user, onSelectCompanyProfile, onSelectModel, onDatabasesChange, databases,
    lang, setLang 
}) => {
  const t = LABELS[lang];
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);
  
  // Tree State (Keep track of expanded nodes IDs)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const next = new Set(expandedNodes);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpandedNodes(next);
  };

  // --- Database CRUD Operations Wrapper ---
  const addDatabase = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newDb: CustomProductDatabase = { id: Date.now().toString(), name: 'New DB', series: [] };
      const updated = [...databases, newDb];
      onDatabasesChange(updated);
      setExpandedNodes(prev => new Set(prev).add(newDb.id));
  };
  
  const deleteDatabase = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onDatabasesChange(databases.filter(d => d.id !== id));
  };

  const addSeries = (dbId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = databases.map(db => {
          if (db.id === dbId) {
             const newSeries: CustomProductSeries = { id: Date.now().toString(), name: 'New Series', models: [] };
             return { ...db, series: [...db.series, newSeries] };
          }
          return db;
      });
      onDatabasesChange(updated);
  };

  const deleteSeries = (dbId: string, seriesId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = databases.map(db => {
          if (db.id === dbId) {
             return { ...db, series: db.series.filter(s => s.id !== seriesId) };
          }
          return db;
      });
      onDatabasesChange(updated);
  };

  const addModel = (dbId: string, seriesId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = databases.map(db => {
          if (db.id === dbId) {
             const newSeries = db.series.map(s => {
                 if (s.id === seriesId) {
                     const newModel: CustomProductModel = { id: Date.now().toString(), name: 'New Model', indexes: [] };
                     return { ...s, models: [...s.models, newModel] };
                 }
                 return s;
             });
             return { ...db, series: newSeries };
          }
          return db;
      });
      onDatabasesChange(updated);
  };

  const deleteModel = (dbId: string, seriesId: string, modelId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = databases.map(db => {
          if (db.id === dbId) {
             const newSeries = db.series.map(s => {
                 if (s.id === seriesId) {
                     return { ...s, models: s.models.filter(m => m.id !== modelId) };
                 }
                 return s;
             });
             return { ...db, series: newSeries };
          }
          return db;
      });
      onDatabasesChange(updated);
  };

  const renameItem = (type: 'db'|'series'|'model', dbId: string, seriesId?: string, modelId?: string) => {
      const newName = prompt("Enter new name:");
      if (!newName) return;
      
      const updated = databases.map(db => {
          if (db.id === dbId) {
              if (type === 'db') return { ...db, name: newName };
              
              const newSeries = db.series.map(s => {
                  if (s.id === seriesId) {
                      if (type === 'series') return { ...s, name: newName };
                      
                      const newModels = s.models.map(m => {
                          if (m.id === modelId) return { ...m, name: newName };
                          return m;
                      });
                      return { ...s, models: newModels };
                  }
                  return s;
              });
              return { ...db, series: newSeries };
          }
          return db;
      });
      onDatabasesChange(updated);
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col shadow-sm z-20 h-screen md:sticky md:top-0">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onReset}>
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shadow-md">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-2xl tracking-tighter text-gray-900 leading-none">{t.title}</h1>
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-1">{t.subtitle}</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
          
          {/* Customization / User Profile Section - MOVED TO TOP */}
          <div className="mb-6">
             {user && user.isLoggedIn ? (
                 <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-gray-50/50">
                        <div className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={onOpenProfile}>
                             {user.avatar ? (
                                 <img src={user.avatar} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                             ) : (
                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                    {user.username[0].toUpperCase()}
                                </div>
                             )}
                             <div className="flex-1 min-w-0">
                                 <div className="text-sm font-bold text-gray-900 truncate">{user.username}</div>
                                 <div className="text-[10px] text-gray-500 truncate font-medium">{user.bio || 'Industrial User'}</div>
                             </div>
                             
                             {/* Fold Arrow */}
                             <div 
                                className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                onClick={(e) => { e.stopPropagation(); setIsCustomExpanded(!isCustomExpanded); }}
                            >
                                {isCustomExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                            </div>
                        </div>

                        {isCustomExpanded && (
                            <div className="bg-white border-t border-gray-100 pb-2 animate-fade-in">
                                {/* Company Profile */}
                                <button onClick={onSelectCompanyProfile} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border-l-2 border-transparent hover:border-blue-600">
                                    <Building2 className="w-4 h-4" />
                                    {t.companyProfile}
                                </button>
                                
                                {/* Product Database Root */}
                                <div className="mt-1">
                                    <div className="px-4 py-2 flex items-center justify-between group">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                            <Database className="w-4 h-4 text-blue-500" />
                                            {t.productDb}
                                        </div>
                                        <button onClick={addDatabase} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Add Database">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    {/* RECURSIVE TREE RENDERER */}
                                    <div className="ml-4 pl-3 border-l border-gray-200 space-y-1">
                                        {databases.map(db => (
                                            <div key={db.id}>
                                                <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 group cursor-pointer" onClick={(e) => toggleNode(db.id, e)}>
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {expandedNodes.has(db.id) ? <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                                                        <span className="text-sm text-gray-700 truncate font-medium" onDoubleClick={() => renameItem('db', db.id)}>{db.name}</span>
                                                    </div>
                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => addSeries(db.id, e)} className="p-1 hover:text-blue-600"><Plus className="w-3 h-3"/></button>
                                                        <button onClick={(e) => deleteDatabase(db.id, e)} className="p-1 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                                                    </div>
                                                </div>

                                                {/* SERIES LEVEL */}
                                                {expandedNodes.has(db.id) && (
                                                    <div className="ml-3 pl-3 border-l border-gray-100">
                                                        {db.series.map(series => (
                                                            <div key={series.id}>
                                                                <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 group cursor-pointer" onClick={(e) => toggleNode(series.id, e)}>
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        {expandedNodes.has(series.id) ? <FolderOpen className="w-3 h-3 text-yellow-500 flex-shrink-0" /> : <FolderOpen className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                                                                        <span className="text-sm text-gray-600 truncate" onDoubleClick={() => renameItem('series', db.id, series.id)}>{series.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button onClick={(e) => addModel(db.id, series.id, e)} className="p-1 hover:text-blue-600"><Plus className="w-3 h-3"/></button>
                                                                        <button onClick={(e) => deleteSeries(db.id, series.id, e)} className="p-1 hover:text-red-500"><Minus className="w-3 h-3"/></button>
                                                                    </div>
                                                                </div>

                                                                {/* MODEL LEVEL */}
                                                                {expandedNodes.has(series.id) && (
                                                                    <div className="ml-3 pl-3 border-l border-gray-100">
                                                                        {series.models.map(model => (
                                                                            <div 
                                                                                key={model.id} 
                                                                                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-blue-50 group cursor-pointer"
                                                                                onClick={() => onSelectModel(db.id, series.id, model.id)}
                                                                            >
                                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                                    <Box className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                                                                    <span className="text-sm text-gray-600 truncate" onDoubleClick={() => renameItem('model', db.id, series.id, model.id)}>{model.name}</span>
                                                                                </div>
                                                                                <button onClick={(e) => deleteModel(db.id, series.id, model.id, e)} className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100"><Minus className="w-3 h-3"/></button>
                                                                            </div>
                                                                        ))}
                                                                        {series.models.length === 0 && <div className="text-[10px] text-gray-300 px-2 py-1 italic">No models</div>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {db.series.length === 0 && <div className="text-[10px] text-gray-300 px-2 py-1 italic">No series</div>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
             ) : (
                 <button onClick={onOpenAuth} className="w-full flex items-center justify-start gap-3 px-3 py-3 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100 shadow-sm group">
                     <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 text-blue-600 group-hover:scale-110 transition-transform">
                        <UserIcon className="w-4 h-4" />
                     </div>
                     <span>{t.customization}</span>
                 </button>
             )}
          </div>

          {/* Main Items */}
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.dash}</div>
          <button onClick={onReset} className="w-full flex items-center justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors text-left">
            <GitCompare className="w-4 h-4 shrink-0" />
            {t.compEngine}
          </button>
          <button onClick={onOpenHistory} className="w-full flex items-center justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors text-left">
            <Activity className="w-4 h-4 shrink-0" />
            {t.history}
          </button>
          
          <div className="px-3 py-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.sys}</div>
           <button 
             onClick={onOpenSettings}
             className="w-full flex items-center justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors text-left" 
           >
            <Settings className="w-4 h-4 shrink-0" />
            {t.config}
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4 bg-white">
           {/* Language Switcher */}
           <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setLang('en')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${lang === 'en' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLang('cn')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${lang === 'cn' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
              >
                中文
              </button>
           </div>

           <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              {t.online}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative h-screen">
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};