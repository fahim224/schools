"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Html5Qrcode } from "html5-qrcode";
import {
    QrCode,
    CheckCircle,
    XCircle,
    Camera,
    User,
    School,
    ArrowLeft,
    Loader2
} from "lucide-react";
import Link from "next/link";

export default function QRScannerPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        }
    }, [status, router]);

    const [scanType, setScanType] = useState<"ENTRY" | "EXIT">("ENTRY");

    const onScanSuccess = async (decodedText: string) => {
        // Just update state, useEffect handles the actual camera stop
        setScanning(false);
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/scan-qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    qrData: decodedText,
                    scanType: (session.user as any).role === 'STAFF' || (session.user as any).role === 'ADMIN' ? scanType : undefined
                })
            });

            const data = await res.json();

            if (data.success) {
                setResult(data.student);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Failed to process QR code");
        } finally {
            setLoading(false);
        }
    };

    const onScanError = (error: any) => {
        // Ignore scan errors (they happen frequently during scanning)
    };

    useEffect(() => {
        const scanner = html5QrCodeRef.current;

        const initScanner = async () => {
            if (!scanning) return;

            // Small delay to ensure DOM is ready
            await new Promise(r => setTimeout(r, 150));

            const element = document.getElementById("qr-reader");
            if (!element) return;

            try {
                const newScanner = new Html5Qrcode("qr-reader");
                html5QrCodeRef.current = newScanner;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                try {
                    await newScanner.start({ facingMode: "environment" }, config, onScanSuccess, onScanError);
                } catch (firstErr) {
                    const devices = await Html5Qrcode.getCameras();
                    if (devices && devices.length > 0) {
                        await newScanner.start(devices[0].id, config, onScanSuccess, onScanError);
                    } else {
                        throw firstErr;
                    }
                }

                setLoading(false);
            } catch (err: any) {
                console.error("Scanner init error:", err);
                let errorMessage = (t.dashboards as any).camera_error_generic;
                const errStr = String(err).toLowerCase();

                if (errStr.includes("permission") || errStr.includes("notallowed")) {
                    errorMessage = (t.dashboards as any).camera_error_permission;
                } else if (!window.isSecureContext) {
                    errorMessage = (t.dashboards as any).camera_error_security +
                        (dir === 'rtl' ? " (نکته: برای تست روی موبایل، از آدرس localhost استفاده کنید یا در تنظیمات کروم آی‌پی را در لیست سفید قرار دهید)" : " (Tip: For mobile testing, use localhost or whitelist your IP in Chrome flags)");
                }

                setError(errorMessage);
                setScanning(false);
                setLoading(false);
            }
        };

        if (scanning) {
            initScanner();
        }

        return () => {
            if (html5QrCodeRef.current) {
                const currentScanner = html5QrCodeRef.current;
                if (currentScanner.isScanning) {
                    currentScanner.stop()
                        .then(() => {
                            try { currentScanner.clear(); } catch (e) { }
                        })
                        .catch(err => console.error("Cleanup stop error:", err));
                }
                html5QrCodeRef.current = null;
            }
        };
    }, [scanning, t.dashboards]);

    const startScanning = () => {
        setResult(null);
        setError("");
        setLoading(true);
        setScanning(true);
    };

    const stopScanning = () => {
        setScanning(false);
        setLoading(false);
    };

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            {/* Background Effects */}
            <div className="fixed -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-400/20 dark:bg-cyan-600/10 blur-[120px] animate-pulse"></div>
            <div className="fixed top-1/2 -right-24 h-96 w-96 rounded-full bg-purple-400/10 dark:bg-purple-600/5 blur-[120px] animate-pulse"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/dashboard/${(session.user as any).role.toLowerCase()}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft size={16} />
                        {dir === 'rtl' ? 'بازگشت به داشبورد' : 'Back to Dashboard'}
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground flex items-center gap-3">
                        <QrCode className="text-primary" />
                        {t.dashboards.qr_scanner}
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {t.dashboards.scan_qr}
                    </p>
                </div>

                {/* Scanner Section */}
                <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl min-h-[400px] flex flex-col justify-center">
                    {scanning && (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div id="qr-reader" className="rounded-2xl overflow-hidden w-full border-4 border-primary/20 shadow-2xl bg-black"></div>
                            <button
                                onClick={stopScanning}
                                className="mt-6 w-full px-6 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Loader2 className={`h-4 w-4 animate-spin ${loading ? 'block' : 'hidden'}`} />
                                {t.dashboards.stop_scanning}
                            </button>
                        </div>
                    )}

                    {!scanning && !result && !error && (
                        <div className="text-center py-12 animate-in fade-in duration-500">
                            {((session.user as any).role === 'STAFF' || (session.user as any).role === 'ADMIN') && (
                                <div className="mb-8 max-w-sm mx-auto p-1 bg-slate-100 dark:bg-white/5 rounded-2xl flex border border-border">
                                    <button
                                        onClick={() => setScanType("ENTRY")}
                                        className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all ${scanType === 'ENTRY' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-foreground'}`}
                                    >
                                        {dir === 'rtl' ? 'ورود' : 'Entry'}
                                    </button>
                                    <button
                                        onClick={() => setScanType("EXIT")}
                                        className={`flex-1 py-3 px-4 rounded-xl font-black text-sm transition-all ${scanType === 'EXIT' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 hover:text-foreground'}`}
                                    >
                                        {dir === 'rtl' ? 'خروج' : 'Exit'}
                                    </button>
                                </div>
                            )}

                            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6">
                                <Camera size={48} className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-black mb-4">
                                {dir === 'rtl' ? 'آماده برای اسکن' : 'Ready to Scan'}
                            </h2>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                                {dir === 'rtl'
                                    ? `ابتدا نوع اسکن (${scanType === 'ENTRY' ? 'ورود' : 'خروج'}) را انتخاب نموده و سپس دکمه شروع را بزنید.`
                                    : `Select scan type (${scanType}) then click start.`}
                            </p>
                            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto text-start text-start">
                                <p className="font-bold mb-2">
                                    {dir === 'rtl' ? '📱 نکته مهم:' : '📱 Important Note:'}
                                </p>
                                <p>
                                    {dir === 'rtl'
                                        ? 'هنگام باز شدن دوربین، به درخواست دسترسی مرورگر "اجازه دهید" بزنید'
                                        : 'When camera opens, click "Allow" on browser permission request'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={startScanning}
                                className={`px-8 py-4 bg-gradient-to-r ${scanType === 'ENTRY' ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-orange-500'} text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto`}
                            >
                                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                                {t.dashboards.start_scanning}
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-slate-500">
                                {dir === 'rtl' ? 'در حال باز کردن دوربین...' : 'Opening camera...'}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12">
                            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 mb-6">
                                <XCircle size={48} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-black mb-4 text-red-500">
                                {dir === 'rtl' ? 'خطا' : 'Error'}
                            </h2>
                            <p className="text-slate-500 mb-8">{error}</p>
                            <button
                                onClick={startScanning}
                                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                {t.dashboards.scan_again}
                            </button>
                        </div>
                    )}

                    {result && (
                        <div className="py-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
                                    <CheckCircle size={48} className="text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black text-emerald-500">
                                    {dir === 'rtl' ? 'شخص شناسایی شد' : 'Person Identified'}
                                </h2>
                                <div className="mt-2 text-sm font-black uppercase tracking-widest text-slate-500">
                                    {t.roles[result.role as keyof typeof t.roles]}
                                </div>
                            </div>

                            {/* Student Info Card */}
                            <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl p-6 border border-border">
                                <div className="flex items-start gap-6">
                                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-primary/20 overflow-hidden">
                                        {result.image ? (
                                            <img src={result.image} alt={result.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User size={48} className="text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-foreground mb-2">{result.name}</h3>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-slate-500">
                                                <span className="font-bold">{t.student_registration.student_id}:</span> {result.studentId}
                                            </p>
                                            <p className="text-slate-500">
                                                <span className="font-bold">{t.student_registration.father_name_dr}:</span> {result.fatherName || '---'}
                                            </p>
                                            {result.currentClass && (
                                                <p className="text-slate-500 flex items-center gap-2">
                                                    <School size={16} />
                                                    <span className="font-bold">{t.dashboards.classes}:</span> {result.currentClass.level} - {result.currentClass.section}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {((session.user as any).role !== 'STAFF') && (
                                    <div className="mt-6 flex gap-4">
                                        <Link
                                            href={`/dashboard/${(session.user as any).role === 'teacher' ? 'teacher' : 'admin'}/students/${result.id}`}
                                            className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-center hover:bg-primary/90 transition-all"
                                        >
                                            {t.dashboards.view_profile}
                                        </Link>
                                        <button
                                            onClick={startScanning}
                                            className="flex-1 px-6 py-3 bg-slate-200 dark:bg-white/10 text-foreground rounded-2xl font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
                                        >
                                            {t.dashboards.scan_again}
                                        </button>
                                    </div>
                                )}
                                {((session.user as any).role === 'STAFF') && (
                                    <div className="mt-6 flex gap-4">
                                        <button
                                            onClick={startScanning}
                                            className="w-full px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all"
                                        >
                                            {t.dashboards.scan_again}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
