"use client";

import ChatInterface from "@/components/chat/ChatInterface";

export default function TeacherChatPage() {
    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl h-[calc(100vh-6rem)]">
            <h1 className="text-2xl font-black mb-6">پیام‌رسان</h1>
            <ChatInterface />
        </div>
    );
}
