import React, { useState, useRef } from 'react';
import { ResumeData, ResumeExperience, ResumeEducation, ResumeProject, GenerationState } from '../types';
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp, Wand2, Briefcase, GraduationCap, User, Code, FolderGit2, UploadCloud, Loader2 } from 'lucide-react';
import * as GeminiService from '../services/geminiService';

interface EditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onAnalyze: () => void;
  genState: GenerationState;
  setGenState: (state: GenerationState) => void;
}

const Editor: React.FC<EditorProps> = ({ data, onChange, onAnalyze, genState, setGenState }) => {
  const [activeSection, setActiveSection] = useState<string>('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof ResumeData, value: any) => {
    onChange({ ...data, [field]: value });
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
            // Remove data:mime/type;base64, prefix
            const base64String = result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const parsedData = await GeminiService.parseResume(base64, file.type);
      
      // Merge and sanitize
      const mergedData: ResumeData = {
          ...data,
          ...parsedData,
          // Ensure IDs exist
          experience: parsedData.experience?.map(e => ({ ...e, id: crypto.randomUUID() })) || [],
          education: parsedData.education?.map(e => ({ ...e, id: crypto.randomUUID() })) || [],
          projects: parsedData.projects?.map(e => ({ ...e, id: crypto.randomUUID() })) || [],
          skills: parsedData.skills || [],
      };
      
      onChange(mergedData);
      // alert("Resume imported successfully! Please review the details.");
    } catch (error) {
      alert("Failed to parse resume. Please try again with a clear image or PDF.");
    } finally {
      setGenState({ isGenerating: false, type: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Helpers for Arrays (Exp, Edu, Proj) ---
  const addExperience = () => {
    const newExp: ResumeExperience = {
      id: crypto.randomUUID(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    updateField('experience', [newExp, ...data.experience]);
  };

  const updateExperience = (id: string, field: keyof ResumeExperience, value: any) => {
    const updated = data.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp);
    updateField('experience', updated);
  };

  const removeExperience = (id: string) => {
    updateField('experience', data.experience.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    const newEdu: ResumeEducation = {
      id: crypto.randomUUID(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: ''
    };
    updateField('education', [newEdu, ...data.education]);
  };
  
  const updateEducation = (id: string, field: keyof ResumeEducation, value: any) => {
    const updated = data.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu);
    updateField('education', updated);
  };

  const removeEducation = (id: string) => {
    updateField('education', data.education.filter(edu => edu.id !== id));
  };

  const addProject = () => {
    const newProj: ResumeProject = {
      id: crypto.randomUUID(),
      name: '',
      description: ''
    };
    updateField('projects', [newProj, ...data.projects]);
  };

  const updateProject = (id: string, field: keyof ResumeProject, value: any) => {
    const updated = data.projects.map(p => p.id === id ? { ...p, [field]: value } : p);
    updateField('projects', updated);
  };

  const removeProject = (id: string) => {
    updateField('projects', data.projects.filter(p => p.id !== id));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsArray = e.target.value.split(',').map(s => s.trim());
    updateField('skills', skillsArray);
  };

  // --- AI Handlers ---
  const handleGenerateSummary = async () => {
    if (!data.experience[0]?.position) {
      alert("Please add at least one experience position to generate a summary.");
      return;
    }
    setGenState({ isGenerating: true, type: 'summary' });
    try {
      const summary = await GeminiService.generateProfessionalSummary(data, data.experience[0].position);
      updateField('summary', summary);
    } catch (e) {
      alert("Failed to generate summary");
    } finally {
      setGenState({ isGenerating: false, type: null });
    }
  };

  const handleEnhanceDescription = async (id: string, text: string, role: string) => {
    if (!text) return;
    setGenState({ isGenerating: true, type: 'experience', targetId: id });
    try {
      const enhanced = await GeminiService.enhanceBulletPoint(text, role);
      updateExperience(id, 'description', enhanced);
    } catch (e) {
       alert("Failed to enhance text");
    } finally {
      setGenState({ isGenerating: false, type: null, targetId: undefined });
    }
  };

  const SectionHeader = ({ id, icon: Icon, title, subtitle }: { id: string, icon: any, title: string, subtitle?: string }) => {
    const isActive = activeSection === id;
    return (
      <button
        onClick={() => setActiveSection(isActive ? '' : id)}
        className={`w-full flex items-center justify-between p-5 bg-white border-b border-gray-100 transition-all duration-300 group ${isActive ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'}`}>
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          </div>
          <div className="text-left">
            <span className={`block font-bold text-base ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{title}</span>
            {subtitle && <span className="text-xs text-gray-400 font-medium">{subtitle}</span>}
          </div>
        </div>
        <div className={`transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}>
           <ChevronDown size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
        </div>
      </button>
    );
  };

  return (
    <div className="bg-white h-full overflow-y-auto custom-scrollbar flex flex-col">
      
      {/* Import Section */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50/80 to-purple-50/50">
        <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
              <UploadCloud size={16} className="text-indigo-600"/>
              Import Existing Resume
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">Upload a PDF or Image to automatically extract details using AI.</p>
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={genState.isGenerating}
          className="w-full bg-white/80 border border-indigo-200 text-indigo-700 py-4 rounded-xl hover:border-indigo-400 hover:bg-white hover:shadow-md hover:shadow-indigo-100 transition-all flex flex-col items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 group active:scale-95"
        >
          {genState.isGenerating && genState.type === 'import' ? (
             <div className="flex flex-col items-center gap-2">
               <Loader2 size={24} className="animate-spin text-indigo-600" />
               <span className="text-xs text-indigo-500 font-medium">Analyzing document...</span>
             </div>
          ) : (
             <span className="flex items-center gap-2">
               Click to Select File
             </span>
          )}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept="image/png,image/jpeg,image/jpg,application/pdf"
        />
      </div>
      
      <div className="flex-1">
        {/* 1. Personal Info */}
        <SectionHeader id="personal" icon={User} title="Personal Details" subtitle="Contact info & Summary" />
        {activeSection === 'personal' && (
          <div className="p-6 grid grid-cols-1 gap-5 bg-white animate-slideDown">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                <input type="text" className="input-field" value={data.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Title</label>
                <input type="text" className="input-field bg-gray-50" value={data.experience[0]?.position || ''} disabled title="Set in experience section" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <input type="email" className="input-field" value={data.email} onChange={(e) => updateField('email', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                <input type="tel" className="input-field" value={data.phone} onChange={(e) => updateField('phone', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                <input type="text" className="input-field" value={data.location} onChange={(e) => updateField('location', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">LinkedIn / Portfolio</label>
                 <input type="text" className="input-field" value={data.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-2">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Professional Summary</label>
                <button 
                  onClick={handleGenerateSummary}
                  disabled={genState.isGenerating}
                  className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 disabled:opacity-50 ring-1 ring-indigo-200"
                >
                  {genState.isGenerating && genState.type === 'summary' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  Auto-Write
                </button>
              </div>
              <textarea 
                className="input-field min-h-[140px] resize-y leading-relaxed" 
                placeholder="Write a brief summary of your career highlights..."
                value={data.summary}
                onChange={(e) => updateField('summary', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 2. Experience */}
        <SectionHeader id="experience" icon={Briefcase} title="Experience" subtitle="Work History" />
        {activeSection === 'experience' && (
          <div className="p-6 bg-gray-50 space-y-6 animate-slideDown">
            {data.experience.map((exp, index) => (
              <div key={exp.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative group transition-all hover:shadow-lg hover:border-indigo-200 border-l-4 border-l-indigo-500">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => removeExperience(exp.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Role {index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Title</label>
                     <input type="text" className="input-field" value={exp.position} onChange={(e) => updateExperience(exp.id, 'position', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</label>
                     <input type="text" className="input-field" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</label>
                     <input type="text" placeholder="e.g. 2020 or Mar 2020" className="input-field" value={exp.startDate} onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Date</label>
                     <div className="flex gap-3">
                        <input type="text" placeholder="e.g. 2022" className="input-field" value={exp.endDate} disabled={exp.current} onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} />
                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                          <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded-md focus:ring-indigo-500 border-gray-300" checked={exp.current} onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)} />
                          <span className="text-xs font-semibold text-gray-600">Present</span>
                        </label>
                     </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                   <div className="flex justify-between items-end">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                      <button 
                        onClick={() => handleEnhanceDescription(exp.id, exp.description, exp.position)}
                        disabled={genState.isGenerating}
                        className="text-xs flex items-center gap-1.5 text-indigo-600 font-bold hover:text-indigo-800 disabled:opacity-50 px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        {genState.isGenerating && genState.targetId === exp.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Enhance Text
                      </button>
                   </div>
                   <textarea 
                    className="input-field min-h-[160px] text-sm leading-relaxed"
                    placeholder="• Led a team of...&#10;• Improved performance by..."
                    value={exp.description} 
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} 
                  />
                </div>
              </div>
            ))}
            <button onClick={addExperience} className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 font-bold text-sm">
              <Plus size={18} /> Add Position
            </button>
          </div>
        )}

        {/* 3. Skills */}
        <SectionHeader id="skills" icon={Code} title="Skills" subtitle="Technologies & Languages" />
        {activeSection === 'skills' && (
          <div className="p-6 bg-white animate-slideDown">
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Skills List</label>
              <input 
                type="text" 
                placeholder="Type skills separated by commas..." 
                className="input-field py-3" 
                value={data.skills.join(', ')} 
                onChange={handleSkillsChange} 
              />
              <p className="text-xs text-gray-400 mt-2 font-medium">e.g. React, Node.js, Project Management, Figma</p>
            </div>
            
            {data.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                {data.skills.filter(s => s).map((skill, i) => (
                  <span key={i} className="bg-white text-slate-700 px-3 py-1.5 rounded-lg text-sm border border-slate-200 shadow-sm flex items-center gap-2 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Education */}
        <SectionHeader id="education" icon={GraduationCap} title="Education" subtitle="Degrees & Certifications" />
        {activeSection === 'education' && (
          <div className="p-6 bg-gray-50 space-y-6 animate-slideDown">
             {data.education.map((edu, index) => (
              <div key={edu.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative group border-l-4 border-l-indigo-500">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => removeEducation(edu.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Education {index + 1}</h4>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">School / University</label>
                     <input type="text" className="input-field" value={edu.school} onChange={(e) => updateEducation(edu.id, 'school', e.target.value)} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Degree</label>
                        <input type="text" className="input-field" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Field of Study</label>
                        <input type="text" className="input-field" value={edu.field} onChange={(e) => updateEducation(edu.id, 'field', e.target.value)} />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Year</label>
                        <input type="text" className="input-field" value={edu.startDate} onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)} />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Year</label>
                        <input type="text" className="input-field" value={edu.endDate} onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)} />
                     </div>
                   </div>
                </div>
              </div>
             ))}
             <button onClick={addEducation} className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 font-bold text-sm">
              <Plus size={18} /> Add Education
            </button>
          </div>
        )}

        {/* 5. Projects */}
        <SectionHeader id="projects" icon={FolderGit2} title="Projects" subtitle="Side Projects & Open Source" />
        {activeSection === 'projects' && (
          <div className="p-6 bg-gray-50 space-y-6 animate-slideDown">
             {data.projects.map((proj, index) => (
               <div key={proj.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative group border-l-4 border-l-purple-500">
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => removeProject(proj.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Project {index + 1}</h4>
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project Name</label>
                         <input type="text" className="input-field" value={proj.name} onChange={(e) => updateProject(proj.id, 'name', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Link URL</label>
                         <input type="text" className="input-field" value={proj.link || ''} onChange={(e) => updateProject(proj.id, 'link', e.target.value)} />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                      <textarea className="input-field min-h-[100px]" value={proj.description} onChange={(e) => updateProject(proj.id, 'description', e.target.value)} />
                   </div>
                 </div>
               </div>
             ))}
             <button onClick={addProject} className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 font-bold text-sm">
              <Plus size={18} /> Add Project
            </button>
          </div>
        )}
      </div>

      {/* Analysis Button - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white z-10 sticky bottom-0 backdrop-blur-xl bg-white/90">
        <button 
          onClick={onAnalyze}
          disabled={genState.isGenerating}
          className="w-full bg-slate-900 text-white py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.99]"
        >
          {genState.isGenerating && genState.type === 'review' ? (
             <Loader2 size={18} className="animate-spin text-indigo-400" />
          ) : (
             <Sparkles size={18} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
          )}
          <span className="font-bold tracking-wide">Review ATS Compatibility</span>
        </button>
      </div>

    </div>
  );
};

export default Editor;