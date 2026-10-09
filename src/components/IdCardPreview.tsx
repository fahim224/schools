"use client";

import React, { useEffect } from "react";
import { QrCode } from "lucide-react";

interface CardElement {
    id: string;
    type: "text" | "photo" | "qrcode" | "logo";
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

export function IdCardPreview({ designJson, studentData, schoolSettings, id }: { designJson: string, studentData: any, schoolSettings?: any, id: string }) {
    let design: CardDesign | null = null;
    try {
        if (designJson) design = JSON.parse(designJson);
    } catch (e) {
        console.error("Failed to parse design", e);
    }

    if (!design) return null;

    const renderText = (content: string) => {
        let text = content;
        text = text.replace(/{Name}/g, studentData.name || "");
        text = text.replace(/{Surname}/g, studentData.surname || "");
        text = text.replace(/{FatherName}/g, studentData.fatherName || "");
        text = text.replace(/{StudentId}/g, studentData.studentId || "");
        text = text.replace(/{ClassName}/g, studentData.class?.name || schoolSettings?.className || "");
        text = text.replace(/{Phone}/g, studentData.phone || "");
        text = text.replace(/{Role}/g, studentData.role === "TEACHER" ? "معلم" : studentData.role === "STAFF" ? "کارمند" : "شاگرد");
        text = text.replace(/{SchoolName}/g, schoolSettings?.schoolName || "");
        return text;
    };
    return (
        <div id={id} style={{
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: design.width,
            height: design.height,
            backgroundColor: design.backgroundColor,
            backgroundImage: design.backgroundImage ? `url(${design.backgroundImage})` : 'none',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            fontFamily: 'Vazirmatn, sans-serif'
        }}>
            {design.elements.map(el => (
                <div
                    key={el.id}
                    className="absolute font-sans"
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        transform: `translate(${el.x}px, ${el.y}px)`,
                        color: el.color,
                        fontSize: el.fontSize,
                        fontWeight: el.fontWeight,
                        width: el.width,
                        height: el.height,
                    }}
                >
                    {el.type === "text" && (
                        <div style={{ whiteSpace: 'nowrap', lineHeight: 1, direction: 'rtl', textAlign: 'right' }}>{renderText(el.content)}</div>
                    )}
                    {el.type === "photo" && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '1rem', backgroundColor: '#f1f5f9' }}>
                            {studentData.image ? (
                                <img src={studentData.image} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ color: '#cbd5e1', fontSize: '10px' }}>بدون عکس</div>
                            )}
                        </div>
                    )}
                    {el.type === "qrcode" && (
                        <div style={{ width: '100%', height: '100%', padding: '4px', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
                            {studentData.qrCode ? (
                                <img src={studentData.qrCode} alt="QR" style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <QrCode style={{ width: '100%', height: '100%', color: '#1e293b' }} />
                            )}
                        </div>
                    )}
                    {el.type === "logo" && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {schoolSettings?.schoolLogo ? (
                                <img src={schoolSettings.schoolLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : schoolSettings?.logoRight ? (
                                <img src={schoolSettings.logoRight} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ color: '#cbd5e1', fontSize: '10px', textAlign: 'center' }}>لوگو</div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export const generateIdCardImage = async (designJson: string, studentData: any, schoolSettings?: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            let design: CardDesign | null = null;
            try { if (designJson) design = JSON.parse(designJson); } catch (e) { return reject(e); }
            if (!design) return reject(new Error("No design found"));

            const canvas = document.createElement('canvas');
            canvas.width = design.width;
            canvas.height = design.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error("Canvas context not supported"));

            ctx.fillStyle = design.backgroundColor || '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const loadImage = (src: string): Promise<HTMLImageElement> => {
                return new Promise((res) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => res(img);
                    img.onerror = () => res(img); // resolve silently to continue rendering
                    img.src = src;
                });
            };

            const renderText = (content: string) => {
                let text = content;
                text = text.replace(/{Name}/g, studentData.name || "");
                text = text.replace(/{Surname}/g, studentData.surname || "");
                text = text.replace(/{FatherName}/g, studentData.fatherName || "");
                text = text.replace(/{StudentId}/g, studentData.studentId || "");
                text = text.replace(/{ClassName}/g, studentData.class?.name || (schoolSettings?.className || ""));
                text = text.replace(/{Phone}/g, studentData.phone || "");
                text = text.replace(/{Role}/g, studentData.role === "TEACHER" ? "معلم" : studentData.role === "STAFF" ? "کارمند" : "شاگرد");
                text = text.replace(/{SchoolName}/g, schoolSettings?.schoolName || "");
                return text;
            };

            const draw = async () => {
                if (design?.backgroundImage) {
                    try {
                        const bgImg = await loadImage(design.backgroundImage);
                        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                    } catch (e) { }
                }

                for (const el of design!.elements) {
                    if (el.type === 'text') {
                        const text = renderText(el.content);
                        ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize || 16}px Vazirmatn, sans-serif`;
                        ctx.fillStyle = el.color || '#000000';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.direction = 'rtl';
                        ctx.fillText(text, el.x, el.y);
                    } else if (el.type === 'photo') {
                        const w = el.width || 100;
                        const h = el.height || 100;
                        ctx.fillStyle = '#f1f5f9';
                        if (studentData.image) {
                            try {
                                const img = await loadImage(studentData.image);
                                ctx.save();
                                ctx.beginPath();
                                ctx.roundRect(el.x, el.y, w, h, 16);
                                ctx.clip();
                                const ratio = Math.max(w / img.width, h / img.height);
                                const nw = img.width * ratio;
                                const nh = img.height * ratio;
                                const nx = el.x + (w - nw) / 2;
                                const ny = el.y + (h - nh) / 2;
                                ctx.drawImage(img, nx, ny, nw, nh);
                                ctx.restore();
                            } catch (e) {
                                ctx.beginPath(); ctx.roundRect(el.x, el.y, w, h, 16); ctx.fill();
                            }
                        } else {
                            ctx.beginPath(); ctx.roundRect(el.x, el.y, w, h, 16); ctx.fill();
                        }
                    } else if (el.type === 'qrcode') {
                        const w = el.width || 100;
                        const h = el.height || 100;
                        ctx.fillStyle = '#ffffff';
                        ctx.save();
                        ctx.beginPath();
                        ctx.roundRect(el.x, el.y, w, h, 12);
                        ctx.fill();
                        ctx.clip();
                        if (studentData.qrCode) {
                            try {
                                const img = await loadImage(studentData.qrCode);
                                ctx.drawImage(img, el.x + 4, el.y + 4, w - 8, h - 8);
                            } catch (e) { }
                        }
                        ctx.restore();
                    } else if (el.type === 'logo') {
                        const src = schoolSettings?.schoolLogo || schoolSettings?.logoRight;
                        if (src) {
                            try {
                                const img = await loadImage(src);
                                const w = el.width || 100;
                                const h = el.height || 100;
                                const ratio = Math.min(w / img.width, h / img.height);
                                const nw = img.width * ratio;
                                const nh = img.height * ratio;
                                const nx = el.x + (w - nw) / 2;
                                const ny = el.y + (h - nh) / 2;
                                ctx.drawImage(img, nx, ny, nw, nh);
                            } catch (e) { }
                        }
                    }
                }

                resolve(canvas.toDataURL('image/png', 1.0));
            };

            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => draw()).catch(() => draw());
            } else {
                draw();
            }

        } catch (error) {
            reject(error);
        }
    });
};
