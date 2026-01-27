import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ResumeData, TemplateType, GenerationState, ATSScoreData, ATSIssue } from './types';
import Editor from './components/Editor';
import { ResumePreview } from './components/ResumePreview';
import { calculateLocalATSScore, fixIssueWithAI } from './services/geminiService';
import { Printer, X, ZoomIn, ZoomOut, RotateCcw, FileText, Check, Sparkles, LayoutTemplate, ChevronDown, Briefcase, Cpu, Palette, Grid, Mail, FileDown, Loader2, Minus, Plus, Type, History, Save, Trash2, Clock, Menu, AlertTriangle, ArrowRight, BookOpen, Rocket, Coffee, Gem, Settings2, Undo, Redo } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const INITIAL_DATA: ResumeData = {
  fullName: 'Alex Johnson',
  jobTitle: 'Senior Full Stack Engineer',
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
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'System Design'],
  softwares: [
    { id: '1', name: 'VS Code', description: '' },
    { id: '2', name: 'Git', description: '' },
    { id: '3', name: 'Docker', description: '' },
    { id: '4', name: 'Figma', description: '' },
    { id: '5', name: 'Jira', description: '' },
    { id: '6', name: 'Postman', description: '' }
  ],
  projects: [],
  customSections: [],
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'softwares', 'projects'],
  showSkillIcons: true,
  coverLetter: {
    recipientName: '',
    recipientTitle: '',
    companyName: '',
    companyAddress: '',
    content: ''
  }
};

const TEMPLATE_GROUPS = [
  { category: "Corporate", icon: Briefcase, color: "text-blue-400", items: [TemplateType.EXECUTIVE, TemplateType.CLASSIC, TemplateType.ELEGANT] },
  { category: "Technical", icon: Cpu, color: "text-emerald-400", items: [TemplateType.TECHNICAL, TemplateType.ANALYST, TemplateType.GRID] },
  { category: "Creative", icon: Palette, color: "text-pink-400", items: [TemplateType.CREATIVE, TemplateType.DESIGNER, TemplateType.CONTRAST, TemplateType.STARTUP] },
  { category: "Specialized", icon: BookOpen, color: "text-purple-400", items: [TemplateType.ACADEMIC, TemplateType.SERVICE] },
  { category: "Minimal", icon: Grid, color: "text-slate-400", items: [TemplateType.MODERN, TemplateType.MINIMAL] }
];

const PRESET_COLORS = ['#4f46e5', '#0f172a', '#2563eb', '#059669', '#dc2626', '#7c3aed', '#db2777', '#d97706', '#0d9488', '#000000'];
const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Source Sans', value: '"Source Sans 3", sans-serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
  { name: 'Roboto Mono', value: '"Roboto Mono", monospace' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
];

interface SavedResume {
  id: string;
  name: string;
  date: string;
  data: ResumeData;
  template: TemplateType;
}

// --- SCORE RING COMPONENT (Refined Floating Widget) ---
const ScoreRing = ({ score, issues, onClick }: { score: number, issues: ATSIssue[], onClick: () => void }) => {
  const radius = 20; 
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  let color = '#ef4444'; // Red < 50
  if (score >= 80) color = '#22c55e'; // Green
  else if (score >= 50) color = '#eab308'; // Yellow

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const topCritical = criticalIssues.slice(0, 3);
  const remainingCount = Math.max(0, criticalIssues.length - 3);

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[50] flex flex-col items-end print:hidden pointer-events-none">
       {/* Button Container - pointer-events-auto enables interaction */}
       <button 
          onClick={onClick} 
          className="group pointer-events-auto relative flex items-center bg-[#1e293b]/95 backdrop-blur-xl hover:bg-[#1e293b] p-1.5 rounded-full border border-white/10 shadow-2xl shadow-black/40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:pr-5 ring-1 ring-white/5"
       >
          {/* Tooltip Popup */}
          <div className="absolute bottom-full right-0 mb-4 w-72 bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-left cursor-default origin-bottom-right">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Analysis</span>
                 <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${score >= 80 ? 'bg-green-500/10 text-green-400 border-green-500/20' : issues.length > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {issues.length} Issues Found
                 </div>
              </div>
              
              <div className="space-y-2.5">
                 {topCritical.length > 0 ? (
                    topCritical.map(issue => (
                       <div key={issue.id} className="flex gap-2.5 items-start">
                          <div className="mt-0.5 shrink-0 text-red-400"><AlertTriangle size={14} /></div>
                          <div>
                             <div className="text-xs font-bold text-slate-200 leading-tight mb-0.5">{issue.title}</div>
                             <div className="text-[10px] text-slate-400 leading-tight line-clamp-2">{issue.description}</div>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="flex items-center gap-2 text-slate-300 py-1">
                        <Check size={14} className="text-green-400" />
                        <span className="text-xs">{issues.length > 0 ? "No critical issues. Check warnings." : "Great job! Resume is optimized."}</span>
                    </div>
                 )}
                 {remainingCount > 0 && (
                    <div className="text-[10px] text-slate-500 pl-6 pt-1 font-medium">+ {remainingCount} more critical issues</div>
                 )}
              </div>
              
              <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
                 <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 group-hover/link:underline cursor-pointer">View full report <ArrowRight size={10} /></span>
              </div>
          </div>

          {/* Circle Graph */}
          <div className="relative flex items-center justify-center shrink-0 w-[44px] h-[44px]">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] drop-shadow-md">
              <circle stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx={radius} cy={radius} />
              <circle stroke={color} strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }} strokeLinecap="round" fill="transparent" r={normalizedRadius} cx={radius} cy={radius} />
            </svg>
            <span className="absolute text-[11px] font-bold text-white tracking-tighter tabular-nums">{score}</span>
          </div>

          {/* Expandable Text */}
          <div className="flex flex-col text-left leading-none max-w-0 group-hover:max-w-[120px] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] opacity-0 group-hover:opacity-100 whitespace-nowrap pl-0 group-hover:pl-3">
             <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">ATS Score</span>
             <span className="text-sm font-bold text-slate-200">View Report</span>
          </div>
       </button>
    </div>
  );
};

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_DATA);
  
  // History State
  const [past, setPast] = useState<ResumeData[]>([]);
  const [future, setFuture] = useState<ResumeData[]>([]);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHistoryPending = useRef(false);

  // App State
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(TemplateType.MODERN);
  const [viewMode, setViewMode] = useState<'resume' | 'cover-letter'>('resume');
  const [genState, setGenState] = useState<GenerationState>({ isGenerating: false, type: null });
  const [atsScoreData, setAtsScoreData] = useState<ATSScoreData>({ score: 0, issues: [] });
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Appearance State
  const [zoom, setZoom] = useState<number>(0.85); 
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  
  // Customization State
  const [themeColor, setThemeColor] = useState<string>('#4f46e5');
  const [fontFamily, setFontFamily] = useState<string>(FONT_FAMILIES[0].value);
  const [fontSize, setFontSize] = useState<number>(11);

  const [history, setHistory] = useState<SavedResume[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('resume_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error("Failed to parse history", e); }
    }
  }, []);

  useEffect(() => {
    const result = calculateLocalATSScore(resumeData);
    setAtsScoreData(result);
  }, [resumeData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, resumeData]);

  const handleResumeChange = (newData: ResumeData) => {
    if (!isHistoryPending.current) {
        isHistoryPending.current = true;
        setPast(prev => [...prev, resumeData]);
        setFuture([]);
    }
    setResumeData(newData);
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = setTimeout(() => {
        isHistoryPending.current = false;
    }, 1000);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    isHistoryPending.current = false;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture(prev => [resumeData, ...prev]);
    setResumeData(previous);
    setPast(newPast);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    isHistoryPending.current = false;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prev => [...prev, resumeData]);
    setResumeData(next);
    setFuture(newFuture);
  };

  const handleSaveToHistory = () => {
    const newSave: SavedResume = {
      id: crypto.randomUUID(),
      name: resumeData.fullName || 'Untitled Resume',
      date: new Date().toISOString(),
      data: resumeData,
      template: activeTemplate
    };
    const newHistory = [newSave, ...history];
    setHistory(newHistory);
    localStorage.setItem('resume_history', JSON.stringify(newHistory));
    alert('Resume saved to history!');
  };

  const handleLoadHistory = (saved: SavedResume) => {
    if (window.confirm('Load this version? Current unsaved changes will be lost.')) {
      setResumeData({ ...saved.data, customSections: saved.data.customSections || [], sectionOrder: saved.data.sectionOrder || INITIAL_DATA.sectionOrder });
      setActiveTemplate(saved.template);
      setPast([]);
      setFuture([]);
      isHistoryPending.current = false;
      setShowHistory(false);
    }
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved resume?')) {
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem('resume_history', JSON.stringify(newHistory));
    }
  };

  const handleFixIssue = async (issue: ATSIssue) => {
      setGenState({ isGenerating: true, type: 'fix', targetId: issue.id });
      try {
          const updates = await fixIssueWithAI(issue.id, resumeData);
          if (updates && Object.keys(updates).length > 0) {
              handleResumeChange({ ...resumeData, ...updates });
          }
      } catch (e) {
          alert("Failed to fix issue automatically.");
      } finally {
          setGenState({ isGenerating: false, type: null, targetId: undefined });
      }
  };

  const adjustZoom = (delta: number) => setZoom(prev => Math.min(Math.max(prev + delta, 0.4), 1.5));

  return (
    <div className="h-screen w-full flex flex-col bg-[#020617] overflow-hidden font-sans text-slate-100 selection:bg-indigo-500/30">
      
      {/* Header - Improved Layout */}
      <header className="h-16 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-6 shrink-0 print:hidden z-40 relative shadow-2xl">
        
        {/* Left: Brand & Toggle */}
        <div className="flex items-center gap-6 w-1/3">
          <div className="flex items-center gap-3 group cursor-default shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-100 hidden xl:block group-hover:text-white transition-colors">Resume<span className="text-indigo-400">Architect</span></h1>
          </div>
          
          <div className="h-6 w-px bg-white/10 hidden md:block shrink-0"></div>
          
          <div className="flex bg-[#1e293b]/50 p-1 rounded-lg border border-white/5 shadow-sm shrink-0">
             <button onClick={() => setViewMode('resume')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'resume' ? 'bg-indigo-600 text-white shadow-md ring-1 ring-white/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><FileText size={14} /> <span className="hidden sm:inline">Resume</span></button>
             <button onClick={() => setViewMode('cover-letter')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'cover-letter' ? 'bg-indigo-600 text-white shadow-md ring-1 ring-white/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><Mail size={14} /> <span className="hidden sm:inline">Cover Letter</span></button>
          </div>
        </div>

        {/* Center: Controls (Flex centered) */}
        <div className="hidden lg:flex items-center justify-center gap-2 w-1/3">
             <div className="flex items-center gap-1 bg-[#1e293b]/50 p-1 rounded-lg border border-white/5 shadow-sm">
                 <button onClick={handleUndo} disabled={past.length === 0} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent" title="Undo (Ctrl+Z)"><Undo size={16} /></button>
                 <div className="w-px h-4 bg-white/10"></div>
                 <button onClick={handleRedo} disabled={future.length === 0} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent" title="Redo (Ctrl+Shift+Z)"><Redo size={16} /></button>
             </div>
             
             <div className="flex items-center gap-1 bg-[#1e293b]/50 p-1 rounded-lg border border-white/5 shadow-sm">
                 <button onClick={() => setShowHistory(true)} className="p-1.5 px-3 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-2 text-xs font-medium" title="History">
                    <History size={14} /> <span className="hidden 2xl:inline">History</span>
                 </button>
                 <button onClick={handleSaveToHistory} className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors" title="Save Version">
                    <Save size={16} />
                 </button>
             </div>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center justify-end gap-3 w-1/3">
            
            {/* Template Selector */}
            <div className="relative hidden md:block">
                <button onClick={() => setShowTemplateMenu(!showTemplateMenu)} className={`flex items-center gap-2 px-3 py-2 bg-[#1e293b]/50 hover:bg-[#1e293b] text-slate-300 rounded-lg text-xs font-semibold transition-all border border-white/5 group ${showTemplateMenu ? 'border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-indigo-500/10' : 'hover:border-white/10'}`}>
                  <LayoutTemplate size={16} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  <span className="capitalize hidden lg:inline">{activeTemplate}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showTemplateMenu ? 'rotate-180 text-indigo-400' : ''}`} />
                </button>
                {showTemplateMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTemplateMenu(false)}></div>
                    <div className="absolute top-full right-0 mt-3 w-[520px] bg-[#1e293b]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 p-5 z-50 animate-scaleIn origin-top-right overflow-y-auto max-h-[80vh] custom-scrollbar ring-1 ring-black/40">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                         {TEMPLATE_GROUPS.map((group) => (
                           <div key={group.category} className="col-span-1">
                              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/5">
                                 <group.icon size={12} className={group.color} />
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.category}</span>
                              </div>
                              <div className="space-y-1">
                                {group.items.map(t => (
                                  <button key={t} onClick={() => { setActiveTemplate(t as TemplateType); setShowTemplateMenu(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group/item ${activeTemplate === t ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'hover:bg-white/5 text-slate-300 border border-transparent'}`}>
                                     <span className="capitalize">{t}</span>
                                     {activeTemplate === t && <Check size={12} className="text-indigo-400" />}
                                  </button>
                                ))}
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  </>
                )}
            </div>

            {/* Font & Size */}
            <div className="hidden lg:flex items-center gap-2 bg-[#1e293b]/50 rounded-lg border border-white/5 p-1 shadow-sm">
                <div className="relative">
                  <button onClick={() => setShowFontMenu(!showFontMenu)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded text-slate-300 text-xs font-medium transition-all min-w-[100px] justify-between">
                    <span className="truncate max-w-[80px]">{FONT_FAMILIES.find(f => f.value === fontFamily)?.name}</span>
                    <ChevronDown size={12} className="opacity-50" />
                  </button>
                  {showFontMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowFontMenu(false)}></div>
                      <div className="absolute top-full left-0 mt-2 w-48 bg-[#1e293b] rounded-lg shadow-xl border border-white/10 p-1 z-50 animate-scaleIn origin-top-left ring-1 ring-black/40">
                        {FONT_FAMILIES.map((font) => (
                          <button key={font.name} onClick={() => { setFontFamily(font.value); setShowFontMenu(false); }} className={`w-full text-left px-3 py-2 text-xs rounded transition-colors flex items-center justify-between ${fontFamily === font.value ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/5'}`} style={{ fontFamily: font.value }}>{font.name}{fontFamily === font.value && <Check size={12} />}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="w-px h-4 bg-white/10"></div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setFontSize(prev => Math.max(9, prev - 1))} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"><Minus size={12} /></button>
                  <span className="text-[10px] font-mono font-bold w-4 text-center">{fontSize}</span>
                  <button onClick={() => setFontSize(prev => Math.min(18, prev + 1))} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"><Plus size={12} /></button>
                </div>
            </div>

            {/* Colors */}
            <div className="relative hidden lg:block">
                <button onClick={() => setShowColorMenu(!showColorMenu)} className="flex items-center gap-2 px-2 py-2 bg-[#1e293b]/50 hover:bg-[#1e293b] rounded-lg transition-colors border border-white/5 shadow-sm" title="Accent Color">
                  <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: themeColor }}></div>
                </button>
                {showColorMenu && (
                  <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowColorMenu(false)}></div>
                     <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e293b] rounded-xl shadow-xl border border-white/10 p-3 z-50 animate-scaleIn origin-top-right ring-1 ring-black/40">
                        <div className="grid grid-cols-5 gap-2 mb-3">
                           {PRESET_COLORS.map(color => (
                             <button key={color} onClick={() => { setThemeColor(color); setShowColorMenu(false); }} className={`w-8 h-8 rounded-full border border-white/10 hover:scale-110 transition-transform ${themeColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e293b]' : ''}`} style={{ backgroundColor: color }} />
                           ))}
                        </div>
                        <div className="pt-2 border-t border-white/10">
                           <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg">
                              <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-6 h-6 rounded bg-transparent cursor-pointer border-none p-0" />
                              <span className="text-xs font-mono text-slate-400">{themeColor}</span>
                           </div>
                        </div>
                     </div>
                  </>
                )}
            </div>

            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

            <button onClick={window.print} className="flex items-center gap-2 bg-white text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg hover:bg-indigo-50 border border-transparent hidden sm:flex hover:shadow-xl hover:scale-105 active:scale-95 ring-1 ring-white/50">
              <FileDown size={16} /><span className="hidden sm:inline">Export</span>
            </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className={`w-full md:w-[480px] border-r border-white/5 bg-[#0b1121] flex flex-col print:hidden z-30 transition-transform duration-300 absolute md:relative h-full shadow-2xl md:shadow-none ${showMobilePreview ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
          <Editor data={resumeData} onChange={handleResumeChange} genState={genState} setGenState={setGenState} viewMode={viewMode} />
        </div>

        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
           <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none"></div>
           <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-slate-950/50 to-slate-950 pointer-events-none"></div>
           
           {/* Zoom Controls (Floating Top) */}
           <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#1e293b]/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-2xl print:hidden ring-1 ring-black/20 hover:bg-[#1e293b] transition-colors">
             <button onClick={() => adjustZoom(-0.1)} className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-colors"><ZoomOut size={16} /></button>
             <span className="text-[11px] font-mono font-bold w-12 text-center text-slate-400 select-none">{Math.round(zoom * 100)}%</span>
             <button onClick={() => adjustZoom(0.1)} className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-colors"><ZoomIn size={16} /></button>
             <div className="w-px h-4 bg-white/10 mx-1"></div>
             <button onClick={() => setZoom(0.85)} className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-colors" title="Reset"><RotateCcw size={14} /></button>
           </div>

           <button onClick={() => setShowMobilePreview(!showMobilePreview)} className="md:hidden absolute bottom-24 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all active:scale-95 print:hidden border border-white/10 ring-2 ring-indigo-400/20">
             {showMobilePreview ? <LayoutTemplate size={24} /> : <FileText size={24} />}
           </button>

           <div className="flex-1 overflow-auto custom-scrollbar p-8 md:p-12 flex justify-center items-start print:p-0 print:overflow-visible">
             <div className="origin-top transition-transform duration-200 ease-out shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] print:shadow-none print:transform-none bg-white ring-1 ring-white/10 relative" style={{ transform: `scale(${zoom})`, width: '210mm', minHeight: '297mm' }}>
               <ResumePreview 
                  data={resumeData} 
                  template={activeTemplate} 
                  viewMode={viewMode} 
                  customColor={themeColor} 
                  fontFamily={fontFamily} 
                  fontSize={fontSize}
               />
               <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-hidden">
                    <div className="absolute w-full border-b border-dashed border-red-300/60 print:hidden flex justify-end items-end" style={{ top: '297mm' }}><span className="text-[10px] text-red-400 font-mono bg-white/90 px-2 py-0.5 rounded shadow-sm opacity-50 hover:opacity-100 transition-opacity">Page Break</span></div>
               </div>
             </div>
           </div>
        </div>
      </main>

      {/* --- ANALYSIS / ISSUES MODAL --- */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn print:hidden" onClick={() => setShowAnalysisModal(false)}>
           <div className="bg-[#1e293b] w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col animate-scaleIn ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
             <div className="p-6 border-b border-white/5 bg-white/5 rounded-t-2xl flex justify-between items-center">
                <div>
                   <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-500/50 flex items-center justify-center text-sm font-bold bg-indigo-500/10 text-indigo-400">{atsScoreData.score}</div>
                      ATS Analysis
                   </h3>
                   <p className="text-xs text-slate-400 mt-1 ml-12">
                     {atsScoreData.score >= 80 ? 'Excellent! Your resume is ATS friendly.' : atsScoreData.score >= 50 ? 'Good start. Fix specific issues to improve.' : 'Needs Improvement. Critical sections are missing.'}
                   </p>
                </div>
                <button onClick={() => setShowAnalysisModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="space-y-4">
                   {atsScoreData.issues.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4"><Check size={32} /></div>
                          <h4 className="text-white font-bold text-lg">No Issues Found</h4>
                          <p className="text-slate-400 text-sm mt-1">Your resume looks great for ATS parsing!</p>
                       </div>
                   ) : (
                       atsScoreData.issues.map((issue, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border flex gap-4 ${issue.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                              <div className={`mt-1 shrink-0 ${issue.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                                 <AlertTriangle size={20} />
                              </div>
                              <div className="flex-1">
                                 <div className="flex justify-between items-start mb-1">
                                    <h5 className={`font-bold text-sm ${issue.severity === 'critical' ? 'text-red-200' : 'text-amber-200'}`}>{issue.title}</h5>
                                    {issue.canAutoFix && (
                                       <button 
                                          onClick={() => handleFixIssue(issue)} 
                                          disabled={genState.isGenerating}
                                          className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded flex items-center gap-1 transition-colors text-white disabled:opacity-50"
                                       >
                                          {genState.isGenerating && genState.targetId === issue.id ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10} />}
                                          Fix with AI
                                       </button>
                                    )}
                                 </div>
                                 <p className="text-xs text-slate-300 leading-relaxed opacity-90">{issue.description}</p>
                              </div>
                          </div>
                       ))
                   )}
                </div>
             </div>
           </div>
        </div>
      )}
      
      {/* Floating Score Ring Button - Now Fixed at bottom right */}
      <ScoreRing score={atsScoreData.score} issues={atsScoreData.issues} onClick={() => setShowAnalysisModal(true)} />
    </div>
  );
};

export default App;