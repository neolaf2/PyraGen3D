
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  TilePattern, 
  PyramidBase, 
  GenerationParams, 
  GenerationHistory,
  ChatMessage 
} from './types';
import { generatePyramidImage, getChatResponse, generateSpeech } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import ImageDisplay from './components/ImageDisplay';
import HistorySidebar from './components/HistorySidebar';
import DocumentationModal from './components/DocumentationModal';
import { Layers, Box, Info, MessageSquare, Send, Volume2, X, HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  const [params, setParams] = useState<GenerationParams>({
    levels: 5,
    baseSize: 5,
    tileColor: '#3b82f6',
    pattern: TilePattern.MARBLE,
    baseType: PyramidBase.SQUARE,
    backgroundStyle: 'Minimalistic grey studio',
    lightDirection: 'Top-Down',
    lightIntensity: 80,
    shadowsEnabled: true,
  });

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  
  // Modals & Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMsg, setUserMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await generatePyramidImage(params);
      setCurrentImage(imageUrl);
      
      const newHistoryItem: GenerationHistory = {
        id: Date.now().toString(),
        imageUrl,
        params: { ...params },
        timestamp: Date.now(),
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
    } catch (err: any) {
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMsg.trim()) return;
    const msg = userMsg;
    setUserMsg('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsChatLoading(true);

    try {
      const response = await getChatResponse(msg, chatMessages);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
      await generateSpeech(response);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting to my architectural database right now." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const loadFromHistory = useCallback((item: GenerationHistory) => {
    setCurrentImage(item.imageUrl);
    setParams(item.params);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200">
      <div className="hidden lg:block w-72 border-r border-slate-800 shrink-0">
        <HistorySidebar history={history} onSelect={loadFromHistory} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">PyraGen <span className="text-blue-500 font-light">3D</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDocsOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              title="Help & Documentation"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsChatOpen(true)} 
              className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Ask AI Consultant</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col xl:flex-row p-4 md:p-8 gap-8 overflow-y-auto custom-scrollbar">
          <div className="w-full xl:w-96 shrink-0">
            <ControlPanel 
              params={params} 
              setParams={setParams} 
              onGenerate={handleGenerate} 
              isGenerating={isGenerating} 
            />
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <ImageDisplay 
              imageUrl={currentImage} 
              isGenerating={isGenerating} 
              error={error} 
              params={params}
              setCurrentImage={setCurrentImage}
            />
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Architectural Studio
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                PyraGen combines advanced generative AI with granular lighting controls. Use the Chat Consultant to refine your design theory or learn more about tile patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Chatbot Overlay */}
        {isChatOpen && (
          <div className="absolute right-4 bottom-4 w-96 max-h-[600px] h-[70vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-medium">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                AI Consultant
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4">
                  <p className="text-sm">Welcome Architect. I have the full system guide in my memory. Ask me anything about creating 3D pyramids!</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm relative group ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
                  }`}>
                    {msg.text}
                    {msg.role === 'model' && (
                      <button 
                        onClick={() => generateSpeech(msg.text)}
                        className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-blue-400"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 px-4 py-2 rounded-2xl flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask about features, patterns, or tips..."
                  value={userMsg}
                  onChange={(e) => setUserMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl py-2.5 pl-4 pr-12 outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  onClick={handleSendMessage}
                  className="absolute right-2 top-1.5 p-1.5 text-blue-500 hover:text-blue-400"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <DocumentationModal 
          isOpen={isDocsOpen} 
          onClose={() => setIsDocsOpen(false)} 
        />
      </main>

      <div className="lg:hidden h-20 border-t border-slate-800 bg-slate-900 p-2 flex items-center overflow-x-auto gap-3 shrink-0">
        {history.length === 0 ? (
          <div className="w-full text-center text-slate-500 text-xs italic">No generations yet</div>
        ) : (
          history.map(item => (
            <button 
              key={item.id} 
              onClick={() => loadFromHistory(item)}
              className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 border-transparent hover:border-blue-500 transition-all"
            >
              <img src={item.imageUrl} alt="History thumbnail" className="w-full h-full object-cover" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default App;
