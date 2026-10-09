"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Save,
    User as UserIcon,
    Shield,
    MapPin,
    Camera,
    Loader2,
    CheckCircle,
    GraduationCap,
    BookOpen,
    Clock,
    Key,
    AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function TeacherStudentProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { t, dir } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [originalImage, setOriginalImage] = useState("");
    const [activeTab, setActiveTab] = useState("profile");

    // Reset password state
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    const [studentData, setStudentData] = useState<any>(null);
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
        image: "",
        qrCode: "",
        phone: ""
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && !["TEACHER", "ADMIN", "SUPERADMIN"].includes((session.user as any).role)) {
            router.push("/");
        }

        if (session && params.id) {
            fetchStudent();
        }
    }, [status, session, router, params.id]);

    const fetchStudent = async () => {
        try {
            const res = await fetch(`/api/admin/students/${params.id}`);
            const data = await res.json();

            if (res.ok) {
                setStudentData(data);
                setFormData({
                    name: data.name || "",
                    fatherName: data.fatherName || "",
                    grandfatherName: data.grandfatherName || "",
                    studentId: data.studentId || "",
                    surname: data.surname || "",
                    tazkiraNo: data.tazkiraNo || "",
                    nameEn: data.nameEn || "",
                    fatherNameEn: data.fatherNameEn || "",
                    grandfatherNameEn: data.grandfatherNameEn || "",
                    surnameEn: data.surnameEn || "",
                    permanentAddress: data.permanentAddress || "",
                    currentAddress: data.currentAddress || "",
                    paternalUncle: data.paternalUncle || "",
                    maternalUncle: data.maternalUncle || "",
                    paternalCousin: data.paternalCousin || "",
                    maternalCousin: data.maternalCousin || "",
                    email: data.email || "",
                    image: data.image || "",
                    qrCode: data.qrCode || "",
                    phone: data.phone || ""
                });
                setOriginalImage(data.image || "");
            } else {
                setError(`${data.message || "Could not load student data"}`);
            }
        } catch (err) {
            setError("Failed to fetch student profile");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!confirm("Are you sure you want to reset this student's password to their basis number?")) return;

        setResetLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/admin/students/${params.id}/reset-password`, {
                method: "POST"
            });
            if (res.ok) {
                setResetSuccess(true);
                setTimeout(() => setResetSuccess(false), 5000);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to reset password");
            }
        } catch (err) {
            setError("An error occurred during password reset");
        } finally {
            setResetLoading(false);
        }
    };

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
            if (formData.image && formData.image !== originalImage && formData.image.startsWith("/uploads/")) {
                await fetch(`/api/upload?url=${encodeURIComponent(formData.image)}`, {
                    method: "DELETE"
                });
            }

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
        setSubmitting(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch(`/api/admin/students/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSuccess(true);
                setOriginalImage(formData.image);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to update student");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const tabs = [
        { id: "profile", label: (t.dashboards as any).profile || "مشخصات عمومی", icon: UserIcon },
        { id: "grades", label: "نمرات", icon: GraduationCap },
        { id: "enrollments", label: "سوابق تحصیلی", icon: BookOpen },
        { id: "attendance", label: "حاضری", icon: Clock },
    ];

    return (
        <div className={`font-sans pb-12 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className={`fixed -top-24 ${dir === 'rtl' ? '-right-24' : '-left-24'} h-96 w-96 rounded-full bg-cyan-600/10 dark:bg-cyan-600/10 blur-[120px] animate-pulse pointer-events-none`}></div>

            <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/teacher/students" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                            <ArrowLeft size={20} className={`${dir === 'rtl' ? 'rotate-180' : ''} transition-transform`} />
                        </Link>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t.roles.STUDENT} Profile</h2>
                            <h1 className="text-3xl font-black tracking-tight">{formData.name} {formData.surname}</h1>
                        </div>
                    </div>
                </header>

                <div className="flex space-x-2 mb-8 border-b border-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "profile" && (
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar: Photo & Essential ID */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border flex flex-col items-center text-center shadow-xl">
                                <div className="relative group">
                                    <div className="h-40 w-40 rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-4 border-primary/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary">
                                        {formData.image ? (
                                            <img src={formData.image} alt="Student" className="h-full w-full object-cover" />
                                        ) : (
                                            <UserIcon size={64} className={`text-slate-400 ${uploading ? 'animate-pulse' : ''}`} />
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
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                </div>
                                <div className="mt-6 w-full space-y-4 text-start">
                                    <div className="space-y-1">
                                        <label htmlFor="studentId" className="text-[10px] font-black uppercase tracking-widest text-slate-500 block px-2">{t.student_registration.student_id}</label>
                                        <input type="text" id="studentId" value={formData.studentId} onChange={handleChange} required className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all" />
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="tazkiraNo" className="text-[10px] font-black uppercase tracking-widest text-slate-500 block px-2">{t.student_registration.tazkira_no}</label>
                                        <input type="text" id="tazkiraNo" value={formData.tazkiraNo} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all" />
                                    </div>
                                </div>

                                <div className="w-full h-px bg-border my-6"></div>

                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    disabled={resetLoading}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 font-black text-xs transition-all border border-orange-500/20 shadow-sm"
                                >
                                    {resetLoading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                                    {(t.dashboards as any).reset_password || "Reset Password"}
                                </button>
                                {resetSuccess && <p className="text-[10px] font-bold text-emerald-500 mt-2">Password reset to basis!</p>}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                <h3 className="flex items-center gap-3 text-xl font-black">
                                    <UserIcon className="text-cyan-500" />
                                    {(t.dashboards as any).local_profile_title || "General Info"}
                                </h3>

                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.name_dr} *</label>
                                        <input type="text" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="surname" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.surname_dr}</label>
                                        <input type="text" id="surname" value={formData.surname} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="fatherName" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.father_name_dr}</label>
                                        <input type="text" id="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.parent_contact}</label>
                                        <input type="text" id="phone" value={formData.phone || ""} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="grandfatherName" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.grandfather_name_dr}</label>
                                        <input type="text" id="grandfatherName" value={formData.grandfatherName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                <h3 className="flex items-center gap-3 text-xl font-black">
                                    <Shield className="text-purple-500" />
                                    {(t.dashboards as any).english_profile_title || "English Profile"}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="nameEn" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.name_en}</label>
                                        <input type="text" id="nameEn" value={formData.nameEn} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="surnameEn" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.surname_en}</label>
                                        <input type="text" id="surnameEn" value={formData.surnameEn} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="fatherNameEn" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.father_name_en}</label>
                                        <input type="text" id="fatherNameEn" value={formData.fatherNameEn} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all" dir="ltr" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="grandfatherNameEn" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.grandfather_name_en}</label>
                                        <input type="text" id="grandfatherNameEn" value={formData.grandfatherNameEn || ""} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all" dir="ltr" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                <h3 className="flex items-center gap-3 text-xl font-black">
                                    <MapPin className="text-emerald-500" />
                                    {(t.dashboards as any).relatives_addresses_title || "Relatives & Addresses"}
                                </h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="permanentAddress" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.permanent_address}</label>
                                            <textarea id="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all h-20 resize-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="currentAddress" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.current_address}</label>
                                            <textarea id="currentAddress" value={formData.currentAddress} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all h-20 resize-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-6">
                                {success && <div className="text-emerald-500 font-bold flex items-center gap-2"><CheckCircle size={20} /> تغییرات ذخیره شد!</div>}
                                <button type="submit" disabled={submitting} className="flex items-center justify-center gap-3 rounded-[1.5rem] bg-primary px-12 py-5 text-lg font-black text-white shadow-2xl transition-all hover:bg-primary/90 hover:scale-[1.02] disabled:opacity-50">
                                    {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                                    ذخیره تغییرات
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {activeTab === "grades" && (
                    <div className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-xl">
                            <h3 className="text-xl font-black mb-6">نمرات ثبت شده</h3>
                            {studentData?.grades && studentData.grades.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-bold text-center">
                                        <thead className="bg-slate-100 dark:bg-white/10 uppercase tracking-wider text-xs">
                                            <tr>
                                                <th className="p-4 rounded-r-2xl">مضمون</th>
                                                <th className="p-4">نمره</th>
                                                <th className="p-4">نوع امتحان</th>
                                                <th className="p-4 rounded-l-2xl">تاریخ ثبت</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {studentData.grades.map((g: any) => (
                                                <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4">{g.subject?.name}</td>
                                                    <td className={`p-4 ${g.score < 40 ? 'text-red-500' : 'text-emerald-500'}`}>{g.score}</td>
                                                    <td className="p-4">{g.type === 'MIDTERM' ? 'چهار و نیم ماهه' : 'سالانه'}</td>
                                                    <td className="p-4 text-slate-400" dir="ltr">{new Date(g.createdAt).toLocaleDateString('fa-AF')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-slate-500">هیچ نمره ای ثبت نشده است.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "enrollments" && (
                    <div className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-xl">
                            <h3 className="text-xl font-black mb-6">سوابق تحصیلی (صنف ها)</h3>
                            {studentData?.enrollments && studentData.enrollments.length > 0 ? (
                                <div className="space-y-4">
                                    {studentData.enrollments.map((en: any) => (
                                        <div key={en.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border">
                                            <div>
                                                <h4 className="text-lg font-black">{en.class?.name || en.class?.level} - {en.class?.section}</h4>
                                                <p className="text-sm font-bold text-slate-500">سال تحصیلی {en.academicYear}</p>
                                            </div>
                                            <div className="text-emerald-500 font-bold text-xs uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
                                                مشغول تحصیل
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500">هیچ صنف ثبت شده ای یافت نشد.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "attendance" && (
                    <div className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-xl text-start">
                            <h3 className="text-xl font-black mb-6">آمار حاضری</h3>
                            {studentData?.attendance && studentData.attendance.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-bold text-center">
                                        <thead className="bg-slate-100 dark:bg-white/10 uppercase tracking-wider text-xs">
                                            <tr>
                                                <th className="p-4 rounded-r-2xl">نوع</th>
                                                <th className="p-4">حاضر</th>
                                                <th className="p-4">غیرحاضر</th>
                                                <th className="p-4">رخصت</th>
                                                <th className="p-4">مریض</th>
                                                <th className="p-4 rounded-l-2xl">سال</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {studentData.attendance.map((att: any) => (
                                                <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4">{att.type === 'MIDTERM' ? 'چهار و نیم ماهه' : 'سالانه'}</td>
                                                    <td className="p-4 text-emerald-500">{att.present}</td>
                                                    <td className="p-4 text-red-500">{att.absent}</td>
                                                    <td className="p-4 text-blue-500">{att.leave}</td>
                                                    <td className="p-4 text-orange-500">{att.sick}</td>
                                                    <td className="p-4">{att.academicYear}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-slate-500">هیچ آمار حاضری ثبت نشده است.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
