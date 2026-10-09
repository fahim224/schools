"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    Save,
    Loader2,
    CheckCircle,
    Image,
    Type,
    FileText,
    PenTool,
    Shield,
    Sparkles,
    MessageSquare
} from "lucide-react";

export default function settingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [settings, setSettings] = useState({
        schoolName: "",
        headerTitle1: "",
        headerTitle2: "",
        headerTitle3: "",
        logoLeft: "",
        logoRight: "",
        schoolLogo: "", // Main school logo for home page slider
        signatureLabel1: "",
        signatureLabel2: "",
        signatureLabel3: "",
        signatureLabel4: "",
        signatureLabel5: "",
        signatureLabel6: "",
        footerNote: "",
        // Ad Settings
        adBanner: "",
        adTitle: "",
        adDescription: "",
        whatsappNumber: "",
        schoolAddress: "",
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        }

        if (session) {
            fetchSettings();
        }
    }, [status, session]);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validation
            if (!file.type.startsWith("image/")) {
                setError(t.dashboards.image_validation.invalid_file);
                return;
            }
            if (file.size > 1024 * 1024) {
                setError(t.dashboards.image_validation.file_too_large);
                return;
            }

            setError(""); // Clear error
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        setSuccess(false);
        setError("");

        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(data.error || data.message || "Failed to save settings");
                console.error("Save error:", data);
            }
        } catch (err) {
            setError("Error saving settings: " + (err instanceof Error ? err.message : String(err)));
            console.error("Error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <header className="mb-10 text-start">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 mb-1">{t.dashboards.settings}</h2>
                <h1 className="text-3xl font-black tracking-tight">تنظیمات مکتب و جدول نتایج</h1>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {/* General Info */}
                <section className="bg-card border border-border rounded-[2rem] p-8 shadow-xl">
                    <h3 className="flex items-center gap-3 text-lg font-black mb-6 text-start border-b border-border pb-4">
                        <Type className="text-cyan-500" />
                        عنوان‌های هدر (سربرگ)
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2 text-start">
                            <label className="text-xs font-black text-slate-500 uppercase">نام مکتب</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={settings.schoolName}
                                onChange={(e) => handleInputChange("schoolName", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 text-start">
                            <label className="text-xs font-black text-slate-500 uppercase">عنوان اول (مثلاً وزارت معارف)</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={settings.headerTitle1}
                                onChange={(e) => handleInputChange("headerTitle1", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 text-start">
                            <label className="text-xs font-black text-slate-500 uppercase">عنوان دوم (مثلاً ریاست معارف)</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={settings.headerTitle2}
                                onChange={(e) => handleInputChange("headerTitle2", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 text-start">
                            <label className="text-xs font-black text-slate-500 uppercase">عنوان سوم (مثلاً آمریت معارف)</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={settings.headerTitle3}
                                onChange={(e) => handleInputChange("headerTitle3", e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-card border border-border rounded-[2rem] p-8 shadow-xl">
                    <h3 className="flex items-center gap-3 text-lg font-black mb-6 text-start border-b border-border pb-4">
                        <Image className="text-purple-500" />
                        لوگوها
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase block text-start">لوگو سمت راست</label>
                            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-border rounded-2xl bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
                                {settings.logoRight ? (
                                    <img src={settings.logoRight} className="h-32 w-auto object-contain" />
                                ) : (
                                    <Image size={48} className="text-slate-300" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload("logoRight", e)}
                                    className="hidden"
                                    id="logoRight"
                                />
                                <label htmlFor="logoRight" className="cursor-pointer px-4 py-2 bg-card border border-border rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-foreground">تغییر لوگو</label>
                                <p className="text-[9px] font-bold text-slate-500 mt-1">{t.dashboards.image_validation.instruction}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase block text-start">لوگو سمت چپ</label>
                            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-border rounded-2xl bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
                                {settings.logoLeft ? (
                                    <img src={settings.logoLeft} className="h-32 w-auto object-contain" />
                                ) : (
                                    <Image size={48} className="text-slate-300" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload("logoLeft", e)}
                                    className="hidden"
                                    id="logoLeft"
                                />
                                <label htmlFor="logoLeft" className="cursor-pointer px-4 py-2 bg-card border border-border rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-foreground">تغییر لوگو</label>
                                <p className="text-[9px] font-bold text-slate-500 mt-1">{t.dashboards.image_validation.instruction}</p>
                            </div>
                        </div>
                        {/* Main School Logo */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-indigo-500 uppercase block text-start">لوگوی اصلی مکتب (نمایش در خانه)</label>
                            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
                                {settings.schoolLogo ? (
                                    <img src={settings.schoolLogo} className="h-32 w-auto object-contain" />
                                ) : (
                                    <Image size={48} className="text-indigo-300" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload("schoolLogo", e)}
                                    className="hidden"
                                    id="schoolLogo"
                                />
                                <label htmlFor="schoolLogo" className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-500 transition-all">تغییر لوگوی اصلی</label>
                                <p className="text-[9px] font-bold text-slate-500 mt-1">{t.dashboards.image_validation.instruction}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Note */}
                <section className="bg-card border border-border rounded-[2rem] p-8 shadow-xl">
                    <h3 className="flex items-center gap-3 text-lg font-black mb-6 text-start border-b border-border pb-4">
                        <FileText className="text-amber-500" />
                        یادداشت انتهای کارنامه
                    </h3>
                    <div className="space-y-4 text-start">
                        <label className="text-xs font-black text-slate-500 uppercase block">متن یادداشت (سفارشی)</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none min-h-[120px] transition-all"
                            value={settings.footerNote || ""}
                            placeholder="متن یادداشت را اینجا بنویسید..."
                            onChange={(e) => handleInputChange("footerNote", e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 font-medium italic">این متن در تمام کارنامه‌ها در بخش «یادداشت اداره» نمایش داده می‌شود.</p>
                    </div>
                </section>

                {/* Signatures */}
                <section className="bg-card border border-border rounded-[2rem] p-8 shadow-xl">
                    <h3 className="flex items-center gap-3 text-lg font-black mb-6 text-start border-b border-border pb-4">
                        <PenTool className="text-emerald-500" />
                        عنواین امضاءها
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <div key={num} className="space-y-2 text-start">
                                <label className="text-xs font-black text-slate-500 uppercase">امضا {num}</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={(settings as any)[`signatureLabel${num}`] || ""}
                                    onChange={(e) => handleInputChange(`signatureLabel${num}`, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Advertisement & Contact Settings */}
                <section className="bg-card border border-border rounded-[2rem] p-8 shadow-xl">
                    <h3 className="flex items-center gap-3 text-lg font-black mb-6 text-start border-b border-border pb-4 text-primary">
                        <Sparkles className="animate-pulse text-primary" />
                        تنظیمات تبلیغات و نمایش در صفحه اصلی
                    </h3>
                    <p className="text-sm text-muted-foreground bg-primary/5 p-4 rounded-xl border border-primary/10 mb-6">
                        در این بخش می‌توانید اطلاعات مکتب خود را برای نمایش در بخش "مدارس برتر" صفحه اصلی سایت وارد کنید.
                        پس از تکمیل، باید منتظر تایید مدیریت کل باشید تا مدرسه شما در صفحه اصلی نمایش داده شود.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Banner Upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase block text-start flex items-center gap-2">
                                <Image size={16} />
                                بنر تبلیغاتی (Banner Image)
                            </label>
                            <div className="relative h-48 w-full border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden hover:bg-muted/50 transition-colors group">
                                {settings.adBanner ? (
                                    <img src={settings.adBanner} alt="Banner" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-muted-foreground group-hover:text-primary transition-colors">
                                        <Image className="mx-auto mb-2 opacity-50" size={32} />
                                        <span className="text-xs">برای آپلود کلیک کنید</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload('adBanner', e)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic">اندازه پیشنهادی: 800x400 پیکسل • {t.dashboards.image_validation.instruction}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2 text-start">
                                <label className="text-xs font-black text-slate-500 uppercase">عنوان تبلیغاتی (Ad Title)</label>
                                <input
                                    type="text"
                                    value={settings.adTitle || ""}
                                    onChange={(e) => handleInputChange("adTitle", e.target.value)}
                                    placeholder="مثلاً: ثبت نام آغاز شد - تخفیف ویژه"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2 text-start">
                                <label className="text-xs font-black text-slate-500 uppercase">توضیحات کوتاه (Description)</label>
                                <textarea
                                    value={settings.adDescription || ""}
                                    onChange={(e) => handleInputChange("adDescription", e.target.value)}
                                    placeholder="توضیحات مختصری درباره مکتب و امکانات آن..."
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none min-h-[120px] transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-2 text-start">
                                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1"><MessageSquare size={14} /> شماره واتساپ</label>
                                <input
                                    type="text"
                                    value={settings.whatsappNumber || ""}
                                    onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                                    placeholder="مثلاً: 00937..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                    dir="ltr"
                                />
                            </div>
                            <div className="space-y-2 text-start">
                                <label className="text-xs font-black text-slate-500 uppercase">آدرس دقیق مکتب</label>
                                <input
                                    type="text"
                                    value={settings.schoolAddress || ""}
                                    onChange={(e) => handleInputChange("schoolAddress", e.target.value)}
                                    placeholder="مثلاً: کابل، دشت برچی، ایستگاه..."
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ad Request Toggle */}
                    <div className="mt-8 border-t border-border pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 text-start">
                            <span className="font-bold text-foreground">درخواست نمایش تبلیغات</span>
                            <span className="text-xs text-muted-foreground">با روشن کردن این گزینه، بنر و اطلاعات شما برای تایید به مدیریت کل ارسال می‌شود.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!(settings as any).isAdRequestActive}
                                onChange={(e) => setSettings(prev => ({ ...prev, isAdRequestActive: e.target.checked } as any))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Show Status */}
                    {(settings as any).isAdRequestActive && (
                        <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 text-sm font-bold ${(settings as any).isAdApproved
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}>
                            {(settings as any).isAdApproved ? (
                                <>
                                    <div className="bg-green-500 text-white p-1 rounded-full"><CheckCircle size={16} /></div>
                                    <span>تبریک! تبلیغات شما تایید شده و هم‌اکنون در صفحه اصلی سایت نمایش داده می‌شود.</span>
                                </>
                            ) : (
                                <>
                                    <div className="bg-amber-500 text-white p-1 rounded-full"><Shield size={16} /></div>
                                    <span>درخواست شما ثبت شد و در صف بررسی توسط مدیریت کل قرار دارد.</span>
                                </>
                            )}
                        </div>
                    )}
                </section>


                {/* Save Button */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className={`flex items-center gap-2 px-10 py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(6,182,212,0.3)] font-black active:scale-95 ${success ? 'bg-emerald-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}
                    >
                        {submitting ? <Loader2 size={24} className="animate-spin" /> : success ? <CheckCircle size={24} /> : <Save size={24} />}
                        {success ? "ذخیره شد!" : "ذخیره تمام تنظیمات"}
                    </button>
                    {error && <p className="text-red-500 font-bold self-center">{error}</p>}
                </div>
            </div>
        </div>
    );
}
