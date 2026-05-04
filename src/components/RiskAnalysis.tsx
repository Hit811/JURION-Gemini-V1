import React, { useState } from 'react';
import { Search, AlertCircle, Loader2, Play, FileText, CheckCircle, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { extractTextFromPDF } from '@/lib/pdf';
import { analyzeLegalDocument, ProjectLanguage } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';

export function RiskAnalysis({ language }: { language: ProjectLanguage }) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');

  const t = {
    es: {
      title: "Evaluación de Riesgos",
      select: "Carga archivo para identificar riesgos críticos",
      start: "ANALIZAR RIESGOS",
      matrix: "Matriz de Riesgo Detectado",
      high: "ALTO RIESGO",
      mid: "RIESGO MEDIO",
      low: "BAJO RIESGO",
      report: "EVALUACIÓN DE RIESGOS AI",
      findings: "Resumen de Hallazgos"
    },
    en: {
      title: "Risk Assessment",
      select: "Upload file to identify critical risks",
      start: "ANALYZE RISKS",
      matrix: "Risk Matrix Detected",
      high: "HIGH RISK",
      mid: "MEDIUM RISK",
      low: "LOW RISK",
      report: "AI RISK ASSESSMENT",
      findings: "Findings Summary"
    }
  }[language];

  const handleAnalysis = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const text = file.type === 'application/pdf' ? await extractTextFromPDF(file) : await file.text();
      const analysis = await analyzeLegalDocument(text, ['risk_assessor'], language);
      setResult(analysis[0].text);
    } catch (error) {
      console.error(error);
      alert('Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    
    const high = (result.match(/\[ALTO RIESGO\]/g) || []).length;
    const medium = (result.match(/\[RIESGO MEDIO\]/g) || []).length;
    const low = (result.match(/\[BAJO RIESGO\]/g) || []).length;

    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("EVALUACIÓN DE RIESGOS AI", 20, 25);
    
    y = 55;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Resumen de Hallazgos", 20, y);
    y += 10;

    const drawBox = (label: string, count: number, color: [number, number, number], x: number) => {
      doc.setFillColor(...color);
      doc.rect(x, y, 50, 20, 'F');
      doc.setTextColor(255);
      doc.setFontSize(8);
      doc.text(label, x + 5, y + 8);
      doc.setFontSize(12);
      doc.text(count.toString(), x + 5, y + 15);
    };

    drawBox("ALTO RIESGO", high, [231, 76, 60], 20);
    drawBox("RIESGO MEDIO", medium, [241, 196, 15], 80);
    drawBox("BAJO RIESGO", low, [39, 174, 96], 140);
    
    y += 35;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Archivo: ${file?.name}`, 20, y);
    y += 15;

    const rawLines = result.split('\n');
    
    rawLines.forEach((line) => {
      let riskColor: [number, number, number] = [0, 0, 0];
      let hasTag = false;
      let isHeader = false;
      let headerLevel = 0;
      
      // Handle Risk Tags
      if (line.includes('[ALTO RIESGO]')) { riskColor = [231, 76, 60]; hasTag = true; }
      else if (line.includes('[RIESGO MEDIO]')) { riskColor = [241, 196, 15]; hasTag = true; }
      else if (line.includes('[BAJO RIESGO]')) { riskColor = [39, 174, 96]; hasTag = true; }

      let cleanLine = line.replace(/\[ALTO RIESGO\]|\[RIESGO MEDIO\]|\[BAJO RIESGO\]/g, '').trim();

      // Handle Headers
      if (cleanLine.startsWith('# ')) { isHeader = true; headerLevel = 1; cleanLine = cleanLine.substring(2); }
      else if (cleanLine.startsWith('## ')) { isHeader = true; headerLevel = 2; cleanLine = cleanLine.substring(3); }
      else if (cleanLine.startsWith('### ')) { isHeader = true; headerLevel = 3; cleanLine = cleanLine.substring(4); }
      
      if (!cleanLine && !hasTag) return;

      // Visual layout decisions
      if (isHeader) {
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(headerLevel === 1 ? 16 : headerLevel === 2 ? 14 : 12);
        doc.setTextColor(0, 0, 0);
      } else if (hasTag) {
        y += 2;
        doc.setFillColor(...riskColor);
        doc.rect(20, y - 5, 2, 6, 'F');
        doc.setTextColor(...riskColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
      } else {
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      }

      const splitLines = doc.splitTextToSize(cleanLine, isHeader ? 170 : 165);
      
      splitLines.forEach((sl: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(sl, isHeader ? 20 : 25, y);
        y += isHeader ? 8 : 6;
      });

      y += 2;
    });

    doc.save(`riesgos-${new Date().getTime()}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section className="legal-card p-10 space-y-8 bg-white">
        <div className="flex items-center gap-4">
          <span className="text-6xl font-black text-black">!</span>
          <h2 className="text-4xl font-black uppercase tracking-tighter">{t.title}</h2>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="relative group">
            <input type="file" onChange={(e) => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className={cn("p-6 border-[3px] border-dashed text-sm font-black uppercase tracking-widest text-center", file ? "border-brand-yellow bg-brand-yellow/5" : "border-black/10")}>
              {file ? file.name : t.select}
            </div>
          </div>
          <button onClick={handleAnalysis} disabled={!file || isProcessing} className="brutalist-button w-full">
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t.start}
          </button>
        </div>
      </section>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center bg-black text-white px-8 py-4">
              <span className="font-black uppercase tracking-widest text-sm">{t.matrix}</span>
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-brand-yellow text-black px-4 py-1 text-xs font-black brutalist-border hover:bg-white transition-colors"
              >
                <Download className="w-3 h-3" />
                PDF
              </button>
            </div>

            {/* Legend Section */}
            <div className="legal-card p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-[#e74c3c] mt-1 brutalist-border" />
                <p className="text-[10px] uppercase font-black">{t.high}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-[#f1c40f] mt-1 brutalist-border" />
                <p className="text-[10px] uppercase font-black">{t.mid}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-[#27ae60] mt-1 brutalist-border" />
                <p className="text-[10px] uppercase font-black">{t.low}</p>
              </div>
            </div>

            <div className="legal-card p-10 bg-white markdown-body">
              <ReactMarkdown
                components={{
                  p: ({ children }) => {
                    const content = React.Children.toArray(children).join('');
                    if (content.includes('[ALTO RIESGO]')) return <p className="mb-4 font-medium"><span className="risk-tag risk-high">{t.high}</span>{content.replace('[ALTO RIESGO]', '')}</p>;
                    if (content.includes('[RIESGO MEDIO]')) return <p className="mb-4 font-medium"><span className="risk-tag risk-medium">{t.mid}</span>{content.replace('[RIESGO MEDIO]', '')}</p>;
                    if (content.includes('[BAJO RIESGO]')) return <p className="mb-4 font-medium"><span className="risk-tag risk-low">{t.low}</span>{content.replace('[BAJO RIESGO]', '')}</p>;
                    return <p className="mb-4 font-medium">{children}</p>;
                  },
                  li: ({ children }) => {
                    const content = React.Children.toArray(children).join('');
                    if (content.includes('[ALTO RIESGO]')) return <li className="pl-1 border-b border-black/10 py-1"><span className="risk-tag risk-high scale-75 origin-left">{t.high}</span>{content.replace('[ALTO RIESGO]', '')}</li>;
                    if (content.includes('[RIESGO MEDIO]')) return <li className="pl-1 border-b border-black/10 py-1"><span className="risk-tag risk-medium scale-75 origin-left">{t.mid}</span>{content.replace('[RIESGO MEDIO]', '')}</li>;
                    if (content.includes('[BAJO RIESGO]')) return <li className="pl-1 border-b border-black/10 py-1"><span className="risk-tag risk-low scale-75 origin-left">{t.low}</span>{content.replace('[BAJO RIESGO]', '')}</li>;
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
