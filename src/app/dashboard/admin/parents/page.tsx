"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
    Search,
    Users,
    ArrowLeft,
    Eye,
    Edit,
    Phone,
    Mail,
    Baby
} from "lucide-react";
import Link from "next/link";

export default function ParentsListPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t, dir } = useLanguage();

    const [parents, setParents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (session) {
            const role = (session.user as any).role;
            if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "TEACHER") {
                router.push("/");
            } else {
                fetchParents();
            }
        }
    }, [status, session]);

    const fetchParents = async (searchQuery = "") => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/parents?search=${searchQuery}`);
            if (res.ok) {
                const data = await res.json();
                setParents(data);
            }
        } catch (error) {
            console.error("Failed to fetch parents");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        // Debounce could be good, but simple for now
        if (e.target.value.length > 2 || e.target.value.length === 0) {
            fetchParents(e.target.value);
        }
    };

    if (status === "loading") return <div className="p-8">Loading...</div>;

    const role = (session?.user as any)?.role;
    const basePath = role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/admin";

    return (
        <div className={`p-4 md:p-8 space-y-8 font-sans ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={basePath} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group">
                        <ArrowLeft size={20} className={`text-slate-600 dark:text-slate-300 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">لیست والدین</h1>
                        <p className="text-slate-500 font-bold text-sm">مدیریت حساب های والدین و شاگردان مربوطه</p>
                    </div>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors`} size={20} />
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch}
                        placeholder="جستجو والدین (نام، شماره، ایمیل)..."
                        className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-shadow shadow-sm`}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase tracking-widest font-black border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-6 text-start">شهرت والدین</th>
                                <th className="px-8 py-6 text-start">تماس</th>
                                <th className="px-8 py-6 text-center">تعداد فرزندان</th>
                                <th className="px-8 py-6 text-end">عملکرد</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {parents.length > 0 ? (
                                (() => {
                                    const uniqueParents: any[] = [];
                                    const seen = new Set();
                                    parents.forEach(p => {
                                        const identifier = p.email || p.name;
                                        if (!seen.has(identifier)) {
                                            seen.add(identifier);
                                            uniqueParents.push(p);
                                        }
                                    });
                                    return uniqueParents.map((parent) => (
                                        <tr key={parent.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                                                        {parent.image ? <img src={parent.image} className="h-full w-full rounded-2xl object-cover" /> : <Users size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 dark:text-slate-200 text-base">{parent.name}</div>
                                                        <div className="text-xs font-bold text-slate-500 mt-0.5" dir="ltr">{parent.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-sm">
                                                        <Phone size={14} className="text-emerald-500" />
                                                        <span dir="ltr">{parent.phone || "---"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-bold text-xs">
                                                    <Baby size={14} />
                                                    <span>{parent.children?.length || 0} شاگرد</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-end">
                                                <Link href={`${basePath}/parents/${parent.id}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all">
                                                    <Eye size={16} />
                                                    مشاهده و ویرایش
                                                </Link>
                                            </td>
                                        </tr>
                                    ));
                                })()
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold">
                                        {loading ? "در حال بارگذاری..." : "هیچ حساب کاربری یافت نشد."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
