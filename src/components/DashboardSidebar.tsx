"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
    LayoutDashboard,
    Users,
    School,
    GraduationCap,
    QrCode,
    Settings,
    TrendingUp,
    MessageSquare,
    Palette
} from "lucide-react";


export default function DashboardSidebar({ role }: { role: string }) {
    const pathname = usePathname();
    const { dir } = useLanguage();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            // Avoid fetching on login page or if not needed
            try {
                const res = await fetch("/api/chat/users");
                if (res.ok) {
                    const data: any[] = await res.json();
                    const count = data.reduce((acc, u) => acc + (u.unreadCount || 0), 0);
                    setUnreadCount(count);
                }
            } catch (e) { }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 15000); // Check every 15s to be light
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        {
            icon: LayoutDashboard,
            href: role === 'staff' ? `/dashboard/staff` : (role === 'superadmin' ? `/dashboard/superadmin` : `/dashboard/${role}`),
            active: pathname === `/dashboard/${role}` || (role === 'staff' && pathname === `/dashboard/staff`)
        },
        {
            icon: MessageSquare,
            href: `/dashboard/${role}/chat`,
            active: pathname.includes('/chat'),
            label: "Chat",
            badge: unreadCount > 0 ? unreadCount : undefined
        },
        ...(role === 'staff' ? [
            { icon: QrCode, href: "/scan-qr", active: pathname === "/scan-qr", label: "Scan QR" }
        ] : role === 'superadmin' ? [
            {
                icon: Users,
                href: `/dashboard/superadmin/users`,
                active: pathname.includes('/users'),
                label: "Admins"
            },
            {
                icon: School,
                href: `/dashboard/superadmin/classes`,
                active: pathname.includes('/classes'),
                label: "Classes"
            },
            {
                icon: TrendingUp,
                href: `/dashboard/superadmin/ads`,
                active: pathname.includes('/ads'),
                label: "Ads Management"
            },
            {
                icon: Settings,
                href: `/dashboard/superadmin/settings`,
                active: pathname.includes('/settings'),
                label: "Settings"
            }
        ] : [
            {
                icon: Users,
                href: role === 'teacher' ? `/dashboard/teacher/students/new` : `/dashboard/admin/students`,
                active: pathname.includes('/students') || (role === 'teacher' && pathname.includes('/students/new')),
                label: "Students"
            },
            ...(role === 'teacher' ? [
                {
                    icon: GraduationCap,
                    href: `/dashboard/teacher/classes`,
                    active: pathname.includes(`/classes`),
                    label: "My Classes"
                },
                {
                    icon: Settings,
                    href: `/dashboard/teacher/settings`,
                    active: pathname.includes(`/settings`),
                    label: "Settings"
                }
            ] : [
                {
                    icon: School,
                    href: role === 'superadmin' ? `/dashboard/superadmin/classes` : `/dashboard/admin/classes`,
                    active: pathname.includes(`/classes`)
                },
                { icon: QrCode, href: "/scan-qr", active: pathname === "/scan-qr" },
                {
                    icon: TrendingUp,
                    href: role === 'superadmin' ? `/dashboard/superadmin/promotions` : `/dashboard/admin/promotions`,
                    active: pathname.includes('/promotions')
                },
                {
                    icon: Palette,
                    href: "/dashboard/admin/id-card-designer",
                    active: pathname.includes('/id-card-designer')
                },
                
                {
                    icon: Settings,
                    href: role === 'superadmin' ? "/dashboard/admin/settings" : "/dashboard/admin/settings",
                    active: pathname.includes('/settings')
                },
            ]),
        ]),
    ];

    // Mobile Bottom Navigation Items (subset for better fit)
    const mobileNavItems = role === 'teacher'
        ? [navItems[0], navItems[1], navItems[2], navItems[3]].filter(Boolean)
        : (role === 'staff' ? navItems : navItems.filter((_, i) => [0, 2, 3, 6].includes(i)));

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`fixed ${dir === 'rtl' ? 'right-6' : 'left-6'} no-print top-24 bottom-6 w-20 hidden lg:flex flex-col items-center py-8 bg-card/60 backdrop-blur-3xl border border-border rounded-[2.5rem] z-40 shadow-xl dark:shadow-2xl transition-all duration-500`}>
                <div className="mb-6 p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg overflow-hidden h-12 w-12 flex items-center justify-center flex-shrink-0">
                    <img src="/images/logo.png" alt="Logo" className="h-full w-full object-cover" />
                </div>
                <nav className="flex flex-col gap-5 flex-1 overflow-y-auto overflow-x-hidden w-full px-2" style={{ scrollbarWidth: 'thin' }}>
                    {navItems.map((item, i) => (
                        <Link
                            key={i}
                            href={item.href}
                            className={`relative p-4 rounded-2xl transition-all duration-300 group hover:scale-110 flex items-center justify-center flex-shrink-0 ${item.active ? 'text-white bg-cyan-600 dark:bg-cyan-500 shadow-lg shadow-cyan-500/30' : 'text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-white hover:bg-cyan-500/5'}`}
                        >
                            <item.icon size={24} />
                            {item.badge && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Mobile Bottom Navigation Bar */}
            <div className="lg:hidden fixed bottom-6 no-print left-6 right-6 h-16 bg-card/80 backdrop-blur-2xl border border-border rounded-[2rem] z-[90] shadow-2xl flex items-center justify-around px-2 py-2">
                {mobileNavItems.map((item, i) => (
                    <Link
                        key={i}
                        href={item.href}
                        className={`relative p-3 rounded-2xl transition-all duration-300 flex items-center justify-center ${item.active ? 'text-white bg-cyan-600 dark:bg-cyan-500 shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:text-cyan-600 hover:bg-cyan-500/5'}`}
                    >
                        <item.icon size={22} />
                        {item.badge && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                                {item.badge > 9 ? '9+' : item.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </>
    );
}
