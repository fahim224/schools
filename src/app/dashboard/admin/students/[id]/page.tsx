"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    Save,
    User as UserIcon,
    Trash2,
    Shield,
    MapPin,
    Camera,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    Download,
    History,
    Award,
    Calendar,
    FileText,
    Printer,
    Activity
} from "lucide-react";
import { useRef } from "react";
import Link from "next/link";
import { IdCardPreview, generateIdCardImage } from "@/components/IdCardPreview";

const toPersianNum = (n: string | number | undefined | null) => {
    if (n === undefined || n === null || n === "") return "";
    return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

export default function StudentProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [originalImage, setOriginalImage] = useState("");

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
        phone: "",
        groupId: ""
    });

    const [groups, setGroups] = useState<any[]>([]);

    const [studentHistory, setStudentHistory] = useState<{ enrollments: any[], grades: any[], attendance: any[] }>({
        enrollments: [],
        grades: [],
        attendance: []
    });
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [schoolSettings, setSchoolSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        }

        if (session && params.id) {
            fetchStudent();
            fetchSettings();
            fetchGroups();
        }
    }, [status, session, router, params.id]);

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/superadmin/groups");
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (err) {
            console.error("Failed to fetch groups");
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setSchoolSettings(data);
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        }
    };

    const fetchStudent = async () => {
        try {
            const res = await fetch(`/api/admin/students/${params.id}`);
            const data = await res.json();

            if (res.ok) {
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
                    phone: data.phone || "",
                    groupId: data.groupId || ""
                });
                setOriginalImage(data.image || "");
                setStudentHistory({
                    enrollments: data.enrollments || [],
                    grades: data.grades || [],
                    attendance: data.attendance || []
                });
                if (data.enrollments && data.enrollments.length > 0) {
                    setSelectedHistoryId(data.enrollments[0].classId);
                } else if (data.grades && data.grades.length > 0) {
                    // Fallback if no enrollment record exists but grades do
                    setSelectedHistoryId(data.grades[0].classId);
                } else if (data.attendance && data.attendance.length > 0) {
                    setSelectedHistoryId(data.attendance[0].classId);
                }
            } else {
                setError(`${data.message || "Could not load student data"} (Status: ${res.status})`);
            }
        } catch (err) {
            setError("Failed to fetch student profile");
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

        // Image Validation
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
            // If we have a preview image (different from original) and are uploading a NEW one, delete the current preview
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

    const handleDownloadQR = () => {
        if (!formData.qrCode) return;

        const link = document.createElement('a');
        link.href = formData.qrCode;
        link.download = `QR_${formData.studentId || formData.name}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadIdCard = async () => {
        if (!schoolSettings?.idCardDesign) return;

        setLoading(true);

        try {
            const dataUrl = await generateIdCardImage(
                schoolSettings.idCardDesign,
                { ...formData, class: { name: schoolSettings?.className || '' } },
                schoolSettings
            );

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `IDCard_${formData.name}_${Date.now()}.png`;
            link.click();
        } catch (err) {
            console.error(err);
            alert("خطا در ایجاد کارت. لطفا مطمئن شوید عکس‌ها کامل لود شده‌اند.");
        } finally {
            setLoading(false);
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

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/students/${params.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/dashboard/admin");
            } else {
                const errorData = await res.json();
                setError(errorData.message || "Failed to delete student");
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
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="font-sans pb-12">
            {/* Ambient Blobs */}
            <div className={`fixed -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-600/10 dark:bg-cyan-600/10 blur-[120px] animate-pulse pointer-events-none`}></div>

            <div className="container mx-auto px-4 md:px-8 py-8 relative z-10">
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/admin" className="p-3 bg-card border border-border rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm group">
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t.roles.STUDENT} Profile</h2>
                            <h1 className="text-3xl font-black tracking-tight">{formData.name} {formData.surname}</h1>
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

                    {/* Sidebar: Photo & Essential ID */}
                    <div className="lg:col-span-1 space-y-8">
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
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <p className="mt-2 text-[10px] font-bold text-slate-500">
                                {t.dashboards.image_validation.instruction}
                            </p>
                            {error && error.includes(t.dashboards.image_validation.title.split(' ')[0]) && (
                                <p className="mt-1 text-[10px] font-black text-red-500 animate-pulse">
                                    {error}
                                </p>
                            )}
                            <div className="mt-6 w-full space-y-4 text-left">
                                <div className="space-y-1">
                                    <label htmlFor="studentId" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{t.student_registration.student_id}</label>
                                    <input
                                        type="text" id="studentId" value={formData.studentId} onChange={handleChange} required
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="tazkiraNo" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{t.student_registration.tazkira_no}</label>
                                    <input
                                        type="text" id="tazkiraNo" value={formData.tazkiraNo} onChange={handleChange}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* QR Code Section */}
                            {formData.qrCode && (
                                <div className="mt-6 pt-6 border-t border-border">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 bg-white rounded-2xl shadow-lg">
                                            <img
                                                src={formData.qrCode}
                                                alt="Student QR Code"
                                                className="w-48 h-48"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleDownloadQR}
                                            className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Download size={20} />
                                            {t.dashboards.download_qr_code}
                                        </button>

                                        {schoolSettings?.idCardDesign && schoolSettings?.isIdCardEnabled && (
                                            <button
                                                type="button"
                                                onClick={handleDownloadIdCard}
                                                className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                                            >
                                                <Download size={20} />
                                                دانلود کارت هویت شاگرد
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content: Info Tabs/Sections */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Tab Navigation */}
                        <div className="flex bg-card/60 backdrop-blur-xl border border-border p-2 rounded-[2rem] shadow-lg sticky top-4 z-40 overflow-x-auto scrollbar-none">
                            {[
                                { id: 'profile', label: (t.dashboards as any).local_profile_title || 'پروفایل', icon: UserIcon },
                                { id: 'grades', label: (t.dashboards as any).academic_history || 'درجات و نتایج', icon: Award },
                                { id: 'enrollments', label: 'سوابق ثبت‌نام', icon: Calendar },
                                { id: 'attendance', label: 'حاضری', icon: Activity }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Section 1: Local Info */}
                                <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                    <h3 className="flex items-center gap-3 text-xl font-black">
                                        <UserIcon className="text-cyan-500" />
                                        {(t.dashboards as any).local_profile_title}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.name_dr} *</label>
                                            <input type="text" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
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
                                            <label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.parent_contact}</label>
                                            <input type="text" id="phone" value={formData.phone || ""} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all" dir="ltr" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="grandfatherName" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">{t.student_registration.grandfather_name_dr}</label>
                                            <input type="text" id="grandfatherName" value={formData.grandfatherName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section Group selection */}
                                <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8 text-right" dir="rtl">
                                    <h3 className="flex items-center gap-3 text-xl font-black">
                                        <Activity className="text-blue-500" />
                                        {t.student_registration.group_assignment || "گروه‌بندی شاگرد"}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="groupId" className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">انتخاب گروه</label>
                                            <select
                                                id="groupId"
                                                value={formData.groupId}
                                                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-2xl px-5 py-3.5 text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-right"
                                            >
                                                <option value="">بدون گروه</option>
                                                {groups.map((g: any) => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 gap-3">
                                            <Activity className="text-blue-500 shrink-0" size={20} />
                                            <p className="text-[10px] font-bold text-slate-500 leading-tight">
                                                گروه‌ها توسط مدیریت ارشد ایجاد می‌شوند. شما می‌توانید شاگرد را به یکی از گروه‌های تعریف شده اختصاص دهید.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: English Info */}
                                <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                    <h3 className="flex items-center gap-3 text-xl font-black">
                                        <Shield className="text-purple-500" />
                                        {(t.dashboards as any).english_profile_title}
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

                                {/* Section 3: Relatives & Addresses */}
                                <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                    <h3 className="flex items-center gap-3 text-xl font-black">
                                        <MapPin className="text-emerald-500" />
                                        {(t.dashboards as any).relatives_addresses_title}
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
                                            {[
                                                { id: 'paternalUncle', key: 'paternal_uncle' },
                                                { id: 'maternalUncle', key: 'maternal_uncle' },
                                                { id: 'paternalCousin', key: 'paternal_cousin' },
                                                { id: 'maternalCousin', key: 'maternal_cousin' }
                                            ].map((rel) => (
                                                <div key={rel.id} className="space-y-2">
                                                    <label htmlFor={rel.id} className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{(t.student_registration as any)[rel.key]}</label>
                                                    <input type="text" id={rel.id} value={(formData as any)[rel.id]} onChange={handleChange} className="w-full bg-slate-50 dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'grades' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Section 4: Academic History */}
                                {selectedHistoryId && (studentHistory.grades.length > 0 || studentHistory.attendance.length > 0 || studentHistory.enrollments.length > 1) ? (
                                    <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-8">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <h3 className="flex items-center gap-3 text-xl font-black">
                                                <History className="text-blue-500" />
                                                {t.dashboards.academic_history || "سوابق تعلیمی شاگرد"}
                                            </h3>

                                            <div className="flex flex-col gap-2">
                                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.dashboards.filter_classes || "انتخاب صنف برای نمایش کارنامه"}</div>
                                                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none max-w-full">
                                                    {(() => {
                                                        const classMap = new Map();
                                                        studentHistory.enrollments.forEach(en => classMap.set(en.classId, { id: en.classId, level: en.class?.level, year: en.academicYear }));
                                                        studentHistory.grades.forEach(g => { if (!classMap.has(g.classId) && g.class) classMap.set(g.classId, { id: g.classId, level: g.class.level, year: g.class.academicYear || "---" }) });
                                                        studentHistory.attendance.forEach(a => { if (!classMap.has(a.classId) && a.class) classMap.set(a.classId, { id: a.classId, level: a.class.level, year: a.academicYear || a.class.academicYear || "---" }) });

                                                        const sortedClasses = Array.from(classMap.values()).sort((a, b) => b.year.localeCompare(a.year));

                                                        return sortedClasses.map((cls) => (
                                                            <button
                                                                key={cls.id}
                                                                type="button"
                                                                onClick={() => setSelectedHistoryId(cls.id)}
                                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border ${selectedHistoryId === cls.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-card border-border text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                                            >
                                                                {cls.level} ({cls.year})
                                                            </button>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        <style jsx global>{`
                                    .cell-border {
                                        border: 1px solid black !important;
                                    }
                                    .report-border {
                                        border: 2px solid black !important;
                                    }
                                    
                                    /* Print container styles to match result-cart source */
                                    .print-container {
                                        background-color: white;
                                        box-sizing: border-box;
                                        margin-left: auto;
                                        margin-right: auto;
                                        width: 210mm;
                                        min-height: 297mm;
                                        max-height: 297mm;
                                        padding: 10mm 15mm;
                                        position: relative;
                                        overflow: hidden;
                                        display: flex;
                                        flex-direction: column;
                                    }
                                    
                                    @media print {
                                        @page {
                                            size: A4;
                                            margin: 0;
                                        }
                                        body {
                                            visibility: hidden !important;
                                            background: white !important;
                                            padding: 0 !important;
                                            margin: 0 !important;
                                            font-family: 'Vazirmatn', sans-serif !important;
                                        }
                                        .no-print, header, footer, nav, aside, button {
                                            display: none !important;
                                        }
                                        #printable-result-cart {
                                            visibility: visible !important;
                                            position: fixed !important;
                                            left: 0 !important;
                                            top: 0 !important;
                                            width: 210mm !important;
                                            height: 297mm !important;
                                            margin: 0 !important;
                                            padding: 10mm 15mm !important;
                                            border: none !important;
                                            box-shadow: none !important;
                                            background: white !important;
                                            z-index: 9999 !important;
                                            display: flex !important;
                                            flex-direction: column !important;
                                            font-family: 'Vazirmatn', sans-serif !important;
                                            overflow: hidden !important;
                                        }
                                        #printable-result-cart * {
                                            visibility: visible !important;
                                            -webkit-print-color-adjust: exact !important;
                                            print-color-adjust: exact !important;
                                            font-family: 'Vazirmatn', sans-serif !important;
                                        }
                                        #printable-result-cart .bg-emerald-700 { 
                                            background-color: #047857 !important; 
                                            color: white !important; 
                                        }
                                        #printable-result-cart .bg-red-700 { 
                                            background-color: #b91c1c !important; 
                                            color: white !important; 
                                        }
                                        #printable-result-cart .bg-sky-700 { 
                                            background-color: #0369a1 !important; 
                                            color: white !important; 
                                        }
                                        #printable-result-cart .bg-black { 
                                            background-color: #000000 !important; 
                                            color: white !important; 
                                        }
                                        #printable-result-cart .text-red-700 { 
                                            color: #b91c1c !important; 
                                        }
                                    }
                                `}</style>

                                        {(() => {
                                            const selectedEnrol = studentHistory.enrollments.find(e => e.classId === selectedHistoryId);
                                            const fallbackClass = studentHistory.grades.find(g => g.classId === selectedHistoryId)?.class ||
                                                studentHistory.attendance.find(a => a.classId === selectedHistoryId)?.class;

                                            const displayYear = selectedEnrol?.academicYear || fallbackClass?.academicYear || "---";
                                            const displayLevel = selectedEnrol?.class?.level || fallbackClass?.level || "---";
                                            const displaySection = selectedEnrol?.class?.section || fallbackClass?.section || "---";

                                            const enrolGrades = studentHistory.grades.filter(g => g.classId === selectedHistoryId);
                                            const enrolAtt = studentHistory.attendance.filter(a => a.classId === selectedHistoryId);

                                            const subjectGrades: Record<string, { name: string, midterm?: number, final?: number, order?: number }> = {};
                                            enrolGrades.forEach(g => {
                                                const subId = g.subjectId;
                                                if (!subjectGrades[subId]) {
                                                    subjectGrades[subId] = { name: g.subject?.name, order: g.subject?.order || 0 };
                                                }
                                                if (g.type === 'MIDTERM') subjectGrades[subId].midterm = g.score;
                                                else if (g.type === 'FINAL') subjectGrades[subId].final = g.score;
                                            });

                                            const subjectsList = Object.values(subjectGrades).sort((a, b) => {
                                                if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
                                                return (a.name || "").localeCompare(b.name || "", 'fa');
                                            });

                                            const midtermTotal = subjectsList.reduce((acc, curr) => acc + (curr.midterm || 0), 0);
                                            const finalTotal = subjectsList.reduce((acc, curr) => acc + (curr.final || 0), 0);
                                            const grandTotal = midtermTotal + finalTotal;

                                            const validsMid = subjectsList.filter(s => s.midterm !== undefined).length;
                                            const validsFinal = subjectsList.filter(s => s.final !== undefined).length;

                                            const midAvg = validsMid ? (midtermTotal / validsMid).toFixed(2) : "0.00";
                                            const finalAvg = validsFinal ? (finalTotal / validsFinal).toFixed(2) : "0.00";
                                            const grandAvg = validsFinal ? (grandTotal / validsFinal).toFixed(2) : "0.00";

                                            const attendanceSummary = {
                                                days: enrolAtt.reduce((acc, curr) => acc + (curr.days || 0), 0),
                                                present: enrolAtt.reduce((acc, curr) => acc + (curr.present || 0), 0),
                                                absent: enrolAtt.reduce((acc, curr) => acc + (curr.absent || 0), 0),
                                                sick: enrolAtt.reduce((acc, curr) => acc + (curr.sick || 0), 0),
                                                leave: enrolAtt.reduce((acc, curr) => acc + (curr.leave || 0), 0),
                                            };

                                            const getAfghanGrade = (score: number, maxScore: number) => {
                                                const percentage = (score / maxScore) * 100;
                                                if (percentage >= 90) return "الف";
                                                if (percentage >= 75) return "ب";
                                                if (percentage >= 60) return "ج";
                                                if (percentage >= 40) return "د";
                                                return "هـ";
                                            };

                                            const midAtt = enrolAtt.find(a => a.type === 'MIDTERM');
                                            const finAtt = enrolAtt.find(a => a.type === 'FINAL');
                                            const midAbsent = midAtt?.absent || 0;
                                            const finAbsent = finAtt?.absent || 0;

                                            let mLimit = 25;
                                            let aLimit = 50;
                                            if (midAtt?.remarks?.startsWith("__L:")) {
                                                const match = midAtt.remarks.match(/__L:(\d+),(\d+)__/);
                                                if (match) {
                                                    mLimit = parseInt(match[1]);
                                                    aLimit = parseInt(match[2]);
                                                }
                                            }

                                            const isMahroomMid = midAbsent >= mLimit;
                                            const isMahroomAnnual = (midAbsent + finAbsent) >= aLimit;

                                            let midStatus = "";
                                            if (isMahroomMid) {
                                                midStatus = "غایب (محروم)";
                                            } else if (validsMid > 0) {
                                                const hasLowMid = subjectsList.some(s => (s.midterm || 0) < 16);
                                                midStatus = hasLowMid ? "تلاش بیشتر" : "موفق";
                                            }

                                            let annualStatus = "";
                                            if (isMahroomAnnual) {
                                                annualStatus = "محروم";
                                            } else if (validsFinal > 0) {
                                                const fails = subjectsList.filter(s => ((s.midterm || 0) + (s.final || 0)) < 40).length;
                                                const avg = parseFloat(grandAvg);
                                                if (fails === 0 && avg >= 40) annualStatus = "ارتقاء صنف";
                                                else if (fails >= 3 || avg < 40) annualStatus = "تکرار صنف";
                                                else if (fails > 0 && fails < 3) annualStatus = "مشروط";
                                                else annualStatus = "در جریان";
                                            }

                                            const midGrade = validsMid > 0 ? getAfghanGrade(parseFloat(midAvg), 40) : "";
                                            const annualGrade = validsFinal > 0 ? getAfghanGrade(parseFloat(grandAvg), 100) : "";

                                            const GRADING_SYSTEM = {
                                                MIDTERM: [
                                                    { grade: 'الف', range: '36 - 40' },
                                                    { grade: 'ب', range: '30 - 35.9' },
                                                    { grade: 'ج', range: '24 - 29.9' },
                                                    { grade: 'د', range: '20 - 23.9' },
                                                    { grade: 'هـ', range: 'کمتر از 16' },
                                                ],
                                                ANNUAL: [
                                                    { grade: 'الف', range: '90 - 100' },
                                                    { grade: 'ب', range: '75 - 89.9' },
                                                    { grade: 'ج', range: '60 - 74.9' },
                                                    { grade: 'د', range: '50 - 59.9' },
                                                    { grade: 'هـ', range: 'کمتر از 50' },
                                                ]
                                            };

                                            return (
                                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                    <div id="printable-result-cart" className="print-container bg-white shadow-2xl report-border relative text-black" dir="rtl">
                                                        <div className="flex justify-between items-center mb-4 bg-white">
                                                            <div className="w-20 h-20 flex items-center justify-center bg-white">
                                                                {schoolSettings?.logoRight ? <img src={schoolSettings.logoRight} alt="Right Logo" className="max-w-full max-h-full object-contain" /> : <div className="w-20 h-20"></div>}
                                                            </div>
                                                            <div className="text-center flex flex-col flex-grow mx-4 bg-white">
                                                                <h2 className="text-base font-bold bg-white">{schoolSettings?.headerTitle1 || "وزارت معارف"}</h2>
                                                                <h3 className="text-sm font-bold bg-white">{schoolSettings?.headerTitle2 || "ریاست معارف (شهر کابل)"}</h3>
                                                                <h4 className="text-sm font-bold bg-white">{schoolSettings?.headerTitle3 || "آمریت معارف (هفدهم)"}</h4>
                                                                <h5 className="text-lg font-black mt-1 bg-white">{schoolSettings?.schoolName || "لیسه عالی خصوصی نیکان"}</h5>
                                                            </div>
                                                            <div className="w-20 h-20 flex items-center justify-center bg-white">
                                                                {schoolSettings?.logoLeft ? <img src={schoolSettings.logoLeft} alt="Left Logo" className="max-w-full max-h-full object-contain" /> : <div className="w-20 h-20"></div>}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-4 gap-0 mb-3 text-xs font-bold text-center">
                                                            <div className="bg-emerald-700 text-white p-1.5 cell-border">صنف: {displayLevel} {displaySection}</div>
                                                            <div className="bg-red-700 text-white p-1.5 cell-border">نگران: ---</div>
                                                            <div className="bg-sky-700 text-white p-1.5 cell-border">سال: {toPersianNum(displayYear)}</div>
                                                            <div className="bg-black text-white p-1.5 cell-border">نمبر: {toPersianNum(formData.studentId)}</div>
                                                        </div>

                                                        <div className="flex gap-3 bg-white flex-grow overflow-hidden">
                                                            <div className="w-[60%] flex flex-col gap-2 bg-white">
                                                                <table className="w-full cell-border border-collapse text-black bg-white" style={{ fontSize: '10px' }}>
                                                                    <tbody>
                                                                        <tr>
                                                                            <td rowSpan={6} className="cell-border p-0 w-[40px] bg-white text-center">
                                                                                <div className="flex items-center justify-center w-full h-full">
                                                                                    <span className="font-black" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '12px' }}>شـهـرت</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="cell-border bg-white p-1 font-black w-[55px]">نام</td>
                                                                            <td className="cell-border p-1 font-bold bg-white">{formData.name}</td>
                                                                            <td className="cell-border bg-white p-1 font-black w-[55px]">Name</td>
                                                                            <td className="cell-border p-1 font-bold bg-white font-sans text-left">{formData.nameEn || ''}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="cell-border bg-white p-1 font-black">تخلص</td>
                                                                            <td className="cell-border p-1 font-bold bg-white">{formData.surname || ''}</td>
                                                                            <td className="cell-border bg-white p-1 font-black">L/Name</td>
                                                                            <td className="cell-border p-1 font-bold bg-white font-sans text-left">{formData.surnameEn || ''}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="cell-border bg-white p-1 font-black">نام پدر</td>
                                                                            <td className="cell-border p-1 font-bold bg-white">{formData.fatherName}</td>
                                                                            <td className="cell-border bg-white p-1 font-black">F/Name</td>
                                                                            <td className="cell-border p-1 font-bold bg-white font-sans text-left">{formData.fatherNameEn || ''}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="cell-border bg-white p-1 font-black">نام پ/ک</td>
                                                                            <td className="cell-border p-1 font-bold bg-white" colSpan={3}>{formData.grandfatherName}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="cell-border bg-white p-1 font-black">تذکره</td>
                                                                            <td className="cell-border p-1 font-bold bg-white font-sans" colSpan={3}>{toPersianNum(formData.tazkiraNo)}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td className="cell-border bg-white p-1 font-black">اساس</td>
                                                                            <td className="cell-border p-1 font-bold bg-white font-sans" colSpan={3}>{toPersianNum(formData.studentId)}</td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>

                                                                <div className="relative bg-white mt-1 flex-grow">
                                                                    <table className="w-full h-full cell-border border-collapse text-black bg-white" style={{ fontSize: '10px' }}>
                                                                        <thead className="bg-white font-black text-center">
                                                                            <tr className="bg-white">
                                                                                <th className="cell-border p-1 text-right pr-2 bg-white">مضامین</th>
                                                                                <th className="cell-border p-1 w-[60px] bg-white text-center">۴.۵ ماهه</th>
                                                                                <th className="cell-border p-1 w-[60px] bg-white text-center">سالانه</th>
                                                                                <th className="cell-border p-1 w-[60px] bg-white text-center">مجموع</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="bg-white">
                                                                            {subjectsList.map((sub: any, sIdx: number) => (
                                                                                <tr key={sIdx} className="bg-white">
                                                                                    <td className="cell-border p-1 pr-2 font-bold bg-white">{sub.name}</td>
                                                                                    <td className="cell-border text-center font-black bg-white"><span className="font-sans">{toPersianNum(sub.midterm)}</span></td>
                                                                                    <td className="cell-border text-center font-black bg-white"><span className="font-sans">{toPersianNum(sub.final)}</span></td>
                                                                                    <td className="cell-border text-center font-black bg-white font-sans">{toPersianNum((Number(sub.midterm) || 0) + (Number(sub.final) || 0))}</td>
                                                                                </tr>
                                                                            ))}
                                                                            <tr className="bg-white font-black">
                                                                                <td className="cell-border p-1 pr-2 bg-white">مجموعه نمرات</td>
                                                                                <td className="cell-border text-center font-sans bg-white">{toPersianNum(midtermTotal)}</td>
                                                                                <td className="cell-border text-center font-sans bg-white">{toPersianNum(finalTotal)}</td>
                                                                                <td className="cell-border text-center font-sans bg-white">{toPersianNum(grandTotal)}</td>
                                                                            </tr>
                                                                            <tr className="bg-white font-black">
                                                                                <td className="cell-border p-1 pr-2 bg-white">اوسط نمرات</td>
                                                                                <td className="cell-border text-center font-sans bg-white">{toPersianNum(midAvg)}</td>
                                                                                <td className="cell-border text-center font-sans bg-white">{toPersianNum(finalAvg)}</td>
                                                                                <td className="cell-border text-center font-sans bg-white">{toPersianNum(grandAvg)}</td>
                                                                            </tr>
                                                                            <tr className="bg-white font-black">
                                                                                <td className="cell-border p-1 pr-2 bg-white">نتیجه</td>
                                                                                <td className="cell-border text-center text-[8px] bg-white">{midStatus}</td>
                                                                                <td className="cell-border text-center text-[8px] bg-white" colSpan={2}>{annualStatus}</td>
                                                                            </tr>
                                                                            <tr className="bg-white font-black">
                                                                                <td className="cell-border p-1 pr-2 bg-white">درجه</td>
                                                                                <td className="cell-border text-center bg-white">{midGrade}</td>
                                                                                <td className="cell-border text-center bg-white" colSpan={2}>{annualGrade}</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                <div className="flex gap-2 bg-white mt-1">
                                                                    <table className="w-[75%] cell-border border-collapse text-black bg-white" style={{ fontSize: '10px' }}>
                                                                        <thead className="bg-white">
                                                                            <tr className="bg-white h-6">
                                                                                <th className="cell-border bg-white text-center">ضوابط حاضری</th>
                                                                                <th className="cell-border bg-white text-center">حاضر</th>
                                                                                <th className="cell-border bg-white text-center">غیر حاضر</th>
                                                                                <th className="cell-border bg-white text-center">مریض</th>
                                                                                <th className="cell-border bg-white text-center">رخصت</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="bg-white">
                                                                            <tr className="text-center font-black bg-white">
                                                                                <td className="cell-border bg-white"><span className="font-bold">ایام:</span> <span className="font-sans">{toPersianNum(attendanceSummary.days)}</span></td>
                                                                                <td className="cell-border bg-white"><span className="font-sans">{toPersianNum(attendanceSummary.present)}</span></td>
                                                                                <td className="cell-border bg-white"><span className="font-sans">{toPersianNum(attendanceSummary.absent)}</span></td>
                                                                                <td className="cell-border bg-white"><span className="font-sans">{toPersianNum(attendanceSummary.sick)}</span></td>
                                                                                <td className="cell-border bg-white"><span className="font-sans">{toPersianNum(attendanceSummary.leave)}</span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <div className="w-[25%] cell-border flex items-center justify-center font-black font-sans bg-white" style={{ fontSize: '10px' }}>تاریخ: {new Date().toLocaleDateString('fa-AF')}</div>
                                                                </div>
                                                            </div>

                                                            <div className="w-[40%] flex flex-col gap-2 bg-white">
                                                                <div className="relative h-20 flex items-center justify-center cell-border bg-white">
                                                                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                                                        <svg viewBox="0 0 200 100" className="w-full h-full"><path d="M10 20 L190 20 L170 50 L190 80 L10 80 L30 50 Z" fill="#000" stroke="#000" strokeWidth="2" /></svg>
                                                                    </div>
                                                                    <span className="relative text-2xl font-black text-red-700">اطلاع نامه</span>
                                                                </div>

                                                                <table className="w-full cell-border border-collapse text-black bg-white" style={{ fontSize: '9px' }}>
                                                                    <thead><tr className="bg-white"><th className="cell-border p-1 bg-white font-black" colSpan={3}>درجه بندی امتحان چهارونیم ماهه</th></tr></thead>
                                                                    <tbody className="bg-white">
                                                                        {GRADING_SYSTEM.MIDTERM.map((row, idx) => (
                                                                            <tr key={idx} className="text-center font-bold bg-white">
                                                                                <td className="cell-border p-0.5 bg-white w-[30%]">{row.grade}</td>
                                                                                {idx === 0 && <td rowSpan={4} className="cell-border font-black bg-white w-[35%]">مؤفق</td>}
                                                                                {idx === 4 && <td className="cell-border font-black bg-white w-[35%]">تلاش بیشتر</td>}
                                                                                <td className="cell-border p-0.5 font-sans bg-white w-[35%]">{toPersianNum(row.range)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>

                                                                <table className="w-full cell-border border-collapse text-black bg-white" style={{ fontSize: '9px' }}>
                                                                    <thead><tr className="bg-white"><th className="cell-border p-1 bg-white font-black" colSpan={3}>درجه بندی امتحان سالانه</th></tr></thead>
                                                                    <tbody className="bg-white">
                                                                        {GRADING_SYSTEM.ANNUAL.map((row, idx) => (
                                                                            <tr key={idx} className="text-center font-bold bg-white">
                                                                                <td className="cell-border p-0.5 bg-white w-[30%]">{row.grade}</td>
                                                                                {idx === 0 && <td rowSpan={4} className="cell-border font-black bg-white w-[35%]">ارتقا صنف</td>}
                                                                                {idx === 4 && <td className="cell-border font-black bg-white w-[35%]">تکرار صنف</td>}
                                                                                <td className="cell-border p-0.5 font-sans bg-white w-[35%]">{toPersianNum(row.range)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>

                                                                <div className="flex-grow cell-border grid grid-cols-2 p-1 gap-1 bg-white">
                                                                    <div className="flex flex-col justify-end items-center min-h-[50px] border border-dashed border-black bg-white"><span className="border-t border-black w-full text-center py-0.5 font-bold bg-white" style={{ fontSize: '8px' }}>{schoolSettings?.signatureLabel2 || "امضاء نگران"}</span></div>
                                                                    <div className="flex flex-col justify-end items-center min-h-[50px] border border-dashed border-black bg-white"><span className="border-t border-black w-full text-center py-0.5 font-bold bg-white" style={{ fontSize: '8px' }}>{schoolSettings?.signatureLabel3 || "امضاء سر معلم"}</span></div>
                                                                    <div className="flex flex-col justify-end items-center min-h-[50px] border border-dashed border-black bg-white"><span className="border-t border-black w-full text-center py-0.5 font-bold bg-white" style={{ fontSize: '8px' }}>{schoolSettings?.signatureLabel1 || "امضاء مدیر"}</span></div>
                                                                    <div className="flex flex-col justify-end items-center min-h-[50px] border border-dashed border-black bg-white"><span className="border-t border-black w-full text-center py-0.5 font-bold bg-white" style={{ fontSize: '8px' }}>امضاء ولی</span></div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="w-full p-2 bg-white cell-border leading-relaxed min-h-[85px] mt-1" style={{ fontSize: '9px' }}>
                                                            <span className="font-black underline bg-white block mb-0.5">یادداشت اداره:</span>
                                                            <p className="block bg-white text-justify leading-tight">
                                                                {schoolSettings?.footerNote || "در صورتیکه شهرت، نمبر تذکره، سال تولد، سکونت اصلی و یا سایر مشخصات مربوط به شاگرد مغایرت داشته باشد، الی مدت سه روز بعد از ابلاغ نتایج جهت اصلاح آن به اداره لیسه مراجعه نمایند."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-center gap-4 no-print">
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(`/dashboard/admin/students/${params.id}/print-result`, '_blank', 'width=800,height=600')}
                                                            className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-xl"
                                                        >
                                                            <Printer size={18} />
                                                            چاپ اطلاع نامه
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-border mt-8">
                                        <History size={48} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-500 font-bold">هیچ سابقه تعلیمی یافت نشد.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'enrollments' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl">
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <Calendar className="text-emerald-500" />
                                        تاریخچه ثبت‌نام در صنف‌ها
                                    </h3>
                                    {studentHistory.enrollments.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {studentHistory.enrollments.map((en: any) => (
                                                <div key={en.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border hover:border-primary/30 transition-all group">
                                                    <div>
                                                        <h4 className="text-lg font-black group-hover:text-primary transition-colors">{en.class?.level} - {en.class?.section}</h4>
                                                        <p className="text-sm font-bold text-slate-500">سال تحصیلی {toPersianNum(en.academicYear)}</p>
                                                    </div>
                                                    <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest">
                                                        ثبت شده
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-border">
                                            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                                            <p className="text-slate-500 font-bold">هیچ سابقه ثبت‌نامی یافت نشد.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-border shadow-xl">
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <Activity className="text-blue-500" />
                                        ضوابط و آمار حاضری شاگرد
                                    </h3>

                                    {studentHistory.attendance.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-right border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 text-xs font-black uppercase tracking-widest">
                                                        <th className="p-4 rounded-r-2xl">صنف / سال</th>
                                                        <th className="p-4">نوع امتحان</th>
                                                        <th className="p-4">ضوابط / ایام</th>
                                                        <th className="p-4 text-emerald-500">حاضر</th>
                                                        <th className="p-4 text-red-500">غیرحاضر</th>
                                                        <th className="p-4 text-amber-500">رخصت</th>
                                                        <th className="p-4 text-blue-500">مریض</th>
                                                        <th className="p-4 rounded-l-2xl">توضیحات</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm font-bold">
                                                    {studentHistory.attendance.map((a: any) => (
                                                        <tr key={a.id} className="border-b border-border hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                                                            <td className="p-4">{a.class?.level} ({toPersianNum(a.academicYear || a.class?.academicYear)})</td>
                                                            <td className="p-4">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] ${a.type === 'MIDTERM' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                                                    {a.type === 'MIDTERM' ? 'چهار و نیم ماهه' : 'سالانه'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 font-sans">{toPersianNum(a.days)}</td>
                                                            <td className="p-4 font-sans text-emerald-600">{toPersianNum(a.present)}</td>
                                                            <td className="p-4 font-sans text-red-600">{toPersianNum(a.absent)}</td>
                                                            <td className="p-4 font-sans text-amber-600">{toPersianNum(a.leave)}</td>
                                                            <td className="p-4 font-sans text-blue-600">{toPersianNum(a.sick)}</td>
                                                            <td className="p-4 text-slate-400 text-xs">{(a.remarks || '').replace(/__L:\d+,\d+__\s*/, '') || '---'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-border">
                                            <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                                            <p className="text-slate-500 font-bold">هیچ سابقه حاضری یافت نشد.</p>
                                        </div>
                                    )}
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
                            className="w-full md:w-auto flex items-center justify-center gap-3 rounded-[1.5rem] bg-primary px-12 py-5 text-lg font-black text-white shadow-2xl shadow-primary/40 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                        >
                            {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                            {t.dashboards.save_changes}
                        </button>
                    </div>
                </form>
                {/* Delete Confirmation Modal */}
                {
                    showDeleteModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-card border border-border w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl scale-in-center animate-in zoom-in-95 duration-300">
                                <div className="flex flex-col items-center text-center space-y-6">
                                    <div className="h-20 w-20 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center shadow-inner">
                                        <AlertTriangle size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-foreground">{(t.dashboards as any).class_details?.delete_title?.replace("صنف", t.roles.STUDENT) || "حذف شاگرد؟"}</h3>
                                        <p className="text-slate-500 font-medium px-4">
                                            آیا مطمئن هستید که می‌خواهید <b className="text-foreground">{formData.name}</b> را از سیستم حذف کنید؟ این عمل غیرقابل بازگشت است.
                                        </p>
                                    </div>
                                    <div className="flex flex-col w-full gap-3 pt-4">
                                        <button
                                            onClick={handleDelete}
                                            disabled={submitting}
                                            className="w-full py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            {submitting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                                            {t.dashboards.delete}
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteModal(false)}
                                            disabled={submitting}
                                            className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                        >
                                            {(t.dashboards as any).class_details?.cancel || "لغو"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}
