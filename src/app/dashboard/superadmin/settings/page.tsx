"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Settings, Save, Loader2, MessageCircle, MapPin, School, Info, CheckCircle2 } from "lucide-react";

export default function SuperAdminSettingsPage() {
    const { t, dir } = useLanguage();
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/superadmin/settings")
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            const res = await fetch("/api/superadmin/settings", {
                method: "POST",
                body: JSON.stringify(settings),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-indigo-950 dark:text-white flex items-center gap-4">
                        <Settings className="h-10 w-10 text-indigo-600" />
                        {t.dashboards.settings}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">مدیریت تمامی تنظیمات عمومی و اطلاعات تماس وب‌سایت</p>
                </div>
            </div>

            {success && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 animate-in slide-in-from-top-4 duration-300">
                    <CheckCircle2 size={24} />
                    <span>تنظیمات با موفقیت ذخیره شد!</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700 space-y-8">

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <School className="text-indigo-500" />
                            اطلاعات عمومی مکتب
                        </h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">نام مکتب (دری/پشتو)</label>
                                <input
                                    name="schoolName"
                                    value={settings.schoolName || ""}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">نام مکتب (English)</label>
                                <input
                                    name="schoolNameEn"
                                    value={settings.schoolNameEn || ""}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gray-100 dark:bg-gray-700"></div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <MessageCircle className="text-emerald-500" />
                            اطلاعات تماس و آدرس
                        </h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">شماره واتساپ مدیریت</label>
                                <input
                                    name="whatsappNumber"
                                    value={settings.whatsappNumber || ""}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                    placeholder="+937XXXXXXXX"
                                    dir="ltr"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">آدرس فیزیکی</label>
                                <input
                                    name="schoolAddress"
                                    value={settings.schoolAddress || ""}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gray-100 dark:bg-gray-700"></div>

                    {/* System Features */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Settings className="text-blue-500" size={20} />
                            ویژگی‌های سیستم (System Features)
                        </h3>

                        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="space-y-1">
                                <h4 className="font-bold text-slate-900 dark:text-white">فعال‌سازی چت و پیام‌رسان</h4>
                                <p className="text-xs text-slate-500">با غیرفعال کردن این گزینه، سیستم چت برای تمامی کاربران غیرفعال خواهد شد.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${settings.isChatEnabled ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {settings.isChatEnabled ? 'Turn ON' : 'Turn OFF'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSettings((prev: any) => ({ ...prev, isChatEnabled: !prev.isChatEnabled }))}
                                    className={`relative flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner p-1 ${settings.isChatEnabled ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'}`}
                                >
                                    <div className="h-6 w-6 rounded-full bg-white shadow-lg transition-all duration-300" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gray-100 dark:bg-gray-700"></div>

                    {/* Footer & Headers */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Info className="text-amber-500" />
                            سربرگ و پاورقی (Header/Footer)
                        </h3>

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">نکته پاورقی گزارش‌ها</label>
                                <textarea
                                    name="footerNote"
                                    value={settings.footerNote || ""}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gray-100 dark:bg-gray-700"></div>

                    <div className="flex pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto px-12 py-5 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-70 group"
                        >
                            {saving ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <span>ذخیره تمامی تنظیمات</span>
                                    <Save size={24} className="group-hover:translate-y-[-2px] transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
