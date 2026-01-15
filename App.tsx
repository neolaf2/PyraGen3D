
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  TilePattern, 
  PyramidBase, 
  GenerationParams, 
  GenerationHistory,
  ChatMessage,
  SupportedLanguage,
  TextModelVersion
} from './types';
import { generatePyramidImage, getChatResponse, generateSpeechData, playAudio } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import ImageDisplay from './components/ImageDisplay';
import HistorySidebar from './components/HistorySidebar';
import DocumentationModal from './components/DocumentationModal';
import { Layers, Info, MessageSquare, Send, Volume2, X, HelpCircle, Square, Play, RotateCcw, Loader2, VolumeX, Languages, Sun, Moon, Zap } from 'lucide-react';

const TypewriterText: React.FC<{ 
  text: string; 
  isTyping: boolean; 
  onComplete: () => void;
  resetKey: number;
}> = ({ text, isTyping, onComplete, resetKey }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTyping) {
      if (currentIndex < text.length) {
        timerRef.current = window.setTimeout(() => {
          setDisplayedText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, 12);
      } else {
        onComplete();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isTyping, text, onComplete]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [resetKey]);

  return (
    <div className="prose-chat overflow-hidden">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        rehypePlugins={[rehypeKatex]}
      >
        {isTyping ? displayedText : (displayedText || text)}
      </ReactMarkdown>
    </div>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('pyragen-theme') as 'light' | 'dark') || 'dark';
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
    modelVersion: 'gemini-3-pro-image-preview',
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
  const [textModel, setTextModel] = useState<TextModelVersion>('gemini-3-flash-preview');
  
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [typewriterResetKeys, setTypewriterResetKeys] = useState<Record<string, number>>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<{ source: AudioBufferSourceNode; context: AudioContext } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Apply theme to document
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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, typingMessageId, isChatLoading]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => chatInputRef.current?.focus(), 150);
    }
  }, [isChatOpen]);

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const config = urlParams.get('config');
    if (config) {
      try {
        const decodedString = atob(config);
        const sharedParams = JSON.parse(decodedString);
        const hydratedParams = { ...params, ...sharedParams };
        setParams(hydratedParams);
        setTimeout(() => handleGenerate(hydratedParams), 500);
        const baseUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, document.title, baseUrl);
      } catch (e) {
        console.error("Failed to parse shared architectural configuration", e);
      }
    }
  }, []);

  const handleSendMessage = async () => {
    if (!userMsg.trim()) return;
    const msgText = userMsg;
    const userId = Date.now().toString();
    setUserMsg('');
    setChatMessages(prev => [...prev, { id: userId, role: 'user', text: msgText }]);
    setIsChatLoading(true);

    try {
      const responseText = await getChatResponse(msgText, chatMessages, selectedLanguage, textModel);
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

  const handleRestartTypewriter = (id: string) => {
    setTypewriterResetKeys(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setTypingMessageId(id);
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
        {/* Sticky Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-[60] w-full shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">PyraGen <span className="text-blue-500 font-light">3D</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button Group */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setTheme('light')}
                title="Light Mode"
                className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTheme('dark')}
                title="Dark Mode"
                className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => setIsDocsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Help & Documentation"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleChat} 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all border font-medium text-sm ${
                isChatOpen 
                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                : 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-500/20'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">PyraTutor</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
          <div className="flex flex-col xl:flex-row p-4 md:p-8 gap-8 max-w-7xl mx-auto w-full">
            <div className="w-full xl:w-96 shrink-0">
              <ControlPanel 
                params={params} 
                setParams={setParams} 
                onGenerate={() => handleGenerate()} 
                isGenerating={isGenerating} 
                textModel={textModel}
                setTextModel={setTextModel}
              />
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

        {/* Chatbot Overlay */}
        {isChatOpen && (
          <div className="fixed bottom-4 right-4 w-[calc(100%-2rem)] md:w-[420px] max-h-[calc(100vh-6rem)] h-[650px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col z-[100] overflow-hidden chat-fade-in transition-colors duration-300">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                PyraTutor
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group/lang flex items-center bg-white dark:bg-slate-700/60 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-600">
                  <Languages className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                    className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer appearance-none uppercase tracking-widest pr-1"
                  >
                    <option value="English">EN</option>
                    <option value="Chinese">ZH</option>
                    <option value="Spanish">ES</option>
                    <option value="Korean">KO</option>
                  </select>
                </div>
                <button onClick={() => { setIsChatOpen(false); stopAudio(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/80">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center px-8">
                  <div className="p-5 bg-blue-600/10 rounded-full mb-5 ring-1 ring-blue-500/30">
                    <MessageSquare className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-slate-900 dark:text-white font-semibold mb-2 text-lg">Hello, Architect!</h3>
                  <p className="text-sm leading-relaxed">I am <b>PyraTutor</b>, your expert consultant. I can assist with 3D geometry math, tile aesthetics, or general usage of PyraGen.</p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] px-4 py-3 rounded-2xl relative group shadow-lg ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-slate-200 rounded-bl-none'
                  }`}>
                    {msg.role === 'model' ? (
                      <div className="space-y-3">
                        <TypewriterText 
                          text={msg.text} 
                          isTyping={typingMessageId === msg.id} 
                          onComplete={() => setTypingMessageId(null)} 
                          resetKey={typewriterResetKeys[msg.id] || 0}
                        />
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/40">
                          {msg.audioBase64 && (
                            <button 
                              onClick={() => handleToggleAudio(msg)}
                              className={`p-1.5 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${
                                playingAudioId === msg.id 
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' 
                                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              {playingAudioId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                              {playingAudioId === msg.id ? 'Stop' : 'Listen'}
                            </button>
                          )}
                          
                          <button 
                            onClick={() => {
                              if (typingMessageId === msg.id) setTypingMessageId(null);
                              else setTypingMessageId(msg.id);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {typingMessageId === msg.id ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            {typingMessageId === msg.id ? 'Pause' : 'Replay'}
                          </button>

                          <button 
                            onClick={() => handleRestartTypewriter(msg.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"
                            title="Restart text animation"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restart
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-medium">{msg.text}</div>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800/90 px-4 py-3 rounded-2xl flex gap-2 items-center border border-slate-200 dark:border-slate-700/50">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-xs text-slate-400 font-medium italic">PyraTutor is responding...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-md">
              <div className="relative">
                <input 
                  ref={chatInputRef}
                  type="text" 
                  placeholder={`Discuss in ${selectedLanguage}...`}
                  value={userMsg}
                  onChange={(e) => setUserMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl py-3.5 pl-4 pr-12 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !userMsg.trim()}
                  className="absolute right-2 top-2 p-2 text-blue-500 hover:text-blue-600 disabled:opacity-30 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      </main>

      {/* History Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 flex items-center overflow-x-auto gap-3 shrink-0 z-[50] custom-scrollbar">
        {history.length === 0 ? (
          <div className="w-full text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest opacity-50">No previous designs</div>
        ) : (
          history.map(item => (
            <button key={item.id} onClick={() => loadFromHistory(item)} className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 border-transparent hover:border-blue-500 transition-all active:scale-95 shadow-md">
              <img src={item.imageUrl} alt="History item" className="w-full h-full object-cover" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default App;
