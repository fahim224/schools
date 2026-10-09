"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import { useLanguage } from "@/context/LanguageContext";

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { dir } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <DashboardSidebar role="staff" />
            <main className={`${dir === 'rtl' ? 'lg:pr-32' : 'lg:pl-32'} px-4 md:px-8 py-8 animate-in fade-in duration-700`}>
                {children}
            </main>
        </div>
    );
}
