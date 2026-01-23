
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage } from '../services/geminiService';
import { CheckerResult, Language, TRANSLATIONS, Theme } from '../types';
import { Upload, ScanEye, CheckCircle, Layers, Layout, Type, Image, AppWindow, ListOrdered, Monitor, Globe, RotateCcw, AlertTriangle, ChevronDown, MessageSquareText, Languages, Component, Maximize, MousePointerClick, ArrowLeft, FileText, Download, Lock, Linkedin, Mail } from 'lucide-react';
import { Loader } from './Loader';
import { jsPDF } from "jspdf";

interface CheckerModeProps {
  language: Language;
  theme: Theme;
}

const GlobalAccordion: React.FC<{
  title: string;
  content: string[];
  icon: React.ReactNode;
  theme: Theme;
}> = ({ title, content, icon, theme }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!content || content.length === 0) return null;

  const isDark = theme === 'dark';
  const containerClass = isDark ? 'bg-black border-slate-800' : 'bg-white/80 border-slate-200/60 shadow-sm hover:border-black';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const iconBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700';
  const listText = isDark ? 'text-slate-300' : 'text-slate-600';
  const hoverClass = isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50';

  return (
    <div className={`${containerClass} border rounded-xl transition-all duration-300`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-4 p-5 cursor-pointer select-none group active:scale-[0.99] transition-transform text-left rounded-xl ${hoverClass}`}
        aria-expanded={isOpen}
      >
        <div className="shrink-0">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shadow-sm group-hover:border-blue-400 transition-colors ${iconBg}`}>
              {icon}
            </div>
        </div>
        
        <div className="flex-grow flex items-center justify-between">
            <h4 className={`font-bold text-base tracking-wide group-hover:text-blue-500 transition-colors uppercase ${textClass}`}>{title}</h4>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-0 pl-6 md:pl-[4.5rem] animate-fade-in">
            <div className={`border-t pt-3 ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
              <ul className={`list-disc pl-5 space-y-2 font-mono text-sm leading-relaxed ${listText}`}>
                {content.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
        </div>
      )}
    </div>
  );
};

// Accordion for Categories INSIDE a Section
const CategoryAccordion: React.FC<{
  title: string;
  content: string[];
  theme: Theme;
}> = ({ title, content, theme }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!content || content.length === 0) return null;

  const isDark = theme === 'dark';
  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const hoverClass = isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50';
  const titleClass = isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-700';
  const textClass = isDark ? 'text-slate-300' : 'text-slate-700';

  return (
    <div className={`border-l-2 ml-2 mb-2 ${borderClass}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between py-2 px-4 rounded-r-lg transition-colors group text-left active:bg-opacity-80 ${hoverClass}`}
        aria-expanded={isOpen}
      >
        <span className={`font-bold text-xs uppercase tracking-wider ${titleClass}`}>{title}</span>
        <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="pb-3 pl-8 pr-2 animate-fade-in">
            <ul className={`list-disc pl-0 space-y-2 text-xs font-mono leading-relaxed ${textClass}`}>
              {content.map((item, idx) => (
                <li key={idx} className={`pl-2 border-l ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>{item}</li>
              ))}
            </ul>
        </div>
      )}
    </div>
  );
};

// Accordion for the SECTION itself
const SectionAccordion: React.FC<{
  title: string;
  children: React.ReactNode;
  isSelected?: boolean;
  theme: Theme;
}> = ({ title, children, isSelected, theme }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isDark = theme === 'dark';

  let containerClass = '';
  let headerClass = '';
  let titleClass = '';
  let hoverClass = '';

  if (isDark) {
      containerClass = isSelected ? 'bg-blue-900/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-slate-900/30 border-slate-800';
      headerClass = isSelected ? 'bg-blue-900/20 border-blue-500/30' : 'bg-slate-900 border-slate-800';
      titleClass = isSelected ? 'text-blue-200' : 'text-white';
      hoverClass = 'hover:bg-slate-800';
  } else {
      containerClass = isSelected ? 'bg-blue-50/50 border-blue-300 shadow-md shadow-blue-200/50' : 'bg-white/80 border-slate-200 shadow-sm hover:border-black';
      headerClass = isSelected ? 'bg-blue-100/30 border-blue-200' : 'bg-white/50 border-slate-200';
      titleClass = isSelected ? 'text-blue-700' : 'text-slate-900';
      hoverClass = 'hover:bg-slate-50';
  }

  return (
    <div className={`border rounded-xl overflow-hidden mb-4 transition-all duration-300 ${containerClass}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border-b p-4 cursor-pointer flex justify-between items-center group transition-colors active:scale-[0.99] ${headerClass} ${hoverClass}`}
        aria-expanded={isOpen}
      >
          <h4 className={`font-bold text-lg group-hover:text-blue-500 transition-colors text-left ${titleClass}`}>{title}</h4>
          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      
      {isOpen && (
        <div className="p-2 animate-fade-in">
           {children}
        </div>
      )}
    </div>
  );
}

const DetectedScreenAccordion: React.FC<{
  t: any;
  screenContext: CheckerResult['screenContext'];
  imageResolution: string | null;
  renderContextValue: (val: string | number | undefined | null) => React.ReactNode;
  theme: Theme;
}> = ({ t, screenContext, imageResolution, renderContextValue, theme }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isDark = theme === 'dark';

  const containerClass = isDark ? 'bg-black border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm hover:border-black';
  const itemBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200';
  const hoverClass = isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50';

  return (
    <div className={`${containerClass} border rounded-xl overflow-hidden mb-6`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-6 cursor-pointer select-none group border-b flex justify-between items-center active:bg-opacity-80 transition-colors text-left ${isDark ? 'border-slate-800/50' : 'border-slate-100'} ${hoverClass}`}
        aria-expanded={isOpen}
      >
        <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2 group-hover:text-blue-400 transition-colors">
            <Monitor className="w-4 h-4" /> {t.detectedScreen}
        </h3>
        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="p-6 animate-fade-in">
          <div className="space-y-4">
              {screenContext?.description && (
                  <div className={`text-sm italic border-l-2 pl-3 ${isDark ? 'text-slate-300 border-slate-700' : 'text-slate-600 border-slate-300'}`}>"{screenContext.description}"</div>
              )}
              
              {/* Context Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                      { icon: Monitor, label: t.device, val: screenContext?.device },
                      { icon: Globe, label: t.sector, val: screenContext?.sector },
                      { icon: Layout, label: t.screenType, val: screenContext?.screenType },
                      { icon: Maximize, label: t.screenSize, val: imageResolution },
                      { icon: Languages, label: t.uiLanguage, val: screenContext?.language },
                      { icon: Component, label: t.componentCount, val: screenContext?.componentCount },
                  ].map((item, i) => (
                    <div key={i} className={`${itemBg} p-3 rounded-xl border`}>
                        <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold mb-1">
                            <item.icon className="w-3 h-3" aria-hidden="true" /> {item.label}
                        </div>
                        <div className="font-medium text-sm truncate">{renderContextValue(item.val)}</div>
                    </div>
                  ))}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CheckerMode: React.FC<CheckerModeProps> = ({ language, theme }) => {
  // Constants
  const MAX_ATTEMPTS = 3;

  // View State
  const [viewState, setViewState] = useState<'UPLOAD' | 'ANALYZING' | 'RESULT'>('UPLOAD');
  const [image, setImage] = useState<string | null>(null); // base64
  const [imageResolution, setImageResolution] = useState<string | null>(null);
  const [result, setResult] = useState<CheckerResult | null>(null);
  const [userContext, setUserContext] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interaction State
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [hoveredSectionIndex, setHoveredSectionIndex] = useState<number | null>(null);

  // Persistence State for Attempts
  const [attempts, setAttempts] = useState(() => {
    const saved = localStorage.getItem('aaaquest_checker_attempts');
    return saved ? parseInt(saved, 10) : MAX_ATTEMPTS;
  });

  const isLocked = attempts <= 0;

  // Reset scroll on viewState change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [viewState]);

  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';

  // Theme Constants
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const glassPanelClass = isDark ? 'glass-panel' : 'bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-xl';
  const inputBg = isDark ? 'bg-slate-900/50 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400';
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          setImageResolution(`${img.naturalWidth}x${img.naturalHeight}`);
          const MAX_SIZE = 1024;
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          const base64Data = compressedDataUrl.split(',')[1];
          setImage(base64Data);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    
    // Check Attempts Limit
    if (isLocked) {
        return;
    }

    setViewState('ANALYZING');
    setResult(null);
    setSelectedSectionIndex(null);
    setHoveredSectionIndex(null);
    
    try {
      const analysis = await analyzeImage(image, language, userContext);
      setResult(analysis);
      setViewState('RESULT');
      
      // Decrement and Save Attempts on Successful Analysis
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      localStorage.setItem('aaaquest_checker_attempts', newAttempts.toString());

    } catch (e) {
      console.error(e);
      alert("Error en el análisis. Inténtalo de nuevo.");
      setViewState('UPLOAD');
    }
  };

  const handleReset = () => {
    setImage(null);
    setImageResolution(null);
    setResult(null);
    setUserContext('');
    setViewState('UPLOAD');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSelectedSectionIndex(null);
    setHoveredSectionIndex(null);
  };

  const handleZoneClick = (index: number) => {
    if (selectedSectionIndex === index) {
        setSelectedSectionIndex(null);
    } else {
        setSelectedSectionIndex(index);
    }
  };

  const handleExportPDF = () => {
    if (!result || !image) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let yPos = 15;

    const colorSlate900 = '#0f172a';
    const colorSlate500 = '#64748b';
    const colorBlue600 = '#2563eb';

    const drawHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(colorSlate900);
        doc.text("AAAQuest Audit", margin, 17);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(colorSlate500);
        doc.text(new Date().toLocaleDateString(), pageWidth - margin, 17, { align: 'right' });
    };

    const drawFooter = () => {
        const text = "Hecho con Gemini 3 por Victor Saiz Alfageme";
        const linkUrl = "https://www.linkedin.com/in/victorsaizalfageme/";
        doc.setFontSize(8);
        doc.setTextColor(colorSlate500);
        doc.setFont("helvetica", "normal");
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        const y = pageHeight - 8;
        doc.text(text, x, y);
        doc.link(x, y - 3, textWidth, 4, { url: linkUrl });
    };

    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - margin - 10) { 
            drawFooter();
            doc.addPage();
            drawHeader();
            yPos = 25;
            return true;
        }
        return false;
    };

    const addText = (text: string, x: number, y: number, fontSize: number = 9, isBold: boolean = false, color: string = '#000000', maxWidth?: number) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setTextColor(color);
      if (maxWidth) {
          doc.text(doc.splitTextToSize(text, maxWidth), x, y);
      } else {
          doc.text(text, x, y);
      }
    };

    const getCategoryHeight = (cats: {title: string, items: string[]}[], w: number) => {
        let h = 0;
        cats.forEach(c => {
            if (c.items && c.items.length > 0) {
                h += 3.5;
                c.items.forEach((item: string) => {
                    const lines = doc.splitTextToSize(`- ${item}`, w);
                    h += (lines.length * 3.2);
                });
                h += 2;
            }
        });
        return h;
    };

    const renderCategoryColumn = (cats: {title: string, items: string[]}[], x: number, startY: number, w: number) => {
        let curY = startY;
        cats.forEach(c => {
           if (c.items && c.items.length > 0) {
               doc.setFontSize(8);
               doc.setFont("helvetica", "bold");
               doc.setTextColor(colorSlate500);
               doc.text(c.title.toUpperCase(), x, curY);
               curY += 3.5;
               c.items.forEach((item: string) => {
                   const lines = doc.splitTextToSize(`- ${item}`, w);
                   doc.setFontSize(8);
                   doc.setFont("helvetica", "normal");
                   doc.setTextColor('#475569');
                   doc.text(lines, x, curY);
                   curY += (lines.length * 3.2);
               });
               curY += 2;
           }
        });
        return curY;
    };

    drawHeader();
    yPos = 25;

    const ctx = result.screenContext;
    const splitY = yPos;
    const imgProps = doc.getImageProperties(`data:image/jpeg;base64,${image}`);
    const maxImgWidth = 60;
    const maxImgHeight = 50;
    let imgW = maxImgWidth;
    let imgH = (imgProps.height * imgW) / imgProps.width;
    
    if (imgH > maxImgHeight) {
        imgH = maxImgHeight;
        imgW = (imgProps.width * imgH) / imgProps.height;
    }
    
    doc.addImage(`data:image/jpeg;base64,${image}`, 'JPEG', margin, yPos, imgW, imgH);
    
    const textX = margin + maxImgWidth + 5;
    let textY = splitY;
    
    addText("Resumen de Pantalla", textX, textY, 11, true, colorSlate900);
    textY += 5;
    
    if (ctx) {
        const details = [
            `Dispositivo: ${ctx.device || '-'}`,
            `Tipo: ${ctx.screenType || '-'}`,
            `Sector: ${ctx.sector || '-'}`,
            `Idioma: ${ctx.language || '-'}`,
            `Componentes: ${ctx.componentCount || '-'}`,
            `Resolución: ${imageResolution || '-'}`
        ];
        
        details.forEach(det => {
            addText(det, textX, textY, 9, false, '#334155');
            textY += 4;
        });
        
        if (ctx.description) {
            textY += 1;
            addText(`"${ctx.description}"`, textX, textY, 8, false, '#64748b', pageWidth - textX - margin);
        }
    }
    yPos = Math.max(yPos + imgH, textY) + 8;

    checkPageBreak(30);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

    addText("Accesibilidad Global", margin, yPos, 11, true, colorSlate900);
    yPos += 5;

    const globals = [
        { title: "TÍTULO (Title)", items: result.globalAnnotations?.viewTitle },
        { title: "ESTRUCTURA (Landmarks)", items: result.globalAnnotations?.structure },
        { title: "ENCABEZADOS (Headings)", items: result.globalAnnotations?.heading },
        { title: "ORDEN DE FOCO", items: result.globalAnnotations?.focusOrder },
    ];

    let col = 0;
    let maxRowHeight = 0;
    let rowStartY = yPos;
    const colWidth = (pageWidth - (margin * 2) - 5) / 2;

    globals.forEach((g) => {
        if (!g.items || g.items.length === 0) return;
        
        const currentX = margin + (col * (colWidth + 5));
        let currentY = rowStartY;
        let neededH = 4;
        g.items.forEach(item => {
             const lines = doc.splitTextToSize(`• ${item}`, colWidth);
             neededH += (lines.length * 3.5);
        });

        if (currentY + neededH > pageHeight - margin - 10) {
             drawFooter();
             doc.addPage();
             drawHeader();
             rowStartY = 25;
             currentY = 25;
             maxRowHeight = 0;
        }

        addText(g.title, currentX, currentY, 9, true, colorBlue600);
        currentY += 4;
        
        g.items.forEach(item => {
            const lines = doc.splitTextToSize(`• ${item}`, colWidth);
            doc.setFontSize(8);
            doc.setTextColor('#334155');
            doc.setFont("helvetica", "normal");
            doc.text(lines, currentX, currentY);
            currentY += (lines.length * 3.5);
        });

        if (currentY - rowStartY > maxRowHeight) maxRowHeight = currentY - rowStartY;

        col++;
        if (col > 1) {
            col = 0;
            rowStartY += maxRowHeight + 4;
            maxRowHeight = 0;
        }
    });
    yPos = rowStartY + maxRowHeight + 4;

    if (result.complexSections) {
        checkPageBreak(15);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

        addText("Secciones / Componentes Detectados", margin, yPos, 11, true, colorSlate900);
        yPos += 5;

        result.complexSections.forEach((section, idx) => {
             const leftCats = [
                 { title: "General", items: section.categories.generalSpecific },
                 { title: "Comportamiento", items: section.categories.behavior },
             ];
             const rightCats = [
                 { title: "Alt / Imágenes", items: section.categories.alt },
                 { title: "Agrupación", items: section.categories.grouped },
             ];

             const leftH = getCategoryHeight(leftCats, colWidth);
             const rightH = getCategoryHeight(rightCats, colWidth);
             const sectionContentHeight = Math.max(leftH, rightH);
             const headerHeight = 7;
             const totalSectionHeight = headerHeight + sectionContentHeight + 5;

             checkPageBreak(totalSectionHeight);

             doc.setFillColor(248, 250, 252);
             doc.roundedRect(margin, yPos - 3, pageWidth - (margin*2), 7, 1, 1, 'F');
             doc.setFontSize(9);
             doc.setFont("helvetica", "bold");
             doc.setTextColor(30, 41, 59);
             doc.text(`${idx + 1}. ${section.regionTitle}`, margin + 2, yPos + 1.5);
             yPos += 6;

             const startSecY = yPos;
             renderCategoryColumn(leftCats, margin, startSecY, colWidth);
             renderCategoryColumn(rightCats, margin + colWidth + 5, startSecY, colWidth);
             
             yPos += sectionContentHeight + 5;
        });
    }

    drawFooter();
    doc.save("AAAQuest-Audit-Report.pdf");
  };

  const renderContextValue = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === '') {
      return <span className={`italic ${isDark ? 'text-red-400/80' : 'text-red-500'}`}>{t.analysisIncorrect}</span>;
    }
    return <span className={`font-medium text-sm ${textMain}`}>{val}</span>;
  };

  // --- VIEW: UPLOAD ---
  if (viewState === 'UPLOAD') {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
        <div className="text-left md:text-center mb-10">
          <h2 className={`text-4xl font-bold mb-2 flex justify-start md:justify-center items-center gap-3 ${textMain}`}>
            <ScanEye className={`w-10 h-10 ${isDark ? 'text-green-500' : 'text-emerald-600'}`} aria-hidden="true" /> 
            <span className={`text-transparent bg-clip-text ${isDark ? 'bg-gradient-to-r from-green-400 to-emerald-600' : 'bg-gradient-to-r from-emerald-600 to-green-800'}`}>{t.checkerTitle}</span>
          </h2>
          <p className={`text-base md:text-lg font-light leading-relaxed max-w-2xl md:mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.checkerSubtitle}
          </p>
        </div>

        <div className={`${glassPanelClass} rounded-xl p-8`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. IMAGE PREVIEW (Mobile: Order 3, Desktop: Left Column) */}
            <div className={`order-3 lg:order-1 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-inner'} rounded-xl h-64 lg:h-auto min-h-[320px] flex items-center justify-center border overflow-hidden relative group`}>
              {image ? (
                <>
                  <img src={`data:image/png;base64,${image}`} alt="Preview" className="max-h-full max-w-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white font-medium mb-2">{t.preview}</p>
                  </div>
                </>
              ) : (
                <div className={`flex flex-col items-center ${textSub}`}>
                   <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                     <Image className="w-10 h-10 opacity-30" aria-hidden="true" />
                   </div>
                   <p className="text-sm">{t.imagePlaceholder}</p>
                </div>
              )}
            </div>

            {/* Right Column Wrapper */}
            <div className="contents lg:flex lg:flex-col lg:gap-6 lg:order-2">
                {/* 2. TITLE (Mobile: Order 1) */}
                <div className="order-1">
                   <div>
                      <h3 className={`text-2xl font-bold mb-2 ${textMain}`}>{t.uploadTitle}</h3>
                      <p className={`${textSub} leading-relaxed text-sm`}>{t.uploadDesc}</p>
                   </div>
                </div>

                {/* 3. INPUTS (Mobile: Order 2) */}
                <div className="order-2 space-y-6">
                   {isLocked ? (
                     <div className={`border rounded-xl p-8 text-center flex flex-col items-center justify-center gap-4 ${isDark ? 'border-red-500/30 bg-red-900/10' : 'border-red-200 bg-red-50'}`}>
                        <h3 className={`text-xl font-bold ${textMain}`}>{t.lockedTitle}</h3>
                        <div className={`text-sm leading-relaxed max-w-md ${textSub}`}>
                           <p className="mb-6">{t.lockedDesc}</p>
                           <ul className="space-y-3 font-medium flex flex-col items-center">
                              <li className="w-full">
                                  <a href="https://www.linkedin.com/in/victorsaizalfageme/" target="_blank" rel="noopener noreferrer" className={`hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all w-full max-w-xs mx-auto ${isDark ? 'bg-slate-800 border-slate-700 hover:border-white text-white' : 'bg-white border-slate-200 hover:border-black hover:text-black text-slate-700 shadow-sm'}`}>
                                     <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                                     <span>Linkedin Victor Saiz</span>
                                  </a>
                              </li>
                              <li className="w-full">
                                  <a href="mailto:victorsaizalfageme@gmail.com" className={`hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all w-full max-w-xs mx-auto ${isDark ? 'bg-slate-800 border-slate-700 hover:border-white text-white' : 'bg-white border-slate-200 hover:border-black hover:text-black text-slate-700 shadow-sm'}`}>
                                     <Mail className="w-4 h-4 text-red-500" />
                                     <span>victorsaizalfageme@gmail.com</span>
                                  </a>
                              </li>
                           </ul>
                        </div>
                        <p className={`text-xs font-bold tracking-wider mt-4 ${isDark ? 'text-white' : 'text-black'}`}>
                           {t.lockedThanks}
                        </p>
                     </div>
                   ) : (
                     <>
                       <div 
                          className={`border-2 rounded-xl p-8 text-center transition-all group ${
                            image ? 'border-green-500/50 bg-green-500/5 border-dashed' : isDark ? 'border-slate-700 hover:border-white hover:bg-slate-800/50 border-dashed' : 'border-slate-300 hover:border-black hover:bg-emerald-50/50 border-dashed'} cursor-pointer active:scale-[0.99]`}
                          role="button"
                          tabIndex={0}
                          onClick={() => fileInputRef.current?.click()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                          }}
                          aria-label={image ? `${t.imageLoaded}. ${t.clickToChange}` : t.uploadFile}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                          
                          {image ? (
                            <div className="text-green-500 flex flex-col items-center">
                              <CheckCircle className="w-10 h-10 mb-2" aria-hidden="true" />
                              <span className="font-bold">{t.imageLoaded}</span>
                              <span className="text-xs opacity-60">{t.clickToChange}</span>
                            </div>
                          ) : (
                            <div className={`${textSub} flex flex-col items-center ${isDark ? 'group-hover:text-white' : 'group-hover:text-emerald-700'} transition-colors`}>
                              <Upload className="w-10 h-10 mb-3 opacity-50 group-hover:scale-105 transition-transform" aria-hidden="true" />
                              <span className="font-medium">{t.uploadFile}</span>
                              <span className="text-xs mt-1 opacity-60">{t.formats}</span>
                            </div>
                          )}
                       </div>

                       <div className="space-y-2">
                         <label htmlFor="userContext" className={`block text-sm font-bold ${textSub}`}>
                           {t.contextOptional}
                         </label>
                         <textarea
                            id="userContext"
                            value={userContext}
                            onChange={(e) => setUserContext(e.target.value)}
                            placeholder={t.contextPlaceholder}
                            className={`w-full rounded-xl p-3 text-sm min-h-[80px] resize-none border transition-all ${inputBg}`}
                         />
                       </div>
                     </>
                   )}
                </div>

                {/* 4. CTA (Mobile: Order 4) */}
                <div className="order-4 space-y-2 mt-4">
                       {/* Attempts Indicator */}
                       <div className="text-center mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>
                             {attempts} {t.attemptsRemaining}
                          </span>
                       </div>

                       <button
                          onClick={handleAnalyze}
                          disabled={!image || isLocked}
                          className={`w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 border border-transparent active:scale-95 ${
                              isDark 
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:border-white/20' 
                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/30 hover:border-white/20'
                          }`}
                        >
                            <ScanEye className="w-6 h-6" aria-hidden="true" /> {t.analyzeBtn}
                        </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: ANALYZING ---
  if (viewState === 'ANALYZING') {
    return (
       <div className="flex items-center justify-center min-h-[80vh] w-full animate-fade-in" role="status" aria-live="polite">
          <Loader text={t.analyzing} theme={theme} />
       </div>
    );
  }

  // --- VIEW: RESULT ---
  if (viewState === 'RESULT' && result) {
    const isComplete = result.isValidUI;
    const device = result.screenContext?.device?.toLowerCase() || '';
    const isDesktopScreenshot = device.includes('desktop') || device.includes('monitor') || device.includes('laptop') || device.includes('web') || device.includes('mac') || device.includes('windows');

    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in pb-32">
        <div className="flex justify-between items-start mb-8">
           <div>
              <h2 className={`text-3xl font-bold mb-2 ${textMain}`}>{t.checkerTitle}</h2>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${isComplete ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                 {isComplete ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                 {isComplete ? t.analysisComplete : t.analysisIncomplete}
              </div>
           </div>
           
           <div className="flex gap-3">
              <button 
                onClick={handleReset}
                className={`flex items-center gap-2 px-5 py-2 border rounded-xl text-sm font-bold transition-all active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-white hover:bg-slate-100 border-slate-300 hover:border-black text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-slate-300/50'}`}
              >
                <RotateCcw className="w-4 h-4" /> {t.uploadAnother}
              </button>
              
              <button 
                onClick={handleExportPDF}
                className={`flex items-center gap-2 px-5 py-2 border border-transparent hover:border-white/20 rounded-xl text-sm font-bold text-white transition-all active:scale-95 ${
                    isDark
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/30'
                }`}
              >
                <Download className="w-4 h-4" /> Descargar PDF
              </button>
           </div>
        </div>

        {!result.isValidUI ? (
           <div className={`border rounded-xl p-10 text-center ${isDark ? 'bg-red-900/20 border-red-500/50' : 'bg-red-50 border-red-200'}`} role="alert">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className={`text-xl font-bold mb-2 ${textMain}`}>{t.invalidUI}</h3>
              <p className={`mb-6 max-w-lg mx-auto ${textSub}`}>{t.invalidUIMsg}</p>
              <button onClick={handleReset} className="text-red-500 hover:text-red-600 font-bold underline rounded px-2">{t.tryAgain}</button>
           </div>
        ) : (
          <div className={`grid gap-8 items-start ${isDesktopScreenshot ? 'grid-cols-1' : 'lg:grid-cols-12'}`}>
             
             {/* LEFT/TOP: Image with Interactive Overlay */}
             <div className={`${isDesktopScreenshot ? 'w-full' : 'lg:col-span-4'} space-y-6`}>
                <div className={`${glassPanelClass} p-0 sticky top-24 overflow-hidden`}>

                   {/* Hidden Screen Reader List for Navigation */}
                   {result.complexSections && result.complexSections.length > 0 && (
                       <div className="sr-only">
                           <h3>{t.sectionsComponents}</h3>
                           <ol>
                               {result.complexSections.map((section, idx) => (
                                   <li key={idx}>
                                       <button 
                                           onClick={() => handleZoneClick(idx)}
                                           aria-pressed={selectedSectionIndex === idx}
                                       >
                                           {section.regionTitle}
                                       </button>
                                   </li>
                               ))}
                           </ol>
                       </div>
                   )}
                   
                   <div className="relative w-full group select-none">
                      <img 
                        src={`data:image/png;base64,${image}`} 
                        alt="Analyzed UI" 
                        className="w-full h-auto block pointer-events-none"
                      />
                      
                      {/* Overlay Container: pointer-events-none to let clicks pass to image/bg if not on button, but buttons have pointer-events-auto */}
                      <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
                        {result.complexSections?.map((section, idx) => {
                            if (!section.box_2d) return null;
                            const [ymin, xmin, ymax, xmax] = section.box_2d;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleZoneClick(idx);
                                    }}
                                    onMouseEnter={() => setHoveredSectionIndex(idx)}
                                    onMouseLeave={() => setHoveredSectionIndex(null)}
                                    onFocus={() => setHoveredSectionIndex(idx)}
                                    onBlur={() => setHoveredSectionIndex(null)}
                                    tabIndex={-1}
                                    className={`absolute cursor-pointer transition-all duration-200 outline-none pointer-events-auto
                                        ${selectedSectionIndex === idx
                                            ? 'border-2 border-blue-400 bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] z-30' 
                                            : hoveredSectionIndex === idx
                                                ? `border-2 z-20 ${isDark ? 'border-white/50 bg-white/10' : 'border-blue-500/50 bg-blue-500/10'}` 
                                                : 'border border-transparent hover:border-white/30 z-10'
                                        }
                                    `}
                                    style={{
                                        top: `${ymin / 10}%`,
                                        left: `${xmin / 10}%`,
                                        width: `${(xmax - xmin) / 10}%`,
                                        height: `${(ymax - ymin) / 10}%`,
                                        backgroundColor: selectedSectionIndex === idx ? undefined : (hoveredSectionIndex === idx ? undefined : 'rgba(255, 255, 255, 0.01)') // Tiny alpha to ensure hit test works
                                    }}
                                >
                                    {(hoveredSectionIndex === idx || selectedSectionIndex === idx) && (
                                        <div className="absolute -top-8 left-0 bg-black/90 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap border border-white/20 z-40 pointer-events-none">
                                            {section.regionTitle}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                      </div>
                      
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-[10px] text-white/80 px-2 py-1 rounded-md pointer-events-none flex items-center gap-1 z-20" aria-hidden="true">
                         <MousePointerClick className="w-3 h-3" /> Click regions to filter
                      </div>
                   </div>

                   {userContext && (
                    <div className={`${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'} border-t p-4`}>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-2">
                        <MessageSquareText className="w-4 h-4" aria-hidden="true" />
                        <span>{t.contextOptional}</span>
                        </div>
                        <p className={`text-sm italic ${textSub}`}>"{userContext}"</p>
                    </div>
                   )}
                </div>
             </div>

             {/* RIGHT/BOTTOM: Hierarchical Audit Panel */}
             <div className={`${isDesktopScreenshot ? 'w-full' : 'lg:col-span-8'} space-y-6`}>
                
                {selectedSectionIndex === null && (
                    <DetectedScreenAccordion 
                      t={t} 
                      screenContext={result.screenContext} 
                      imageResolution={imageResolution} 
                      renderContextValue={renderContextValue} 
                      theme={theme}
                    />
                )}

                {selectedSectionIndex === null && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest pl-2">Accesibilidad global</h3>
                        
                        <GlobalAccordion 
                            title="TÍTULO DE VISTA (Title)" 
                            content={result.globalAnnotations?.viewTitle} 
                            icon={<AppWindow className="w-5 h-5 text-pink-500" aria-hidden="true" />} 
                            theme={theme}
                        />
                        <GlobalAccordion 
                            title="ESTRUCTURA (Landmarks)" 
                            content={result.globalAnnotations?.structure} 
                            icon={<Layers className="w-5 h-5 text-teal-500" aria-hidden="true" />} 
                            theme={theme}
                        />
                        <GlobalAccordion 
                            title="ENCABEZADO (Headings)" 
                            content={result.globalAnnotations?.heading} 
                            icon={<Type className="w-5 h-5 text-indigo-500" aria-hidden="true" />} 
                            theme={theme}
                        />
                        <GlobalAccordion 
                            title="ORDEN DE FOCO" 
                            content={result.globalAnnotations?.focusOrder} 
                            icon={<ListOrdered className="w-5 h-5 text-yellow-500" aria-hidden="true" />} 
                            theme={theme}
                        />
                    </div>
                )}

                <div className="space-y-4">
                   <div className="flex justify-between items-center pl-2 mt-8 mb-2">
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                            {selectedSectionIndex !== null 
                                ? result.complexSections[selectedSectionIndex].regionTitle 
                                : (t.sectionsComponents || "Sections/Components")
                            }
                        </h3>
                        {selectedSectionIndex !== null && (
                            <button 
                                onClick={() => setSelectedSectionIndex(null)}
                                className="text-xs text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 font-bold focus:outline-none focus:underline"
                            >
                                <ArrowLeft className="w-3 h-3" /> Ver todos
                            </button>
                        )}
                   </div>
                   
                   {result.complexSections?.map((section, idx) => {
                     if (selectedSectionIndex !== null && selectedSectionIndex !== idx) return null;

                     return (
                        <SectionAccordion 
                            key={idx} 
                            title={section.regionTitle} 
                            isSelected={selectedSectionIndex === idx}
                            theme={theme}
                        >
                            <div className="py-2">
                            <CategoryAccordion title="Accesibilidad específica" content={section.categories.generalSpecific} theme={theme} />
                            <CategoryAccordion title="COMPORTAMIENTO" content={section.categories.behavior} theme={theme} />
                            <CategoryAccordion title="ALT" content={section.categories.alt} theme={theme} />
                            <CategoryAccordion title="ELEMENTOS AGRUPADOS" content={section.categories.grouped} theme={theme} />
                            </div>
                        </SectionAccordion>
                     );
                   })}

                   {result.complexSections?.length === 0 && (
                       <p className={`italic text-sm pl-2 ${textSub}`}>No specific sections detected.</p>
                   )}
                </div>

             </div>
          </div>
        )}
      </div>
    );
  };
}
