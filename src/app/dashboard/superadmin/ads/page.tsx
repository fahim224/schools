"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    CheckCircle,
    XCircle,
    ExternalLink,
    Loader2,
    Shield,
    Image,
    MessageSquare,
    MapPin
} from "lucide-react";

export default function AdsManagementPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session && (session.user as any).role !== "SUPERADMIN") {
            router.push("/");
        }

        if (session) {
            fetchAds();
        }
    }, [status, session]);

    const fetchAds = async () => {
        try {
            const res = await fetch("/api/admin/ads");
            if (res.ok) {
                const data = await res.json();
                setAds(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (id: string, isApproved: boolean) => {
        try {
            const res = await fetch("/api/admin/ads", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isAdApproved: isApproved })
            });

            if (res.ok) {
                // Optimistic update
                setAds(prev => prev.map(ad => ad.id === id ? { ...ad, isAdApproved: isApproved } : ad));
            }
        } catch (err) {
            console.error("Error updating ad:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                        مدیریت تبلیغات مدارس
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        درخواست‌های ارسالی مدارس برای نمایش در صفحه اصلی را بررسی و تایید کنید.
                    </p>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                    <Shield size={20} />
                    <span>{ads.filter(a => !a.isAdApproved).length} درخواست جدید</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {ads.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
                        <Image className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-bold text-muted-foreground">هیچ درخواست تبلیغاتی یافت نشد</h3>
                    </div>
                ) : (
                    ads.map((ad) => (
                        <div key={ad.id} className={`group relative bg-card border ${ad.isAdApproved ? 'border-green-500/30 shadow-green-500/5' : 'border-amber-500/30 shadow-amber-500/5'} shadow-xl rounded-3xl p-6 transition-all hover:-translate-y-1`}>
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Banner Preview */}
                                <div className="w-full md:w-1/3 aspect-video bg-muted rounded-2xl overflow-hidden relative border border-border">
                                    {ad.adBanner ? (
                                        <img src={ad.adBanner} alt="Banner" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <Image size={32} />
                                            <span className="text-xs mr-2">بدون تصویر</span>
                                        </div>
                                    )}
                                    <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${ad.isAdApproved ? 'bg-green-500' : 'bg-amber-500'}`}>
                                        {ad.isAdApproved ? "تایید شده" : "در انتظار بررسی"}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-black text-foreground">{ad.adTitle || ad.schoolName}</h3>
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">ID: {ad.id.substring(0, 8)}</span>
                                        </div>
                                        <p className="text-sm font-bold text-primary mt-1">{ad.schoolName}</p>
                                    </div>

                                    <p className="text-muted-foreground text-sm leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                                        {ad.adDescription || "توضیحات ندارد."}
                                    </p>

                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
                                            <MessageSquare size={14} />
                                            <span dir="ltr">{ad.whatsappNumber || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
                                            <MapPin size={14} />
                                            <span>{ad.schoolAddress || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg ml-auto">
                                            <span>مدیر: {ad.user?.name || "نامشخص"} ({ad.user?.email})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-r border-border pt-4 md:pt-0 md:pr-6 mt-4 md:mt-0">
                                    <button
                                        onClick={() => handleApproval(ad.id, true)}
                                        disabled={ad.isAdApproved}
                                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${ad.isAdApproved
                                                ? "bg-green-100 text-green-700 cursor-default opacity-50"
                                                : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 active:scale-95"
                                            }`}
                                    >
                                        <CheckCircle size={18} />
                                        تایید تبلیغ
                                    </button>

                                    <button
                                        onClick={() => handleApproval(ad.id, false)}
                                        disabled={!ad.isAdApproved}
                                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${!ad.isAdApproved
                                                ? "bg-slate-100 text-slate-400 cursor-default opacity-50"
                                                : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-95"
                                            }`}
                                    >
                                        <XCircle size={18} />
                                        لغو تایید
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
