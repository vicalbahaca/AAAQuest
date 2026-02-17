
import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import { Award, Download, Share2, X, Loader2 } from 'lucide-react';
import { Language, TRANSLATIONS, Theme, AppMode } from '../types';

interface CertificateModeProps {
    language: Language;
    theme: Theme;
    setMode: (mode: AppMode) => void;
}

export const CertificateMode: React.FC<CertificateModeProps> = ({ language, theme, setMode }) => {
    const [showModal, setShowModal] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [actionType, setActionType] = useState<'DOWNLOAD' | 'SHARE'>('DOWNLOAD');
    const [isGenerating, setIsGenerating] = useState(false);

    const t = TRANSLATIONS[language];
    const isDark = theme === 'dark';
    const textMain = isDark ? 'text-white' : 'text-slate-900';
    const textSub = isDark ? 'text-slate-400' : 'text-slate-600';
    const inputBg = isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400';

    const MAX_CHARS = 35;
    const isNameTooLong = nameInput.length > MAX_CHARS;

    const createPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4: 297mm x 210mm
        const width = doc.internal.pageSize.getWidth();
        
        // Obtener fecha formateada según el idioma
        const dateStr = new Date().toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' });

        // Background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, width, 210, 'F');
        
        // Border
        doc.setDrawColor(20, 184, 166); // Teal-500
        doc.setLineWidth(2);
        doc.rect(10, 10, width - 20, 190);
        
        doc.setDrawColor(15, 23, 42); // Slate-900
        doc.setLineWidth(0.5);
        doc.rect(15, 15, width - 30, 180);

        // Header (Translated)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(36);
        doc.setTextColor(15, 23, 42);
        const headerText = t.certHeader || "CERTIFICATE OF COMPLETION";
        doc.text(headerText, width / 2, 50, { align: 'center' });

        // Icon placeholder representation (Text fallback)
        doc.setFontSize(16);
        doc.setTextColor(20, 184, 166); // Teal
        doc.text("AAAQuest", width / 2, 65, { align: 'center' });

        // Body "This certifies that" (Translated)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        const verifyText = t.certVerify || "This certifies that";
        doc.text(verifyText, width / 2, 90, { align: 'center' });

        // User Name (Dynamic)
        doc.setFont("times", "italic");
        doc.setFontSize(32);
        doc.setTextColor(15, 23, 42);
        // Truncate for safety in PDF generation if logic fails, though UI prevents it
        const finalName = nameInput.length > MAX_CHARS ? nameInput.substring(0, MAX_CHARS) + '...' : nameInput;
        doc.text(finalName, width / 2, 110, { align: 'center' });
        
        doc.setLineWidth(0.5);
        doc.line((width/2) - 60, 115, (width/2) + 60, 115);

        // Description (Translated)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        // Use splitTextToSize to handle multi-line text properly
        const splitText = doc.splitTextToSize(t.certText, 180);
        doc.text(splitText, width / 2, 135, { align: 'center' });

        // --- FOOTER SECTION ---
        // Y Position adjusted to 185mm to allow more breathing room from description
        const footerBaseY = 185; 
        const leftBlockX = 50;
        const rightBlockCenterX = width - 50; 

        // 1. DATE (Left aligned)
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(dateStr, leftBlockX, footerBaseY);
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(language === 'es' ? "Fecha" : "Date", leftBlockX, footerBaseY + 5);
        
        // 2. NAME & TITLE (Right Center aligned)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("Victor Saiz Alfageme", rightBlockCenterX, footerBaseY, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Creator, AAAQuest", rightBlockCenterX, footerBaseY + 5, { align: 'center' });

        // 3. SIGNATURE (Vector Fallback)
        const sigBottomY = footerBaseY - 7;
        doc.setLineWidth(0.6);
        doc.setDrawColor(0, 0, 0); 
        const cx = rightBlockCenterX;
        const cy = sigBottomY - 5; 

        doc.moveTo(cx - 10, cy - 1);
        doc.curveTo(cx - 4, cy - 2, cx + 4, cy - 2, cx + 15, cy - 4);
        doc.moveTo(cx + 5, cy - 8); 
        doc.curveTo(cx - 7, cy - 10, cx - 8, cy - 2, cx + 1, cy + 3); 
        doc.curveTo(cx + 5, cy + 5, cx + 1, cy + 7, cx - 1, cy + 3); 
        doc.stroke();
        
        return doc;
    };

    const handleAction = async () => {
        if (!nameInput.trim() || isGenerating || isNameTooLong) return;

        setIsGenerating(true);

        try {
            // Small delay to allow UI to update to loading state
            await new Promise(resolve => setTimeout(resolve, 50));

            const doc = createPDF();
            const safeName = nameInput.replace(/\s+/g, '_');
            const fileName = `AAAQuest-Certificate-${safeName}.pdf`;

            // Always download the file so the user has it
            doc.save(fileName);

            if (actionType === 'SHARE') {
                // Open LinkedIn share URL exclusively
                // Note: LinkedIn API does not allow attaching local files via URL. 
                // The user must manually attach the downloaded PDF.
                const shareText = `He completado la demo de AAAQuest.\nFormación en accesibilidad digital básica y automatización con IA.\n\nDurante el proceso, he aprendido cómo automatizar la documentación de accesibilidad, tanto a nivel no técnico como técnico (HTML, iOS y Android nativo).\n\nSigo formándome en ser más eficiente, accesible y en automatización de procesos. 🙌`;
                
                window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`, '_blank');
            }
            
            setShowModal(false);

        } catch (error) {
            console.error("Error generating/sharing certificate:", error);
            alert("Ocurrió un error. Por favor inténtalo de nuevo.");
        } finally {
            setIsGenerating(false);
        }
    };

    const openModal = (type: 'DOWNLOAD' | 'SHARE') => {
        setActionType(type);
        setShowModal(true);
    };

    const getModalContent = () => {
        if (language === 'es') {
            if (actionType === 'SHARE') {
                return {
                    title: "Compartir diploma AAAQuest",
                    description: "Introduce el nombre para que aparezca en el certificado y compártelo vía LinkedIn.\n\nTen en cuenta que AAAQuest es una demo, no tiene ningún valor como certificado, pero nos ayuda a que puedas compartir el proyecto. ¡Gracias y buen trabajo!",
                    button: "Compartir"
                };
            } else {
                return {
                    title: "Descargar diploma AAAQuest",
                    description: "Introduce tu nombre para que aparezca en el certificado. Se descargará automáticamente para que puedas compartirlo.\n\nTen en cuenta que AAAQuest es una demo, no tiene ningún valor como certificado, pero nos ayuda a que puedas compartir el proyecto. ¡Gracias y buen trabajo!",
                    button: "Descargar diploma"
                };
            }
        }
        
        // English fallback
        if (actionType === 'SHARE') {
            return {
                title: "Share your AAAQuest Diploma",
                description: "Enter the name to appear on the certificate and share it via LinkedIn.\n\nPlease note that AAAQuest is a demo and has no value as a certificate, but it helps us to share the project. Thanks and good work!",
                button: "Share"
            };
        } else {
             return {
                title: "Download diploma",
                description: "Enter your name to appear on the certificate. It will download automatically so you can share it.\n\nPlease note that AAAQuest is a demo and has no value as a certificate, but it helps us to share the project. Thanks and good work!",
                button: "Download diploma"
            };
        }
    };

    const modalContent = getModalContent();

    // Styles for buttons to match Header buttons
    // Using h-10/12, rounded-full, px-6/8, and specific border/hover interactions
    const btnBase = "px-8 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 border transition-all active:scale-95 min-w-[200px]";
    
    // Primary Style (Colored - like Support button)
    const btnPrimary = isDark 
        ? 'bg-teal-600 hover:bg-teal-500 border-teal-500/50 text-white shadow-lg shadow-teal-900/20' 
        : 'bg-teal-600 hover:bg-teal-700 border-teal-600/20 text-white shadow-sm shadow-teal-500/30';
    
    // Secondary Style (Neutral - like Nav buttons)
    const btnSecondary = isDark
        ? 'bg-slate-800/50 hover:bg-slate-700 border-slate-700 hover:border-white/20 text-slate-300 hover:text-white'
        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-black text-slate-600 hover:text-emerald-700 shadow-sm';

    return (
        <>
            <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in pb-32 pt-20">
                {/* Back button removed as requested */}

                {/* Decorative Background Glows - Fixed to screen for floating feel */}
                <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
                <div className="fixed bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none -z-10" />

                <div className="text-center relative z-10 flex flex-col items-center">
                    
                    {/* Floating Icon - No Animation */}
                    <div className={`w-32 h-32 mx-auto mb-10 rounded-full flex items-center justify-center shadow-2xl ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' : 'bg-white border border-white/50'}`}>
                        <Award className={`w-16 h-16 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                    </div>

                    <h1 className={`text-4xl md:text-6xl font-black tracking-tight mb-6 uppercase ${textMain}`}>
                        {t.certHeader || t.certTitle}
                    </h1>
                    
                    <p className={`text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto mb-16 ${textSub}`}>
                        {t.certText}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                        <button 
                            onClick={() => openModal('DOWNLOAD')}
                            className={`${btnBase} ${btnPrimary}`}
                        >
                            <Download className="w-4 h-4" /> {t.downloadCert}
                        </button>

                        <button 
                            onClick={() => openModal('SHARE')}
                            className={`${btnBase} ${btnSecondary}`}
                        >
                            <Share2 className="w-4 h-4" /> Compartir
                        </button>
                    </div>
                </div>
            </div>

            {/* Name Input Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <button 
                            onClick={() => setShowModal(false)}
                            className={`absolute top-4 right-4 p-1 rounded-full hover:bg-slate-500/10 ${textSub} transition-colors`}
                            aria-label={language === 'es' ? 'Cerrar' : 'Close'}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className={`text-xl font-bold mb-2 ${textMain}`}>{modalContent.title}</h3>
                        <p className={`text-sm mb-6 whitespace-pre-line ${textSub}`}>
                            {modalContent.description}
                        </p>
                        
                        <div className="mb-6 relative">
                            <input 
                                id="certificate-name-input"
                                type="text" 
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                placeholder={language === 'es' ? "Ej: Ana García" : "Ex: John Doe"}
                                className={`w-full p-4 rounded-xl border outline-none focus:ring-2 transition-all font-medium ${inputBg} ${isNameTooLong ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'focus:ring-teal-500'}`}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && !isNameTooLong && handleAction()}
                                aria-invalid={isNameTooLong}
                                aria-describedby="certificate-name-help"
                            />
                            
                            <div id="certificate-name-help" className="flex justify-between mt-2 px-1">
                                <span className={`text-xs ${isNameTooLong ? 'text-red-500 font-bold' : textSub}`}>
                                    {isNameTooLong 
                                        ? (language === 'es' ? "El nombre no puede exceder los 35 caracteres." : "Name cannot exceed 35 characters.")
                                        : (language === 'es' ? "35 caracteres máximos" : "35 characters max")
                                    }
                                </span>
                                <span className={`text-xs font-mono ${isNameTooLong ? 'text-red-500 font-bold' : textSub}`}>
                                    {nameInput.length}/{MAX_CHARS}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                disabled={isGenerating}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                            >
                                {t.backBtn || "Cancel"}
                            </button>
                            <button 
                                onClick={handleAction}
                                disabled={!nameInput.trim() || isGenerating || isNameTooLong}
                                className={`px-6 py-2 rounded-lg font-bold text-sm text-white transition-all flex items-center gap-2 ${!nameInput.trim() || isGenerating || isNameTooLong ? 'opacity-50 cursor-not-allowed bg-slate-500' : 'bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-500/30 active:scale-95'}`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                                    </>
                                ) : actionType === 'DOWNLOAD' ? (
                                    <>
                                        <Download className="w-4 h-4" /> {modalContent.button}
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-4 h-4" /> {modalContent.button}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
