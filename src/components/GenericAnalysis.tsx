import React, { useState } from 'react';
import { Play, Loader2, FileText, CheckCircle, Download, Languages } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { extractTextFromPDF } from '@/lib/pdf';
import { analyzeLegalDocument, LegalAgentType, ProjectLanguage } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';

interface GenericAnalysisProps {
  agentType: LegalAgentType;
  title: string;
  description: string;
  language: ProjectLanguage;
}

export function GenericAnalysis({ agentType, title, description, language }: GenericAnalysisProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }
      const response = await analyzeLegalDocument(text, [agentType], language);
      setResult(response[0].text);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    let y = 20;
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 20, 25);
    
    y = 60;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(language === 'es' ? "Reporte Detallado" : "Detailed Report", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`${language === 'es' ? 'Archivo' : 'File'}: ${file?.name}`, 20, y);
    y += 15;

    const rawLines = result.split('\n');
    rawLines.forEach((line) => {
      let isHeader = false;
      let headerLevel = 0;
      let cleanLine = line.replace(/\[ALTO RIESGO\]|\[RIESGO MEDIO\]|\[BAJO RIESGO\]/g, '').trim();

      if (cleanLine.startsWith('# ')) { isHeader = true; headerLevel = 1; cleanLine = cleanLine.substring(2); }
      else if (cleanLine.startsWith('## ')) { isHeader = true; headerLevel = 2; cleanLine = cleanLine.substring(3); }
      else if (cleanLine.startsWith('### ')) { isHeader = true; headerLevel = 3; cleanLine = cleanLine.substring(4); }
      
      if (!cleanLine) return;

      if (isHeader) {
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(headerLevel === 1 ? 16 : headerLevel === 2 ? 14 : 12);
        doc.setTextColor(0, 0, 0);
      } else {
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      }

      if (cleanLine.includes('**')) {
        doc.setFont("helvetica", "bold");
        cleanLine = cleanLine.replace(/\*\*/g, '');
      }

      const splitLines = doc.splitTextToSize(cleanLine, isHeader ? 170 : 165);
      splitLines.forEach((sl: string) => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(sl, isHeader ? 20 : 25, y);
        y += isHeader ? 8 : 6;
      });
      y += 2;
    });

    doc.save(`${agentType}-${new Date().getTime()}.pdf`);
  };

  const t = {
    es: {
      upload: "Subir Documento",
      select: "SELECCIONAR ARCHIVO",
      start: "INICIAR ANÁLISIS",
      processing: "PROCESANDO...",
      report: "REPORTE",
      download: "PDF",
      risk_high: "ALTO RIESGO",
      risk_med: "RIESGO MEDIO",
      risk_low: "BAJO RIESGO"
    },
    en: {
      upload: "Upload Document",
      select: "SELECT FILE",
      start: "START ANALYSIS",
      processing: "PROCESSING...",
      report: "REPORT",
      download: "PDF",
      risk_high: "HIGH RISK",
      risk_med: "MEDIUM RISK",
      risk_low: "LOW RISK"
    }
  }[language];

  return (
    <div className="space-y-12">
      <section className="legal-card p-10 space-y-8 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white flex items-center justify-center brutalist-border">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">{title}</h2>
            <p className="text-black/60 font-medium">{description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative group">
            <input type="file" accept=".pdf,.txt" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className={cn("p-8 border-[3px] border-dashed transition-all text-sm font-black uppercase text-center", file ? "border-brand-yellow bg-brand-yellow/5" : "border-black hover:bg-slate-50")}>
              {file ? file.name : t.select}
            </div>
          </div>
          <button onClick={startAnalysis} disabled={!file || isProcessing} className="brutalist-button h-full flex items-center justify-center gap-3">
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Play className="w-6 h-6 fill-current" /> <span className="text-xl">{t.start}</span></>}
          </button>
        </div>
      </section>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center bg-black text-white px-8 py-4">
              <span className="font-black uppercase tracking-widest text-sm">{t.report}</span>
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-brand-yellow text-black px-4 py-1 text-xs font-black brutalist-border hover:bg-white transition-colors"
              >
                <Download className="w-3 h-3" />
                {t.download}
              </button>
            </div>

            <div className="legal-card p-10 bg-white markdown-body">
              <ReactMarkdown
                components={{
                  p: ({ children }) => {
                   const content = React.Children.toArray(children).join('');
                          if (content.includes('[ALTO RIESGO]')) return <p className="mb-4 font-medium"><span className="risk-tag risk-high">{t.risk_high}</span>{content.replace('[ALTO RIESGO]', '')}</p>;
                          if (content.includes('[RIESGO MEDIO]')) return <p className="mb-4 font-medium"><span className="risk-tag risk-medium">{t.risk_med}</span>{content.replace('[RIESGO MEDIO]', '')}</p>;
                          if (content.includes('[BAJO RIESGO]')) return <p className="mb-4 font-medium"><span className="risk-tag risk-low">{t.risk_low}</span>{content.replace('[BAJO RIESGO]', '')}</p>;
                          return <p className="mb-4 font-medium">{children}</p>;
                  },
                  li: ({ children }) => {
                     const content = React.Children.toArray(children).join('');
                          if (content.includes('[ALTO RIESGO]')) return <li className="pl-1 border-b border-black/10 py-1"><span className="risk-tag risk-high scale-75 origin-left">{t.risk_high}</span>{content.replace('[ALTO RIESGO]', '')}</li>;
                          if (content.includes('[RIESGO MEDIO]')) return <li className="pl-1 border-b border-black/10 py-1"><span className="risk-tag risk-medium scale-75 origin-left">{t.risk_med}</span>{content.replace('[RIESGO MEDIO]', '')}</li>;
                          if (content.includes('[BAJO RIESGO]')) return <li className="pl-1 border-b border-black/10 py-1"><span className="risk-tag risk-low scale-75 origin-left">{t.risk_low}</span>{content.replace('[BAJO RIESGO]', '')}</li>;
                          return <li className="pl-1 border-b border-black/10 py-1">{children}</li>;
                  }
                }}
              >
                {result}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
