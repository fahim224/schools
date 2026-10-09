"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Save,
    User as UserIcon,
    Trash2,
    Shield,
    Camera,
    CheckCircle,
    XCircle,
    Loader2,
    Briefcase,
    Mail,
    Lock,
    Phone,
    Download,
    AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function EmployeeProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = useParams();
    const { t, dir } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "",
        phone: "",
        jobTitle: "",
        image: "",
        qrCode: "",
        permissions: ""
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        } else if (session && id) {
            fetchEmployee();
        }
    }, [status, session, router, id]);

    const fetchEmployee = async () => {
        try {
            const res = await fetch(`/api/admin/employees/${id}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    password: "",
                    role: data.role || "TEACHER",
                    phone: data.phone || "",
                    jobTitle: data.jobTitle || "",
                    image: data.image || "",
                    qrCode: data.qrCode || "",
                    permissions: data.permissions || "CAN_GRADE,CAN_VIEW_RESULTS"
                });
            } else {
                setError("Employee not found");
            }
        } catch (err) {
            setError("Failed to fetch employee details");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handlePermissionToggle = (perm: string) => {
        const current = formData.permissions.split(",").filter(p => p !== "");
        const updated = current.includes(perm)
            ? current.filter(p => p !== perm)
            : [...current, perm];
        setFormData({ ...formData, permissions: updated.join(",") });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith("image/")) {
            setError(t.dashboards.image_validation.invalid_file);
            return;
        }
        if (file.size > 1024 * 1024) {
            setError(t.dashboards.image_validation.file_too_large);
            return;
        }

        setUploading(true);
        setError("");
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

    const handleDownloadQR = () => {
        if (!formData.qrCode) return;
        const link = document.createElement('a');
        link.href = formData.qrCode;
        link.download = `QR_${formData.name || 'employee'}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess(false);

        const submitData = { ...formData };
        if (!submitData.password) {
            delete (submitData as any).password;
        }

        try {
            const res = await fetch(`/api/admin/employees/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to update employee");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/employees/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/dashboard/admin/employees");
            } else {
                setError("Failed to delete employee");
                setShowDeleteModal(false);
            }
        } catch (err) {
            setError("Something went wrong during deletion");
        } finally {
            setSubmitting(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    return (
        <div className={`font-sans pb-12 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {/* Ambient Blobs */}
            <div className={`fixed -top-24 ${dir === 'rtl' ? '-right-24' : '-left-24'} h-96 w-96 rounded-full bg-emerald-600/10 dark:bg-emerald-600/10 blur-[120px] animate-pulse pointer-events-none`}></div>

            <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
                <header className="mb-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/admin/employees" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                            <ArrowLeft size={20} className={`${dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} />
                        </Link>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">{t.dashboards.manage_employees} Profile</h2>
                            <h1 className="text-3xl font-black tracking-tight">{formData.name || t.dashboards.edit_employee}</h1>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    >
                        <Trash2 size={24} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar: Photo & QR Code */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border flex flex-col items-center text-center shadow-xl">
                            <div className="relative group">
                                <div className="h-40 w-40 rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-4 border-emerald-500/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Employee" className="h-full w-full object-cover" />
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
                                    className="absolute -bottom-2 -right-2 p-3 bg-emerald-500 text-white rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition-all"
                                >
                                    <Camera size={20} />
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            </div>
                            <div className="mt-6 w-full space-y-2">
                                <p className="text-[10px] font-bold text-slate-500">{t.dashboards.image_validation.instruction}</p>
                                {error && error.includes(t.dashboards.image_validation.title.split(' ')[0]) && (
                                    <p className="text-[10px] font-black text-red-500 animate-pulse">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 w-full space-y-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{t.roles[formData.role]}</label>
                                    <div className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-emerald-500">
                                        {formData.jobTitle || t.roles[formData.role]}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{t.dashboards.phone}</label>
                                    <div className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-4 py-3 text-sm font-bold">
                                        {formData.phone || "---"}
                                    </div>
                                </div>
                            </div>

                            {/* QR Code Section */}
                            {formData.qrCode && (
                                <div className="mt-6 pt-6 border-t border-border w-full">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 bg-white rounded-2xl shadow-lg border border-border">
                                            <img
                                                src={formData.qrCode}
                                                alt="Employee QR Code"
                                                className="w-48 h-48"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleDownloadQR}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Download size={20} />
                                            {t.dashboards.download_qr_code}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content: Sections */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Section: Professional Info */}
                        <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                            <h3 className="flex items-center gap-3 text-xl font-black text-foreground">
                                <Briefcase className="text-emerald-500" />
                                {t.dashboards.staff_list}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.register_page.name} *</label>
                                    <div className="relative">
                                        <UserIcon size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input type="text" id="name" value={formData.name} onChange={handleChange} required className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all`} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="role" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.role} *</label>
                                    <div className="relative">
                                        <Shield size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <select id="role" value={formData.role} onChange={handleChange} required className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none`}>
                                            <option value="TEACHER">{t.roles.TEACHER}</option>
                                            <option value="STAFF">{t.roles.STAFF}</option>
                                            <option value="ADMIN">{t.roles.ADMIN}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="jobTitle" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.surname_dr} / {t.roles.STAFF}</label>
                                    <div className="relative">
                                        <Briefcase size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input type="text" id="jobTitle" value={formData.jobTitle} onChange={handleChange} className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all`} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.dashboards.phone}</label>
                                    <div className="relative">
                                        <Phone size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input type="text" id="phone" value={formData.phone} onChange={handleChange} className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all`} dir="ltr" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.register_page.email}</label>
                                    <div className="relative">
                                        <Mail size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input type="email" id="email" value={formData.email} onChange={handleChange} className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all`} dir="ltr" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.register_page.password} (Leave blank to keep current)</label>
                                    <div className="relative">
                                        <Lock size={18} className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} />
                                        <input type="password" id="password" value={formData.password} onChange={handleChange} className={`w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-3.5 text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all`} />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Permissions (Only for Teachers) */}
                            {formData.role === "TEACHER" && (
                                <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="flex items-center gap-3 text-xl font-black text-foreground">
                                            <Shield className="text-emerald-500" />
                                            دسترسی‌ها و صلاحیت‌ها
                                        </h3>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Permissions</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: "CAN_GRADE", label: "ثبت نمرات و حاضری", labelEn: "Grading & Attendance" },
                                            { id: "CAN_PRINT_CARTS", label: "چاپ و دانلود کارنامه", labelEn: "Print Report Cards" },
                                            { id: "CAN_VIEW_RESULTS", label: "مشاهده جدول نتایج", labelEn: "View Results Table" },
                                            { id: "CAN_MANAGE_STUDENTS", label: "ثبت شاگرد جدید", labelEn: "Register Students" },
                                            { id: "CAN_MANAGE_CLASSES", label: "ویرایش معلومات صنف", labelEn: "Edit Class Detail" },
                                        ].map((perm) => (
                                            <div
                                                key={perm.id}
                                                onClick={() => handlePermissionToggle(perm.id)}
                                                className={`group cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${formData.permissions.includes(perm.id)
                                                    ? 'bg-emerald-50 border-emerald-500/50 dark:bg-emerald-500/10'
                                                    : 'bg-slate-50 border-transparent hover:border-slate-200 dark:bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex flex-col text-start">
                                                    <span className={`font-black text-sm ${formData.permissions.includes(perm.id) ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {perm.label}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">{perm.labelEn}</span>
                                                </div>
                                                <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${formData.permissions.includes(perm.id)
                                                    ? 'bg-emerald-500 text-white rotate-0'
                                                    : 'bg-slate-200 dark:bg-slate-800 text-transparent -rotate-90'
                                                    }`}>
                                                    <CheckCircle size={14} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-start">
                                        <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                                            توجه: تغییر دسترسی‌ها بلافاصله پس از ذخیره شدن بر روی حساب معلم اعمال می‌شود. برخی دسترسی‌ها ممکن است نیاز به بارگذاری مجدد صفحه توسط معلم داشته باشد.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Final Actions */}
                        <div className="flex flex-col md:flex-row items-center justify-end gap-6">
                            {error && <div className="text-red-500 font-bold flex items-center gap-2 animate-pulse"><XCircle size={20} />{error}</div>}
                            {success && <div className="text-emerald-500 font-bold flex items-center gap-2"><CheckCircle size={20} />{t.dashboards.save_changes} Successfully!</div>}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full md:w-auto flex items-center justify-center gap-3 rounded-[1.5rem] bg-emerald-500 px-12 py-5 text-lg font-black text-white shadow-2xl shadow-emerald-500/40 transition-all hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                            >
                                {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                                {t.dashboards.save_changes}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-card border border-border rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="p-4 bg-red-500/10 text-red-500 rounded-full">
                                <AlertTriangle size={48} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-foreground">Are you absolutely sure?</h3>
                                <p className="text-slate-500 font-bold">This action will permanently delete this employee account and cannot be recovered.</p>
                            </div>
                            <div className="flex w-full gap-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 font-black hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={submitting}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white font-black hover:bg-red-600 transition-all shadow-lg shadow-red-500/40"
                                >
                                    {submitting ? <Loader2 className="animate-spin mx-auto" /> : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
