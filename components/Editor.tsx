import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, ResumeExperience, ResumeEducation, ResumeProject, GenerationState, CustomSection, CustomSectionItem } from '../types';
import { Plus, Trash2, Sparkles, ChevronDown, Wand2, Briefcase, GraduationCap, User, Code, FolderGit2, UploadCloud, Loader2, Check, PenTool, TerminalSquare, ArrowUp, ArrowDown, LayoutList, Link as LinkIcon, MapPin, Mail, Phone, Globe, Linkedin, FileText, Send, GripVertical } from 'lucide-react';
import * as GeminiService from '../services/geminiService';

interface EditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  genState: GenerationState;
  setGenState: (state: GenerationState) => void;
  viewMode: 'resume' | 'cover-letter';
}

const SECTION_CONFIG: Record<string, { title: string, subtitle: string, icon: any }> = {
    personal: { title: 'Personal Details', subtitle: 'Contact Information', icon: User },
    summary: { title: 'Professional Summary', subtitle: 'Career Objective', icon: Wand2 },
    experience: { title: 'Experience', subtitle: 'Work History', icon: Briefcase },
    education: { title: 'Education', subtitle: 'Academic Background', icon: GraduationCap },
    skills: { title: 'Skills', subtitle: 'Professional Abilities', icon: Code },
    softwares: { title: 'Software & Tools', subtitle: 'Tech Stack & Programs', icon: TerminalSquare },
    projects: { title: 'Projects', subtitle: 'Portfolio', icon: FolderGit2 },
};

// --- Sub-components ---

const AccordionItem = ({ title, subtitle, isOpen, onToggle, onRemove, children, idx }: any) => (
  <div className={`rounded-lg border transition-all duration-200 ease-in-out overflow-hidden ${isOpen ? 'bg-[#1e293b]/40 border-indigo-500/30' : 'bg-[#1e293b]/20 border-white/5 hover:border-white/10'}`}>
      <div onClick={onToggle} className="flex items-center justify-between p-3 cursor-pointer group select-none">
          <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${isOpen ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
                  {isOpen ? <ChevronDown size={12} /> : (idx + 1)}
              </div>
              <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-bold truncate transition-colors ${isOpen ? 'text-indigo-200' : 'text-slate-300 group-hover:text-white'}`}>{title || <span className="text-slate-600 italic">Untitled</span>}</span>
                  {subtitle && <span className="text-[10px] text-slate-500 truncate">{subtitle}</span>}
              </div>
          </div>
          <button 
              type="button"
              onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  onRemove(); 
              }} 
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Remove Item"
          >
              <Trash2 size={12} />
          </button>
      </div>
      {isOpen && (
        <div className="px-3 pb-4 pt-0 animate-fadeIn">
          <div className="h-px w-full bg-white/5 mb-3"></div>
          <div className="space-y-3">{children}</div>
        </div>
      )}
  </div>
);

const SectionHeader = ({ id, icon: Icon, title, subtitle, isOpen, onToggle, canMove, onMoveUp, onMoveDown, isCustom, onDelete }: any) => {
  return (
    <div className={`w-full border-b border-white/5 transition-all duration-200 group relative ${isOpen ? 'bg-[#1e293b]/30' : 'hover:bg-white/[0.02]'}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[2px] bg-indigo-500 transition-transform duration-300 ease-out ${isOpen ? 'scale-y-100' : 'scale-y-0'}`}></div>
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
              <div className="text-slate-600 group-hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing w-4 flex justify-center" title="Reorder Section">
                  {canMove && <GripVertical size={14} />}
              </div>
              <div className={`transition-colors duration-200 ${isOpen ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                  <Icon size={16} />
              </div>
              <div>
                  <span className={`block font-bold text-sm transition-colors ${isOpen ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{title}</span>
                  {subtitle && <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">{subtitle}</span>}
              </div>
          </div>
          <div className="flex items-center gap-1">
               {canMove && (
                   <div className="flex gap-0.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                       <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }} className="text-slate-600 hover:text-white hover:bg-white/10 p-1.5 rounded transition-colors" title="Move Up"><ArrowUp size={12} /></button>
                       <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }} className="text-slate-600 hover:text-white hover:bg-white/10 p-1.5 rounded transition-colors" title="Move Down"><ArrowDown size={12} /></button>
                   </div>
               )}
               {isCustom && (
                   <button 
                       type="button"
                       onClick={(e) => { 
                           e.preventDefault();
                           e.stopPropagation(); 
                           if (onDelete) onDelete();
                       }} 
                       onMouseDown={(e) => e.stopPropagation()}
                       className="relative z-10 text-slate-600 hover:text-red-400 p-1.5 rounded hover:bg-white/5 mr-1 transition-colors"
                       title="Delete Section"
                   >
                       <Trash2 size={14} />
                   </button>
               )}
               <ChevronDown size={14} className={`transition-transform duration-300 text-slate-600 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
          </div>
      </div>
    </div>
  );
};

const SmartTextArea = ({ id, value, onChange, placeholder, label, minHeight = "100px", genState, onImprove }: any) => {
  const [showAiMenu, setShowAiMenu] = useState(false);
  return (
    <div className="space-y-1.5 relative group/textarea">
      <div className="flex justify-between items-end">
        <label className="input-label mb-0">{label}</label>
        <div className="relative z-10">
           <button type="button" onClick={() => setShowAiMenu(!showAiMenu)} disabled={genState.isGenerating} className={`text-[9px] flex items-center gap-1 font-bold px-1.5 py-0.5 rounded transition-all border ${showAiMenu ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'text-slate-600 border-transparent hover:bg-white/5 hover:text-indigo-400'}`}>
             {genState.isGenerating && genState.targetId?.startsWith(id) ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI Improve
           </button>
           {showAiMenu && (
             <>
               <div className="fixed inset-0 z-0" onClick={() => setShowAiMenu(false)}></div>
               <div className="absolute right-0 top-full mt-1 w-40 bg-[#1e293b] rounded-lg shadow-xl border border-white/10 z-20 overflow-hidden animate-scaleIn origin-top-right ring-1 ring-black/40 p-1">
                    <button type="button" onClick={() => { onImprove(id, value, 'grammar', onChange); setShowAiMenu(false); }} className="ai-menu-btn"><Check size={12} /> Fix Grammar</button>
                    <button type="button" onClick={() => { onImprove(id, value, 'polish', onChange); setShowAiMenu(false); }} className="ai-menu-btn"><Wand2 size={12} /> Professional</button>
                    <button type="button" onClick={() => { onImprove(id, value, 'concise', onChange); setShowAiMenu(false); }} className="ai-menu-btn"><PenTool size={12} /> Make Concise</button>
               </div>
             </>
           )}
        </div>
      </div>
      <textarea 
        className="input-field text-sm resize-y focus:min-h-[120px] transition-all duration-200" 
        style={{ minHeight }} 
        placeholder={placeholder} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  );
};

const InputGroup = ({ label, icon: Icon, value, onChange, placeholder, type = "text" }: any) => (
  <div className="space-y-1">
    <label className="input-label flex items-center gap-1.5">{Icon && <Icon size={10} className="text-indigo-400/80" />} {label}</label>
    <div className="relative group">
       <input 
          type={type} 
          className="input-field" 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder} 
        />
    </div>
  </div>
);

// --- Main Editor Component ---

const Editor: React.FC<EditorProps> = ({ data, onChange, genState, setGenState, viewMode }) => {
  const [activeSection, setActiveSection] = useState<string>('personal');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [linkErrors, setLinkErrors] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewMode === 'cover-letter') {
        setActiveSection('cl-recipient');
    } else if (activeSection.startsWith('cl-')) {
        setActiveSection('personal');
    }
  }, [viewMode]);

  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateField = (field: keyof ResumeData, value: any) => {
    onChange({ ...data, [field]: value });
  };
  
  const updateCoverLetter = (field: string, value: string) => {
    onChange({
        ...data,
        coverLetter: {
            recipientName: '',
            recipientTitle: '',
            companyName: '',
            companyAddress: '',
            content: '',
            ...data.coverLetter,
            [field]: value
        }
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === data.sectionOrder.length - 1) return;

      const newOrder = [...data.sectionOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      updateField('sectionOrder', newOrder);
  };

  const handleAddCustomSection = () => {
    const id = `custom-${crypto.randomUUID()}`;
    const newSection: CustomSection = {
        id,
        title: 'New Section',
        items: []
    };
    const updatedCustomSections = [...(data.customSections || []), newSection];
    const updatedOrder = [...data.sectionOrder, id];
    
    onChange({
        ...data,
        customSections: updatedCustomSections,
        sectionOrder: updatedOrder
    });
    setActiveSection(id);
  };

  const handleDeleteCustomSection = (id: string) => {
    if(!window.confirm("Are you sure you want to delete this section?")) return;

    const currentCustomSections = data.customSections || [];
    const updatedCustomSections = currentCustomSections.filter(s => s.id !== id);
    const updatedOrder = (data.sectionOrder || []).filter(oid => oid !== id);
    
    // If deleting active section, switch to personal
    if (activeSection === id) setActiveSection('personal');

    onChange({
        ...data,
        customSections: updatedCustomSections,
        sectionOrder: updatedOrder
    });
  };

  const updateCustomSection = (id: string, field: keyof CustomSection, value: any) => {
      const updatedSections = (data.customSections || []).map(s => s.id === id ? { ...s, [field]: value } : s);
      updateField('customSections', updatedSections);
  };

  const addCustomItem = (sectionId: string) => {
      const newItemId = crypto.randomUUID();
      const updatedSections = (data.customSections || []).map(s => {
          if (s.id === sectionId) {
              return {
                  ...s,
                  items: [...s.items, { id: newItemId, name: '', description: '' }]
              };
          }
          return s;
      });
      updateField('customSections', updatedSections);
      setExpandedItems(prev => ({ ...prev, [newItemId]: true }));
  };

  const updateCustomItem = (sectionId: string, itemId: string, field: keyof CustomSectionItem, value: string) => {
      const updatedSections = (data.customSections || []).map(s => {
          if (s.id === sectionId) {
              return {
                  ...s,
                  items: s.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
              };
          }
          return s;
      });
      updateField('customSections', updatedSections);
  };

  const removeCustomItem = (sectionId: string, itemId: string) => {
      const updatedSections = (data.customSections || []).map(s => {
          if (s.id === sectionId) {
              return {
                  ...s,
                  items: s.items.filter(item => item.id !== itemId)
              };
          }
          return s;
      });
      updateField('customSections', updatedSections);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
        alert("File size too large. Please upload a file smaller than 4MB.");
        return;
    }

    setGenState({ isGenerating: true, type: 'import' });

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64String = result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const parsedData = await GeminiService.parseResume(base64, file.type);
      
      const mergedData: ResumeData = {
          ...data,
          ...parsedData,
          experience: parsedData.experience?.map(e => ({ ...e, id: crypto.randomUUID() })) || [],
          education: parsedData.education?.map(e => ({ ...e, id: crypto.randomUUID() })) || [],
          projects: parsedData.projects?.map(e => ({ ...e, id: crypto.randomUUID() })) || [],
          skills: parsedData.skills || [],
          softwares: parsedData.softwares || [],
          customSections: data.customSections || [],
      };
      
      onChange(mergedData);
      alert("Resume imported successfully!");
    } catch (error) {
      alert("Failed to parse resume. Please try again with a clear image or PDF.");
    } finally {
      setGenState({ isGenerating: false, type: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Helpers ---
  const addExperience = () => {
    const newId = crypto.randomUUID();
    const newExp: ResumeExperience = { id: newId, company: '', position: '', startDate: '', endDate: '', current: false, description: '' };
    updateField('experience', [newExp, ...data.experience]);
    setExpandedItems(prev => ({ ...prev, [newId]: true }));
  };
  const updateExperience = (id: string, field: keyof ResumeExperience, value: any) => updateField('experience', data.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  const removeExperience = (id: string) => updateField('experience', data.experience.filter(exp => exp.id !== id));

  const addEducation = () => {
    const newId = crypto.randomUUID();
    const newEdu: ResumeEducation = { id: newId, school: '', degree: '', field: '', startDate: '', endDate: '' };
    updateField('education', [newEdu, ...data.education]);
    setExpandedItems(prev => ({ ...prev, [newId]: true }));
  };
  const updateEducation = (id: string, field: keyof ResumeEducation, value: any) => updateField('education', data.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  const removeEducation = (id: string) => updateField('education', data.education.filter(edu => edu.id !== id));

  const addProject = () => {
    const newId = crypto.randomUUID();
    const newProj: ResumeProject = { id: newId, name: '', description: '' };
    updateField('projects', [newProj, ...data.projects]);
    setExpandedItems(prev => ({ ...prev, [newId]: true }));
  };
  const updateProject = (id: string, field: keyof ResumeProject, value: any) => updateField('projects', data.projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  const removeProject = (id: string) => updateField('projects', data.projects.filter(p => p.id !== id));

  const handleGenerateSummary = async () => {
    const role = data.jobTitle || data.experience[0]?.position;
    if (!role) { alert("Please add a Job Title or an experience position to generate a summary."); return; }
    setGenState({ isGenerating: true, type: 'summary' });
    try { const summary = await GeminiService.generateProfessionalSummary(data, role); updateField('summary', summary); } catch (e) { alert("Failed to generate summary"); } finally { setGenState({ isGenerating: false, type: null }); }
  };
  
  const handleGenerateCoverLetter = async () => {
    if (!data.experience.length) { alert("Please add experience to your resume first."); return; }
    setGenState({ isGenerating: true, type: 'cover-letter' });
    try { const content = await GeminiService.generateCoverLetter(data); updateCoverLetter('content', content); } catch (e) { alert("Failed to generate cover letter."); } finally { setGenState({ isGenerating: false, type: null }); }
  };

  const handleSendEmail = () => {
    if (!data.coverLetter?.content) return;
    const subject = `Application for ${data.coverLetter.recipientTitle || 'Position'} - ${data.fullName}`;
    const body = data.coverLetter.content;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleImproveText = async (id: string, text: string, type: 'grammar' | 'polish' | 'concise', fieldSetter: (val: string) => void) => {
     if (!text) return;
     let context = data.jobTitle || 'Professional';
     const expItem = data.experience.find(e => e.id === id);
     if (expItem) context = expItem.position;

     setGenState({ isGenerating: true, type: 'experience', targetId: id + type });
     try { 
         const improved = await GeminiService.improveText(text, type, context); 
         fieldSetter(improved); 
     } catch (e) { 
         alert("Failed to improve text"); 
     } finally { 
         setGenState({ isGenerating: false, type: null }); 
     }
  };

  // --- View Renderers ---
  if (viewMode === 'cover-letter') {
    return (
      <div className="bg-[#0f172a] h-full overflow-y-auto custom-scrollbar flex flex-col relative">
        <div className="p-4 border-b border-white/5 bg-[#0f172a]/90 sticky top-0 z-20 backdrop-blur-md">
             <div><h3 className="text-sm font-bold text-white mb-0.5">Cover Letter</h3><p className="text-[11px] text-slate-500 font-medium">Draft & Customize</p></div>
        </div>
        <div className="flex-1 pb-10">
            <SectionHeader 
                id="cl-recipient" 
                icon={Briefcase} 
                title="Recipient Details" 
                subtitle="Target Company" 
                isOpen={activeSection === 'cl-recipient'} 
                onToggle={() => setActiveSection(activeSection === 'cl-recipient' ? '' : 'cl-recipient')} 
            />
            {activeSection === 'cl-recipient' && (
                <div className="p-4 bg-[#0b1121]/30 animate-slideDown border-b border-white/5 grid grid-cols-1 gap-4">
                    <InputGroup label="Recipient Name" icon={User} value={data.coverLetter?.recipientName} onChange={(e: any) => updateCoverLetter('recipientName', e.target.value)} placeholder="e.g. Jane Doe" />
                    <InputGroup label="Recipient Title" icon={Briefcase} value={data.coverLetter?.recipientTitle} onChange={(e: any) => updateCoverLetter('recipientTitle', e.target.value)} placeholder="e.g. Hiring Manager" />
                    <InputGroup label="Company Name" icon={Briefcase} value={data.coverLetter?.companyName} onChange={(e: any) => updateCoverLetter('companyName', e.target.value)} placeholder="e.g. Acme Corp" />
                    <InputGroup label="Company Address" icon={MapPin} value={data.coverLetter?.companyAddress} onChange={(e: any) => updateCoverLetter('companyAddress', e.target.value)} placeholder="123 Business Rd..." />
                </div>
            )}
            <SectionHeader 
                id="cl-content" 
                icon={FileText} 
                title="Letter Content" 
                subtitle="Body Text" 
                isOpen={activeSection === 'cl-content'} 
                onToggle={() => setActiveSection(activeSection === 'cl-content' ? '' : 'cl-content')} 
            />
            {activeSection === 'cl-content' && (
                <div className="p-4 bg-[#0b1121]/30 animate-slideDown border-b border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleGenerateCoverLetter} disabled={genState.isGenerating} className="btn-secondary">{genState.isGenerating && genState.type === 'cover-letter' ? <><Loader2 size={14} className="animate-spin" /> Writing...</> : <><Sparkles size={14} /> AI Generate</>}</button>
                        <button onClick={handleSendEmail} disabled={!data.coverLetter?.content} className="btn-primary"><Send size={14} /> Send Email</button>
                    </div>
                    <SmartTextArea id="coverLetterContent" label="Body Paragraphs" placeholder="Start writing or generate with AI..." value={data.coverLetter?.content || ''} onChange={(val: string) => updateCoverLetter('content', val)} minHeight="300px" genState={genState} onImprove={handleImproveText} />
                </div>
            )}
        </div>
      </div>
    );
  }

  const renderSectionBody = (id: string) => {
      const customSection = data.customSections?.find(s => s.id === id);
      if (customSection) {
          return (
              <div className="p-4 bg-[#0b1121]/30 space-y-5 animate-slideDown border-b border-white/5">
                  <InputGroup label="Section Title" value={customSection.title} onChange={(e: any) => updateCustomSection(customSection.id, 'title', e.target.value)} placeholder="e.g. Certifications" />
                  <div className="space-y-3">
                    {customSection.items.map((item, index) => (
                        <AccordionItem key={item.id} title={item.name} subtitle={item.description} isOpen={expandedItems[item.id]} onToggle={() => toggleItem(item.id)} onRemove={() => removeCustomItem(customSection.id, item.id)} idx={index}>
                            <InputGroup label="Item Name" value={item.name} onChange={(e: any) => updateCustomItem(customSection.id, item.id, 'name', e.target.value)} />
                            <InputGroup label="Description" value={item.description} onChange={(e: any) => updateCustomItem(customSection.id, item.id, 'description', e.target.value)} />
                        </AccordionItem>
                    ))}
                  </div>
                  <button onClick={() => addCustomItem(customSection.id)} className="btn-dashed"><Plus size={14} /> Add New Item</button>
              </div>
          );
      }

      switch(id) {
          case 'personal':
            return (
                <div className="p-4 bg-[#0b1121]/30 animate-slideDown border-b border-white/5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><InputGroup label="Full Name" icon={User} value={data.fullName} onChange={(e: any) => updateField('fullName', e.target.value)} placeholder="e.g. Alex Johnson" /></div>
                        <div className="col-span-2"><InputGroup label="Job Title" icon={Briefcase} value={data.jobTitle} onChange={(e: any) => updateField('jobTitle', e.target.value)} placeholder="e.g. Software Engineer" /></div>
                        <InputGroup label="Email" icon={Mail} value={data.email} onChange={(e: any) => updateField('email', e.target.value)} placeholder="email@example.com" type="email" />
                        <InputGroup label="Phone" icon={Phone} value={data.phone} onChange={(e: any) => updateField('phone', e.target.value)} placeholder="(555) 000-0000" type="tel" />
                        <div className="col-span-2"><InputGroup label="Location" icon={MapPin} value={data.location} onChange={(e: any) => updateField('location', e.target.value)} placeholder="City, Country" /></div>
                        <div className="col-span-2"><InputGroup label="LinkedIn / Website" icon={LinkIcon} value={data.linkedin} onChange={(e: any) => updateField('linkedin', e.target.value)} placeholder="linkedin.com/in/..." /></div>
                    </div>
                </div>
            );
          case 'summary':
              return (
                  <div className="p-4 bg-[#0b1121]/30 animate-slideDown border-b border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Summarize your professional background.</span>
                        <button onClick={handleGenerateSummary} disabled={genState.isGenerating} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">{genState.isGenerating && genState.type === 'summary' ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />} Auto-Write</button>
                    </div>
                    <SmartTextArea id="summary" label="Summary Text" placeholder="Passionate professional with..." value={data.summary} onChange={(val: string) => updateField('summary', val)} genState={genState} onImprove={handleImproveText} />
                  </div>
              );
          case 'experience':
              return (
                  <div className="p-4 bg-[#0b1121]/30 space-y-4 animate-slideDown border-b border-white/5">
                    <div className="space-y-3">
                        {data.experience.map((exp, index) => (
                        <AccordionItem key={exp.id} title={exp.position} subtitle={`${exp.company} • ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`} isOpen={expandedItems[exp.id]} onToggle={() => toggleItem(exp.id)} onRemove={() => removeExperience(exp.id)} idx={index}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Job Title" value={exp.position} onChange={(e: any) => updateExperience(exp.id, 'position', e.target.value)} />
                                <InputGroup label="Company" value={exp.company} onChange={(e: any) => updateExperience(exp.id, 'company', e.target.value)} />
                                <InputGroup label="Start Date" value={exp.startDate} onChange={(e: any) => updateExperience(exp.id, 'startDate', e.target.value)} placeholder="MM/YYYY" />
                                <div className="space-y-1">
                                    <label className="input-label">End Date</label>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="MM/YYYY" className="input-field flex-1" value={exp.endDate} disabled={exp.current} onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} />
                                        <label className="flex items-center justify-center px-3 cursor-pointer shrink-0 bg-[#0f172a] rounded border border-slate-700 hover:border-indigo-500/50 hover:bg-[#1e293b] transition-colors" title="Currently Working Here">
                                            <input type="checkbox" className="w-3.5 h-3.5 rounded text-indigo-500 focus:ring-0 cursor-pointer accent-indigo-500" checked={exp.current} onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <SmartTextArea id={exp.id} label="Achievements & Responsibilities" placeholder="• Led a team of..." value={exp.description} onChange={(val: string) => updateExperience(exp.id, 'description', val)} minHeight="120px" genState={genState} onImprove={handleImproveText} />
                        </AccordionItem>
                        ))}
                    </div>
                    <button onClick={addExperience} className="btn-dashed"><Plus size={14} /> Add Position</button>
                  </div>
              );
          case 'education':
              return (
                <div className="p-4 bg-[#0b1121]/30 space-y-4 animate-slideDown border-b border-white/5">
                    <div className="space-y-3">
                        {data.education.map((edu, index) => (
                        <AccordionItem key={edu.id} title={edu.school} subtitle={`${edu.degree} • ${edu.field}`} isOpen={expandedItems[edu.id]} onToggle={() => toggleItem(edu.id)} onRemove={() => removeEducation(edu.id)} idx={index}>
                            <InputGroup label="Institution" value={edu.school} onChange={(e: any) => updateEducation(edu.id, 'school', e.target.value)} />
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Degree" value={edu.degree} onChange={(e: any) => updateEducation(edu.id, 'degree', e.target.value)} />
                                <InputGroup label="Field of Study" value={edu.field} onChange={(e: any) => updateEducation(edu.id, 'field', e.target.value)} />
                                <InputGroup label="Start Date" value={edu.startDate} onChange={(e: any) => updateEducation(edu.id, 'startDate', e.target.value)} placeholder="YYYY" />
                                <InputGroup label="End Date" value={edu.endDate} onChange={(e: any) => updateEducation(edu.id, 'endDate', e.target.value)} placeholder="YYYY" />
                            </div>
                        </AccordionItem>
                        ))}
                    </div>
                    <button onClick={addEducation} className="btn-dashed"><Plus size={14} /> Add Education</button>
                </div>
              );
          case 'softwares':
              return (
                  <div className="p-4 bg-[#0b1121]/30 space-y-5 animate-slideDown border-b border-white/5">
                      <div className="flex items-center justify-end mb-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-400 transition-colors">Show Icons</span>
                            <div className="relative inline-block w-7 h-3.5 transition-all">
                                <input type="checkbox" className="sr-only peer" checked={data.showSkillIcons ?? false} onChange={(e) => updateField('showSkillIcons', e.target.checked)} />
                                <div className="w-7 h-3.5 bg-slate-800 rounded-full peer peer-checked:bg-indigo-600 transition-colors border border-white/10"></div>
                                <div className="absolute top-[2px] left-[2px] bg-slate-400 peer-checked:bg-white rounded-full h-2.5 w-2.5 transition-transform peer-checked:translate-x-3.5 shadow-sm"></div>
                            </div>
                        </label>
                      </div>
                      <div className="space-y-3">
                        {data.softwares.map((item, index) => (
                            <AccordionItem 
                                key={item.id} 
                                title={item.name} 
                                subtitle={item.description} 
                                isOpen={expandedItems[item.id]} 
                                onToggle={() => toggleItem(item.id)} 
                                onRemove={() => {
                                    const newSoftwares = data.softwares.filter(s => s.id !== item.id);
                                    updateField('softwares', newSoftwares);
                                }} 
                                idx={index}
                            >
                                <InputGroup 
                                    label="Tool Name" 
                                    value={item.name} 
                                    onChange={(e: any) => {
                                        const newSoftwares = data.softwares.map(s => s.id === item.id ? { ...s, name: e.target.value } : s);
                                        updateField('softwares', newSoftwares);
                                    }} 
                                    placeholder="e.g. VS Code, Figma"
                                />
                                <InputGroup 
                                    label="Description (Optional)" 
                                    value={item.description} 
                                    onChange={(e: any) => {
                                        const newSoftwares = data.softwares.map(s => s.id === item.id ? { ...s, description: e.target.value } : s);
                                        updateField('softwares', newSoftwares);
                                    }} 
                                    placeholder="e.g. Used for daily development..."
                                />
                            </AccordionItem>
                        ))}
                      </div>
                      <button 
                          onClick={() => {
                              const newItem = { id: crypto.randomUUID(), name: '', description: '' };
                              updateField('softwares', [...data.softwares, newItem]);
                              setExpandedItems(prev => ({ ...prev, [newItem.id]: true }));
                          }} 
                          className="btn-dashed"
                      >
                          <Plus size={14} /> Add Tool
                      </button>
                  </div>
              );
          case 'skills':
              const handleChange = (e: any) => updateField('skills', e.target.value.split(','));
              
              return (
                <div className="p-4 bg-[#0b1121]/30 animate-slideDown border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <label className="input-label mb-0">List Skills (Comma Separated)</label>
                    </div>
                    <textarea 
                        placeholder="Leadership, Public Speaking, Agile..."
                        className="input-field py-3 text-sm min-h-[80px]" 
                        value={data.skills.join(', ')} 
                        onChange={(e) => handleChange({ target: { value: e.target.value } })} 
                    />
                    {data.skills.length > 0 && data.skills[0] !== '' && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {data.skills.map((s, i) => s.trim() && <span key={i} className="bg-[#1e293b] text-slate-300 px-2 py-0.5 rounded text-[10px] border border-white/10 flex items-center gap-1 shadow-sm">{s.trim()}</span>)}
                        </div>
                    )}
                </div>
              );
          case 'projects':
              return (
                <div className="p-4 bg-[#0b1121]/30 space-y-4 animate-slideDown border-b border-white/5">
                    <div className="space-y-3">
                        {data.projects.map((proj, index) => (
                        <AccordionItem key={proj.id} title={proj.name} subtitle={proj.link} isOpen={expandedItems[proj.id]} onToggle={() => toggleItem(proj.id)} onRemove={() => removeProject(proj.id)} idx={index}>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Project Name" value={proj.name} onChange={(e: any) => updateProject(proj.id, 'name', e.target.value)} />
                                <div className="space-y-1">
                                    <label className="input-label">Link</label>
                                    <input type="text" className={`input-field ${linkErrors[proj.id] ? '!border-red-500' : ''}`} value={proj.link || ''} onChange={(e) => {
                                        updateProject(proj.id, 'link', e.target.value);
                                        try { if(e.target.value) new URL(e.target.value.startsWith('http') ? e.target.value : `https://${e.target.value}`); setLinkErrors(p => ({...p, [proj.id]: false})); } catch { setLinkErrors(p => ({...p, [proj.id]: true})); }
                                    }} placeholder="https://..." />
                                </div>
                            </div>
                            <SmartTextArea id={proj.id} label="Project Details" placeholder="Describe what you built..." value={proj.description} onChange={(val: string) => updateProject(proj.id, 'description', val)} minHeight="100px" genState={genState} onImprove={handleImproveText} />
                        </AccordionItem>
                        ))}
                    </div>
                    <button onClick={addProject} className="btn-dashed"><Plus size={14} /> Add Project</button>
                </div>
              );
          default: return null;
      }
  };

  return (
    <div className="bg-[#020617] h-full overflow-y-auto custom-scrollbar flex flex-col relative border-r border-white/5 shadow-2xl z-10">
      <div className="p-4 border-b border-white/5 bg-[#0f172a]/95 sticky top-0 z-20 backdrop-blur-xl flex justify-between items-center shadow-lg shadow-black/10">
        <div><h3 className="text-sm font-bold text-white mb-0.5 tracking-tight">Editor</h3><p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Fill details below</p></div>
        <div>
            <button onClick={() => fileInputRef.current?.click()} disabled={genState.isGenerating} className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-300 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-2 group">
                {genState.isGenerating && genState.type === 'import' ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14} className="group-hover:scale-110 transition-transform"/>} <span>Import</span>
            </button>
            <div style={{ display: 'none' }} className="hidden">
               <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png,image/jpeg,image/jpg,application/pdf" />
            </div>
        </div>
      </div>
      
      <div className="flex-1 pb-24">
        {/* Force "Personal" as the first rendered section for UI logic */}
        <SectionHeader 
            id="personal" 
            icon={User} 
            title="Personal Details" 
            subtitle="Contact Info" 
            isOpen={activeSection === 'personal'} 
            onToggle={() => setActiveSection(activeSection === 'personal' ? '' : 'personal')} 
        />
        {activeSection === 'personal' && renderSectionBody('personal')}

        {data.sectionOrder && data.sectionOrder.map((sectionId, index) => {
            const config = SECTION_CONFIG[sectionId];
            const customSection = data.customSections?.find(s => s.id === sectionId);
            
            if (config && sectionId !== 'personal') return (
                <div key={sectionId}>
                    <SectionHeader 
                        id={sectionId} 
                        icon={config.icon} 
                        title={config.title} 
                        subtitle={config.subtitle} 
                        canMove={true} 
                        onMoveUp={() => moveSection(index, 'up')} 
                        onMoveDown={() => moveSection(index, 'down')}
                        isOpen={activeSection === sectionId}
                        onToggle={() => setActiveSection(activeSection === sectionId ? '' : sectionId)}
                    />
                    {activeSection === sectionId && renderSectionBody(sectionId)}
                </div>
            );

            if (customSection) return (
                <div key={sectionId}>
                    <SectionHeader 
                        id={sectionId} 
                        icon={LayoutList} 
                        title={customSection.title || 'Untitled Section'} 
                        subtitle="Custom Section" 
                        canMove={true} 
                        onMoveUp={() => moveSection(index, 'up')} 
                        onMoveDown={() => moveSection(index, 'down')} 
                        isCustom={true} 
                        onDelete={() => handleDeleteCustomSection(sectionId)}
                        isOpen={activeSection === sectionId}
                        onToggle={() => setActiveSection(activeSection === sectionId ? '' : sectionId)}
                    />
                    {activeSection === sectionId && renderSectionBody(sectionId)}
                </div>
            );
            return null;
        })}

        <div className="p-4">
             <button onClick={handleAddCustomSection} className="w-full py-3 border border-dashed border-white/10 text-slate-500 rounded-xl hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider bg-[#1e293b]/20">
                <Plus size={14} /> Add Custom Section
             </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;