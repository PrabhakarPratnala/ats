import React, { useState } from 'react';
import { ResumeData, TemplateType, GenerationState } from './types';
import Editor from './components/Editor';
import ResumePreview from './components/ResumePreview';
import { analyzeResume } from './services/geminiService';
import { Download, LayoutTemplate, Printer, AlertTriangle, X, ZoomIn, ZoomOut, RotateCcw, FileText, Check, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const INITIAL_DATA: ResumeData = {
  fullName: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  phone: '(555) 123-4567',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexjohnson',
  website: 'alexj.dev',
  summary: 'Detail-oriented Software Engineer with 5+ years of experience in full-stack development. Proven track record of improving application performance by 40% and leading cross-functional teams. Skilled in React, Node.js, and cloud infrastructure.',
  experience: [
    {
      id: '1',
      company: 'Tech Solutions Inc.',
      position: 'Senior Frontend Engineer',
      startDate: '2021',
      endDate: 'Present',
      current: true,
      description: 'Led the migration of a legacy jQuery application to React 18, improving load times by 60%.\nMentored 3 junior developers and established code review standards.\nImplemented automated testing pipeline using Jest and Cypress.'
    }
  ],
  education: [
    {
      id: '1',
      school: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2015',
      endDate: '2019'
    }
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Docker', 'GraphQL'],
  projects: []
};

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_DATA);
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(TemplateType.MODERN);
  const [genState, setGenState] = useState<GenerationState>({ isGenerating: false, type: null });
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.8);

  const handleAnalyze = async () => {
    setGenState({ isGenerating: true, type: 'review' });
    try {
      const result = await analyzeResume(resumeData);
      setAnalysisResult(result);
    } catch (error) {
      alert("Failed to analyze resume. Check console for details.");
    } finally {
      setGenState({ isGenerating: false, type: null });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.4), 1.5));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between px-6 shrink-0 print:hidden z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 transform transition-transform hover:scale-105">
            <FileText size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-tight">ATS Architect</h1>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">AI Powered</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            {(Object.values(TemplateType) as TemplateType[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTemplate(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all flex items-center gap-1.5 ${
                  activeTemplate === t 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {activeTemplate === t && <Check size={12} strokeWidth={3} />}
                {t}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left: Editor Panel */}
        <div className="w-full md:w-[500px] border-r border-gray-200 bg-white flex flex-col print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
          <Editor 
            data={resumeData} 
            onChange={setResumeData} 
            onAnalyze={handleAnalyze} 
            genState={genState}
            setGenState={setGenState}
          />
        </div>

        {/* Right: Preview Panel */}
        <div className="flex-1 bg-grid-pattern overflow-hidden relative flex flex-col print:p-0 print:bg-white print:overflow-visible">
          
          {/* Zoom Controls (Floating) */}
          <div className="absolute bottom-8 right-8 flex items-center gap-1 bg-white/90 backdrop-blur p-2 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200/60 z-10 print:hidden transition-transform hover:scale-105">
             <button onClick={() => adjustZoom(-0.1)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Zoom Out">
               <ZoomOut size={18} />
             </button>
             <span className="text-xs font-bold text-slate-700 w-12 text-center select-none tabular-nums">{Math.round(zoom * 100)}%</span>
             <button onClick={() => adjustZoom(0.1)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Zoom In">
               <ZoomIn size={18} />
             </button>
             <div className="w-px h-4 bg-slate-200 mx-1"></div>
             <button onClick={() => setZoom(0.8)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Reset Zoom">
               <RotateCcw size={16} />
             </button>
          </div>

          <div className="flex-1 overflow-auto p-12 flex justify-center items-start custom-scrollbar">
            <div 
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              className="w-[210mm] min-h-[297mm] bg-white shadow-[0_30px_60px_-12px_rgba(50,50,93,0.25),0_18px_36px_-18px_rgba(0,0,0,0.3)] ring-1 ring-slate-900/5 print:shadow-none print:ring-0 print:w-full print:h-full print:transform-none"
            >
               <ResumePreview data={resumeData} template={activeTemplate} />
            </div>
          </div>
        </div>

      </main>

      {/* Analysis Modal */}
      {analysisResult && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 print:hidden backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-100 overflow-hidden transform transition-all animate-scaleIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                  <Sparkles size={22} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-slate-800">Resume Audit</h2>
                   <p className="text-xs text-slate-500 font-medium">AI Analysis & Suggestions</p>
                </div>
              </div>
              <button onClick={() => setAnalysisResult(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto prose prose-sm prose-indigo max-w-none text-slate-600 leading-relaxed custom-scrollbar">
               <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setAnalysisResult(null)}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold shadow-lg shadow-slate-900/10"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile/Small Screen Warning */}
      <div className="fixed bottom-0 left-0 w-full bg-amber-50 border-t border-amber-200 p-4 md:hidden print:hidden z-50">
        <div className="flex items-center gap-3">
           <AlertTriangle className="text-amber-600" size={20} />
           <p className="text-sm text-amber-800 font-medium">Please use a desktop for the best experience.</p>
        </div>
      </div>
      
    </div>
  );
};

export default App;