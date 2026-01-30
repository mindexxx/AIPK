import React, { useMemo, useState, useEffect } from 'react';
import { SimulationResult, Language, LABELS, SimulationMetricPoint } from '../types';
import { MessageSquare, Trophy, Minus, FileText, ExternalLink, ThumbsUp, ThumbsDown, MinusCircle, Activity, Clock, PlayCircle, Download, Sliders } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SimulationResultViewProps {
  data: SimulationResult;
  modelA: string;
  modelB: string;
  lang: Language;
  onExport?: () => void;
}

export const SimulationResultView: React.FC<SimulationResultViewProps> = ({ data, modelA, modelB, lang, onExport }) => {
  const t = LABELS[lang];
  // Playback state
  const [visiblePoints, setVisiblePoints] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const events = data.timelineEvents || [];
  
  // Transform complex timeline events into flat data for Recharts
  const metricKeys = useMemo(() => {
    if (events.length === 0) return [];
    return Object.keys(events[0].metrics || {});
  }, [events]);

  const fullChartData = useMemo(() => {
    return events.map(e => {
        const point: any = { time: e.time };
        Object.keys(e.metrics || {}).forEach(key => {
            point[`${key}_A`] = e.metrics[key].A;
            point[`${key}_B`] = e.metrics[key].B;
        });
        return point;
    });
  }, [events]);

  // Animate the running status
  useEffect(() => {
    if (!isPlaying) {
        setVisiblePoints(fullChartData.length);
        return;
    }
    
    setVisiblePoints(0);
    const interval = setInterval(() => {
        setVisiblePoints(prev => {
            if (prev >= fullChartData.length) {
                clearInterval(interval);
                setIsPlaying(false);
                return prev;
            }
            return prev + 1;
        });
    }, 800); // Add a point every 800ms to simulate "Running"

    return () => clearInterval(interval);
  }, [fullChartData.length, isPlaying]);

  const currentChartData = useMemo(() => {
      return fullChartData.slice(0, Math.max(1, visiblePoints));
  }, [fullChartData, visiblePoints]);

  const getWinnerBadge = (winner: 'A' | 'B' | 'Tie') => {
    if (winner === 'Tie') return <span className="text-gray-500 flex items-center gap-1 text-xs"><Minus className="w-3 h-3" /> Tie</span>;
    const isA = winner === 'A';
    const colorClass = isA ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50';
    const model = isA ? modelA : modelB;
    return (
        <span className={`${colorClass} px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 truncate max-w-[140px]`}>
            <Trophy className="w-3 h-3" /> {model}
        </span>
    );
  };

  const kpis = data.kpis || [];
  const questionAnswers = data.questionAnswers || [];
  const comments = data.userComments || [];

  // Colors for different metrics
  const colors = [
    { A: '#2563eb', B: '#9333ea' }, // Blue / Purple
    { A: '#059669', B: '#db2777' }, // Green / Pink
    { A: '#d97706', B: '#0891b2' }, // Amber / Cyan
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.report}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {lang === 'cn' ? `${t.simCycle}: ${data.period}` : `Simulated ${data.period} Running Cycle`}
            </p>
         </div>
         <div className="flex items-center gap-3">
             <button
                onClick={onExport}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-50 transition-all text-sm"
             >
                <Download className="w-4 h-4" />
                {t.exportPdf}
             </button>
             <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                {!isPlaying ? (
                    <button onClick={() => setIsPlaying(true)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors" title="Replay Simulation">
                        <PlayCircle className="w-6 h-6" />
                    </button>
                ) : (
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                        Running...
                    </span>
                )}
                {!isPlaying && (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Complete
                    </span>
                )}
             </div>
         </div>
      </div>

      <div id="simulation-report-container" className="space-y-8 bg-white p-4">
        
        {/* Environment Parameters Confirmation (New) */}
        {data.comparison && data.comparison.recommendedRules && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-800 uppercase tracking-wider">
                    <Sliders className="w-3 h-3" />
                    Simulation Environment
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.comparison.recommendedRules.map(rule => (
                        <div key={rule.id} className="bg-white border border-blue-200 px-3 py-1 rounded-full text-sm text-blue-900 shadow-sm">
                            <span className="font-semibold">{rule.name}:</span> {rule.value} {rule.unit}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" /> {t.summary}
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg">
                {data.summary}
            </p>
        </div>

        {/* Complex Timeline Visualization */}
        {fullChartData.length > 0 && (
            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Chart Column */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" /> {t.timeline} 
                        {data.period && (
                            <span className="text-gray-400 font-normal ml-1 normal-case">
                                ({lang === 'cn' ? `持续 ${data.period}` : `Duration: ${data.period}`})
                            </span>
                        )}
                    </h3>
                    <div className="h-80 w-full flex-1 relative">
                        {/* Add a static grid background if needed, but Recharts handles it */}
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                                labelStyle={{color: '#6b7280', fontSize: '12px'}}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            {metricKeys.map((key, i) => (
                                <React.Fragment key={key}>
                                    <Line 
                                        type="monotone" 
                                        dataKey={`${key}_A`} 
                                        name={`${modelA} (${key})`} 
                                        stroke={colors[i % colors.length].A} 
                                        strokeWidth={2} 
                                        dot={{r: 3}}
                                        isAnimationActive={false} 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey={`${key}_B`} 
                                        name={`${modelB} (${key})`} 
                                        stroke={colors[i % colors.length].B} 
                                        strokeWidth={2} 
                                        dot={{r: 3}}
                                        strokeDasharray="5 5"
                                        isAnimationActive={false}
                                    />
                                </React.Fragment>
                            ))}
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Event Log Column */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" /> Live Event Log
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-80 lg:max-h-full custom-scrollbar">
                        {events.slice(0, visiblePoints).map((e, idx) => (
                            <div key={idx} className="relative pl-4 border-l-2 border-gray-100 pb-1 animate-fade-in">
                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-sm"></div>
                                <div className="text-xs font-bold text-gray-400 mb-0.5">{e.time}</div>
                                <div className="text-sm font-medium text-gray-900">{e.description}</div>
                                <div className="mt-1 text-[10px] text-gray-500 grid grid-cols-2 gap-1">
                                    {Object.entries(e.metrics || {}).map(([key, rawVal]) => {
                                        const val = rawVal as SimulationMetricPoint;
                                        return (
                                            <div key={key} className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                <span className="font-semibold text-gray-700">{val.A}</span> vs <span className="font-semibold text-gray-700">{val.B}</span> <span className="text-gray-400">{val.unit}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        {visiblePoints === 0 && (
                            <div className="text-sm text-gray-400 italic text-center pt-10">Initializing simulation...</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* KPIs */}
        <div className={`transition-opacity duration-1000 ${visiblePoints > 1 ? 'opacity-100' : 'opacity-50'}`}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">{t.kpi}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi, idx) => (
                <div key={idx} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div className="text-gray-900 font-medium text-sm">{kpi.name}</div>
                </div>
                
                <div className="flex items-baseline justify-between mb-4 px-1">
                    <div>
                        <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide truncate max-w-[80px]">{modelA}</div>
                        <div className="text-lg font-mono text-blue-600 font-medium">{kpi.valueA} <span className="text-xs text-gray-400">{kpi.unit}</span></div>
                    </div>
                    <div className="w-px h-8 bg-gray-100 mx-2"></div>
                    <div className="text-right">
                        <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide truncate max-w-[80px]">{modelB}</div>
                        <div className="text-lg font-mono text-purple-600 font-medium">{kpi.valueB} <span className="text-xs text-gray-400">{kpi.unit}</span></div>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-sm">
                    <span className="text-gray-400 text-xs">Winner</span>
                    {getWinnerBadge(kpi.winner)}
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* Direct Q&A Section */}
        {questionAnswers.length > 0 && (
            <div className="grid gap-4">
            {questionAnswers.map((qa, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">{qa.question}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{qa.answer}</p>
                </div>
            ))}
            </div>
        )}

        {/* User Comments / Threads */}
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">{t.comments}</h3>
            {comments.length === 0 && <div className="text-sm text-gray-400 italic">No community data available.</div>}
            {comments.map((comment, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                {comment.user.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{comment.user}</span>
                            <span className="text-xs text-gray-400">• {comment.source}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {comment.sentiment === 'Positive' && <ThumbsUp className="w-3 h-3 text-green-500" />}
                            {comment.sentiment === 'Negative' && <ThumbsDown className="w-3 h-3 text-red-500" />}
                            {comment.sentiment === 'Neutral' && <MinusCircle className="w-3 h-3 text-gray-400" />}
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 italic">"{comment.comment}"</p>
                    
                    {/* Robust Link Rendering: Only show if valid URL */}
                    {comment.url && (comment.url.startsWith('http') || comment.url.startsWith('www')) && (
                        <a href={comment.url.startsWith('www') ? `https://${comment.url}` : comment.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                            Source Thread <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};