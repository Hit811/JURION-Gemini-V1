import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, Loader2, Play, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { extractTextFromPDF } from '@/lib/pdf';
import { analyzeLegalDocument, LegalAgentType, ProjectLanguage } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';

interface ContractReviewProps {
  language: ProjectLanguage;
}

export function ContractReview({ language }: ContractReviewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ step: string; percent: number }>({ step: '', percent: 0 });
  const [results, setResults] = useState<{ type: LegalAgentType; text: string }[]>([]);

  const t = {
    es: {
      step1: "01",
      step2: "02",
      step3: "03",
      title1: "Subir Contrato",
      desc1: "Cargue su documento legal para una auditoría instantánea mediante agentes de IA paralelos coordinados.",
      select: "SELECCIONAR ARCHIVO O ARRASTRAR AQUÍ",
      start: "INICIAR",
      analyzing: "Analizando...",
      status: "Status: Procesando",
      agent: "Agente",
      report: "REPORTE COMPLETO",
      download: "Bajar PDF",
      verified: "Verificado",
      activeAgents: "5 Agentes Paralelos Activos",
      legend: "Leyenda de Evaluación",
      riskHigh: "ALTO RIESGO / NON-COMPLIANT",
      riskMid: "RIESGO MEDIO / GAP DETECTADO",
      riskLow: "BAJO RIESGO / COMPLIANT",
      extracting: "Extrayendo texto del documento...",
      initializing: "Inicializando agentes de IA paralelos...",
      complete: "¡Análisis completo!"
    },
    en: {
      step1: "01",
      step2: "02",
      step3: "03",
      title1: "Upload Contract",
      desc1: "Upload your legal document for an instant audit via coordinated parallel AI agents.",
      select: "SELECT FILE OR DRAG HERE",
      start: "START",
      analyzing: "Analyzing...",
      status: "Status: Processing",
      agent: "Agent",
      report: "FULL REPORT",
      download: "Download PDF",
      verified: "Verified",
      activeAgents: "5 Parallel Agents Active",
      legend: "Evaluation Legend",
      riskHigh: "HIGH RISK / NON-COMPLIANT",
      riskMid: "MEDIUM RISK / GAP DETECTED",
      riskLow: "LOW RISK / COMPLIANT",
      extracting: "Extracting text from document...",
      initializing: "Initializing parallel AI agents...",
      complete: "Analysis complete!"
    }
  }[language];

  // ... (rest of the file handles results rendering and PDF generation using language)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults([]);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    
    // Calculate risk counts
    const counts = {
      high: 0,
      medium: 0,
      low: 0
    };

    results.forEach(r => {
      counts.high += (r.text.match(/\[ALTO RIESGO\]/g) || []).length;
      counts.medium += (r.text.match(/\[RIESGO MEDIO\]/g) || []).length;
      counts.low += (r.text.match(/\[BAJO RIESGO\]/g) || []).length;
    });

    // Dark Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("AUDITORÍA LEGAL IA", 20, 25);
    
    doc.setTextColor(255, 215, 0); // Gold
    doc.setFontSize(10);
    doc.text("REPORTE PROFESIONAL COORDINADO // SISTEMA DE ANÁLISIS CRÍTICO", 20, 32);
    doc.text(`DOCUMENTO: ${file?.name?.toUpperCase() || 'N/A'}`, 20, 37);

    y = 60;
    
    // Executive Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("Resumen Ejecutivo de Riesgos", 20, y);
    y += 12;

    // Financial visualization boxes
    const drawScoreBox = (label: string, count: number, bgColor: [number, number, number], xPos: number) => {
      doc.setFillColor(...bgColor);
      doc.rect(xPos, y, 50, 25, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.rect(xPos, y, 50, 25, 'S');
      
      const isDark = bgColor[0] < 200;
      doc.setTextColor(isDark ? 255 : 0, isDark ? 255 : 0, isDark ? 255 : 0);
      doc.setFontSize(8);
      doc.text(label, xPos + 5, y + 8);
      doc.setFontSize(16);
      doc.text(count.toString(), xPos + 5, y + 18);
    };

    drawScoreBox("ALTO RIESGO / CRÍTICO", counts.high, [231, 76, 60], 20);
    drawScoreBox("RIESGO MEDIO / CAUTELA", counts.medium, [241, 196, 15], 80);
    drawScoreBox("BAJO RIESGO / ESTÁNDAR", counts.low, [39, 174, 96], 140);
    
    y += 40;

    // Metadata
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DEL PROCESAMIENTO:", 20, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, y);
    y += 5;
    doc.text(`Validación: 5 Agentes de IA Paralelos en Gemini 1.5 Flash`, 20, y);
    y += 15;

    results.forEach((result) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Section Header
      doc.setFillColor(0, 0, 0); // Solid black header for section
      doc.rect(20, y, 170, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      const label = agentLabels[result.type].toUpperCase();
      doc.text(label, 25, y + 8);
      y += 20;
      
      const rawLines = result.text.split('\n');
      
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
          y += 5;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(headerLevel === 1 ? 16 : headerLevel === 2 ? 14 : 12);
          doc.setTextColor(0, 0, 0);
        } else if (hasTag) {
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

        // Handle bolding within the line (simplified for PDF)
        // We'll treat the whole line as bold if it contains **
        if (cleanLine.includes('**')) {
          doc.setFont("helvetica", "bold");
          cleanLine = cleanLine.replace(/\*\*/g, '');
        }

        const splitLines = doc.splitTextToSize(cleanLine, isHeader ? 160 : 155);
        
        splitLines.forEach((sl: string) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(sl, isHeader ? 20 : 25, y);
          y += isHeader ? 8 : 6;
        });

        y += (isHeader ? 4 : 2);
      });
      y += 15;
    });

    // Page numbers and footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(20, 285, 190, 285);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(`Auditoría Legal v4.0 // Página ${i} de ${pageCount} // Propia Solución Professional`, 105, 290, { align: 'center' });
    }

    doc.save(`auditoria-legal-reporte-${new Date().getTime()}.pdf`);
  };

  const startAnalysis = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setResults([]);
    
    try {
      setProgress({ step: 'Extracting text from document...', percent: 20 });
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }

      const agents: LegalAgentType[] = [
        'clause_analyst',
        'risk_assessor',
        'compliance_checker',
        'terms_mapper',
        'recommendations_engine'
      ];

      setProgress({ step: 'Initializing parallel AI agents...', percent: 40 });
      
      const interval = setInterval(() => {
        setProgress(prev => ({ ...prev, percent: Math.min(prev.percent + 5, 95) }));
      }, 500);

      const agentResults = await analyzeLegalDocument(text, agents);
      
      clearInterval(interval);
      setProgress({ step: 'Analysis complete!', percent: 100 });
      setResults(agentResults);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze document. Please ensure your Gemini API key is valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const agentLabels: Record<LegalAgentType, string> = {
    clause_analyst: language === 'es' ? 'Análisis de Cláusulas' : 'Clause Analysis',
    risk_assessor: language === 'es' ? 'Evaluación de Riesgos' : 'Risk Assessment',
    compliance_checker: language === 'es' ? 'Auditoría de Cumplimiento' : 'Compliance Audit',
    terms_mapper: language === 'es' ? 'Términos y Obligaciones' : 'Terms & Obligations',
    recommendations_engine: language === 'es' ? 'Estrategia de Negociación' : 'Negotiation Strategy',
    plain_english: language === 'es' ? 'Lenguaje Claro' : 'Plain English',
    negotiator: language === 'es' ? 'Contrapropuesta' : 'Counter-proposal',
    missing_protections: language === 'es' ? 'Protecciones Faltantes' : 'Missing Protections',
    freelancer_review: language === 'es' ? 'Revisión Freelancer' : 'Freelancer Review',
    comparer: language === 'es' ? 'Comparador' : 'Comparer'
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Upload Section */}
      <section className="legal-card p-10 flex flex-col md:flex-row items-center gap-10 bg-white">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-6xl font-black text-black">{t.step1}</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter">{t.title1}</h2>
          </div>
          <p className="text-lg font-medium leading-tight text-black/60">
            {t.desc1}
          </p>
          
          <div className="relative group">
            <input 
              type="file" 
              accept=".pdf,.txt" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={cn(
              "p-6 border-[3px] border-dashed transition-all text-sm font-black uppercase tracking-widest text-center",
              file ? "border-brand-yellow bg-brand-yellow/10 text-black" : "border-black group-hover:bg-slate-50 text-black/40"
            )}>
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-5 h-5" />
                  {file.name}
                  <CheckCircle className="w-5 h-5 text-black" />
                </div>
              ) : (
                t.select
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-64">
          <button
            onClick={startAnalysis}
            disabled={!file || isProcessing}
            className="brutalist-button w-full flex items-center justify-center gap-3 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" />
                <span className="text-xl">{t.start}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Progress & Results */}
      <AnimatePresence mode="wait">
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="legal-card p-10 space-y-10 bg-black text-white"
          >
            <div className="flex items-center gap-4">
              <span className="text-6xl font-black text-brand-yellow">{t.step2}</span>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-brand-yellow mb-1">{t.status}</span>
                <h3 className="text-3xl font-black uppercase tracking-tighter">{progress.step}</h3>
              </div>
            </div>
            
            <div className="w-full h-8 bg-white/20 brutalist-border relative overflow-hidden">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percent}%` }}
                  className="h-full bg-brand-yellow border-r-[3px] border-black"
                />
            </div>

            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-2 w-full bg-white/10 overflow-hidden">
                    <motion.div 
                      animate={{ 
                        opacity: [0.3, 1, 0.3],
                        backgroundColor: progress.percent > (i * 20) ? '#FFD700' : '#333'
                      }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                      className="h-full w-full"
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.agent} {i}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {results.length > 0 && !isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            <div className="flex items-end justify-between border-b-[3px] border-black pb-4">
              <div className="flex items-center gap-4">
                <span className="text-8xl font-black leading-none">{t.step3}</span>
                <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">{t.report.split(' ')[0]}<br/>{t.report.split(' ').slice(1).join(' ')}</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={downloadPDF}
                  className="px-6 py-2 bg-brand-yellow text-black font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-colors brutalist-border flex items-center gap-2 mb-2"
                >
                  <Download className="w-4 h-4" />
                  {t.download}
                </button>
                <div className="flex flex-col items-end">
                  <span className="px-4 py-1 bg-black text-white text-xs font-black uppercase tracking-widest">{t.verified}</span>
                  <span className="text-[10px] font-black uppercase opacity-40">{t.activeAgents}</span>
                </div>
              </div>
            </div>

            {/* Legend Section */}
            <div className="legal-card p-6 bg-white space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 border-b border-black/10 pb-2">{t.legend}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 bg-[#e74c3c] brutalist-border shrink-0 mt-1" />
                  <div>
                    <p className="text-xs font-black uppercase">{t.riskHigh}</p>
                    <p className="text-[10px] font-medium leading-tight opacity-70">
                      {language === 'es' ? 'Identifica cláusulas peligrosas, exposición financiera crítica o incumplimientos legales graves.' : 'Identifies dangerous clauses, critical financial exposure, or serious legal non-compliance.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 bg-[#f1c40f] brutalist-border shrink-0 mt-1" />
                  <div>
                    <p className="text-xs font-black uppercase">{t.riskMid}</p>
                    <p className="text-[10px] font-medium leading-tight opacity-70">
                      {language === 'es' ? 'Indica puntos que requieren negociación, cautela o donde existen lagunas menores.' : 'Indicates points requiring negotiation, caution, or where minor gaps exist.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 bg-[#27ae60] brutalist-border shrink-0 mt-1" />
                  <div>
                    <p className="text-xs font-black uppercase">{t.riskLow}</p>
                    <p className="text-[10px] font-medium leading-tight opacity-70">
                      {language === 'es' ? 'Confirma cláusulas estándar, seguras o cumplimiento total con normativas.' : 'Confirms standard, secure clauses or full compliance with regulations.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {results.map((result, idx) => (
                <motion.div 
                  key={result.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="legal-card"
                >
                  <div className="bg-black text-white px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black text-brand-yellow">/ 0{idx + 1}</span>
                      <h3 className="text-xl font-black uppercase tracking-widest">{agentLabels[result.type]}</h3>
                    </div>
                    <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-none uppercase text-white/50 tracking-widest">Agent System v2</span>
                  </div>
                  <div className="p-10 markdown-body">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => {
                          const content = React.Children.toArray(children).join('');
                          if (content.includes('[ALTO RIESGO]')) {
                            return <p className="mb-4 font-medium"><span className="risk-tag risk-high">ALTO RIESGO</span>{content.replace('[ALTO RIESGO]', '')}</p>;
                          }
                          if (content.includes('[RIESGO MEDIO]')) {
                            return <p className="mb-4 font-medium"><span className="risk-tag risk-medium">RIESGO MEDIO</span>{content.replace('[RIESGO MEDIO]', '')}</p>;
                          }
                          if (content.includes('[BAJO RIESGO]')) {
                            return <p className="mb-4 font-medium"><span className="risk-tag risk-low">BAJO RIESGO</span>{content.replace('[BAJO RIESGO]', '')}</p>;
                          }
                          return <p className="mb-4 font-medium">{children}</p>;
                        },
                        li: ({ children }) => {
                          const content = React.Children.toArray(children).join('');
                          if (content.includes('[ALTO RIESGO]')) {
                            return <li className="pl-1 border-b border-black/10 py-1"><span className="risk-tag risk-high scale-75 origin-left">ALTO RIESGO</span>{content.replace('[ALTO RIESGO]', '')}</li>;
                          }
                          if (content.includes('[RIESGO MEDIO]')) {
                            return <li className="pl-1 border-b border-black/10 py-1"><span className="risk-tag risk-medium scale-75 origin-left">RIESGO MEDIO</span>{content.replace('[RIESGO MEDIO]', '')}</li>;
                          }
                          if (content.includes('[BAJO RIESGO]')) {
                            return <li className="pl-1 border-b border-black/10 py-1"><span className="risk-tag risk-low scale-75 origin-left">BAJO RIESGO</span>{content.replace('[BAJO RIESGO]', '')}</li>;
                          }
                          return <li className="pl-1 border-b border-black/10 py-1">{children}</li>;
                        }
                      }}
                    >
                      {result.text}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
