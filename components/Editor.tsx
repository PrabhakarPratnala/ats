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

  const SectionHeader = ({ id, icon: Icon, title, subtitle }: { id: string, icon: any, title: string, subtitle?: string }) => (
    <button
      onClick={() => setActiveSection(activeSection === id ? '' : id)}
      className={`w-full flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 group`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg transition-colors ${activeSection === id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
          <Icon size={18} />
        </div>
        <div className="text-left">
          <span className={`block font-semibold ${activeSection === id ? 'text-gray-900' : 'text-gray-700'}`}>{title}</span>
          {subtitle && <span className="text-xs text-gray-400 font-normal">{subtitle}</span>}
        </div>
      </div>
      {activeSection === id ? <ChevronUp size={16} className="text-indigo-500" /> : <ChevronDown size={16} className="text-gray-400" />}
    </button>
  );

  return (
    <div className="bg-white h-full overflow-y-auto custom-scrollbar flex flex-col">
      
      {/* Import Section */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Already have a resume?</h3>
            <p className="text-xs text-gray-600">Upload your PDF or Image to auto-fill details using AI.</p>
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={genState.isGenerating}
          className="w-full bg-white border-2 border-dashed border-indigo-200 text-indigo-700 py-4 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-2 text-sm font-medium shadow-sm disabled:opacity-50 group"
        >
          {genState.isGenerating && genState.type === 'import' ? (
             <div className="flex flex-col items-center gap-2">
               <Loader2 size={24} className="animate-spin text-indigo-600" />
               <span className="text-xs text-indigo-500">Analyzing document...</span>
             </div>
          ) : (
             <>
               <UploadCloud size={24} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
               <span>Click to Upload Resume</span>
             </>
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
        <SectionHeader id="personal" icon={User} title="Personal Information" subtitle="Contact & Profile" />
        {activeSection === 'personal' && (
          <div className="p-6 grid grid-cols-1 gap-5 bg-white animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Full Name</label>
                <input type="text" className="input-field" value={data.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Target Job Title</label>
                <input type="text" className="input-field" value={data.experience[0]?.position || ''} disabled title="Set in experience section" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Email</label>
                <input type="email" className="input-field" value={data.email} onChange={(e) => updateField('email', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Phone</label>
                <input type="tel" className="input-field" value={data.phone} onChange={(e) => updateField('phone', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-500">Location</label>
                <input type="text" className="input-field" value={data.location} onChange={(e) => updateField('location', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                 <label className="text-xs font-medium text-gray-500">LinkedIn / Portfolio</label>
                 <input type="text" className="input-field" value={data.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 mt-2">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-700">Professional Summary</label>
                <button 
                  onClick={handleGenerateSummary}
                  disabled={genState.isGenerating}
                  className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {genState.isGenerating && genState.type === 'summary' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  Auto-Write
                </button>
              </div>
              <textarea 
                className="input-field min-h-[120px] resize-y" 
                placeholder="Brief summary of your career highlights..."
                value={data.summary}
                onChange={(e) => updateField('summary', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 2. Experience */}
        <SectionHeader id="experience" icon={Briefcase} title="Experience" subtitle="Work History" />
        {activeSection === 'experience' && (
          <div className="p-6 bg-gray-50/50 space-y-6 animate-fadeIn">
            {data.experience.map((exp, index) => (
              <div key={exp.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 relative group transition-all hover:shadow-md">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => removeExperience(exp.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Position {index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-500">Job Title</label>
                     <input type="text" className="input-field" value={exp.position} onChange={(e) => updateExperience(exp.id, 'position', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-500">Company</label>
                     <input type="text" className="input-field" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-500">Start Date</label>
                     <input type="text" placeholder="e.g. 2020 or Mar 2020" className="input-field" value={exp.startDate} onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-500">End Date</label>
                     <div className="flex gap-3">
                        <input type="text" placeholder="e.g. 2022" className="input-field" value={exp.endDate} disabled={exp.current} onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" checked={exp.current} onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)} />
                          <span className="text-xs font-medium text-gray-600">Present</span>
                        </label>
                     </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                   <div className="flex justify-between items-end">
                      <label className="text-xs font-medium text-gray-500">Responsibilities & Achievements</label>
                      <button 
                        onClick={() => handleEnhanceDescription(exp.id, exp.description, exp.position)}
                        disabled={genState.isGenerating}
                        className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-700 disabled:opacity-50"
                      >
                        {genState.isGenerating && genState.targetId === exp.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Enhance with AI
                      </button>
                   </div>
                   <textarea 
                    className="input-field min-h-[140px] text-sm leading-relaxed"
                    placeholder="• Led a team of..."
                    value={exp.description} 
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} 
                  />
                </div>
              </div>
            ))}
            <button onClick={addExperience} className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 font-medium text-sm">
              <Plus size={18} /> Add Position
            </button>
          </div>
        )}

        {/* 3. Skills */}
        <SectionHeader id="skills" icon={Code} title="Skills" subtitle="Technologies & Languages" />
        {activeSection === 'skills' && (
          <div className="p-6 bg-white animate-fadeIn">
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">Skills List</label>
              <input 
                type="text" 
                placeholder="Type skills separated by commas..." 
                className="input-field py-3" 
                value={data.skills.join(', ')} 
                onChange={handleSkillsChange} 
              />
              <p className="text-xs text-gray-400 mt-2">e.g. React, Node.js, Project Management, Figma</p>
            </div>
            
            {data.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                {data.skills.filter(s => s).map((skill, i) => (
                  <span key={i} className="bg-white text-gray-700 px-3 py-1.5 rounded-md text-sm border border-gray-200 shadow-sm flex items-center gap-2">
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
          <div className="p-6 bg-gray-50/50 space-y-4 animate-fadeIn">
             {data.education.map((edu, index) => (
              <div key={edu.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 relative group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => removeEducation(edu.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Education {index + 1}</h4>

                <div className="space-y-4">
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-500">School / University</label>
                     <input type="text" className="input-field" value={edu.school} onChange={(e) => updateEducation(edu.id, 'school', e.target.value)} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Degree</label>
                        <input type="text" className="input-field" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Field of Study</label>
                        <input type="text" className="input-field" value={edu.field} onChange={(e) => updateEducation(edu.id, 'field', e.target.value)} />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Start Year</label>
                        <input type="text" className="input-field" value={edu.startDate} onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">End Year</label>
                        <input type="text" className="input-field" value={edu.endDate} onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)} />
                     </div>
                   </div>
                </div>
              </div>
             ))}
             <button onClick={addEducation} className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 font-medium text-sm">
              <Plus size={18} /> Add Education
            </button>
          </div>
        )}

        {/* 5. Projects */}
        <SectionHeader id="projects" icon={FolderGit2} title="Projects" subtitle="Side Projects & Open Source" />
        {activeSection === 'projects' && (
          <div className="p-6 bg-gray-50/50 space-y-4 animate-fadeIn">
             {data.projects.map((proj, index) => (
               <div key={proj.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 relative group">
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => removeProject(proj.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Project {index + 1}</h4>
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-xs font-medium text-gray-500">Project Name</label>
                         <input type="text" className="input-field" value={proj.name} onChange={(e) => updateProject(proj.id, 'name', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-medium text-gray-500">Link URL</label>
                         <input type="text" className="input-field" value={proj.link || ''} onChange={(e) => updateProject(proj.id, 'link', e.target.value)} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Description</label>
                      <textarea className="input-field min-h-[100px]" value={proj.description} onChange={(e) => updateProject(proj.id, 'description', e.target.value)} />
                   </div>
                 </div>
               </div>
             ))}
             <button onClick={addProject} className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 font-medium text-sm">
              <Plus size={18} /> Add Project
            </button>
          </div>
        )}
      </div>

      {/* Analysis Button - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white z-10 sticky bottom-0">
        <button 
          onClick={onAnalyze}
          disabled={genState.isGenerating}
          className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:from-slate-800 hover:to-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {genState.isGenerating && genState.type === 'review' ? (
             <Loader2 size={18} className="animate-spin" />
          ) : (
             <Sparkles size={18} className="text-yellow-300 group-hover:scale-110 transition-transform" />
          )}
          <span className="font-semibold tracking-wide">Review ATS Compatibility</span>
        </button>
      </div>

    </div>
  );
};

export default Editor;
