import React from 'react';
import { 
  FileText, 
  Scale, 
  ShieldAlert, 
  PlusSquare, 
  Globe, 
  X, 
  MessageSquare, 
  Diff, 
  Zap, 
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  FileSignature
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectLanguage } from '@/lib/gemini';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  language: ProjectLanguage;
  setLanguage: (lang: ProjectLanguage) => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, language, setLanguage }: SidebarProps) {
  const menuItems = [
    { id: 'review', label: language === 'es' ? 'Auditoría Contractual' : 'Contract Audit', icon: ShieldCheck, category: 'analysis' },
    { id: 'risks', label: language === 'es' ? 'Análisis de Riesgos' : 'Risk Analysis', icon: ShieldAlert, category: 'analysis' },
    { id: 'compliance', label: language === 'es' ? 'Cumplimiento Legal' : 'Compliance Audit', icon: Scale, category: 'analysis' },
    { id: 'plain', label: language === 'es' ? 'Traducción Simple' : 'Plain Translation', icon: Zap, category: 'analysis' },
    { id: 'missing', label: language === 'es' ? 'Protecciones Faltantes' : 'Missing Protections', icon: AlertTriangle, category: 'analysis' },
    { id: 'freelancer', label: language === 'es' ? 'Revisión Freelancer' : 'Freelancer Review', icon: UserCheck, category: 'analysis' },
    
    { id: 'generate', label: language === 'es' ? 'Generador Documentos' : 'Doc Generator', icon: FileSignature, category: 'creation' },
    { id: 'negotiate', label: language === 'es' ? 'Generador de Contrapropuestas' : 'Counter-Proposal', icon: MessageSquare, category: 'creation' },
    
    { id: 'compare', label: language === 'es' ? 'Comparar Contratos' : 'Compare Contracts', icon: Diff, category: 'utility' }
  ];

  const categories = {
    analysis: language === 'es' ? 'ANÁLISIS' : 'ANALYSIS',
    creation: language === 'es' ? 'CREACIÓN' : 'CREATION',
    utility: language === 'es' ? 'UTILIDADES' : 'UTILITIES'
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-80 bg-white text-black z-50 transform transition-transform duration-300 ease-in-out border-r-[3px] border-black flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand */}
        <div className="p-8 border-b-[3px] border-black flex flex-col gap-1 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Legal Assistant</span>
            <button className="lg:hidden" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none mt-1">JURION</h1>
          </div>
        </div>

        {/* Language Selection */}
        <div className="px-8 py-4 border-b-[3px] border-black bg-slate-50">
          <div className="flex bg-white brutalist-border p-1">
            <button 
              onClick={() => setLanguage('es')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                language === 'es' ? "bg-black text-white" : "bg-transparent text-black/40 hover:text-black"
              )}
            >
              ESPAÑOL
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                language === 'en' ? "bg-black text-white" : "bg-transparent text-black/40 hover:text-black"
              )}
            >
              ENGLISH
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {(Object.keys(categories) as Array<keyof typeof categories>).map(catKey => (
            <div key={catKey} className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 px-2">
                {categories[catKey]}
              </h3>
              <div className="space-y-1">
                {menuItems.filter(item => item.category === catKey).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase tracking-widest transition-all group",
                      activeTab === item.id 
                        ? "bg-brand-yellow text-black border-black border-b-[3px] italic" 
                        : "text-black/40 hover:text-black hover:bg-black/5"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5",
                      activeTab === item.id ? "text-black" : "text-black/20 group-hover:text-black"
                    )} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-8 bg-black text-white">
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/20">
             <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center font-black text-black text-xs">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Account Status</span>
              <span className="text-xs font-black uppercase tracking-widest leading-none">PROFESIONAL</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
