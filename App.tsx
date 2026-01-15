
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  TilePattern, 
  PyramidBase, 
  GenerationParams, 
  GenerationHistory,
  ChatMessage,
  SupportedLanguage 
} from './types.ts';
import { generatePyramidImage, getChatResponse, generateSpeechData, playAudio } from './services/geminiService.ts';
import ControlPanel from './components/ControlPanel.tsx';
import ImageDisplay from './components/ImageDisplay.tsx';
import HistorySidebar from './components/HistorySidebar.tsx';
import DocumentationModal from './components/DocumentationModal.tsx';
import { Layers, Info, MessageSquare, Send, Volume2, X, HelpCircle, Square, Play, RotateCcw, Loader2, VolumeX, Languages, Sun, Moon } from 'lucide-react';

// Optimized Typewriter component
const TypewriterText: React.FC<{ 
  text: string; 
  isTyping: boolean; 
  onComplete: () => void;
  resetKey: number;
}> = ({ text, isTyping, onComplete, resetKey }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    // Reset state when key changes
    setDisplayedText('');
  }, [resetKey]);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text);
      return;
    }

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(prev => text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(intervalId);
        onComplete();
      }
    }, 12);

    return () => clearInterval(intervalId);
  }, [isTyping, text, resetKey, onComplete]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {displayedText}
    </div>
  );
};

const App: React.FC = () => {
  // Initialize theme based on localStorage OR system preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('pyragen-theme');
    if (saved) return saved as 'light' | 'dark';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

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
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMsg, setUserMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('English');
  
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [typewriterResetKeys, setTypewriterResetKeys] = useState<Record<string, number>>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<{ source: AudioBufferSourceNode; context: AudioContext } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pyragen-theme', theme);
  }, [theme]);

  const scrollToBottom = () => {
    // Small timeout to allow DOM to update
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, typingMessageId, isChatLoading, isChatOpen]);

  const toggleChat = () => {
    const newState = !isChatOpen;
    setIsChatOpen(newState);
    if (newState) {
      setTimeout(() => chatInputRef.current?.focus(), 150);
    }
  };

  const handleGenerate = async (overrideParams?: GenerationParams) => {
    const activeParams = overrideParams || params;
    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await generatePyramidImage(activeParams);
      setCurrentImage(imageUrl);
      
      const newHistoryItem: GenerationHistory = {
        id: Date.now().toString(),
        imageUrl,
        params: { ...activeParams },
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
    const msgText = userMsg;
    const userId = Date.now().toString();
    setUserMsg('');
    setChatMessages(prev => [...prev, { id: userId, role: 'user', text: msgText }]);
    setIsChatLoading(true);

    try {
      const responseText = await getChatResponse(msgText, chatMessages, selectedLanguage);
      const audioData = await generateSpeechData(responseText);
      const modelId = (Date.now() + 1).toString();
      
      setChatMessages(prev => [...prev, { 
        id: modelId, 
        role: 'model', 
        text: responseText,
        audioBase64: audioData || undefined 
      }]);
      setTypingMessageId(modelId);
      setTypewriterResetKeys(prev => ({ ...prev, [modelId]: 0 }));
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { id: 'err', role: 'model', text: "I'm sorry, I'm having trouble connecting to my architectural database right now." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleToggleAudio = async (msg: ChatMessage) => {
    if (playingAudioId === msg.id) {
      stopAudio();
      return;
    }

    if (!msg.audioBase64) return;
    
    stopAudio();
    setPlayingAudioId(msg.id);
    try {
      const playRes = await playAudio(msg.audioBase64, () => setPlayingAudioId(null));
      activeAudioRef.current = playRes;
    } catch (err) {
      console.error("Audio playback error:", err);
      setPlayingAudioId(null);
    }
  };

  const stopAudio = () => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.source.stop();
        activeAudioRef.current.context.close();
      } catch (e) {}
      activeAudioRef.current = null;
    }
    setPlayingAudioId(null);
  };

  const loadFromHistory = useCallback((item: GenerationHistory) => {
    setCurrentImage(item.imageUrl);
    setParams(item.params);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 overflow-hidden transition-colors duration-300">
      {/* History Sidebar */}
      <div className="hidden lg:block w-72 border-r border-slate-200 dark:border-slate-800 shrink-0 h-screen overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900/40">
        <HistorySidebar history={history} onSelect={loadFromHistory} />
      </div>

      <main className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Unified Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-[60] w-full shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">PyraGen <span className="text-blue-500 font-light">3D</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button Group */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <button 
                onClick={() => setTheme('light')}
                title="Switch to Light Mode"
                className={`p-2 rounded-lg transition-all duration-200 ${theme === 'light' ? 'bg-white text-amber-500 shadow-sm scale-110' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTheme('dark')}
                title="Switch to Dark Mode"
                className={`p-2 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-sm scale-110' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => setIsDocsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="View Documentation"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleChat} 
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border font-semibold text-sm ${
                isChatOpen 
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg' 
                : 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-500/20'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">PyraTutor</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
          <div className="flex flex-col xl:flex-row p-4 md:p-8 gap-8 max-w-7xl mx-auto w-full">
            <div className="w-full xl:w-96 shrink-0">
              <ControlPanel params={params} setParams={setParams} onGenerate={() => handleGenerate()} isGenerating={isGenerating} />
            </div>

            <div className="flex-1 flex flex-col gap-6">
              <ImageDisplay imageUrl={currentImage} isGenerating={isGenerating} error={error} params={params} setCurrentImage={setCurrentImage} />
              
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  Architectural Studio
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  PyraGen combines advanced generative AI with granular lighting controls. Use <b>PyraTutor</b> to refine your design theory or learn more about tile patterns and geometric formulas.
                </p>
              </div>
            </div>
          </div>
          <div className="h-24 lg:hidden" />
        </div>

        {/* Floating Chat Window */}
        {isChatOpen && (
          <div className="fixed bottom-4 right-4 w-[calc(100%-2rem)] md:w-[420px] max-h-[calc(100vh-6rem)] h-[650px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-2xl flex flex-col z-[100] overflow-hidden transition-all duration-300">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold uppercase tracking-wider text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                PyraTutor AI
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group/lang flex items-center bg-white dark:bg-slate-700/60 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-600">
                  <Languages className="w-3 h-3 text-slate-400 mr-1" />
                  <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                    className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none uppercase tracking-widest"
                  >
                    <option value="English">EN</option>
                    <option value="Chinese">ZH</option>
                    <option value="Spanish">ES</option>
                    <option value="Korean">KO</option>
                  </select>
                </div>
                <button onClick={() => { setIsChatOpen(false); stopAudio(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/80">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center px-8">
                  <MessageSquare className="w-10 h-10 mb-4 opacity-20" />
                  <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Architectural Assistant</h3>
                  <p className="text-sm">I can help with parameters, color theory, or explaining 3D pyramid geometry.</p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl relative shadow-sm ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-bl-none'
                  }`}>
                    {msg.role === 'model' ? (
                      <div className="space-y-3">
                        <TypewriterText 
                          text={msg.text} 
                          isTyping={typingMessageId === msg.id} 
                          onComplete={() => setTypingMessageId(null)} 
                          resetKey={typewriterResetKeys[msg.id] || 0}
                        />
                        {msg.audioBase64 && (
                          <button 
                            onClick={() => handleToggleAudio(msg)}
                            className={`p-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${
                              playingAudioId === msg.id 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600'
                            }`}
                          >
                            {playingAudioId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            {playingAudioId === msg.id ? 'Stop' : 'Listen'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm font-medium">{msg.text}</div>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl flex gap-2 items-center border border-slate-200 dark:border-slate-700">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-xs text-slate-400 italic font-medium">Consulting databases...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="relative">
                <input 
                  ref={chatInputRef}
                  type="text" 
                  placeholder="Ask PyraTutor..."
                  value={userMsg}
                  onChange={(e) => setUserMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl py-3 pl-4 pr-12 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !userMsg.trim()}
                  className="absolute right-2 top-2 p-1.5 text-blue-500 hover:text-blue-600 disabled:opacity-30"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      </main>
    </div>
  );
};

export default App;
