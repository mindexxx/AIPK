import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Sparkles, Navigation, MousePointerClick } from 'lucide-react';
import { chatWithAI } from '../services/geminiService';
import { Language, AppState, AIAction } from '../types';

interface FloatingChatProps {
  currentState: AppState;
  modelA: string;
  modelB: string;
  contextData: any;
  onUpdateData: (newData: any) => void;
  onAction: (action: AIAction) => void;
  lang: Language;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  actionSummary?: string;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ 
  currentState,
  modelA,
  modelB,
  contextData, 
  onUpdateData, 
  onAction,
  lang 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Construct full context for the AI
      const context = {
        currentState,
        modelA,
        modelB,
        data: contextData
      };

      const result = await chatWithAI(userMsg, context, lang);
      
      let actionSummary = '';
      
      // Execute Actions
      if (result.actions && result.actions.length > 0) {
        for (const action of result.actions) {
           onAction(action);
           if (action.type === 'NAVIGATE') actionSummary += `[Navigating to ${action.payload}] `;
           if (action.type === 'SET_INPUTS') actionSummary += `[Filling Inputs] `;
           if (action.type === 'TRIGGER_COMPARE') actionSummary += `[Starting Comparison] `;
           if (action.type === 'TRIGGER_SIMULATION') actionSummary += `[Running Simulation] `;
           if (action.type === 'UPDATE_DATA') {
              onUpdateData(action.payload);
              actionSummary += `[Updating Report Data] `;
           }
        }
      } else if (result.updatedData) {
        // Fallback for older legacy format if service returns it
        onUpdateData(result.updatedData);
        actionSummary += `[Data Updated] `;
      }

      setMessages(prev => [...prev, { role: 'assistant', text: result.text, actionSummary }]);
      
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting to the system right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button - Always Visible */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all hover:scale-105 ${isOpen ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in max-h-[600px] h-[500px]">
          <div className="bg-gray-900 p-4 flex items-center gap-2 border-b border-gray-800">
             <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
             </div>
             <div>
                 <h3 className="text-white font-bold text-sm">AIPK Assistant</h3>
                 <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    System Connected
                 </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
                <div className="text-center text-gray-400 text-xs mt-10 space-y-2">
                    <p>I can control the app for you.</p>
                    <div className="flex flex-col gap-1 items-center">
                      <span className="bg-white border border-gray-200 px-2 py-1 rounded">"Compare Cat 3512 vs Cummins QSK60"</span>
                      <span className="bg-white border border-gray-200 px-2 py-1 rounded">"Run the simulation"</span>
                      <span className="bg-white border border-gray-200 px-2 py-1 rounded">"Go back to home"</span>
                    </div>
                </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] space-y-1`}>
                   <div className={`px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800 shadow-sm'}`}>
                      {m.text}
                   </div>
                   {m.actionSummary && (
                     <div className="flex items-center gap-1 text-[10px] text-gray-500 pl-1">
                        <Navigation className="w-3 h-3" />
                        {m.actionSummary}
                     </div>
                   )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    <span className="text-xs text-gray-500">Processing...</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type an order..."
              className="flex-1 bg-gray-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};