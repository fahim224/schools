"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function ForceLogoutPage() {
    const [status, setStatus] = useState("Clearing cookies...");

    useEffect(() => {
        const clearAll = async () => {
            setStatus("Signing out...");

            // Sign out from NextAuth
            await signOut({ redirect: false });

            setStatus("Clearing local storage...");
            localStorage.clear();
            sessionStorage.clear();

            setStatus("Done! Redirecting...");
            setTimeout(() => {
                window.location.href = "/auth/signin";
            }, 1000);
        };

        clearAll();
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-indigo-950">
            <div className="text-center text-white">
                <Loader2 className="mx-auto h-16 w-16 animate-spin mb-4" />
                <h1 className="text-2xl font-black">{status}</h1>
            </div>
        </div>
    );
}
