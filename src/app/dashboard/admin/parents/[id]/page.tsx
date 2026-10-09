
"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    Baby,
    School,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ParentProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const UnwrappedParams = use(params);
    const { id } = UnwrappedParams;
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();
    const [parent, setParent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session) {
            fetchParent();
        }
    }, [status, session]);

    const fetchParent = async () => {
        try {
            const res = await fetch(`/api/admin/parents/${id}`);
            if (res.ok) {
                const data = await res.json();
                setParent(data);
            } else {
                router.push("/dashboard/admin/parents");
            }
        } catch (error) {
            console.error("Failed to fetch parent");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
    if (!parent) return null;

    const role = (session?.user as any)?.role;
    const basePath = role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/admin";

    return (
        <div className={`p-4 md:p-8 font-sans ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`${basePath}/parents`} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group">
                    <ArrowLeft size={20} className={`text-slate-600 dark:text-slate-300 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{parent.name}</h1>
                    <p className="text-slate-500 font-bold text-sm">{dir === 'rtl' ? 'پروفایل والدین' : 'Parent Profile'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center text-center">
                        <div className="h-40 w-40 rounded-[2rem] bg-slate-100 dark:bg-slate-900 mb-6 overflow-hidden">
                            {parent.image ? (
                                <img src={parent.image} alt={parent.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400"><User size={64} /></div>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{parent.name}</h2>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                            {t.roles?.PARENT || 'Parent'}
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <User size={20} className="text-indigo-500" />
                            {dir === 'rtl' ? 'تماس و اطلاعات' : 'Contact & Info'}
                        </h3>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dir === 'rtl' ? 'تلفن' : 'Phone'}</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300" dir="ltr">{parent.phone || "---"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dir === 'rtl' ? 'ایمیل' : 'Email'}</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300" dir="ltr">{parent.email || "---"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dir === 'rtl' ? 'شغل' : 'Job'}</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300">{parent.jobTitle || "---"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dir === 'rtl' ? 'آدرس' : 'Address'}</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{parent.currentAddress || "---"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Children List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden">
                        <div className={`absolute top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} opacity-10 p-4`}>
                            <Baby size={200} />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-2">{parent.children?.length || 0} {dir === 'rtl' ? 'فرزند' : 'Children'}</h2>
                            <p className="opacity-80 font-bold">{dir === 'rtl' ? 'شاگردان ثبت شده مرتبط با این والد' : 'Registered students linked to this parent.'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {parent.children && parent.children.length > 0 ? (
                            parent.children.map((child: any) => (
                                <Link href={`${basePath}/students/${child.id}`} key={child.id} className="block group">
                                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden border-2 border-slate-100 dark:border-slate-800 group-hover:border-indigo-500 transition-colors">
                                                {child.image ? (
                                                    <img src={child.image} alt={child.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-slate-400"><Baby size={32} /></div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{child.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
                                                        <School size={12} />
                                                        {child.currentClass ? `${child.currentClass.level} - ${child.currentClass.section}` : (dir === 'rtl' ? 'بدون صنف' : 'No Class')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all ${dir === 'rtl' ? 'rotate-180' : ''}`}>
                                            <ArrowUpRight size={24} />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="text-slate-400 font-bold">{dir === 'rtl' ? 'هیچ فرزندی ثبت نشده است' : 'No registered children found.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
