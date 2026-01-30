import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AppState, ComparisonResult, SimulationResult, SimulationRule, ExpectedResultQuery, Language, LABELS, AIAction, HistoryItem, UserProfile, CustomProductDatabase, CustomProductModel, CustomProductSeries } from './types';
import { compareProducts, runSimulation } from './services/geminiService';
import { customDataService } from './services/customDataService';
import { ComparisonView } from './components/ComparisonView';
import { SimulationForm } from './components/SimulationForm';
import { SimulationResultView } from './components/SimulationResultView';
import { SettingsModal } from './components/SettingsModal';
import { FloatingChat } from './components/FloatingChat';
import { HistoryView } from './components/HistoryView';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CompanyProfileView } from './components/CompanyProfileView';
import { ProductModelEditor } from './components/ProductModelEditor';
import { SimpleItemEditor } from './components/SimpleItemEditor';
import { ModelInput } from './components/ModelInput';
import { DatabaseImporter } from './components/DatabaseImporter'; 
import { DatabaseExporter } from './components/DatabaseExporter'; // Import new component
import { Loader2, ArrowRight, ChevronLeft } from 'lucide-react';
import { generatePDFFromDOM } from './services/pdfService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.INPUT_MODELS);
  const [lastComparisonState, setLastComparisonState] = useState<AppState>(AppState.INPUT_MODELS);
  
  const [lang, setLang] = useState<Language>('cn');
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showImporter, setShowImporter] = useState(false); 
  const [showExporter, setShowExporter] = useState(false); // New State
  
  // Core Data State
  const [modelA, setModelA] = useState('');
  const [modelB, setModelB] = useState('');
  // Store the full local model object if found via autocomplete
  const [localModelA, setLocalModelA] = useState<CustomProductModel | null>(null);
  const [localModelB, setLocalModelB] = useState<CustomProductModel | null>(null);

  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Customization State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [databases, setDatabases] = useState<CustomProductDatabase[]>([]);
  const [selectedModel, setSelectedModel] = useState<CustomProductModel | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<CustomProductDatabase | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<CustomProductSeries | null>(null);
  const [activeDbId, setActiveDbId] = useState<string>('');
  const [activeSeriesId, setActiveSeriesId] = useState<string>('');

  // Hidden PDF Printing State
  const [pdfExportItem, setPdfExportItem] = useState<{
      modelA: string,
      modelB: string,
      comparison: ComparisonResult | null,
      simulation: SimulationResult | null
  } | null>(null);

  const t = LABELS[lang];

  // Initialize Custom Data
  useEffect(() => {
    setUser(customDataService.getUser());
    setDatabases(customDataService.getDatabases());
  }, []);

  // Track the last active comparison state to resume later
  useEffect(() => {
    const comparisonStates = [
        AppState.INPUT_MODELS, 
        AppState.LOADING_SPECS, 
        AppState.VIEW_SPECS, 
        AppState.SETUP_SIMULATION, 
        AppState.LOADING_SIMULATION, 
        AppState.VIEW_SIMULATION
    ];
    if (comparisonStates.includes(state)) {
        setLastComparisonState(state);
    }
  }, [state]);

  // Handle PDF Export Queue
  useEffect(() => {
    if (pdfExportItem) {
        // Wait for render cycle to ensure the hidden DOM is populated
        setTimeout(() => {
            const id = 'hidden-combined-report';
            const filename = `Report_${pdfExportItem.modelA}_vs_${pdfExportItem.modelB}`;
            generatePDFFromDOM(id, filename).then(() => {
                setPdfExportItem(null); // Clear after export
            });
        }, 1500); // Slight delay for charts to render in hidden view
    }
  }, [pdfExportItem]);

  const checkApiKey = () => {
    const savedKeys = localStorage.getItem('inducomp_api_keys');
    const activeProvider = localStorage.getItem('inducomp_active_provider') || 'gemini';
    let hasKey = false;
    
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys);
        hasKey = !!keys[activeProvider];
      } catch (e) { }
    }
    
    if (!hasKey && activeProvider === 'gemini' && process.env.API_KEY) {
      hasKey = true;
    }
    
    return hasKey;
  };

  // --- Logic Functions ---

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleDatabasesUpdate = (newDbs: CustomProductDatabase[]) => {
      setDatabases(newDbs);
      customDataService.saveDatabases(newDbs);
  };

  // Import Handler
  const handleImportDatabase = (newDb: CustomProductDatabase) => {
      const updated = [...databases, newDb];
      handleDatabasesUpdate(updated);
  };

  const handleModelUpdate = (updatedModel: CustomProductModel) => {
     // Deep update in database structure
     const newDbs = databases.map(db => {
         if (db.id === activeDbId) {
             const newSeries = db.series.map(s => {
                 if (s.id === activeSeriesId) {
                     const newModels = s.models.map(m => m.id === updatedModel.id ? updatedModel : m);
                     return { ...s, models: newModels };
                 }
                 return s;
             });
             return { ...db, series: newSeries };
         }
         return db;
     });
     handleDatabasesUpdate(newDbs);
     setSelectedModel(updatedModel);
  };

  const handleDatabaseDetailsUpdate = (name: string, description: string) => {
    const newDbs = databases.map(db => {
        if (db.id === activeDbId) {
            return { ...db, name, description };
        }
        return db;
    });
    handleDatabasesUpdate(newDbs);
    if (selectedDatabase) setSelectedDatabase({...selectedDatabase, name, description});
  };

  const handleSeriesDetailsUpdate = (name: string, description: string) => {
    const newDbs = databases.map(db => {
        if (db.id === activeDbId) {
            const newSeries = db.series.map(s => {
                if (s.id === activeSeriesId) {
                    return { ...s, name, description };
                }
                return s;
            });
            return { ...db, series: newSeries };
        }
        return db;
    });
    handleDatabasesUpdate(newDbs);
    if (selectedSeries) setSelectedSeries({...selectedSeries, name, description});
  };

  const handleSelectModel = (dbId: string, seriesId: string, modelId: string) => {
      const db = databases.find(d => d.id === dbId);
      const series = db?.series.find(s => s.id === seriesId);
      const model = series?.models.find(m => m.id === modelId);
      
      if (model) {
          setActiveDbId(dbId);
          setActiveSeriesId(seriesId);
          setSelectedModel(model);
          setState(AppState.EDIT_PRODUCT_MODEL);
      }
  };

  const handleEditDatabase = (dbId: string) => {
      const db = databases.find(d => d.id === dbId);
      if (db) {
          setActiveDbId(dbId);
          setSelectedDatabase(db);
          setState(AppState.EDIT_DATABASE);
      }
  };

  const handleEditSeries = (dbId: string, seriesId: string) => {
      const db = databases.find(d => d.id === dbId);
      const series = db?.series.find(s => s.id === seriesId);
      if (series) {
          setActiveDbId(dbId);
          setActiveSeriesId(seriesId);
          setSelectedSeries(series);
          setState(AppState.EDIT_SERIES);
      }
  };

  const saveToHistory = (type: 'COMPARISON' | 'SIMULATION', mA: string, mB: string, data: any) => {
    try {
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            type,
            modelA: mA,
            modelB: mB,
            data
        };

        const saved = localStorage.getItem('inducomp_history');
        let history: HistoryItem[] = saved ? JSON.parse(saved) : [];
        history.unshift(newItem);
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        localStorage.setItem('inducomp_history', JSON.stringify(history));
    } catch (e) { console.error(e); }
  };

  const loadHistoryItem = (item: HistoryItem) => {
      setModelA(item.modelA);
      setModelB(item.modelB);
      // When loading history, we reset local models as they aren't part of the history snapshot usually
      setLocalModelA(null);
      setLocalModelB(null);
      
      if (item.type === 'COMPARISON') {
          setComparisonData(item.data as ComparisonResult);
          // If we only loaded comparison, ensure simulation is clear
          setSimulationData(null);
          setState(AppState.VIEW_SPECS);
      } else {
          // It's a simulation type
          const simData = item.data as SimulationResult;
          setSimulationData(simData);
          // If the simulation data has embedded comparison data (new feature), use it
          if (simData.comparison) {
             setComparisonData(simData.comparison);
          }
          setState(AppState.VIEW_SIMULATION);
      }
  };

  const runComparison = async (mA: string, mB: string) => {
    if (!mA || !mB) return;
    if (!checkApiKey()) { setError(t.selectKey); setShowSettings(true); return; }

    setState(AppState.LOADING_SPECS);
    setError(null);
    try {
      // Pass local model data if available (A or B or Both)
      let finalLocalA = localModelA;
      let finalLocalB = localModelB;

      const findExactMatch = (name: string) => {
          for(const db of databases) {
              for (const s of db.series) {
                  const m = s.models.find(mod => mod.name.toLowerCase() === name.toLowerCase());
                  if (m) return m;
              }
          }
          return null;
      };

      if (!finalLocalA) finalLocalA = findExactMatch(mA);
      if (!finalLocalB) finalLocalB = findExactMatch(mB);

      const data = await compareProducts(mA, mB, lang, finalLocalA || undefined, finalLocalB || undefined);
      if (data.error) throw new Error(data.error);
      setComparisonData(data);
      saveToHistory('COMPARISON', mA, mB, data);
      setState(AppState.VIEW_SPECS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.unknownModel);
      setState(AppState.INPUT_MODELS);
    }
  };

  const runSim = async (mA: string, mB: string, rules: SimulationRule[], queries: ExpectedResultQuery[]) => {
    setState(AppState.LOADING_SIMULATION);
    setError(null);
    try {
      const data = await runSimulation(mA, mB, rules, queries, lang);
      
      // Attach comparison data to simulation result for unified export later
      if (comparisonData) {
          data.comparison = comparisonData;
      }

      setSimulationData(data);
      saveToHistory('SIMULATION', mA, mB, data);
      setState(AppState.VIEW_SIMULATION);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Simulation failed. Please try again.");
      setState(AppState.SETUP_SIMULATION);
    }
  };

  // --- Export Handlers ---
  
  const handleExportCurrentReport = () => {
      setPdfExportItem({
          modelA,
          modelB,
          comparison: comparisonData,
          simulation: simulationData
      });
  };

  const handleExportHistoryItem = (item: HistoryItem) => {
      // Logic to prepare export data from a history item
      if (item.type === 'COMPARISON') {
          setPdfExportItem({
              modelA: item.modelA,
              modelB: item.modelB,
              comparison: item.data as ComparisonResult,
              simulation: null
          });
      } else {
          const simData = item.data as SimulationResult;
          setPdfExportItem({
              modelA: item.modelA,
              modelB: item.modelB,
              comparison: simData.comparison || null, // Use embedded comparison if available
              simulation: simData
          });
      }
  };

  // --- Handlers ---

  const handleComparisonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runComparison(modelA, modelB);
  };

  const handleRunSimulationSubmit = (rules: SimulationRule[], queries: ExpectedResultQuery[]) => {
    runSim(modelA, modelB, rules, queries);
  };

  const handleAIAction = (action: AIAction) => {
    console.log("AI Action Received:", action);
    switch (action.type) {
      case 'NAVIGATE':
        if (action.payload && AppState[action.payload as keyof typeof AppState]) setState(action.payload as AppState);
        break;
      case 'SET_INPUTS':
        if (action.payload?.modelA) setModelA(action.payload.modelA);
        if (action.payload?.modelB) setModelB(action.payload.modelB);
        break;
      case 'TRIGGER_COMPARE': runComparison(modelA, modelB); break;
      case 'TRIGGER_SIMULATION':
        const rules = comparisonData?.recommendedRules || [{ id: '1', name: 'Load', value: '100', unit: '%' }];
        const queries = comparisonData?.recommendedQueries || [{ id: '1', query: 'Efficiency?' }];
        runSim(modelA, modelB, rules, queries);
        break;
      case 'UPDATE_DATA':
        if (state === AppState.VIEW_SPECS) setComparisonData(action.payload);
        if (state === AppState.VIEW_SIMULATION) setSimulationData(action.payload);
        break;
    }
  };

  // --- Navigation & Helper ---

  // Resume the last comparison state (used by "Comparison Engine" button)
  const resumeComparison = () => {
    setState(lastComparisonState);
  };

  // Completely reset to start a new comparison (used by "New Comparison" button)
  const startNewComparison = () => {
    setState(AppState.INPUT_MODELS);
    setLastComparisonState(AppState.INPUT_MODELS);
    setModelA('');
    setModelB('');
    setLocalModelA(null);
    setLocalModelB(null);
    setComparisonData(null);
    setSimulationData(null);
    setError(null);
  };

  const goBack = () => {
    setError(null);
    if (state === AppState.VIEW_SPECS) setState(AppState.INPUT_MODELS);
    else if (state === AppState.SETUP_SIMULATION) setState(AppState.VIEW_SPECS);
    else if (state === AppState.VIEW_SIMULATION) setState(AppState.SETUP_SIMULATION);
    // When returning from non-flow screens, go back to last flow state if possible
    else if (state === AppState.VIEW_HISTORY || state === AppState.COMPANY_PROFILE || state === AppState.EDIT_PRODUCT_MODEL || state === AppState.EDIT_DATABASE || state === AppState.EDIT_SERIES) {
        setState(lastComparisonState);
    }
    else setState(AppState.INPUT_MODELS);
  };

  const currentContextData = state === AppState.VIEW_SIMULATION ? simulationData : (state === AppState.VIEW_SPECS ? comparisonData : null);

  const handleDataUpdate = (newData: any) => {
    if (state === AppState.VIEW_SPECS) setComparisonData(newData);
    else if (state === AppState.VIEW_SIMULATION) setSimulationData(newData);
  };

  return (
    <Layout 
      onNavigateComparison={resumeComparison}
      onNewAnalysis={startNewComparison}
      onOpenSettings={() => setShowSettings(true)} 
      onOpenHistory={() => setState(AppState.VIEW_HISTORY)}
      onOpenAuth={() => setShowAuth(true)}
      onOpenProfile={() => setShowProfileEdit(true)}
      onOpenImporter={() => setShowImporter(true)}
      onOpenExporter={() => setShowExporter(true)}
      user={user}
      onSelectCompanyProfile={() => setState(AppState.COMPANY_PROFILE)}
      onSelectModel={handleSelectModel}
      onEditDatabase={handleEditDatabase}
      onEditSeries={handleEditSeries}
      onDatabasesChange={handleDatabasesUpdate}
      databases={databases}
      lang={lang} 
      setLang={handleLanguageChange}
    >
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} lang={lang} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLoginSuccess={setUser} />}
      {showProfileEdit && user && <UserProfileModal user={user} onClose={() => setShowProfileEdit(false)} onUpdate={setUser} />}
      {showImporter && <DatabaseImporter onClose={() => setShowImporter(false)} onImport={handleImportDatabase} lang={lang} />}
      {showExporter && <DatabaseExporter databases={databases} onClose={() => setShowExporter(false)} lang={lang} />}

      <FloatingChat 
        currentState={state}
        modelA={modelA}
        modelB={modelB}
        contextData={currentContextData} 
        onUpdateData={handleDataUpdate}
        onAction={handleAIAction}
        lang={lang}
      />

      {/* Hidden Render Containers for PDF Export - Combined View */}
      <div className="absolute top-0 left-0 w-[800px] z-[-50] opacity-0 pointer-events-none overflow-hidden">
        {pdfExportItem && (
            <div id="hidden-combined-report" className="p-8 bg-white text-black space-y-12">
                 <div className="border-b-2 border-gray-900 pb-4 mb-8">
                     <h1 className="text-3xl font-bold">Industrial Comparison & Simulation Report</h1>
                     <p className="text-gray-500 mt-2">Generated by AIPK Industrial Tool</p>
                 </div>
                 
                 {/* 1. Comparison Part */}
                 {pdfExportItem.comparison && (
                     <div className="mb-12">
                         <div className="bg-gray-100 px-4 py-2 rounded mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Part 1: Technical Comparison</h2>
                         </div>
                         <ComparisonView 
                            data={pdfExportItem.comparison} 
                            modelA={pdfExportItem.modelA} 
                            modelB={pdfExportItem.modelB} 
                            onStartSimulation={() => {}} 
                            lang={lang} 
                         />
                     </div>
                 )}

                 {/* 2. Simulation Part */}
                 {pdfExportItem.simulation && (
                     <div>
                         <div className="bg-gray-100 px-4 py-2 rounded mb-6">
                             <h2 className="text-xl font-bold text-gray-800">Part 2: Running Simulation Status</h2>
                         </div>
                         <SimulationResultView 
                            data={pdfExportItem.simulation} 
                            modelA={pdfExportItem.modelA} 
                            modelB={pdfExportItem.modelB} 
                            lang={lang} 
                         />
                     </div>
                 )}
            </div>
        )}
      </div>

      {error && (
        <div className="fixed top-6 right-6 bg-white border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 cursor-pointer animate-fade-in" onClick={() => setError(null)}>
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Back Button */}
      {state !== AppState.INPUT_MODELS && state !== AppState.LOADING_SPECS && state !== AppState.LOADING_SIMULATION && (
        <button onClick={goBack} className="mb-4 flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wide">
          <ChevronLeft className="w-4 h-4" /> {t.back}
        </button>
      )}

      {/* --- VIEWS --- */}

      {state === AppState.INPUT_MODELS && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="text-center mb-10 max-w-2xl px-4">
            <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
              {t.title} <span className="text-gray-400 font-light text-2xl">| {t.subtitle}</span>
            </h1>
          </div>
          <form onSubmit={handleComparisonSubmit} className="w-full max-w-2xl bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mx-4">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <ModelInput 
                label={t.modelA}
                value={modelA}
                onChange={setModelA}
                onSelect={setLocalModelA}
                databases={databases}
                placeholder="e.g. Caterpillar 3512C"
              />
              <ModelInput 
                label={t.modelB}
                value={modelB}
                onChange={setModelB}
                onSelect={setLocalModelB}
                databases={databases}
                placeholder="e.g. Cummins QSK60"
              />
            </div>
            <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
              {t.start} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {state === AppState.LOADING_SPECS && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4">
           <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
           <div><h3 className="text-lg font-semibold text-gray-900">{t.analyzing}</h3><p className="text-gray-500 text-sm">AI is verifying models & local databases...</p></div>
        </div>
      )}

      {state === AppState.VIEW_SPECS && comparisonData && (
        <ComparisonView data={comparisonData} modelA={modelA} modelB={modelB} onStartSimulation={() => setState(AppState.SETUP_SIMULATION)} lang={lang} />
      )}

      {state === AppState.SETUP_SIMULATION && (
        <SimulationForm modelA={modelA} modelB={modelB} initialRules={comparisonData?.recommendedRules} initialQueries={comparisonData?.recommendedQueries} onRunSimulation={handleRunSimulationSubmit} lang={lang} />
      )}

      {state === AppState.LOADING_SIMULATION && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4">
           <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
           <div className="max-w-md"><h3 className="text-lg font-semibold text-gray-900">{t.simulating}</h3><p className="text-gray-500 text-sm mt-1">Processing algorithms & community data...</p></div>
        </div>
      )}

      {state === AppState.VIEW_SIMULATION && simulationData && (
        <SimulationResultView data={simulationData} modelA={modelA} modelB={modelB} lang={lang} onExport={handleExportCurrentReport} />
      )}

      {state === AppState.VIEW_HISTORY && <HistoryView onLoadItem={loadHistoryItem} lang={lang} onExportItem={handleExportHistoryItem} />}
      
      {state === AppState.COMPANY_PROFILE && <CompanyProfileView lang={lang} />}
      
      {state === AppState.EDIT_PRODUCT_MODEL && selectedModel && <ProductModelEditor model={selectedModel} onSave={handleModelUpdate} lang={lang} />}
      
      {state === AppState.EDIT_DATABASE && selectedDatabase && (
        <SimpleItemEditor 
          initialName={selectedDatabase.name} 
          initialDescription={selectedDatabase.description} 
          type="database" 
          onSave={handleDatabaseDetailsUpdate} 
          lang={lang} 
        />
      )}

      {state === AppState.EDIT_SERIES && selectedSeries && (
        <SimpleItemEditor 
          initialName={selectedSeries.name} 
          initialDescription={selectedSeries.description} 
          type="series" 
          onSave={handleSeriesDetailsUpdate} 
          lang={lang} 
        />
      )}
    </Layout>
  );
};

export default App;