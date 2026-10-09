"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Save,
    User,
    Camera,
    Info,
    CheckCircle,
    XCircle,
    Loader2,
    Briefcase,
    Mail,
    Lock,
    Phone,
    Calendar,
    Award
} from "lucide-react";
import Link from "next/link";

export default function AdminProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        jobTitle: "",
        experience: "",
        image: ""
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session) {
            fetchProfile();
        }
    }, [status, session]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    password: "",
                    phone: data.phone || "",
                    jobTitle: data.jobTitle || "",
                    experience: data.experience || "",
                    image: data.image || ""
                });
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith("image/")) {
            setError(t.dashboards.image_validation.invalid_file);
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB
            setError(t.dashboards.image_validation.file_too_large);
            return;
        }

        setUploading(true);
        setError(""); // Clear any previous errors
        const uploadData = new FormData();
        uploadData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: uploadData,
            });

            if (res.ok) {
                const data = await res.json();
                setFormData({ ...formData, image: data.url });
            } else {
                setError("Failed to upload image");
            }
        } catch (err) {
            setError("Error uploading file");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to update profile");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading" || loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 size={48} className="animate-spin text-primary" />
        </div>
    );

    return (
        <div className={`font-sans pb-12 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className={`fixed -top-24 ${dir === 'rtl' ? '-right-24' : '-left-24'} h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse pointer-events-none`}></div>

            <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
                <header className="mb-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/admin" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                            <ArrowLeft size={20} className={`${dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} />
                        </Link>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t.dashboards.account_settings}</h2>
                            <h1 className="text-3xl font-black tracking-tight">{t.dashboards.admin} {t.profile.title}</h1>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar: Profile Photo */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border flex flex-col items-center text-center shadow-xl">
                            <div className="relative group">
                                <div className="h-48 w-48 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 border-4 border-primary/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <User size={80} className={`text-slate-400 ${uploading ? 'animate-pulse' : ''}`} />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 size={32} className="animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition-all"
                                >
                                    <Camera size={20} />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <div className="mt-6 w-full space-y-2">
                                <p className="text-[10px] font-bold text-slate-500">{t.dashboards.image_validation.instruction}</p>
                                {error && error.includes(t.dashboards.image_validation.title?.split(' ')[0] || "Warning") && (
                                    <p className="text-[10px] font-black text-red-500 animate-pulse">{error}</p>
                                )}
                                <h3 className="text-xl font-black">{formData.name || "Admin Name"}</h3>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{formData.jobTitle || t.profile.job_title}</p>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4">
                            <div className="flex items-center gap-3 text-primary">
                                <Info size={20} />
                                <h4 className="font-black text-sm uppercase tracking-wider">{t.profile.instructions}</h4>
                            </div>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                {t.profile.instructions_desc}
                            </p>
                        </div>
                    </div>

                    {/* Main Form Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                            <h3 className="flex items-center gap-3 text-xl font-black">
                                <User className="text-primary" />
                                {t.profile.personal_info}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.register_page.name} *</label>
                                    <div className="relative">
                                        <User size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input
                                            type="text" id="name" value={formData.name} onChange={handleChange} required
                                            className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-primary outline-none transition-all`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.register_page.email} *</label>
                                    <div className="relative" >
                                        <Mail size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input
                                            type="email" id="email" value={formData.email} onChange={handleChange} required
                                            className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-primary outline-none transition-all`}
                                            dir="ltr"
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.dashboards.phone}</label>
                                    <div className="relative">
                                        <Phone size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input
                                            type="text" id="phone" value={formData.phone} onChange={handleChange}
                                            className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-primary outline-none transition-all`}
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.profile.new_password}</label>
                                    <div className="relative">
                                        <Lock size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input
                                            type="password" id="password" value={formData.password} onChange={handleChange}
                                            className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-primary outline-none transition-all`}
                                            placeholder={t.profile.leave_empty}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                            <h3 className="flex items-center gap-3 text-xl font-black">
                                <Briefcase className="text-primary" />
                                {t.profile.professional_info}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="jobTitle" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.profile.job_title}</label>
                                    <div className="relative">
                                        <Award size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input
                                            type="text" id="jobTitle" value={formData.jobTitle} onChange={handleChange}
                                            className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-primary outline-none transition-all`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="experience" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.profile.experience}</label>
                                    <div className="relative">
                                        <Calendar size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input
                                            type="text" id="experience" value={formData.experience} onChange={handleChange}
                                            className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-primary outline-none transition-all`}
                                            placeholder="e.g. 5 Years"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Section */}
                        <div className="flex flex-col md:flex-row items-center justify-end gap-6">
                            {error && (
                                <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
                                    <XCircle size={20} />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 text-emerald-500 font-bold">
                                    <CheckCircle size={20} />
                                    {t.profile.save_success}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full md:w-auto flex items-center justify-center gap-3 rounded-[1.5rem] bg-primary px-12 py-5 text-lg font-black text-white shadow-2xl shadow-primary/40 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                                {t.profile.save_btn}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
