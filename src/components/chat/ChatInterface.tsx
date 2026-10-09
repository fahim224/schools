"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import {
    Send,
    Search,
    MoreVertical,
    Phone,
    Video,
    Loader2,
    MessageSquare,
    User,
    Check,
    CheckCheck,
    BellRing
} from "lucide-react";

interface ChatUser {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    isOnline: boolean;
    isTyping: boolean;
    lastActiveAt: string | null;
    unreadCount: number;
    isBlockedByMe: boolean;
    amIBlocked: boolean;
    schoolSettings?: {
        schoolName: string;
    } | null;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    createdAt: string;
    read: boolean;
    sender: {
        id: string;
        name: string;
        image: string | null;
    };
}

export default function ChatInterface() {
    const { data: session } = useSession();
    const { t, dir } = useLanguage();
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [lastTyped, setLastTyped] = useState<number>(0);
    const [showOptions, setShowOptions] = useState(false);
    const [isChatEnabled, setIsChatEnabled] = useState(true);

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data && data.isChatEnabled !== undefined) {
                    setIsChatEnabled(data.isChatEnabled);
                }
            })
            .catch(err => console.error("Error fetching settings:", err));
    }, []);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUserId = (session?.user as any)?.id;

    // Helper: relative time format
    const formatLastActive = (dateString: string | null) => {
        if (!dateString) return "نامشخص";
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "چند لحظه پیش";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقیقه پیش`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعت پیش`;
        return date.toLocaleDateString("fa-IR");
    };

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 1. Fetch Users & Status (Polling)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/chat/users");
                if (res.ok) {
                    const data: ChatUser[] = await res.json();
                    setUsers(data);

                    // Simple browser notification check
                    const totalUnread = data.reduce((acc, u) => acc + u.unreadCount, 0);
                    if (totalUnread > 0 && document.hidden) {
                        document.title = `(${totalUnread}) پیام جدید - مکتب یار`;
                    } else {
                        document.title = "مکتب یار | سیستم مدیریت هوشمند مکاتب";
                    }
                }
            } catch (error) {
                console.error("Error fetching chat users:", error);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
        const interval = setInterval(fetchUsers, 5000); // Poll every 5s for user status
        return () => clearInterval(interval);
    }, []);

    // 2. Heartbeat (Update my online status)
    useEffect(() => {
        const heartbeat = async () => {
            try {
                await fetch("/api/user/active", { method: "POST" });
            } catch (e) { }
        };

        heartbeat();
        const interval = setInterval(heartbeat, 30000); // Every 30s
        return () => clearInterval(interval);
    }, []);

    // 3. Fetch Messages for Selected User (Polling)
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/chat/messages?userId=${selectedUser.id}`);
                if (res.ok) {
                    const data = await res.json();

                    setMessages(prev => {
                        // Only update if length changed or last message ID changed to avoid jitter
                        if (prev.length !== data.length || (data.length > 0 && prev.length > 0 && prev[prev.length - 1].id !== data[data.length - 1].id)) {
                            return data;
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        setLoadingMessages(true);
        fetchMessages().then(() => setLoadingMessages(false));

        const interval = setInterval(fetchMessages, 3000); // Poll every 3s for new messages
        return () => clearInterval(interval);
    }, [selectedUser]);

    // 4. Handle Typing Indicator
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);

        const now = Date.now();
        if (now - lastTyped > 2000) { // Throttle: only notify every 2s
            setLastTyped(now);
            fetch("/api/user/typing", { method: "POST" }).catch(() => { });
        }
    };

    const handleBlockUser = async () => {
        if (!selectedUser) return;
        const action = selectedUser.isBlockedByMe ? "unblock" : "block";
        const confirmMsg = action === "block"
            ? "آیا مطمئن هستید که می‌خواهید این کاربر را مسدود کنید؟"
            : "آیا مطمئن هستید که می‌خواهید این کاربر را رفع مسدودی کنید؟";

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch("/api/chat/block", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetId: selectedUser.id, action })
            });

            if (res.ok) {
                // Optimistically update UI
                setUsers(prev => prev.map(u =>
                    u.id === selectedUser.id
                        ? { ...u, isBlockedByMe: action === "block" }
                        : u
                ));
                setSelectedUser(prev => prev ? { ...prev, isBlockedByMe: action === "block" } : null);
                setShowOptions(false);
            }
        } catch (error) {
            console.error("Error blocking user:", error);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !selectedUser || sending) return;

        const content = inputText.trim();
        setInputText(""); // Optimistic clear
        setSending(true);

        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiverId: selectedUser.id,
                    content
                })
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessages(prev => [...prev, newMessage]);
                scrollToBottom();
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Selected user live data (e.g. typing status)
    const activeUser = users.find(u => u.id === selectedUser?.id) || selectedUser;

    if (!isChatEnabled && (session?.user as any)?.role !== "SUPERADMIN") {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-card border border-border rounded-[2rem] shadow-xl text-center space-y-4">
                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/10 rounded-full flex items-center justify-center text-amber-600">
                    <BellRing size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">بخش چت مسدود می‌باشد</h2>
                <p className="text-slate-500 max-w-md">ارسال و دریافت پیام در حال حاضر توسط مدیر ارشد (فهیم الله) غیرفعال شده است.</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-card border border-border rounded-[2rem] shadow-xl overflow-hidden">
            {/* Sidebar (Users List) */}
            <div className={`w-full md:w-80 border-e border-border flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {/* Search Header */}
                <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="جستجو..."
                            className="w-full bg-background border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {loadingUsers ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredUsers.length === 0 ? (
                                <p className="text-center text-muted-foreground text-sm p-4">کاربری یافت نشد</p>
                            ) : (
                                filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => {
                                            setSelectedUser(user);
                                            // Optimistically clear unread count
                                            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, unreadCount: 0 } : u));
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedUser?.id === user.id
                                            ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                            : "hover:bg-slate-100 dark:hover:bg-white/5"
                                            }`}
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border border-border">
                                                {user.image ? (
                                                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-lg">
                                                        {user.name?.[0]?.toUpperCase() || <User size={20} />}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Online Status Indicator */}
                                            {user.isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full shadow-sm animate-pulse"></span>
                                            )}
                                        </div>
                                        <div className="flex-1 text-start overflow-hidden">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-bold text-sm truncate">{user.name || "Unknown"}</h4>
                                                {user.unreadCount > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-lg shadow-red-500/30 animate-pulse">
                                                        {user.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5 h-4">
                                                {user.isBlockedByMe ? (
                                                    <p className="text-[10px] text-red-500 font-bold">مسدود شده</p>
                                                ) : user.isTyping ? (
                                                    <p className="text-[10px] text-primary font-bold animate-pulse">در حال نوشتن...</p>
                                                ) : (
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black truncate max-w-[80px]">
                                                        {user.role}
                                                    </p>
                                                )}
                                                {user.isOnline ? (
                                                    <span className="text-[10px] text-green-500 font-bold">آنلاین</span>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">{formatLastActive(user.lastActiveAt)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-slate-50/30 dark:bg-black/10 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {activeUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-border bg-card flex items-center justify-between shadow-sm z-10 sticky top-0">
                            <div className="flex items-center gap-3">
                                <button
                                    className="md:hidden p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"
                                    onClick={() => setSelectedUser(null)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                                            {activeUser.image ? (
                                                <img src={activeUser.image} alt={activeUser.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold">
                                                    {activeUser.name?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        {activeUser.isOnline && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-foreground">{activeUser.name}</h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                            {activeUser.isBlockedByMe ? (
                                                <span className="text-red-500 font-bold">مسدود شده</span>
                                            ) : activeUser.isTyping ? (
                                                <span className="text-primary font-bold animate-pulse">در حال نوشتن...</span>
                                            ) : (
                                                activeUser.isOnline ? "آنلاین" : ("آخرین بازدید: " + formatLastActive(activeUser.lastActiveAt))
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 relative">
                                {((session?.user as any)?.role === "SUPERADMIN" || (session?.user as any)?.role === "ADMIN") && (
                                    <button
                                        onClick={() => {
                                            const isSuperAdmin = (session?.user as any)?.role === "SUPERADMIN";
                                            if (isSuperAdmin) {
                                                // SuperAdmin always goes to the universal user profile page
                                                window.open(`/dashboard/superadmin/users/${activeUser.id}`, '_blank');
                                            } else {
                                                // Admin goes to role-specific pages
                                                if (activeUser.role === 'STUDENT') {
                                                    window.open(`/dashboard/admin/students/${activeUser.id}`, '_blank');
                                                } else if (activeUser.role === 'PARENT') {
                                                    window.open(`/dashboard/admin/parents/${activeUser.id}`, '_blank');
                                                } else {
                                                    // TEACHER, ADMIN, STAFF → edit page
                                                    window.open(`/dashboard/admin/employees/${activeUser.id}/edit`, '_blank');
                                                }
                                            }
                                        }}
                                        className="p-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors"
                                        title="مشاهده پروفایل"
                                    >
                                        <User size={18} />
                                    </button>
                                )}
                                <button
                                    className="p-2 text-slate-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
                                    onClick={() => setShowOptions(!showOptions)}
                                >
                                    <MoreVertical size={18} />
                                </button>
                                {showOptions && (
                                    <div className="absolute top-10 left-0 bg-card border border-border shadow-xl rounded-xl py-1 w-48 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={handleBlockUser}
                                            className="w-full text-start px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-white/5 text-red-500 font-bold flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                                            {activeUser.isBlockedByMe ? "رفع مسدودی کاربر" : "مسدود کردن کاربر"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50 dark:bg-black/20" style={{ backgroundImage: "url('/images/chat-bg-pattern.png')", backgroundBlendMode: 'overlay' }}>
                            {loadingMessages && messages.length === 0 ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50">
                                    <MessageSquare size={48} className="mb-2" />
                                    <p>هنوز پیامی نیست. آغاز کننده باشید!</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMe = msg.senderId === currentUserId;
                                    const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);

                                    return (
                                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isMe && (
                                                <div className="w-8 h-8 flex-shrink-0">
                                                    {showAvatar && (
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                                                            {msg.sender.image ? (
                                                                <img src={msg.sender.image} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-[10px] font-bold">
                                                                    {msg.sender.name?.[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className={`max-w-[70%] group relative px-4 py-2.5 rounded-2xl shadow-sm leading-relaxed text-sm ${isMe
                                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-none'
                                                : 'bg-white dark:bg-slate-800 text-foreground rounded-bl-none border border-border'
                                                }`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-blue-100 justify-end' : 'text-muted-foreground'}`}>
                                                    <span>{new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {isMe && (
                                                        msg.read ? <CheckCheck size={12} /> : <Check size={12} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-card border-t border-border">
                            {/* Unread Alert inside chat (if any) */}
                            {activeUser.unreadCount > 0 && (
                                <div className="mb-2 text-center">
                                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full animate-bounce inline-flex items-center gap-1">
                                        <BellRing size={12} />
                                        {activeUser.unreadCount} پیام جدید
                                    </span>
                                </div>
                            )}

                            {activeUser.isBlockedByMe ? (
                                <div className="p-4 text-center bg-slate-100 dark:bg-slate-900 rounded-xl text-red-500 font-bold text-sm">
                                    شما این کاربر را مسدود کرده‌اید.
                                    <button onClick={handleBlockUser} className="mx-2 underline hover:text-red-600">رفع مسدودی</button>
                                </div>
                            ) : activeUser.amIBlocked ? (
                                <div className="p-4 text-center bg-slate-100 dark:bg-slate-900 rounded-xl text-muted-foreground font-bold text-sm">
                                    شما نمیتوانید به این کاربر پیام ارسال کنید.
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-[1.5rem] border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={handleInput}
                                        placeholder="پیام خود را بنویسید..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 min-h-[48px] max-h-[120px] resize-none outline-none"
                                        autoComplete="off"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputText.trim() || sending}
                                        className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex-shrink-0"
                                    >
                                        {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 p-4 text-center">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare size={48} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">گفتگو را آغاز کنید</h3>
                        <p className="max-w-xs">کاربری را از لیست انتخاب کنید تا گفتگو شروع شود.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
