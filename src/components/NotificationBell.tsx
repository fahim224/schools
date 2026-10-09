"use client";

import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, MessageSquare, Shield } from "lucide-react";

export default function NotificationBell() {
    const [messages, setMessages] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                setUnreadCount(data.filter((m: any) => !m.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId: id })
            });
            if (res.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error("Failed to mark read");
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-2xl transition-all duration-300 group hover:scale-110 flex items-center justify-center flex-shrink-0 relative ${isOpen ? 'text-white bg-cyan-600 shadow-lg shadow-cyan-500/30' : 'text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-white hover:bg-cyan-500/5'}`}
            >
                <Bell size={24} className={unreadCount > 0 ? "animate-swing" : ""} />
                {unreadCount > 0 && (
                    <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-white dark:border-slate-900 shadow-lg animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute left-24 top-0 w-80 max-h-[500px] overflow-hidden bg-card border border-border rounded-[2rem] shadow-2xl z-[101] animate-in fade-in slide-in-from-left-4 duration-300 flex flex-col">
                        <div className="p-6 border-b border-border bg-slate-500/5 flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                <Bell size={16} className="text-primary" />
                                Notifications
                            </h4>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-foreground">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide" style={{ maxHeight: '400px' }}>
                            {messages.length > 0 ? messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${msg.isRead ? 'bg-transparent border-transparent opacity-70' : 'bg-primary/5 border-primary/20 shadow-sm'}`}
                                    onClick={() => markAsRead(msg.id)}
                                >
                                    <div className="flex gap-3 relative z-10">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center border border-primary/10">
                                            {msg.sender?.role === 'SUPERADMIN' ? <Shield className="text-purple-500" size={18} /> : <MessageSquare className="text-primary" size={18} />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">{msg.sender?.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xs font-bold text-foreground leading-relaxed line-clamp-2">{msg.content}</p>
                                        </div>
                                    </div>
                                    {!msg.isRead && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary"></div>
                                    )}
                                </div>
                            )) : (
                                <div className="py-12 flex flex-col items-center text-center space-y-3">
                                    <Bell size={40} className="text-slate-200" />
                                    <p className="text-xs font-bold text-slate-400 italic">No new notifications</p>
                                </div>
                            )}
                        </div>

                        {messages.length > 0 && (
                            <div className="p-4 border-t border-border bg-slate-500/5 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click a message to mark as read</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            <style jsx>{`
                @keyframes swing {
                    0%, 100% { transform: rotate(0); }
                    10%, 30%, 50%, 70%, 90% { transform: rotate(10deg); }
                    20%, 40%, 60%, 80% { transform: rotate(-10deg); }
                }
                .animate-swing {
                    animation: swing 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
