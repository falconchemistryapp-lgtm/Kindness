import React, { useState, useEffect, useRef } from 'react';
import { ContentRenderer } from './ContentRenderer';

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

interface ChatBoxProps {
    chatHistory: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    chapter: string;
}

const ChatBox = ({
    chatHistory,
    onSendMessage,
    isLoading,
    isOpen,
    setIsOpen,
    chapter
}: ChatBoxProps) => {
    const [userInput, setUserInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [chatHistory, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userInput.trim() && !isLoading) {
            onSendMessage(userInput);
            setUserInput('');
        }
    };

    if (!chapter) return null; // Don't show the chatbox if no chapter is selected

    return (
        <>
            {/* Chat Toggle Button */}
            <div className={`fixed bottom-12 right-4 z-50 transition-transform duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-[var(--bg-accent)] text-[var(--text-on-accent)] rounded-full p-4 shadow-lg hover:bg-[var(--bg-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
                    aria-label="Open chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </button>
            </div>

            {/* Chat Window */}
            <div className={`fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-md h-[70vh] max-h-[500px] bg-[var(--bg-secondary)]/80 backdrop-blur-md rounded-xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b border-[var(--border-primary)] flex-shrink-0">
                    <h3 className="font-bold text-[var(--text-accent)]">Chemistry Tutor</h3>
                    <button onClick={() => setIsOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'}`}>
                                {/* FIX: Changed from children to 'content' prop to resolve typing error. */}
                                <ContentRenderer content={msg.text} />
                            </div>
                        </div>
                    ))}
                    {isLoading && chatHistory[chatHistory.length - 1]?.role === 'user' && (
                        <div className="flex justify-start">
                             <div className="bg-[var(--bg-tertiary)] rounded-lg px-3 py-2">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <div className="p-3 border-t border-[var(--border-primary)] flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask a question..."
                            disabled={isLoading}
                            className="flex-grow bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2 text-sm focus:ring-[var(--ring-accent)] focus:border-[var(--border-accent)]"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !userInput.trim()}
                            className="bg-[var(--bg-accent)] text-[var(--text-on-accent)] p-2 rounded-lg transition-colors hover:bg-[var(--bg-accent-hover)] disabled:bg-[var(--bg-quaternary)] disabled:cursor-not-allowed"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ChatBox;