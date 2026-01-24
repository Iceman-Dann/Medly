
import React, { useState, useRef, useEffect } from 'react';
import { useHealth } from '../HealthContext';
import { gemini } from '../services/gemini';

const ChatAssistant: React.FC = () => {
    const { chatHistory, addChatMessage, getRecentContext, isMedicalContextEnabled, setMedicalContextEnabled } = useHealth();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        addChatMessage({ role: 'user', content: userMsg });
        setIsLoading(true);

        try {
            const context = isMedicalContextEnabled ? getRecentContext() : [];
            const response = await gemini.chat(userMsg, context, chatHistory);
            addChatMessage({ role: 'assistant', content: response });
        } catch (error) {
            addChatMessage({ role: 'assistant', content: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen lg:ml-64 bg-background-light dark:bg-background-dark">
            <header className="flex-none p-6 border-b border-slate-200 dark:border-rose-900/20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">smart_toy</span>
                            Symra AI Assistant
                        </h2>
                        <p className="text-xs text-slate-500">Professional medical empowerment companion</p>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl border border-primary/10 bg-primary/5">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold leading-none">Medical Context</p>
                            <p className="text-[10px] text-slate-500">Syncs with your history</p>
                        </div>
                        <button 
                            onClick={() => setMedicalContextEnabled(!isMedicalContextEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isMedicalContextEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMedicalContextEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {chatHistory.length === 0 && (
                        <div className="bg-primary/5 border border-primary/20 p-8 rounded-3xl text-center space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
                            </div>
                            <h3 className="text-xl font-bold">Hello, I'm Symra</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                How can I help you understand your symptoms today? I can analyze your logs, explain clinical terms, or help you prepare questions for your doctor.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {["Review my last 3 days", "Help me describe pelvic pain", "Prepare for my OBGYN visit"].map(q => (
                                    <button 
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="text-xs font-semibold px-4 py-2 bg-white dark:bg-rose-950/20 border border-primary/20 rounded-full hover:bg-primary hover:text-white transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                    <span className="material-symbols-outlined text-primary">clinical_notes</span>
                                </div>
                            )}
                            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-primary text-white rounded-tr-none' 
                                : 'bg-white dark:bg-rose-950/20 border border-primary/10 text-slate-800 dark:text-slate-100 rounded-tl-none'
                            }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <p className={`text-[9px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            {msg.role === 'user' && (
                                <div className="size-10 rounded-full bg-cover bg-center shrink-0 border-2 border-primary/30" style={{ backgroundImage: `url('https://picsum.photos/seed/user/100')` }}></div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4 animate-pulse">
                            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                            <div className="max-w-[100px] h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl rounded-tl-none"></div>
                        </div>
                    )}
                </div>
            </div>

            <footer className="flex-none p-6 border-t border-slate-200 dark:border-rose-900/20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="max-w-3xl mx-auto">
                    <div className="relative flex items-center">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Describe your symptoms or ask a question..."
                            className="w-full bg-slate-50 dark:bg-rose-950/20 border border-slate-200 dark:border-rose-900/30 rounded-2xl py-4 pl-6 pr-16 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-3 bg-primary p-2.5 rounded-xl text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <span className="material-symbols-outlined font-bold">send</span>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest">
                        Symra AI is not a replacement for professional medical advice.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ChatAssistant;
