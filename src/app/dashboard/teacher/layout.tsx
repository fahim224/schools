"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import { useLanguage } from "@/context/LanguageContext";

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { dir } = useLanguage();

    return (
        <div className="min-h-screen bg-background transition-colors duration-500">
            <DashboardSidebar role="teacher" />
            <main className={`${dir === 'rtl' ? 'lg:pr-32' : 'lg:pl-32'} pb-24 lg:pb-8 relative z-10 transition-all duration-500`}>
                {children}
            </main>
        </div>
    );
}
