"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Save, Plus, Type, Image as ImageIcon, QrCode, Trash2, Edit3, Palette, LayoutTemplate } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type ElementType = "text" | "photo" | "qrcode" | "logo";

interface CardElement {
    id: string;
    type: ElementType;
    content: string;
    x: number;
    y: number;
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    width?: number;
    height?: number;
}

interface CardDesign {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
    elements: CardElement[];
}

export default function IdCardDesigner() {
    const { t } = useLanguage();
    const [isEnabled, setIsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const [design, setDesign] = useState<CardDesign>({
        width: 350,   // px approx
        height: 550,
        backgroundColor: "#ffffff",
        elements: [
            { id: "e1", type: "text", content: "نام مکتب شما", x: 100, y: 30, fontSize: 20, color: "#1e1b4b", fontWeight: "900" },
            { id: "photo", type: "photo", content: "PHOTO", x: 125, y: 90, width: 100, height: 120 },
            { id: "e2", type: "text", content: "{Name}", x: 140, y: 230, fontSize: 18, color: "#312e81", fontWeight: "bold" },
            { id: "e3", type: "text", content: "{FatherName}", x: 140, y: 260, fontSize: 16, color: "#4338ca" },
            { id: "e4", type: "text", content: "آی دی: {StudentId}", x: 110, y: 290, fontSize: 14, color: "#4f46e5" },
            { id: "qr", type: "qrcode", content: "QR", x: 135, y: 340, width: 80, height: 80 },
        ]
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/settings/id-card")
            .then(res => res.json())
            .then(data => {
                if (data.isIdCardEnabled !== undefined) setIsEnabled(data.isIdCardEnabled);
                if (data.idCardDesign) {
                    try {
                        const parsed = JSON.parse(data.idCardDesign);
                        setDesign(parsed);
                    } catch (e) {
                        console.error("Failed to parse design", e);
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings/id-card", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idCardDesign: JSON.stringify(design) })
            });
            if (res.ok) {
                alert("Design saved successfully!");
            } else {
                alert("Failed to save design.");
            }
        } catch (error) {
            alert("Error saving design.");
        }
        setSaving(false);
    };

    const handleReset = () => {
        if (confirm("آیا مطمئن هستید که می‌خواهید طراحی را ریست کنید؟ تمام تغییرات حذف خواهد شد.")) {
            setDesign({
                width: 320,
                height: 480,
                backgroundColor: "#ffffff",
                backgroundImage: "",
                elements: []
            });
            setSelectedId(null);
        }
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setDesign({ ...design, backgroundImage: base64 });
            };
            reader.readAsDataURL(file);
        }
    };


    const addElement = (type: ElementType, presetText?: string) => {
        const newEl: CardElement = {
            id: Date.now().toString(),
            type,
            content: presetText || (type === "text" ? "متن جدید" : type.toUpperCase()),
            x: 50,
            y: 50,
            fontSize: type === "text" ? 16 : undefined,
            color: type === "text" ? "#000000" : undefined,
            width: type !== "text" ? 100 : undefined,
            height: type !== "text" ? 100 : undefined,
            fontWeight: "normal"
        };
        setDesign({ ...design, elements: [...design.elements, newEl] });
        setSelectedId(newEl.id);
    };

    const updateElement = (id: string, updates: Partial<CardElement>) => {
        setDesign({
            ...design,
            elements: design.elements.map(e => e.id === id ? { ...e, ...updates } : e)
        });
    };

    const removeElement = (id: string) => {
        setDesign({
            ...design,
            elements: design.elements.filter(e => e.id !== id)
        });
        if (selectedId === id) setSelectedId(null);
    };

    const handleDragEnd = (e: any, info: any, id: string) => {
        const el = design.elements.find(x => x.id === id);
        if (el) {
            updateElement(id, { x: el.x + info.offset.x, y: el.y + info.offset.y });
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;

    if (!isEnabled) {
        return (
            <div className="p-10 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-lg mx-auto border border-red-200 shadow-sm">
                    <h2 className="text-2xl font-black mb-2">طراح کارت غیرفعال است</h2>
                    <p>مدیر کل (SuperAdmin) دسترسی به طراح کارت را برای این مکتب غیرفعال کرده است. برای فعالسازی با مدیر کل تماس بگیرید.</p>
                </div>
            </div>
        );
    }

    const selectedElement = design.elements.find(e => e.id === selectedId);

    return (
        <div className="p-6 font-['Vazirmatn']">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Palette className="text-indigo-500" /> طراح کارت هوشمند (دیزاینر)
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">طراحی گرافیکی کارت شاگردان و پرسونل بصورت کشیدن و رها کردن (Drag & Drop)</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-bold hover:bg-red-100 transition shadow-sm border border-red-100"
                    >
                        <Trash2 size={20} />
                        ریست (پاک کردن)
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30"
                    >
                        {saving ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div> : <Save size={20} />}
                        ذخیره طراحی
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Tools Panel */}
                <div className="w-full lg:w-80 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><LayoutTemplate size={18} /> ساختار کلی</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">رنگ پس‌زمینه</label>
                                <input
                                    type="color"
                                    value={design.backgroundColor}
                                    onChange={e => setDesign({ ...design, backgroundColor: e.target.value })}
                                    className="w-full h-12 rounded-xl cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">عکس پس‌زمینه (قالب خام کارت)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBackgroundUpload}
                                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {design.backgroundImage && (
                                        <button onClick={() => setDesign({ ...design, backgroundImage: "" })} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition" title="حذف پس‌زمینه">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">عرض (پیکسل)</label>
                                    <input type="number" value={design.width} onChange={e => setDesign({ ...design, width: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">ارتفاع (پیکسل)</label>
                                    <input type="number" value={design.height} onChange={e => setDesign({ ...design, height: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Plus size={18} /> افزودن المان‌های دستی</h3>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button onClick={() => addElement("text")} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition border border-slate-200">
                                <Type size={24} className="mb-2 text-indigo-500" /> متن دلخواه
                            </button>
                            <button onClick={() => addElement("photo")} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition border border-slate-200">
                                <ImageIcon size={24} className="mb-2 text-emerald-500" /> عکس شخص
                            </button>
                            <button onClick={() => addElement("qrcode")} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition border border-slate-200">
                                <QrCode size={24} className="mb-2 text-purple-500" /> بارکد (QR)
                            </button>
                            <button onClick={() => addElement("logo")} className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition border border-slate-200">
                                <ImageIcon size={24} className="mb-2 text-pink-500" /> لوگو مکتب
                            </button>
                        </div>

                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-t border-slate-100 pt-5"><Plus size={18} /> فیلدهای آماده (خودکار)</h3>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => addElement("text", "{Name} {Surname}")} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition">+ نام و تخلص</button>
                            <button onClick={() => addElement("text", "{FatherName}")} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition">+ نام پدر</button>
                            <button onClick={() => addElement("text", "{StudentId}")} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition">+ اساس</button>
                            <button onClick={() => addElement("text", "{ClassName}")} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition">+ صنف</button>
                            <button onClick={() => addElement("text", "{Phone}")} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition">+ تماس</button>
                            <button onClick={() => addElement("text", "{Role}")} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition">+ وظیفه</button>
                            <button onClick={() => addElement("text", "{SchoolName}")} className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-bold rounded-lg border border-purple-100 hover:bg-purple-100 transition">+ اسم مکتب</button>
                        </div>
                    </div>

                    {selectedElement && (
                        <div className="bg-indigo-50 p-6 rounded-3xl shadow-sm border border-indigo-100 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Edit3 size={18} /> ویرایش المان</h3>
                                <button onClick={() => removeElement(selectedElement.id)} className="text-red-500 hover:text-red-700 bg-red-100 p-2 rounded-lg"><Trash2 size={16} /></button>
                            </div>

                            <div className="space-y-4">
                                {selectedElement.type === "text" && (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-indigo-800 mb-1 block">متن</label>
                                            <input type="text" value={selectedElement.content} onChange={e => updateElement(selectedElement.id, { content: e.target.value })} className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" dir="ltr" />
                                            <div className="text-[10px] text-indigo-600 mt-2 bg-white/60 p-2.5 rounded-lg leading-relaxed border border-indigo-100">
                                                <strong>کدهای هوشمند مجاز برای تایپ:</strong><br />
                                                <div className="grid grid-cols-2 gap-x-2 mt-1">
                                                    <div><span className="font-mono bg-indigo-100 px-1 rounded">{'{Name} {Surname}'}</span> نام و تخلص</div>
                                                    <div><span className="font-mono bg-indigo-100 px-1 rounded">{'{FatherName}'}</span> پدر</div>
                                                    <div><span className="font-mono bg-indigo-100 px-1 rounded">{'{StudentId}'}</span> اساس</div>
                                                    <div><span className="font-mono bg-indigo-100 px-1 rounded">{'{ClassName}'}</span> صنف</div>
                                                    <div><span className="font-mono bg-indigo-100 px-1 rounded">{'{Phone}'}</span> تماس</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs font-bold text-indigo-800 mb-1 block">رنگ</label>
                                                <input type="color" value={selectedElement.color} onChange={e => updateElement(selectedElement.id, { color: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-indigo-800 mb-1 block">اندازه خط</label>
                                                <input type="number" value={selectedElement.fontSize} onChange={e => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })} className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm" />
                                            </div>
                                        </div>
                                    </>
                                )}
                                {selectedElement.type !== "text" && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs font-bold text-indigo-800 mb-1 block">عرض</label>
                                            <input type="number" value={selectedElement.width} onChange={e => updateElement(selectedElement.id, { width: Number(e.target.value) })} className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-indigo-800 mb-1 block">ارتفاع</label>
                                            <input type="number" value={selectedElement.height} onChange={e => updateElement(selectedElement.id, { height: Number(e.target.value) })} className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Canvas Panel */}
                <div className="flex-1 flex justify-center items-start bg-slate-100 p-10 rounded-[3rem] border border-slate-200 overflow-auto min-h-[600px]">
                    <div
                        ref={cardRef}
                        className="relative bg-white shadow-2xl rounded-2xl overflow-hidden ring-4 ring-white"
                        style={{
                            width: design.width,
                            height: design.height,
                            backgroundColor: design.backgroundColor,
                            backgroundImage: design.backgroundImage ? `url(${design.backgroundImage})` : undefined,
                            backgroundSize: '100% 100%'
                        }}
                        onClick={() => setSelectedId(null)}
                    >
                        {design.elements.map(el => (
                            <motion.div
                                key={el.id}
                                drag
                                dragMomentum={false}
                                onDragEnd={(e, info) => handleDragEnd(e, info, el.id)}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                                className={`absolute cursor-move select-none ${selectedId === el.id ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white z-50' : ''}`}
                                style={{
                                    x: el.x,
                                    y: el.y,
                                    color: el.color,
                                    fontSize: el.fontSize,
                                    fontWeight: el.fontWeight,
                                    width: el.width,
                                    height: el.height
                                }}
                            >
                                {el.type === "text" && (
                                    <div className="whitespace-nowrap leading-none">{el.content}</div>
                                )}
                                {el.type === "photo" && (
                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs border-2 border-dashed border-slate-300 rounded-xl overflow-hidden">
                                        عکس شاگرد
                                    </div>
                                )}
                                {el.type === "qrcode" && (
                                    <div className="w-full h-full bg-white p-2 rounded-xl flex items-center justify-center border border-slate-200">
                                        <QrCode className="w-full h-full text-slate-800" />
                                    </div>
                                )}
                                {el.type === "logo" && (
                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-300 text-xs border border-indigo-100 rounded-xl">
                                        لوگو مکتب
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
