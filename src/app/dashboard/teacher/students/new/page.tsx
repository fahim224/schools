
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Save,
    User,
    Shield,
    MapPin,
    Users as UsersIcon,
    Camera,
    Info,
    CheckCircle,
    XCircle,
    Loader2
} from "lucide-react";
import { useRef } from "react";
import Link from "next/link";

export default function TeacherStudentRegistration() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [hasCreator, setHasCreator] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        fatherName: "",
        grandfatherName: "",
        studentId: "",
        surname: "",
        tazkiraNo: "",
        nameEn: "",
        fatherNameEn: "",
        grandfatherNameEn: "",
        surnameEn: "",
        permanentAddress: "",
        currentAddress: "",
        paternalUncle: "",
        maternalUncle: "",
        paternalCousin: "",
        maternalCousin: "",
        email: "",
        password: "",
        image: ""
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }

        const user = session?.user as any;
        if (user) {
            if (user.role !== "TEACHER") {
                router.push("/");
                return;
            }

            const isManaged = !!user.createdById;
            const perms = user.permissions || "";

            if (isManaged && !perms.includes("CAN_MANAGE_STUDENTS")) {
                router.push("/dashboard/teacher");
                return;
            }
        }
    }, [status, session, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
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
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch("/api/admin/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/dashboard/teacher/students"), 2000);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to register student");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") return null;

    return (
        <div className="font-sans pb-12">
            {/* Ambient Background Blobs */}
            <div className={`fixed -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-600/10 dark:bg-cyan-600/10 blur-[120px] animate-pulse pointer-events-none`}></div>
            <div className={`fixed top-1/2 -right-24 h-[500px] w-[500px] rounded-full bg-purple-600/5 dark:bg-purple-600/5 blur-[150px] animate-pulse delay-700 pointer-events-none`}></div>

            <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/teacher" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t.student_registration.title}</h2>
                            <h1 className="text-3xl font-black tracking-tight">{t.student_registration.title}</h1>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Sidebar: Profile Photo & Basic Info */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border flex flex-col items-center text-center shadow-xl">
                            <div className="relative group">
                                <div className="h-40 w-40 rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-4 border-primary/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Student" className="h-full w-full object-cover" />
                                    ) : (
                                        <User size={64} className={`text-slate-400 ${uploading ? 'animate-pulse' : ''}`} />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 size={32} className="animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent bubbling
                                        fileInputRef.current?.click();
                                    }}
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
                            <div className="mt-6 w-full space-y-4">
                                <div className="space-y-1">
                                    <label htmlFor="studentId" className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-left block px-2">{t.student_registration.student_id} *</label>
                                    <input
                                        type="text" id="studentId" value={formData.studentId} onChange={handleChange} required
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="BASIS-12345"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="tazkiraNo" className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-left block px-2">{t.student_registration.tazkira_no}</label>
                                    <input
                                        type="text" id="tazkiraNo" value={formData.tazkiraNo} onChange={handleChange}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4">
                            <div className="flex items-center gap-3 text-primary">
                                <Info size={20} />
                                <h4 className="font-black text-sm uppercase tracking-wider">Instructions</h4>
                            </div>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                Please ensure all mandatory fields (marked with *) are filled correctly. The Student ID (Basis Number) will be used as the default password for the student's initial login.
                            </p>
                        </div>
                    </div>

                    {/* Main Form Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Section 1: Local Information */}
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                            <h3 className="flex items-center gap-3 text-xl font-black">
                                <User className="text-cyan-500" />
                                {t.dashboards.financial_info.split(' ')[0]} {t.roles.STUDENT} (DARI/PASHTO)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.name_dr} *</label>
                                    <input type="text" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all transition-shadow" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="surname" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.surname_dr}</label>
                                    <input type="text" id="surname" value={formData.surname} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="fatherName" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.father_name_dr}</label>
                                    <input type="text" id="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="grandfatherName" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.grandfather_name_dr}</label>
                                    <input type="text" id="grandfatherName" value={formData.grandfatherName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: English Information */}
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                            <h3 className="flex items-center gap-3 text-xl font-black">
                                <Shield className="text-purple-500" />
                                INFORMATION (ENGLISH)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="nameEn" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.name_en}</label>
                                    <input type="text" id="nameEn" value={formData.nameEn} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all" dir="ltr" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="surnameEn" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.surname_en}</label>
                                    <input type="text" id="surnameEn" value={formData.surnameEn} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all" dir="ltr" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="fatherNameEn" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.father_name_en}</label>
                                    <input type="text" id="fatherNameEn" value={formData.fatherNameEn} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all" dir="ltr" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="grandfatherNameEn" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.grandfather_name_en}</label>
                                    <input type="text" id="grandfatherNameEn" value={formData.grandfatherNameEn} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all" dir="ltr" />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Addresses & Relatives */}
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                            <h3 className="flex items-center gap-3 text-xl font-black">
                                <MapPin className="text-emerald-500" />
                                {t.student_registration.permanent_address.split('/')[0]} & {t.dashboards.parent}
                            </h3>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="permanentAddress" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.permanent_address}</label>
                                        <textarea id="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-20 resize-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="currentAddress" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.current_address}</label>
                                        <textarea id="currentAddress" value={formData.currentAddress} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-20 resize-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="paternalUncle" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{t.student_registration.paternal_uncle}</label>
                                        <input type="text" id="paternalUncle" value={formData.paternalUncle} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="maternalUncle" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{t.student_registration.maternal_uncle}</label>
                                        <input type="text" id="maternalUncle" value={formData.maternalUncle} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="paternalCousin" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{t.student_registration.paternal_cousin}</label>
                                        <input type="text" id="paternalCousin" value={formData.paternalCousin} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="maternalCousin" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{t.student_registration.maternal_cousin}</label>
                                        <input type="text" id="maternalCousin" value={formData.maternalCousin} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-xs font-bold" />
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
                                    {t.student_registration.submit} Successfully!
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto flex items-center justify-center gap-3 rounded-[1.5rem] bg-primary px-12 py-5 text-lg font-black text-white shadow-2xl shadow-primary/40 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                                {t.student_registration.submit}
                            </button>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
}
