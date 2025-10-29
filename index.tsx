import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { getChapterTopics, startChatSession, continueChatStream, ChatSession } from './services/geminiService';
import { CHEMISTRY_SUBJECT, STANDARDS, CHAPTERS } from './constants';
import { Spinner, ErrorDisplay, Footer } from './components/common';
import TopicContent from './components/TopicContent';
import PeriodicTable from './components/PeriodicTable';
import ReactionPredictor from './components/ReactionPredictor';
import Numericals from './components/Numericals';
import ChatBox, { ChatMessage } from './components/ChatBox';
import FeedbackModal from './components/FeedbackModal';
import UnitTest from './components/UnitTest';
import IntroAnimation from './components/IntroAnimation';

const App = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [standard, setStandard] = useState('');
  const [chapter, setChapter] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [resetPlaygroundTrigger, setResetPlaygroundTrigger] = useState(0);
  const [theme, setTheme] = useState('pitch-black');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Chat state
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500); // Duration of the intro animation
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchTopics = async (currentTopics: string[] = []) => {
    if (!chapter || !standard) return;
    setIsLoading(true);
    setError(null);
    try {
      const newTopics = await getChapterTopics(chapter, standard, CHEMISTRY_SUBJECT, currentTopics);
      setTopics([...currentTopics, ...newTopics]);
    } catch (e: any) {
        setError(e.message || "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };
  
  useEffect(() => {
    setChapter('');
    setTopics([]);
    setSelectedTopic(null);
  }, [standard]);
  
  useEffect(() => {
    setTopics([]);
    setSelectedTopic(null);
    if (chapter) {
      fetchTopics();
    }
  }, [chapter]);

  // Effect to initialize or reset chat session when chapter changes
  useEffect(() => {
    if (chapter && standard) {
        try {
            const session = startChatSession(standard, chapter);
            setChatSession(session);
            setChatHistory([
                { role: 'model', text: `Hi! I'm your tutor for **${chapter}**. Feel free to ask me anything about this chapter!` }
            ]);
            setIsChatLoading(false);
        } catch (e: any) {
            console.error(e);
            setChatHistory([{ role: 'model', text: 'Sorry, the chat tutor failed to initialize. Please try refreshing.' }]);
        }
    } else {
        // Reset chat when no chapter is selected
        setChatSession(null);
        setChatHistory([]);
    }
  }, [chapter, standard]);

  const handleSendMessage = async (message: string) => {
    if (!chatSession || isChatLoading) return;

    setIsChatLoading(true);
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: message }];
    setChatHistory(updatedHistory);

    try {
        const responseStream = await continueChatStream(chatSession, message);
        
        setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    const lastMessage = newHistory[newHistory.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.text += chunkText;
                    }
                    return newHistory;
                });
            }
        }
    } catch (e: any) {
        const errorMessage = `Sorry, something went wrong: ${e instanceof Error ? e.message : 'Unknown error'}`;
        setChatHistory(prev => {
            const lastMessage = prev[prev.length - 1];
            // If the last message was the model's empty placeholder, replace it with the error.
            if (lastMessage?.role === 'model' && lastMessage.text === '') {
                const newHistory = [...prev.slice(0, -1)];
                return [...newHistory, { role: 'model', text: errorMessage }];
            }
            // Otherwise, add a new error message.
            return [...prev, { role: 'model', text: errorMessage }];
        });
    } finally {
        setIsChatLoading(false);
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setIsSidebarOpen(false); // Close sidebar on topic selection
  };

  const sidebarContent = (
    <>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">CO<span className="text-[var(--text-accent)]">/</span><span className="font-light">Chemistry</span></h1>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-6 -mt-6">Interactive Study Aid</p>
        
        <div className="mb-4">
            <label htmlFor="theme-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Theme</label>
            <select id="theme-select" value={theme} onChange={e => setTheme(e.target.value)} className="w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2">
                <option value="pitch-black">Pitch Black</option>
                <option value="dark-blue">Dark Blue</option>
                <option value="light">Light</option>
            </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="standard" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Standard</label>
          <select id="standard" value={standard} onChange={e => setStandard(e.target.value)} className="w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2">
            <option value="" disabled>Select Standard...</option>
            {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="chapter" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Chapter</label>
          <select id="chapter" value={chapter} onChange={e => setChapter(e.target.value)} className="w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2" disabled={!standard}>
            <option value="" disabled>Select Chapter...</option>
            {standard && CHAPTERS[CHEMISTRY_SUBJECT][standard].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <h2 className="text-lg font-semibold text-[var(--text-accent)] border-b border-[var(--border-primary)] pb-2 mb-2">Tools</h2>
        <ul className="space-y-2 mb-4">
            <li key="reaction-predictor">
                <button 
                    onClick={() => handleTopicSelect("Reaction Predictor")}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTopic === "Reaction Predictor" ? "bg-[var(--bg-accent-subtle)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-quaternary)]"}`}
                >
                    Reaction Predictor
                </button>
            </li>
            <li key="numericals">
                <button 
                    onClick={() => handleTopicSelect("Numericals")}
                    disabled={!chapter}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTopic === "Numericals" ? "bg-[var(--bg-accent-subtle)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-quaternary)]"} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    Numericals
                </button>
            </li>
            <li key="unit-test">
                <button 
                    onClick={() => handleTopicSelect("Unit Test")}
                    disabled={!chapter}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTopic === "Unit Test" ? "bg-[var(--bg-accent-subtle)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-quaternary)]"} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    Unit Test
                </button>
            </li>
            <li key="reaction-playground">
                <button 
                    onClick={() => handleTopicSelect("Reaction Playground")}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTopic === "Reaction Playground" ? "bg-[var(--bg-accent-subtle)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-quaternary)]"}`}
                >
                    Reaction Playground
                </button>
            </li>
        </ul>

        <h2 className="text-lg font-semibold text-[var(--text-accent)] border-b border-[var(--border-primary)] pb-2 mb-2">Topics</h2>
        <div className="flex-grow overflow-y-auto pr-2">
          {isLoading && topics.length === 0 && chapter ? <Spinner /> : null}
          {error && <ErrorDisplay message={error} onRetry={() => fetchTopics()} />}
          
          {chapter && (
            <>
                <ul className="space-y-2">
                    {topics.map(topic => (
                    <li key={topic}>
                        <button onClick={() => handleTopicSelect(topic)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTopic === topic ? "bg-[var(--bg-accent-subtle)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-quaternary)]"}`}>
                        {topic}
                        </button>
                    </li>
                    ))}
                </ul>
                {!error && (
                    <button
                        onClick={() => fetchTopics(topics)}
                        disabled={isLoading}
                        className="w-full mt-4 text-center p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Loading...' : 'Load More'}
                    </button>
                )}
            </>
          )}
          {!chapter && <p className="text-sm text-[var(--text-muted)] text-center mt-4">Please select a chapter to see topics.</p>}
        </div>
    </>
  );

  if (showIntro) {
    return <IntroAnimation />;
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden md:flex animate-fade-in">
        {/* Backdrop for mobile */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/60 z-30 md:hidden" 
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 bg-[var(--bg-secondary-sidebar)] backdrop-blur-sm w-4/5 sm:w-1/2 md:w-1/3 xl:w-1/4 z-40 p-4 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
           {sidebarContent}
        </aside>
      
      <div className="flex-grow h-screen flex flex-col">
        <main className="flex-grow overflow-y-auto pt-16 md:pt-0">
            <div className="p-4 sm:p-6 h-full">
                <button 
                    onClick={() => {
                        setIsSidebarOpen(true);
                        setResetPlaygroundTrigger(c => c + 1);
                    }}
                    className={`md:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--bg-secondary-sidebar)] backdrop-blur-sm rounded-lg text-[var(--text-primary)] ${isSidebarOpen ? 'hidden' : ''}`}
                    aria-label="Open menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="bg-[var(--bg-secondary-alpha)] rounded-lg h-full p-4 sm:p-6">
                    {selectedTopic ? (
                        selectedTopic === "Reaction Playground" ? (
                            <PeriodicTable resetTrigger={resetPlaygroundTrigger} />
                        ) : selectedTopic === "Reaction Predictor" ? (
                            <ReactionPredictor />
                        ) : selectedTopic === "Numericals" ? (
                            <Numericals 
                                chapter={chapter!}
                                standard={standard!}
                                subject={CHEMISTRY_SUBJECT}
                            />
                        ) : selectedTopic === "Unit Test" ? (
                             <UnitTest 
                                chapter={chapter!}
                                standard={standard!}
                                subject={CHEMISTRY_SUBJECT}
                            />
                        ) : (
                            <TopicContent 
                                topic={selectedTopic}
                                chapter={chapter}
                                standard={standard}
                                subject={CHEMISTRY_SUBJECT}
                            />
                        )
                    ) : (
                    <div className="flex justify-center items-center h-full">
                        <div className="text-center">
                        <h2 className="text-3xl font-bold text-[var(--text-secondary)]">Welcome to CO/Chemistry</h2>
                        <p className="text-[var(--text-muted)]">Select a standard and chapter from the menu to get started.</p>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </main>
        <Footer onShareFeedbackClick={() => setIsFeedbackModalOpen(true)} />
      </div>

      <ChatBox 
        chatHistory={chatHistory}
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        chapter={chapter}
      />
      
      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);