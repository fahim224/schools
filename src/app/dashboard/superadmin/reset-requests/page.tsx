"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    KeyRound,
    User,
    Calendar,
    Lock,
    Eye,
    Copy,
    CheckCircle2,
    AlertCircle,
    Clock,
    Search,
    Loader2,
    ShieldAlert,
    X
} from "lucide-react";
import { format } from "date-fns-jalali";

interface ResetRequest {
    id: string;
    token: string;
    expiresAt: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
        phone: string;
        fatherName: string;
        studentId: string;
    };
}

export default function ResetRequestsPage() {
    const { t } = useLanguage();
    const [requests, setRequests] = useState<ResetRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Auth Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState("");
    const [currentTarget, setCurrentTarget] = useState<{ id: string, action: 'view' | 'copy' } | null>(null);

    // Revealed tokens state
    const [revealedTokens, setRevealedTokens] = useState<Record<string, string>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/superadmin/reset-requests");
            const data = await res.json();
            if (res.ok) {
                setRequests(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleActionClick = (id: string, action: 'view' | 'copy') => {
        // If token already revealed for this ID, just do the action
        if (revealedTokens[id]) {
            if (action === 'copy') {
                copyToClipboard(id, revealedTokens[id]);
            }
            return;
        }

        setCurrentTarget({ id, action });
        setIsAuthModalOpen(true);
        setAdminPassword("");
        setAuthError("");
    };

    const handleVerify = async () => {
        setAuthLoading(true);
        setAuthError("");
        try {
            const res = await fetch("/api/superadmin/reset-requests/verify-admin", {
                method: "POST",
                body: JSON.stringify({ password: adminPassword }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                const request = requests.find(r => r.id === currentTarget?.id);
                if (request) {
                    setRevealedTokens(prev => ({ ...prev, [request.id]: request.token }));
                    if (currentTarget?.action === 'copy') {
                        copyToClipboard(request.id, request.token);
                    }
                }
                setIsAuthModalOpen(false);
            } else {
                setAuthError(t.dashboards.reset_requests.invalid_admin_password);
            }
        } catch (error) {
            setAuthError("Error verifying password");
        } finally {
            setAuthLoading(false);
        }
    };

    const copyToClipboard = (id: string, token: string) => {
        const link = `${window.location.origin}/auth/reset-password?token=${token}`;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 3000);
    };

    const filteredRequests = requests.filter(r =>
        r.user.name.toLowerCase().includes(search.toLowerCase()) ||
        r.user.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.user.phone?.includes(search) ||
        r.user.studentId?.includes(search)
    );

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-indigo-900 dark:text-white flex items-center gap-3">
                        <KeyRound className="h-8 w-8 text-indigo-600" />
                        {t.dashboards.reset_requests.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {t.dashboards.reset_requests.subtitle}
                    </p>
                </div>

                <div className="relative group max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder={t.dashboards.search_placeholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                    <p className="text-gray-500 font-bold animate-pulse">Loading requests...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                        <Clock className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {t.dashboards.reset_requests.no_requests}
                    </h3>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRequests.map((request) => (
                        <div key={request.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group relative overflow-hidden">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-bl-[40px] -mr-4 -mt-4 group-hover:bg-indigo-500/10 transition-colors"></div>

                            <div className="flex items-start justify-between mb-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                        {request.user.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <User size={14} />
                                        {request.user.fatherName} • {request.user.studentId || 'N/A'}
                                    </div>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <Lock className="text-indigo-600 h-6 w-6" />
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
                                    <div className="text-indigo-500"><Calendar size={18} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                                            {t.dashboards.reset_requests.request_date}
                                        </span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                            {format(new Date(request.createdAt), "yyyy/MM/dd HH:mm")}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30">
                                    <div className="text-amber-500"><Clock size={18} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest font-black text-amber-600/70">
                                            {t.dashboards.reset_requests.expiry}
                                        </span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                            {format(new Date(request.expiresAt), "yyyy/MM/dd HH:mm")}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-1 space-y-1">
                                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                        Contact: {request.user.phone || 'No Phone'}
                                    </div>
                                    <div className="text-xs font-bold text-indigo-400 truncate">
                                        {request.user.email}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleActionClick(request.id, 'view')}
                                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-650 transition-all"
                                >
                                    <Eye size={18} />
                                    {t.dashboards.reset_requests.show_token}
                                </button>
                                <button
                                    onClick={() => handleActionClick(request.id, 'copy')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${copiedId === request.id
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-none'
                                        }`}
                                >
                                    {copiedId === request.id ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                    {copiedId === request.id ? t.dashboards.reset_requests.copied : t.dashboards.reset_requests.copy_link}
                                </button>
                            </div>

                            {revealedTokens[request.id] && (
                                <div className="mt-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <p className="text-[10px] uppercase font-black text-indigo-400 mb-1">
                                        Revealed Token:
                                    </p>
                                    <p className="font-mono text-xs break-all text-indigo-900 dark:text-indigo-200 font-bold">
                                        {revealedTokens[request.id]}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Admin Verification Modal */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-800 rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-white/20 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsAuthModalOpen(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-8 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4">
                                <ShieldAlert className="text-amber-500" size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                {t.dashboards.reset_requests.verify_admin_title}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                                {t.dashboards.reset_requests.verify_admin_desc}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 px-1">
                                    {t.dashboards.reset_requests.admin_password}
                                </label>
                                <div className="group relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold"
                                        placeholder="••••••••"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                    />
                                </div>
                            </div>

                            {authError && (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold border border-red-100 dark:border-red-900/30">
                                    <AlertCircle size={20} />
                                    {authError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsAuthModalOpen(false)}
                                    className="flex-1 py-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-black hover:bg-gray-200 transition-all"
                                >
                                    {t.dashboards.reset_requests.cancel}
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={authLoading || !adminPassword}
                                    className="flex-[2] py-4 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {authLoading ? <Loader2 size={20} className="animate-spin" /> : t.dashboards.reset_requests.confirm}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
