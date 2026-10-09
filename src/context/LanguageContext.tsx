"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionary, Language } from "@/lib/dictionary";

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof dictionary["fa"];
    dir: "rtl" | "ltr";
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("fa");

    // Load language from localStorage if available
    useEffect(() => {
        const savedLang = localStorage.getItem("app-language") as Language;
        if (savedLang) {
            setLanguage(savedLang);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("app-language", lang);
        // document.dir = lang === "en" ? "ltr" : "rtl"; // Update document direction
        document.documentElement.lang = lang;
    };

    const dir = language === "en" ? "ltr" : "rtl";

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage: handleSetLanguage,
                // Persian is the canonical translation shape; other languages
                // intentionally fall back to the same UI contract.
                t: dictionary[language] as typeof dictionary["fa"],
                dir
            }}
        >
            <div dir={dir} className={language === 'ps' ? 'font-pashto' : 'font-dari'}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
