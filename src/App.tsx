import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ContractReview } from './components/ContractReview';
import { DocumentGenerator } from './components/DocumentGenerator';
import { RiskAnalysis } from './components/RiskAnalysis';
import { ComplianceAudit } from './components/ComplianceAudit';
import { GenericAnalysis } from './components/GenericAnalysis';
import { ProjectLanguage } from './lib/gemini';
import { Search } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('review');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<ProjectLanguage>('es');

  const renderContent = () => {
    switch (activeTab) {
      case 'review':
        return <ContractReview language={language} />;
      case 'generate':
        return <DocumentGenerator language={language} />;
      case 'risks':
        return <RiskAnalysis language={language} />;
      case 'compliance':
        return <ComplianceAudit language={language} />;
      case 'plain':
        return (
          <GenericAnalysis 
            agentType="plain_english" 
            title={language === 'es' ? "TRADUCCIÓN A LENGUAJE CLARO" : "PLAIN ENGLISH TRANSLATION"}
            description={language === 'es' ? "Simplifica el lenguaje legal complejo para una mejor comprensión." : "Simplifies complex legal language for better understanding."}
            language={language}
          />
        );
      case 'negotiate':
        return (
          <GenericAnalysis 
            agentType="negotiator" 
            title={language === 'es' ? "GENERADOR DE CONTRAPROPUESTAS" : "COUNTER-PROPOSAL GENERATOR"}
            description={language === 'es' ? "Genera alternativas legales para negociar mejores términos." : "Generates legal alternatives to negotiate better terms."}
            language={language}
          />
        );
      case 'missing':
        return (
          <GenericAnalysis 
            agentType="missing_protections" 
            title={language === 'es' ? "PROTECCIONES FALTANTES" : "MISSING PROTECTIONS"}
            description={language === 'es' ? "Identifica lo que falta en el contrato para proteger sus intereses." : "Identifies what is missing from the contract to protect your interests."}
            language={language}
          />
        );
      case 'freelancer':
        return (
          <GenericAnalysis 
            agentType="freelancer_review" 
            title={language === 'es' ? "REVISIÓN PARA FREELANCERS" : "FREELANCER REVIEW"}
            description={language === 'es' ? "Análisis especializado desde la perspectiva de un profesional independiente." : "Specialized analysis from the perspective of an independent professional."}
            language={language}
          />
        );
      case 'compare':
        return (
          <GenericAnalysis 
            agentType="comparer" 
            title={language === 'es' ? "COMPARADOR DE CONTRATOS" : "CONTRACT COMPARER"}
            description={language === 'es' ? "Compara dos versiones o documentos para identificar cambios clave." : "Compares two versions or documents to identify key changes."}
            language={language}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Coming Soon</h3>
              <p className="text-slate-500">This feature is currently under professional development.</p>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'review': return language === 'es' ? 'AUDITORÍA LEGAL' : 'LEGAL AUDIT';
      case 'generate': return language === 'es' ? 'GENERADOR' : 'GENERATOR';
      case 'risks': return language === 'es' ? 'RIESGOS' : 'RISKS';
      case 'compliance': return language === 'es' ? 'CUMPLIMIENTO' : 'COMPLIANCE';
      default: return language === 'es' ? 'SISTEMA IA' : 'AI SYSTEM';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        language={language}
        setLanguage={setLanguage}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-24 bg-white border-b-[3px] border-black px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <button 
              className="lg:hidden p-3 bg-black text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Search className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">
                Workspace / {activeTab.toUpperCase()}
              </span>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black leading-none">
                {getTitle()}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 border-[3px] border-black">
              <div className="w-3 h-3 bg-brand-yellow brutalist-border animate-pulse" />
              <span className="text-xs font-black uppercase tracking-tight">System: Nominal</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#FAFAFA] custom-scrollbar">
          <div className="max-w-6xl mx-auto mb-20">
            {renderContent()}
          </div>
          
          <footer className="bg-black text-white p-8 border-t-[3px] border-black">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                © 2026 JURION // DESARROLLADO POR MIRAI HATTEN LLC.
              </p>
              <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest opacity-60">
                <span>Status: Nominal</span>
                <span>Encrypt: AES-256</span>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
