"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    User as UserIcon,
    Mail,
    Shield,
    Activity,
    DollarSign,
    Percent,
    Save,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Trash2
} from "lucide-react";
import Link from "next/link";

type UserDetails = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    isActive: boolean;
    phone: string | null;
    receivedAmount: number;
    image: string | null;
    createdById: string | null;
    classLimit: number;
    schoolSettings?: { isIdCardEnabled: boolean } | null;
};

export default function UserProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { t } = useLanguage();

    const [user, setUser] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [role, setRole] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [phone, setPhone] = useState("");
    const [classLimit, setClassLimit] = useState(1);
    const [isIdCardEnabled, setIsIdCardEnabled] = useState(false);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch(`/api/users/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setRole(data.role);
                setIsActive(data.isActive);
                setReceivedAmount(data.receivedAmount || 0);
                setPhone(data.phone || "");
                setClassLimit(data.classLimit || 1);
                setIsIdCardEnabled(data.schoolSettings?.isIdCardEnabled || false);
            }
        } catch (err) {
            console.error("Failed to fetch user details");
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        } else if (session) {
            fetchUser();
        }
    }, [status, session, router, fetchUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        try {
            const res = await fetch(`/api/users/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, isActive, receivedAmount, phone, classLimit, isIdCardEnabled }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg text-primary"></div>
            </div>
        );
    }

    if (!user) return <div className="p-8 text-white">User not found</div>;

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 transition-colors duration-300 font-sans">
            <header className="mb-10 flex items-center justify-between">
                <Link
                    href="/dashboard/superadmin"
                    className="flex items-center gap-2 text-primary hover:underline font-bold transition-all"
                >
                    <ArrowLeft size={20} />
                    {t.home}
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                    {t.dashboards.view_profile}
                </h1>
            </header>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Profile Card */}
                <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-6 h-32 w-32 rounded-full border-4 border-primary/20 bg-primary/10 p-1 shadow-xl overflow-hidden flex items-center justify-center">
                            {user.image ? (
                                <img src={user.image} alt="avatar" className="h-full w-full object-cover" />
                            ) : (
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="avatar" />
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-foreground">{user.name || "---"}</h2>
                        <p className="mt-1 text-muted-foreground font-medium" dir="ltr">{user.email}</p>

                        <div className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                            {isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            {isActive ? t.dashboards.active : t.dashboards.inactive}
                        </div>
                    </div>

                    <div className="mt-8 space-y-4 border-t border-border pt-8">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t.role}</span>
                            <span className="font-black text-primary">{t.roles[user.role as keyof typeof t.roles] || user.role}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">ID</span>
                            <span className="text-xs font-mono opacity-50">{user.id}</span>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-8 shadow-sm">
                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Account Settings */}
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                                    <Shield className="text-blue-500" size={24} />
                                    {(t.dashboards as any).account_settings}
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Class Creation Limit (Independent Teachers)</label>
                                    <input
                                        type="number"
                                        value={classLimit}
                                        onChange={(e) => setClassLimit(parseInt(e.target.value))}
                                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-bold"
                                        min="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">{t.role}</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                                    >
                                        <option value="SUPERADMIN">SuperAdmin</option>
                                        <option value="ADMIN">School Manager</option>
                                        <option value="TEACHER">Teacher</option>
                                        <option value="STUDENT">Student</option>
                                        <option value="PARENT">Parent</option>
                                        <option value="STAFF">Staff</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">{t.dashboards.status}</label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsActive(true)}
                                            className={`flex-1 rounded-2xl border py-3 font-bold transition-all ${isActive ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-background border-border text-muted-foreground'
                                                }`}
                                        >
                                            {t.dashboards.active}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsActive(false)}
                                            className={`flex-1 rounded-2xl border py-3 font-bold transition-all ${!isActive ? 'bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-background border-border text-muted-foreground'
                                                }`}
                                        >
                                            {t.dashboards.inactive}
                                        </button>
                                    </div>
                                </div>
                                {role === "ADMIN" && (
                                    <div className="space-y-2 border-t border-border pt-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-sm font-black text-foreground">طراح کارت هوشمند (دیزاینر)</label>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">ID Card Designer Access</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsIdCardEnabled(true)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isIdCardEnabled ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                >
                                                    فعال (Enabled)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsIdCardEnabled(false)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isIdCardEnabled ? 'bg-slate-700 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                >
                                                    غیرفعال (Disabled)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Financial Information */}
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                                    <DollarSign className="text-emerald-500" size={24} />
                                    {t.dashboards.financial_info}
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">{t.dashboards.received_amount}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">{t.dashboards.currency}</span>
                                        <input
                                            type="number"
                                            value={receivedAmount}
                                            onChange={(e) => setReceivedAmount(parseFloat(e.target.value))}
                                            className="w-full rounded-2xl border border-border bg-background px-4 py-3 pl-14 text-foreground transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-black"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">{t.dashboards.phone}</label>
                                    <div className="relative">
                                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full rounded-2xl border border-border bg-background px-4 py-3 pl-12 text-foreground transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                                            placeholder="07XXXXXXXX"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t border-border pt-8">
                            <div className="flex items-center gap-4">
                                {(session?.user as any).role === "SUPERADMIN" || (user.createdById === (session?.user as any).id) ? (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (confirm(t.dashboards.delete + "?")) {
                                                const res = await fetch("/api/users", {
                                                    method: "DELETE",
                                                    body: JSON.stringify({ userId: user.id }),
                                                    headers: { "Content-Type": "application/json" }
                                                });
                                                if (res.ok) router.push("/dashboard/superadmin");
                                            }
                                        }}
                                        className="flex items-center gap-2 rounded-2xl bg-red-500/10 px-6 py-3 text-sm font-black text-red-500 hover:bg-red-500/20 transition-all"
                                    >
                                        <Trash2 size={18} />
                                        {t.dashboards.delete}
                                    </button>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-4">
                                {success && (
                                    <div className="flex items-center gap-2 text-emerald-500 font-bold animate-in fade-in slide-in-from-right-4">
                                        <CheckCircle size={20} />
                                        Changes Saved!
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-lg font-black text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-70"
                                >
                                    {saving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Save size={20} />}
                                    {t.dashboards.save_changes}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
