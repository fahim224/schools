
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function AiAssistant() {
    const { data: session } = useSession();
    const { t, dir } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Check if AI is enabled from settings
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch("/api/settings");
                if (res.ok) {
                    const data = await res.json();
                    setEnabled(data.isAiEnabled);
                }
            } catch (err) {
                console.error("AI Status Check failed");
            }
        };
        if (session) checkStatus();
    }, [session]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    if (!session || !enabled) return null;

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: "user" as const, content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
            } else {
                const data = await res.json();
                // Handling specific quota error from API
                if (res.status === 403 && data.limitReached) {
                    setMessages(prev => [...prev, { role: "assistant", content: t.ai_assistant.quota_exceeded }]);
                } else {
                    setMessages(prev => [...prev, { role: "assistant", content: data.message || t.ai_assistant.error }]);
                }
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", content: t.ai_assistant.error }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed bottom-6 ${dir === "rtl" ? "left-6" : "right-6"} z-[100] font-sans`} dir={dir}>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center justify-center h-16 w-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-full shadow-[0_10px_40px_rgba(99,102,241,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white/10"
                >
                    <Sparkles className="text-white group-hover:animate-pulse" size={28} />
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white animate-bounce"></div>

                    {/* Tooltip */}
                    <div className={`absolute ${dir === 'rtl' ? 'right-20' : 'left-20'} opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap pointer-events-none shadow-2xl border border-white/10`}>
                        {t.app_name} AI Assistant
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500 transform origin-bottom-${dir === "rtl" ? "left" : "right"} 
          ${isMinimized ? "h-20 w-80" : "h-[600px] w-[400px] max-w-[90vw] max-h-[80vh]"}`}
                >
                    {/* Header */}
                    <div className="p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Bot size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm tracking-tight">{t.ai_assistant.title}</h3>
                                <p className="text-[10px] font-bold opacity-80 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></span> {t.ai_assistant.online}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all"
                            >
                                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    {!isMinimized && (
                        <>
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50 dark:bg-transparent"
                            >
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-6">
                                        <div className="p-4 bg-indigo-500/10 rounded-full">
                                            <MessageSquare className="text-indigo-500" size={32} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 dark:text-white">{t.ai_assistant.support_text}</h4>
                                            <p className="text-xs font-bold text-slate-500 mt-2">
                                                {t.ai_assistant.support_desc}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 w-full mt-4">
                                            {t.ai_assistant.hints.map((hint: string) => (
                                                <button
                                                    key={hint}
                                                    onClick={() => setInput(hint)}
                                                    className="text-[10px] font-black p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-indigo-500 transition-all text-slate-600 dark:text-slate-400"
                                                >
                                                    {hint}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                                    >
                                        <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                            <div className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-indigo-600" : "bg-slate-200 dark:bg-white/10"}`}>
                                                {msg.role === "user" ? <User size={16} className="text-white" /> : <Bot size={16} className="text-indigo-600" />}
                                            </div>
                                            <div
                                                className={`p-4 rounded-2xl text-sm font-bold shadow-sm ${msg.role === "user"
                                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                                    : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-tl-none text-slate-800 dark:text-white"
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="flex gap-3 max-w-[85%]">
                                            <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                                <Loader2 size={16} className="text-indigo-600 animate-spin" />
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-black text-[10px] text-slate-400">
                                                {t.ai_assistant.thinking}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder={t.ai_assistant.type_placeholder}
                                        className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-[1.5rem] py-4 px-6 pr-14 outline-none font-bold text-sm transition-all"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || loading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <p className="text-[9px] text-center mt-3 text-slate-400 font-bold uppercase tracking-widest">
                                    {t.ai_assistant.powered_by}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Minimized View Placeholder */}
                    {isMinimized && (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-xs font-black text-indigo-400 animate-pulse">{t.ai_assistant.minimized_text}</p>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>
        </div>
    );
}
