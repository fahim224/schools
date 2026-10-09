"use client";

import { useState, useEffect } from "react";
import { Clock as ClockIcon, Calendar } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardClock() {
    const { language } = useLanguage();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getAfghanDate = (date: Date, lang: string) => {
        const dariMonths = ["حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله", "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت"];
        const pashtoMonths = ["وری", "غويی", "غبرګولی", "چنګاښ", "زمری", "وږی", "تله", "لړم", "ليندۍ", "مرغومی", "سلواغه", "کب"];

        try {
            // Use Intl to get the Hijri-Solar date components
            const parts = new Intl.DateTimeFormat('en-u-ca-persian', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
            }).formatToParts(date);

            const day = parts.find(p => p.type === 'day')?.value;
            const monthNum = parts.find(p => p.type === 'month')?.value;
            const year = parts.find(p => p.type === 'year')?.value;

            if (day && monthNum && year) {
                const monthIndex = parseInt(monthNum) - 1;
                if (lang === "fa") return `${day} ${dariMonths[monthIndex]} ${year}`;
                if (lang === "ps") return `${day} ${pashtoMonths[monthIndex]} ${year}`;
            }
        } catch (e) {
            console.error("Persian calendar Error:", e);
        }

        // English or fallback: Show day name, month name, day, year
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'fa-AF', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="flex items-center gap-4 bg-card/50 backdrop-blur-md border border-border px-5 py-2.5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 border-r border-border pr-4">
                <Calendar size={16} className="text-primary opacity-70" />
                <span className="text-xs font-black tracking-tight text-foreground/80">
                    {getAfghanDate(time, language)}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <ClockIcon size={16} className="text-emerald-500 opacity-70" />
                <span className="text-sm font-black tabular-nums tracking-wider text-foreground">
                    {formatTime(time)}
                </span>
            </div>
        </div>
    );
}
