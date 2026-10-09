"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function VisitorLogger() {
    const pathname = usePathname();
    const { status } = useSession();
    const loggedRef = useRef<string | null>(null);

    useEffect(() => {
        // Only log for unauthenticated users
        if (status === "unauthenticated" && loggedRef.current !== pathname) {
            const logVisit = async () => {
                try {
                    await fetch("/api/visitor/log", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ path: pathname })
                    });
                    loggedRef.current = pathname;
                } catch (err) {
                    // Fail silently
                }
            };

            logVisit();
        }
    }, [pathname, status]);

    return null;
}
