import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Settings, Activity, GitCompare, User as UserIcon, LogIn, ChevronDown, ChevronRight, Building2, Database, FolderOpen, Box, Plus, Minus, Trash2, Edit2, RotateCcw, UploadCloud, DownloadCloud } from 'lucide-react';
import { Language, LABELS, UserProfile, CustomProductDatabase, CustomProductSeries, CustomProductModel } from '../types';
import { customDataService } from '../services/customDataService';

interface LayoutProps {
  children: React.ReactNode;
  onNavigateComparison: () => void;
  onNewAnalysis: () => void;
  onOpenSettings: () => void;
  onOpenHistory?: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenImporter: () => void;
  onOpenExporter: () => void; // Added prop
  // Customization Props
  user: UserProfile | null;
  onSelectCompanyProfile: () => void;
  onSelectModel: (dbId: string, seriesId: string, modelId: string) => void;
  onEditDatabase: (dbId: string) => void;
  onEditSeries: (dbId: string, seriesId: string) => void;
  onDatabasesChange: (dbs: CustomProductDatabase[]) => void;
  databases: CustomProductDatabase[]; // Passed from App to keep state sync
  lang: Language;
  setLang: (l: Language) => void;
}

// Inline Helper for Action Buttons with Confirmation
const SidebarActions = ({ 
    onEdit, onAdd, onDelete, canAdd = true, t 
}: { 
    onEdit?: (e: React.MouseEvent) => void, 
    onAdd?: (e: React.MouseEvent) => void, 
    onDelete?: (e: React.MouseEvent) => void, 
    canAdd?: boolean,
    t: any
}) => {
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (confirmDelete) {
            onDelete?.(e);
            setConfirmDelete(false);
        } else {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 3000);
        }
    };

    return (
        <div 
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded px-1"
            onClick={(e) => e.stopPropagation()} 
        >
             {onEdit && <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(e); }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit Info"><Edit2 className="w-3 h-3"/></button>}
             {canAdd && onAdd && <button type="button" onClick={onAdd} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Add Item"><Plus className="w-3 h-3"/></button>}
             {onDelete && (
                 <button 
                    type="button" 
                    onClick={handleDelete} 
                    className={`p-1 rounded transition-all flex items-center ${confirmDelete ? 'bg-red-500 text-white hover:bg-red-600' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                    title="Delete"
                 >
                    {confirmDelete ? <span className="text-[10px] px-1 font-bold whitespace-nowrap">{t.sure}</span> : <Trash2 className="w-3 h-3"/>}
                 </button>
             )}
        </div>
    );
};

// Helper to detect default names and translate them dynamically
const getDefaultNames = (type: 'db' | 'series' | 'model') => {
    // Collect default strings from all languages
    const keys = type === 'db' ? 'addDb' : type === 'series' ? 'addSeries' : 'addModel';
    return [
        LABELS['en'][keys],
        LABELS['cn'][keys]
    ];
};

const getDisplayName = (name: string, type: 'db' | 'series' | 'model', t: any) => {
    const defaults = getDefaultNames(type);
    if (defaults.includes(name)) {
        return t[type === 'db' ? 'addDb' : type === 'series' ? 'addSeries' : 'addModel'];
    }
    return name;
};

export const Layout: React.FC<LayoutProps> = ({ 
    children, onNavigateComparison, onNewAnalysis, onOpenSettings, onOpenHistory, onOpenAuth, onOpenProfile, onOpenImporter, onOpenExporter,
    user, onSelectCompanyProfile, onSelectModel, onEditDatabase, onEditSeries, onDatabasesChange, databases,
    lang, setLang 
}) => {
  const t = LABELS[lang];
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);
  
  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(288); // Default 288px (w-72)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Tree State (Keep track of expanded nodes IDs)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Handle Resize Events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        // Limit min and max width
        const newWidth = Math.max(240, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizing]);

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
      const newDb: CustomProductDatabase = { id: Date.now().toString(), name: t.addDb, series: [] };
      const updated = [...databases, newDb];
      onDatabasesChange(updated);
      setExpandedNodes(prev => new Set(prev).add(newDb.id));
  };
  
  const deleteDatabase = (id: string, e: React.MouseEvent) => {
      onDatabasesChange(databases.filter(d => d.id !== id));
  };

  const addSeries = (dbId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      // Ensure we ONLY add a series, NO auto-added models
      const updated = databases.map(db => {
          if (db.id === dbId) {
             const newSeries: CustomProductSeries = { 
                 id: Date.now().toString(), 
                 name: t.addSeries, 
                 models: [] // Empty models array
             };
             return { ...db, series: [...db.series, newSeries] };
          }
          return db;
      });
      onDatabasesChange(updated);
      setExpandedNodes(prev => new Set(prev).add(dbId));
  };

  const deleteSeries = (dbId: string, seriesId: string, e: React.MouseEvent) => {
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
                     const newModel: CustomProductModel = { id: Date.now().toString(), name: t.addModel, indexes: [] };
                     return { ...s, models: [...s.models, newModel] };
                 }
                 return s;
             });
             return { ...db, series: newSeries };
          }
          return db;
      });
      onDatabasesChange(updated);
      setExpandedNodes(prev => new Set(prev).add(seriesId));
  };

  const deleteModel = (dbId: string, seriesId: string, modelId: string, e: React.MouseEvent) => {
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

  // Helper for model renaming inline (since models have full editor, this is just quick rename)
  const renameModel = (dbId: string, seriesId: string, modelId: string) => {
      const newName = prompt("Enter new name:");
      if (!newName) return;
      const updated = databases.map(db => {
          if (db.id === dbId) {
              const newSeries = db.series.map(s => {
                  if (s.id === seriesId) {
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar - FIXED Position with Dynamic Width */}
      <aside 
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        className="fixed top-0 left-0 bottom-0 bg-white border-r border-gray-200 flex flex-col shadow-sm z-30 hidden md:flex select-none"
      >
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onNavigateComparison}>
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shadow-md">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h1 className="font-black text-2xl tracking-tighter text-gray-900 leading-none truncate">{t.title}</h1>
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-1 truncate">{t.subtitle}</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
          
          {/* Customization / User Profile Section */}
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
                                        
                                        <div className="flex items-center">
                                            {/* Export Button */}
                                            <button onClick={onOpenExporter} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-green-600 transition-colors mr-1" title="Export Database to Excel">
                                                <DownloadCloud className="w-3 h-3" />
                                            </button>

                                            {/* Import Button */}
                                            <button onClick={onOpenImporter} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-colors mr-1" title="Import from PDF">
                                                <UploadCloud className="w-3 h-3" />
                                            </button>
                                            
                                            <button onClick={addDatabase} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Add Database">
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* RECURSIVE TREE RENDERER */}
                                    <div className="ml-4 pl-3 border-l border-gray-200 space-y-1">
                                        {databases.map(db => (
                                            <div key={db.id}>
                                                <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 group cursor-pointer" onClick={(e) => toggleNode(db.id, e)}>
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {expandedNodes.has(db.id) ? <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                                                        <span className="text-sm text-gray-700 truncate font-medium" onDoubleClick={() => onEditDatabase(db.id)}>
                                                            {getDisplayName(db.name, 'db', t)}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Database Actions */}
                                                    <SidebarActions 
                                                        t={t}
                                                        onEdit={() => onEditDatabase(db.id)}
                                                        onAdd={(e) => addSeries(db.id, e)}
                                                        onDelete={(e) => deleteDatabase(db.id, e)}
                                                    />
                                                </div>

                                                {/* SERIES LEVEL */}
                                                {expandedNodes.has(db.id) && (
                                                    <div className="ml-3 pl-3 border-l border-gray-100">
                                                        {db.series.map(series => (
                                                            <div key={series.id}>
                                                                <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 group cursor-pointer" onClick={(e) => toggleNode(series.id, e)}>
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        {expandedNodes.has(series.id) ? <FolderOpen className="w-3 h-3 text-yellow-500 flex-shrink-0" /> : <FolderOpen className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                                                                        <span className="text-sm text-gray-600 truncate" onDoubleClick={() => onEditSeries(db.id, series.id)}>
                                                                            {getDisplayName(series.name, 'series', t)}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    {/* Series Actions */}
                                                                    <SidebarActions 
                                                                        t={t}
                                                                        onEdit={() => onEditSeries(db.id, series.id)}
                                                                        onAdd={(e) => addModel(db.id, series.id, e)}
                                                                        onDelete={(e) => deleteSeries(db.id, series.id, e)}
                                                                    />
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
                                                                                    <span className="text-sm text-gray-600 truncate" onDoubleClick={() => renameModel(db.id, series.id, model.id)}>
                                                                                        {getDisplayName(model.name, 'model', t)}
                                                                                    </span>
                                                                                </div>
                                                                                
                                                                                {/* Model Actions */}
                                                                                <SidebarActions 
                                                                                    t={t}
                                                                                    canAdd={false}
                                                                                    onEdit={() => onSelectModel(db.id, series.id, model.id)} 
                                                                                    onDelete={(e) => deleteModel(db.id, series.id, model.id, e)}
                                                                                />
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
          
          <button onClick={onNavigateComparison} className="w-full flex items-center justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors text-left">
            <GitCompare className="w-4 h-4 shrink-0" />
            {t.compEngine}
          </button>
          
          <button onClick={onNewAnalysis} className="w-full flex items-center justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-green-600 rounded-md transition-colors text-left ml-2 border-l border-gray-200">
             <RotateCcw className="w-3 h-3 shrink-0" />
             {t.newComparison}
          </button>

          <button onClick={onOpenHistory} className="w-full flex items-center justify-start gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors text-left mt-1">
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
        
        {/* Resize Handle */}
        <div 
          onMouseDown={() => setIsResizing(true)}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-50"
        ></div>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto relative min-h-screen transition-all duration-75"
        style={{ marginLeft: `${sidebarWidth}px` }} 
      >
        <div className="max-w-6xl mx-auto p-6 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};