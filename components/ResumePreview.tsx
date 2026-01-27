import React from 'react';
import { ResumeData, TemplateType } from '../types';
import { MapPin, Mail, Phone, Globe, Linkedin, ExternalLink, Github, Briefcase, GraduationCap, Code, TerminalSquare, FolderGit2, Award, User } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  template: TemplateType;
  viewMode?: 'resume' | 'cover-letter';
  customColor?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  pagePadding?: number;
  sectionSpacing?: number;
}

// --- UTILS ---

const getIconClass = (skill: string) => {
  const normalized = skill.toLowerCase().trim();
  const map: Record<string, string> = {
    'c++': 'cplusplus', 'c#': 'csharp', 'cpp': 'cplusplus', '.net': 'dot-net', 'golang': 'go', 'aws': 'amazonwebservices',
    'node': 'nodejs', 'node.js': 'nodejs', 'react': 'react', 'react.js': 'react', 'reactjs': 'react', 'vue': 'vuejs',
    'angular': 'angularjs', 'html': 'html5', 'css': 'css3', 'js': 'javascript', 'ts': 'typescript', 'postgres': 'postgresql',
    'sql': 'mysql', 'mongo': 'mongodb', 'python': 'python', 'java': 'java', 'git': 'git', 'docker': 'docker',
    'kubernetes': 'kubernetes', 'figma': 'figma', 'flutter': 'flutter', 'dart': 'dart', 'sass': 'sass', 'tailwind': 'tailwindcss',
    'bootstrap': 'bootstrap', 'linux': 'linux', 'ubuntu': 'ubuntu', 'photoshop': 'photoshop', 'illustrator': 'illustrator'
  };
  const key = map[normalized] || normalized.replace(/[\s\.]/g, '');
  return `devicon-${key}-plain`;
};

const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#000000';
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128 ? '#000000' : '#ffffff';
};

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- SUB-COMPONENTS ---

const SkillItem: React.FC<{ skill: string, showIcon?: boolean, className?: string, iconClassName?: string }> = ({ skill, showIcon, className, iconClassName }) => {
  if (!showIcon) return <span className={className}>{skill}</span>;
  const iconClass = getIconClass(skill);
  return (
    <span className={`${className} inline-flex items-center gap-1.5`}>
      <i className={`${iconClass} ${iconClassName || 'text-sm'}`} aria-hidden="true"></i>
      {skill}
    </span>
  );
};

const ContactItem = ({ icon: Icon, text, link, className, iconSize = 12 }: any) => {
  if (!text) return null;
  return (
      <div className={`flex items-center gap-2 ${className}`}>
          {Icon && <Icon size={iconSize} className="opacity-70 shrink-0" />}
          {link ? (
              <a href={link} target="_blank" rel="noreferrer" className="hover:underline text-inherit">{text}</a>
          ) : (
              <span>{text}</span>
          )}
      </div>
  );
};

// --- SECTION RENDERER FACTORY ---

interface SectionRendererProps {
  id: string;
  data: ResumeData;
  customColor?: string;
  styleVariant?: string;
  showIcons?: boolean;
  marginBottom?: number;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ 
    id, 
    data, 
    customColor, 
    styleVariant = 'standard', // 'standard' | 'minimal' | 'sidebar-dark' | 'sidebar-light' | 'technical' | 'serif' | 'contrast' | 'grid'
    showIcons = true,
    marginBottom = 24
}) => {
    
    // -- COMMON STYLES --
    const headerClass = {
        'standard': `uppercase tracking-wider font-bold text-sm mb-3 border-b pb-1 mt-5 first:mt-0`,
        'minimal': `uppercase tracking-widest font-bold text-sm mb-4 mt-6 first:mt-0 text-slate-900`,
        'sidebar-dark': `uppercase tracking-widest font-bold text-xs mb-3 text-white/90 border-b border-white/20 pb-1 mt-6 first:mt-0`,
        'sidebar-light': `uppercase tracking-wider font-bold text-sm mb-3 text-slate-800 border-b border-slate-200 pb-1 mt-6 first:mt-0`,
        'technical': `font-mono font-bold text-sm mb-3 mt-6 first:mt-0 bg-slate-100 p-1.5 border-l-4 text-slate-800 uppercase tracking-tight flex justify-between items-center`,
        'serif': `uppercase tracking-widest font-bold text-sm text-slate-800 font-serif text-center mb-4 mt-6 first:mt-0 border-b border-slate-300 pb-1`,
        'contrast': `uppercase font-bold text-sm mb-4 mt-6 first:mt-0 flex items-center gap-2 text-slate-700`,
        'grid': `text-blue-700 font-bold text-sm mb-3 mt-5 first:mt-0 tracking-wide`,
    }[styleVariant || 'standard'] || '';

    const headerStyle = styleVariant === 'standard' ? { borderColor: hexToRgba(customColor || '#000', 0.3), color: customColor } : 
                        styleVariant === 'technical' ? { borderLeftColor: customColor } : 
                        styleVariant === 'grid' ? { color: customColor || '#1d4ed8' } : {};

    const textClass = styleVariant === 'sidebar-dark' ? 'text-white/80' : 'text-slate-700';
    const boldClass = styleVariant === 'sidebar-dark' ? 'text-white' : 'text-slate-900';
    const dateClass = styleVariant === 'technical' ? 'font-mono text-xs text-slate-500' : 
                      styleVariant === 'sidebar-dark' ? 'text-xs text-white/60 uppercase' : 
                      styleVariant === 'contrast' ? 'text-xs font-bold text-slate-500' :
                      'text-xs font-semibold text-slate-500 uppercase tracking-wide';

    // -- RENDERERS --

    const customSection = data.customSections?.find(s => s.id === id);
    if (customSection) {
        if (!customSection.items?.length) return null;
        return (
            <div className="break-inside-avoid" style={{ marginBottom }}>
                <h3 className={headerClass} style={headerStyle}>{customSection.title}</h3>
                <div className="space-y-3">
                    {customSection.items.map(item => (
                        <div key={item.id}>
                            <div className={`font-bold ${boldClass}`}>{item.name}</div>
                            <div className={`${textClass} text-sm whitespace-pre-line`}>{item.description}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    switch (id) {
        case 'summary':
            if (!data.summary) return null;
            return (
                <div className="break-inside-avoid" style={{ marginBottom }}>
                     {styleVariant === 'contrast' && <h3 className={headerClass} style={headerStyle}><User size={16} className="text-slate-400"/> Profile</h3>}
                     {styleVariant !== 'contrast' && <h3 className={headerClass} style={headerStyle}>Summary</h3>}
                    <p className={`text-justify leading-relaxed text-sm ${textClass} ${styleVariant === 'serif' ? 'italic' : ''}`}>{data.summary}</p>
                </div>
            );
        case 'experience':
            if (!data.experience.length) return null;
            return (
                <div style={{ marginBottom }}>
                    {styleVariant === 'contrast' ? (
                       <h3 className={headerClass} style={headerStyle}><Briefcase size={16} className="text-slate-400"/> Experiences</h3>
                    ) : (
                       <h3 className={headerClass} style={headerStyle}>Experience</h3>
                    )}
                    
                    <div className={`${styleVariant === 'technical' ? 'space-y-4' : 'space-y-5'} ${styleVariant === 'contrast' ? 'border-l-2 border-slate-200 ml-2 pl-6' : ''}`}>
                        {data.experience.map(exp => (
                            <div key={exp.id} className={`break-inside-avoid ${styleVariant === 'contrast' ? 'relative' : ''}`}>
                                {styleVariant === 'contrast' && <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>}
                                
                                <div className={`flex justify-between items-baseline mb-1 ${styleVariant === 'serif' ? 'flex-col items-center text-center' : ''}`}>
                                    <h4 className={`font-bold ${boldClass} text-[1.05em] uppercase`}>{exp.position}</h4>
                                    <span className={dateClass}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                                </div>
                                <div className={`font-semibold text-sm mb-2 ${styleVariant === 'sidebar-dark' ? 'text-indigo-200' : ''} ${styleVariant === 'serif' ? 'text-slate-600 italic text-center' : ''}`} style={{ color: (styleVariant !== 'sidebar-dark' && styleVariant !== 'serif' && styleVariant !== 'minimal' && styleVariant !== 'contrast') ? customColor : undefined }}>{exp.company}</div>
                                <p className={`whitespace-pre-line text-sm leading-relaxed ${textClass} ${styleVariant === 'serif' ? 'text-center' : ''}`}>{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'education':
            if (!data.education.length) return null;
            return (
                <div className="break-inside-avoid" style={{ marginBottom }}>
                     {styleVariant === 'contrast' ? (
                       <h3 className={headerClass} style={headerStyle}><GraduationCap size={16} className="text-slate-400"/> Educations</h3>
                    ) : (
                       <h3 className={headerClass} style={headerStyle}>Education</h3>
                    )}
                    <div className={`${styleVariant === 'contrast' ? 'border-l-2 border-slate-200 ml-2 pl-6 space-y-5' : 'space-y-4'}`}>
                        {data.education.map(edu => (
                            <div key={edu.id} className={`${styleVariant === 'serif' ? 'text-center' : ''} ${styleVariant === 'contrast' ? 'relative' : ''}`}>
                                {styleVariant === 'contrast' && <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>}
                                <div className={`flex justify-between items-baseline mb-0.5 ${styleVariant === 'serif' ? 'flex-col items-center' : ''}`}>
                                    <h4 className={`font-bold ${boldClass} uppercase`}>{edu.school}</h4>
                                    <span className={dateClass}>{edu.startDate} – {edu.endDate}</span>
                                </div>
                                <div className={textClass}>{edu.degree} {edu.field && <span className="italic">in {edu.field}</span>}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'skills':
            if (!data.skills.length) return null;
            return (
                <div className="break-inside-avoid" style={{ marginBottom }}>
                    <h3 className={headerClass} style={headerStyle}>{styleVariant === 'contrast' ? 'Pro Skills' : 'Skills'}</h3>
                    {styleVariant === 'contrast' ? (
                        <div className="space-y-3">
                           {data.skills.map((skill, i) => (
                               <div key={i} className="mb-2">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs font-bold text-white">{skill}</span>
                                  </div>
                                  <div className="w-full bg-slate-600 rounded-full h-1.5">
                                    <div className="bg-white h-1.5 rounded-full" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                                  </div>
                               </div>
                           ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-x-3 gap-y-2">
                            {data.skills.map((skill, i) => (
                                <SkillItem 
                                    key={i} 
                                    skill={skill} 
                                    showIcon={showIcons} 
                                    className={`font-medium ${styleVariant === 'sidebar-dark' ? 'text-white/90 bg-white/10 px-2 py-1 rounded text-xs' : styleVariant === 'technical' ? 'font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-700' : 'text-slate-700 text-sm'}`} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            );
        case 'softwares':
            if (!data.softwares.length) return null;
            const hasDescriptions = data.softwares.some(item => item.description && item.description.trim().length > 0);
            return (
                <div className="break-inside-avoid" style={{ marginBottom }}>
                    <h3 className={headerClass} style={headerStyle}>Software & Tools</h3>
                    {hasDescriptions ? (
                        <div className="space-y-3">
                            {data.softwares.map((item) => (
                                <div key={item.id} className="break-inside-avoid">
                                     <div className="flex items-center gap-2">
                                         <SkillItem skill={item.name} showIcon={showIcons} className={`font-bold ${boldClass} text-sm`} />
                                     </div>
                                     {item.description && <div className={`${textClass} text-xs mt-0.5 leading-relaxed`}>{item.description}</div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {data.softwares.map((item) => (
                                <SkillItem 
                                  key={item.id} 
                                  skill={item.name} 
                                  showIcon={showIcons} 
                                  className={`${styleVariant === 'sidebar-dark' ? 'bg-white/10 text-white border-white/10' : 'bg-slate-100 border-slate-200 text-slate-700'} border px-2 py-1 rounded text-xs ${styleVariant === 'technical' ? 'font-mono' : ''}`} 
                                  iconClassName="text-xs" 
                                />
                            ))}
                        </div>
                    )}
                </div>
            );
        case 'projects':
            if (!data.projects.length) return null;
            return (
                <div className="break-inside-avoid" style={{ marginBottom }}>
                     {styleVariant === 'contrast' ? (
                       <h3 className={headerClass} style={headerStyle}><FolderGit2 size={16} className="text-slate-400"/> Projects</h3>
                    ) : (
                       <h3 className={headerClass} style={headerStyle}>Projects</h3>
                    )}
                    <div className="space-y-4">
                        {data.projects.map(proj => (
                            <div key={proj.id} className={styleVariant === 'serif' ? 'text-center' : ''}>
                                <div className={`flex justify-between items-baseline mb-1 ${styleVariant === 'serif' ? 'flex-col items-center' : ''}`}>
                                    <h4 className={`font-bold ${boldClass}`}>{proj.name}</h4>
                                    {proj.link && (
                                        <a href={proj.link} target="_blank" rel="noreferrer" className={`text-xs flex items-center gap-1 hover:underline ${styleVariant === 'sidebar-dark' ? 'text-indigo-300' : ''}`} style={{ color: styleVariant !== 'sidebar-dark' && styleVariant !== 'serif' ? customColor : undefined }}>
                                            <ExternalLink size={10} /> View
                                        </a>
                                    )}
                                </div>
                                <p className={`${textClass} text-sm`}>{proj.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        default: return null;
    }
};

// --- MAIN PREVIEW COMPONENT ---

export const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  data, 
  template, 
  viewMode = 'resume', 
  customColor = '#4f46e5',
  fontFamily = 'Inter, sans-serif',
  fontSize = 11,
  lineHeight = 1.4,
  pagePadding = 48, // Default 12 * 4 = 48
  sectionSpacing = 24 // Default 6 * 4 = 24
}) => {
  
  // -- LAYOUT SELECTION LOGIC --
  
  const isLayoutSidebarLeft = template === TemplateType.DESIGNER || template === TemplateType.SERVICE;
  const isLayoutColumnRight = template === TemplateType.ANALYST || template === TemplateType.EXECUTIVE || template === TemplateType.STARTUP;
  const isLayoutBanner = template === TemplateType.CREATIVE || template === TemplateType.MODERN;
  const isLayoutCentered = template === TemplateType.CLASSIC || template === TemplateType.ELEGANT || template === TemplateType.ACADEMIC;
  const isLayoutTechnical = template === TemplateType.TECHNICAL;
  const isLayoutMinimal = template === TemplateType.MINIMAL || template === TemplateType.CORPORATE;
  const isLayoutContrast = template === TemplateType.CONTRAST;
  const isLayoutGrid = template === TemplateType.GRID;

  // -- CONFIG --
  
  const containerStyle = {
    fontFamily: isLayoutTechnical ? '"Roboto Mono", monospace' : 
                (isLayoutCentered ? 'Merriweather, serif' : fontFamily),
    fontSize: `${fontSize}pt`,
    color: '#334155',
    lineHeight: lineHeight,
  };

  // --- VIEW: COVER LETTER ---
  if (viewMode === 'cover-letter') {
     const clContent = data.coverLetter?.content || "Dear Hiring Manager,\n\nI am writing to express my interest in the position...";
     const clDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
     const recipientName = data.coverLetter?.recipientName || 'Hiring Manager';
     const recipientTitle = data.coverLetter?.recipientTitle;
     const companyName = data.coverLetter?.companyName;
     const companyAddress = data.coverLetter?.companyAddress;

     const RecipientBlock = () => (
        <div className="mb-8 space-y-0.5 text-slate-700 text-sm">
             <div className="font-bold text-slate-900">{recipientName}</div>
             {recipientTitle && <div>{recipientTitle}</div>}
             {companyName && <div>{companyName}</div>}
             {companyAddress && <div>{companyAddress}</div>}
        </div>
     );

     const LetterBody = ({ className }: {className?: string}) => (
        <div className={`text-sm leading-relaxed whitespace-pre-line text-justify ${className}`}>
             <div className="mb-6">Dear {recipientName},</div>
             <div className="min-h-[200px]">{clContent}</div>
             <div className="mt-8">
                <div>Sincerely,</div>
                <div className="mt-8 font-bold text-lg">{data.fullName}</div>
             </div>
        </div>
     );

     // --- CL: SIDEBAR LEFT ---
     if (isLayoutSidebarLeft) {
        return (
            <div style={containerStyle} className="h-full w-full bg-white flex min-h-[297mm]">
                 <div className="w-[32%] shrink-0 text-white space-y-8" style={{ backgroundColor: '#1e293b', padding: pagePadding * 0.8 }}>
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold text-white/30 mx-auto border-2 border-white/10">{data.fullName.charAt(0)}</div>
                      <div className="text-center">
                          <h1 className="text-xl font-bold">{data.fullName}</h1>
                          <p className="text-white/70 text-sm">{data.jobTitle}</p>
                      </div>
                      <div className="space-y-3 text-sm opacity-90 pt-8 border-t border-white/10">
                          <ContactItem icon={Mail} text={data.email} link={`mailto:${data.email}`} className="text-white/80" />
                          <ContactItem icon={Phone} text={data.phone} link={`tel:${data.phone}`} className="text-white/80" />
                          <ContactItem icon={MapPin} text={data.location} className="text-white/80" />
                          <ContactItem icon={Linkedin} text="LinkedIn" link={data.linkedin} className="text-white/80" />
                          <ContactItem icon={Globe} text="Portfolio" link={data.website} className="text-white/80" />
                      </div>
                 </div>
                 <div className="flex-1" style={{ padding: pagePadding }}>
                      <div className="text-slate-500 font-medium mb-10 text-right text-sm">{clDate}</div>
                      <RecipientBlock />
                      <LetterBody className="text-slate-700" />
                 </div>
            </div>
        );
     }

     // --- CL: CONTRAST (Sidebar Right) ---
     if (isLayoutContrast) {
        return (
            <div style={containerStyle} className="h-full w-full bg-white flex min-h-[297mm]">
                <div className="flex-1" style={{ padding: pagePadding, paddingTop: pagePadding + 16 }}>
                     <div className="text-slate-500 font-medium mb-10 text-sm">{clDate}</div>
                     <RecipientBlock />
                     <LetterBody className="text-slate-700" />
                </div>
                <div className="w-[35%] bg-slate-700 text-white flex flex-col items-center text-center" style={{ padding: pagePadding * 0.8 }}>
                     <div className="w-32 h-32 rounded-full bg-slate-500 mb-6 flex items-center justify-center text-3xl font-bold text-slate-300 border-4 border-slate-600">
                        {data.fullName.charAt(0)}
                     </div>
                     <h1 className="text-2xl font-bold uppercase mb-2 leading-tight">{data.fullName}</h1>
                     <div className="text-slate-300 font-medium mb-8 pb-8 border-b border-slate-600 w-full">{data.jobTitle}</div>
                     <div className="space-y-4 text-sm text-slate-300 text-left w-full">
                        <div className="flex items-center gap-3"><Phone size={14}/> {data.phone}</div>
                        <div className="flex items-center gap-3"><Mail size={14}/> <span className="break-all">{data.email}</span></div>
                        <div className="flex items-center gap-3"><MapPin size={14}/> {data.location}</div>
                        {data.linkedin && <div className="flex items-center gap-3"><Linkedin size={14}/> LinkedIn</div>}
                        {data.website && <div className="flex items-center gap-3"><Globe size={14}/> Website</div>}
                     </div>
                </div>
            </div>
        );
     }

     // --- CL: BANNER ---
     if (isLayoutBanner) {
        return (
            <div style={containerStyle} className="h-full w-full bg-white min-h-[297mm]">
                <div className="text-white" style={{ backgroundColor: customColor, padding: pagePadding }}>
                  <h1 className="text-4xl font-bold mb-2 tracking-tight">{data.fullName}</h1>
                  <p className="text-lg opacity-90 font-medium mb-6">{data.jobTitle}</p>
                  <div className="flex flex-wrap gap-6 text-sm font-medium opacity-80">
                      <ContactItem icon={Mail} text={data.email} />
                      <ContactItem icon={Phone} text={data.phone} />
                      <ContactItem icon={MapPin} text={data.location} />
                      {data.website && <ContactItem icon={Globe} text={data.website} />}
                  </div>
                </div>
                <div style={{ padding: pagePadding }}>
                    <div className="text-slate-500 font-medium mb-8 text-sm">{clDate}</div>
                    <RecipientBlock />
                    <LetterBody className="text-slate-700" />
                </div>
            </div>
        );
     }

     // --- CL: CENTERED ---
     if (isLayoutCentered) {
         return (
             <div style={{ ...containerStyle, padding: pagePadding }} className="h-full w-full bg-white min-h-[297mm]">
                 <div className="text-center mb-12 border-b-2 border-slate-900 pb-8">
                      <h1 className="text-4xl font-bold mb-3 text-slate-900 font-serif">{data.fullName}</h1>
                      <div className="text-lg text-slate-600 mb-4 italic font-serif">{data.jobTitle}</div>
                      <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-slate-600 font-serif">
                          <span>{data.email}</span><span className="opacity-30">•</span>
                          <span>{data.phone}</span><span className="opacity-30">•</span>
                          <span>{data.location}</span>
                      </div>
                 </div>
                 <div className="max-w-3xl mx-auto font-serif">
                     <div className="text-slate-600 mb-8 text-right italic text-sm">{clDate}</div>
                     <RecipientBlock />
                     <LetterBody className="text-slate-800" />
                 </div>
             </div>
         );
     }

     // --- CL: TECHNICAL ---
     if (isLayoutTechnical) {
         return (
            <div style={{ ...containerStyle, padding: pagePadding }} className="h-full w-full bg-slate-50 min-h-[297mm]">
                <div className="bg-white border border-slate-300 p-8 shadow-sm mb-6 font-mono text-sm">
                    <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                        <span className="text-slate-400">FROM:</span>
                        <span className="font-bold text-slate-900 uppercase">{data.fullName} // {data.jobTitle}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                        <span className="text-slate-400">CONTACT:</span>
                        <span className="text-slate-700">{data.email} | {data.phone} | {data.location}</span>
                    </div>
                    <div className="w-full h-px bg-slate-200 my-4"></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                        <span className="text-slate-400">TO:</span>
                        <span className="font-bold text-slate-900">{recipientName}</span>
                    </div>
                    {companyName && (
                        <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                            <span className="text-slate-400">COMPANY:</span>
                            <span className="text-slate-700">{companyName}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-slate-400">DATE:</span>
                        <span className="text-slate-700">{clDate}</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-300 p-10 shadow-sm min-h-[500px]">
                    <LetterBody className="text-slate-700 font-mono text-xs md:text-sm" />
                </div>
            </div>
         );
     }

     // --- CL: GRID ---
     if (isLayoutGrid) {
         return (
            <div style={containerStyle} className="h-full w-full bg-white flex flex-col min-h-[297mm]">
                <div className="w-full relative overflow-hidden" style={{ minHeight: '160px' }}>
                    <div className="absolute inset-0 z-0" style={{ 
                        backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}></div>
                    <div className="relative z-10 pt-12 pb-6" style={{ paddingLeft: pagePadding, paddingRight: pagePadding }}>
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-5xl font-black text-blue-700 uppercase tracking-tighter mb-2" style={{ color: customColor }}>{data.fullName}</h1>
                                <div className="text-xl font-bold text-slate-700">{data.jobTitle}</div>
                            </div>
                            <div className="text-right text-xs font-bold text-blue-600 space-y-1" style={{ color: customColor }}>
                                <div>{data.phone}</div>
                                <div>{data.email}</div>
                                <div>{data.location}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 py-10" style={{ paddingLeft: pagePadding, paddingRight: pagePadding }}>
                    <div className="border-l-4 border-blue-200 pl-6 ml-2">
                        <div className="text-slate-500 font-bold text-sm mb-6 uppercase tracking-wider">{clDate}</div>
                        <RecipientBlock />
                        <LetterBody className="text-slate-700" />
                    </div>
                </div>
            </div>
         );
     }

     // --- CL: STANDARD (Default) ---
     return (
        <div style={{ ...containerStyle, padding: pagePadding }} className="h-full w-full bg-white min-h-[297mm]">
           <div className="mb-12 border-b pb-6" style={{ borderColor: customColor }}>
               <h1 className="text-4xl font-bold text-slate-900 mb-2 uppercase tracking-tight">{data.fullName}</h1>
               <div className="flex justify-between items-end">
                   <div className="text-lg text-slate-600 font-medium" style={{ color: customColor }}>{data.jobTitle}</div>
                   <div className="text-right text-xs text-slate-500 space-y-0.5">
                       <div>{data.email}</div>
                       <div>{data.phone}</div>
                       <div>{data.location}</div>
                   </div>
               </div>
           </div>

           <div className="mb-8 text-slate-900 font-medium text-sm">
             {clDate}
           </div>
           
           <RecipientBlock />
           <LetterBody className="text-slate-700" />
        </div>
     );
  }

  // --- LAYOUT 1: SIDEBAR LEFT (Designer, Service) ---
  if (isLayoutSidebarLeft) {
      const sidebarSections = ['skills', 'education', 'softwares']; 
      const mainSections = data.sectionOrder.filter(s => !sidebarSections.includes(s));
      
      return (
        <div style={containerStyle} className="h-full w-full bg-white flex min-h-[297mm]">
            <div className="w-[32%] shrink-0 text-white space-y-8" style={{ backgroundColor: '#1e293b', padding: pagePadding * 0.8 }}>
                <div className="space-y-6">
                    {/* Optional Photo Circle */}
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold text-white/30 mx-auto border-2 border-white/10">{data.fullName.charAt(0)}</div>
                    
                    <div className="space-y-3 text-sm opacity-90">
                        <ContactItem icon={Mail} text={data.email} link={`mailto:${data.email}`} className="text-white/80" />
                        <ContactItem icon={Phone} text={data.phone} link={`tel:${data.phone}`} className="text-white/80" />
                        <ContactItem icon={MapPin} text={data.location} className="text-white/80" />
                        <ContactItem icon={Linkedin} text="LinkedIn" link={data.linkedin} className="text-white/80" />
                        <ContactItem icon={Globe} text="Portfolio" link={data.website} className="text-white/80" />
                    </div>
                </div>
                {sidebarSections.map(sid => (
                    <SectionRenderer key={sid} id={sid} data={data} styleVariant="sidebar-dark" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                ))}
            </div>
            <div className="flex-1" style={{ padding: pagePadding }}>
                <div className="mb-10 border-b-4 pb-4" style={{ borderColor: customColor }}>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-2" style={{ color: customColor }}>{data.fullName}</h1>
                    <div className="text-2xl font-light text-slate-500">{data.jobTitle}</div>
                </div>
                {mainSections.map(sid => (
                    <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="standard" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                ))}
            </div>
        </div>
      );
  }

  // --- LAYOUT 2: COLUMN RIGHT (Analyst, Executive, Startup) ---
  if (isLayoutColumnRight) {
      // Body (Left) gets Experience, Summary, Projects. Right gets Skills, Education, Contact.
      const rightSections = ['education', 'skills', 'softwares']; 
      const leftSections = data.sectionOrder.filter(s => !rightSections.includes(s));

      return (
          <div style={{ ...containerStyle, padding: pagePadding }} className="h-full w-full bg-white">
              <div className="flex justify-between items-end border-b pb-6 mb-8 border-slate-200">
                  <div>
                      <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">{data.fullName}</h1>
                      <div className="text-xl text-slate-500 font-medium" style={{ color: customColor }}>{data.jobTitle}</div>
                  </div>
                  <div className="text-right text-sm text-slate-600 space-y-1">
                      <div>{data.email}</div>
                      <div>{data.phone}</div>
                      <div>{data.location}</div>
                  </div>
              </div>

              <div className="grid grid-cols-[1fr_16rem] gap-10">
                  <div>
                      {leftSections.map(sid => (
                           <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="standard" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                      ))}
                  </div>
                  <div className="pt-5">
                      {rightSections.map(sid => (
                           <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="sidebar-light" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                      ))}
                      {/* Extra Links in Right Col */}
                      {(data.linkedin || data.website) && (
                          <div className="pt-4 border-t border-slate-200">
                              <h3 className="uppercase tracking-wider font-bold text-sm mb-3 text-slate-800">Links</h3>
                              <div className="space-y-2 text-sm">
                                  {data.linkedin && <ContactItem icon={Linkedin} text="LinkedIn" link={data.linkedin} />}
                                  {data.website && <ContactItem icon={Globe} text="Portfolio" link={data.website} />}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- LAYOUT 3: BANNER TOP (Creative, Modern) ---
  if (isLayoutBanner) {
      return (
          <div style={containerStyle} className="h-full w-full bg-white">
              <div className="text-white" style={{ backgroundColor: customColor, padding: pagePadding }}>
                  <h1 className="text-5xl font-bold mb-2 tracking-tight">{data.fullName}</h1>
                  <p className="text-xl opacity-90 font-medium mb-6">{data.jobTitle}</p>
                  <div className="flex flex-wrap gap-6 text-sm font-medium opacity-80">
                      <ContactItem icon={Mail} text={data.email} link={`mailto:${data.email}`} />
                      <ContactItem icon={Phone} text={data.phone} link={`tel:${data.phone}`} />
                      <ContactItem icon={MapPin} text={data.location} />
                      {data.linkedin && <ContactItem icon={Linkedin} text="LinkedIn" link={data.linkedin} />}
                      {data.website && <ContactItem icon={Globe} text="Website" link={data.website} />}
                  </div>
              </div>
              <div style={{ padding: pagePadding }}>
                  {data.sectionOrder.map(sid => (
                      <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="standard" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                  ))}
              </div>
          </div>
      );
  }

  // --- LAYOUT 4: CENTERED SERIF (Classic, Elegant, Academic) ---
  if (isLayoutCentered) {
      return (
          <div style={{ ...containerStyle, padding: pagePadding }} className="h-full w-full bg-white">
              <div className="text-center mb-10 border-b-2 border-slate-900 pb-8">
                  <h1 className="text-4xl font-bold mb-3 text-slate-900 font-serif tracking-wide">{data.fullName}</h1>
                  <div className="text-lg text-slate-600 mb-4 italic">{data.jobTitle}</div>
                  <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-slate-600 font-serif">
                      <span>{data.email}</span>
                      <span className="opacity-30">•</span>
                      <span>{data.phone}</span>
                      <span className="opacity-30">•</span>
                      <span>{data.location}</span>
                  </div>
              </div>
              <div className="max-w-3xl mx-auto">
                   {data.sectionOrder.map(sid => (
                       <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="serif" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                   ))}
              </div>
          </div>
      );
  }

  // --- LAYOUT 5: TECHNICAL GRID (Technical) ---
  if (isLayoutTechnical) {
      return (
          <div style={{ ...containerStyle, padding: pagePadding }} className="h-full w-full bg-slate-50">
              <div className="bg-white border border-slate-300 p-8 mb-6 shadow-sm">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2 font-mono" style={{ color: customColor }}>{data.fullName}</h1>
                  <div className="text-lg text-slate-600 mb-4 font-mono">{data.jobTitle}</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono text-slate-500 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2"><Mail size={12}/> {data.email}</div>
                      <div className="flex items-center gap-2"><Phone size={12}/> {data.phone}</div>
                      <div className="flex items-center gap-2"><MapPin size={12}/> {data.location}</div>
                      {data.linkedin && <div className="flex items-center gap-2"><Linkedin size={12}/> LinkedIn</div>}
                      {data.website && <div className="flex items-center gap-2"><Globe size={12}/> Website</div>}
                  </div>
              </div>
              <div className="bg-white border border-slate-300 p-8 shadow-sm">
                  {data.sectionOrder.map(sid => (
                      <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="technical" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                  ))}
              </div>
          </div>
      );
  }

  // --- LAYOUT 6: CONTRAST (Razib Ferguson Style) ---
  if (isLayoutContrast) {
    const sidebarSections = ['skills', 'softwares']; 
    // We add specific items like Hobbies if present in customSections, else ignore
    const mainSections = data.sectionOrder.filter(s => !sidebarSections.includes(s));

    return (
        <div style={containerStyle} className="h-full w-full bg-white flex min-h-[297mm]">
            {/* Left Content (White) */}
            <div className="flex-1" style={{ padding: pagePadding, paddingTop: pagePadding + 16, paddingRight: pagePadding + 16 }}>
                 {mainSections.map(sid => (
                    <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="contrast" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                 ))}
            </div>
            
            {/* Right Sidebar (Dark) */}
            <div className="w-[35%] bg-slate-700 text-white flex flex-col items-center text-center" style={{ padding: pagePadding * 0.8 }}>
                 {/* Photo Placeholder */}
                 <div className="w-32 h-32 rounded-full bg-slate-500 mb-6 flex items-center justify-center text-3xl font-bold text-slate-300 border-4 border-slate-600">
                    {data.fullName.charAt(0)}
                 </div>
                 
                 <h1 className="text-2xl font-bold uppercase mb-2 leading-tight">{data.fullName}</h1>
                 <div className="text-slate-300 font-medium mb-6">{data.jobTitle}</div>
                 
                 <div className="w-12 h-0.5 bg-slate-500 mb-8"></div>
                 
                 <div className="w-full mb-8">
                    <h3 className="uppercase font-bold text-sm mb-4 border-b border-slate-600 pb-2">Contact</h3>
                    <div className="space-y-3 text-sm text-slate-300 text-left">
                        <div className="flex items-center gap-2"><Phone size={14}/> {data.phone}</div>
                        <div className="flex items-center gap-2"><Mail size={14}/> <span className="break-all">{data.email}</span></div>
                        <div className="flex items-center gap-2"><MapPin size={14}/> {data.location}</div>
                        {data.linkedin && <div className="flex items-center gap-2"><Linkedin size={14}/> LinkedIn</div>}
                    </div>
                 </div>

                 {sidebarSections.map(sid => (
                     <div key={sid} className="w-full text-left" style={{ marginBottom: sectionSpacing }}>
                        <SectionRenderer id={sid} data={data} styleVariant="contrast" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                     </div>
                 ))}
            </div>
        </div>
    );
  }

  // --- LAYOUT 7: GRID (Darlene Robertson Style) ---
  if (isLayoutGrid) {
      // Split layout logic
      const rightSections = ['education', 'skills', 'softwares'];
      const leftSections = data.sectionOrder.filter(s => !rightSections.includes(s));

      return (
        <div style={containerStyle} className="h-full w-full bg-white flex flex-col min-h-[297mm]">
            {/* Grid Header */}
            <div className="w-full relative overflow-hidden" style={{ minHeight: '180px' }}>
                {/* CSS Grid Background */}
                <div className="absolute inset-0 z-0" style={{ 
                    backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}></div>
                
                <div className="relative z-10 pt-16 pb-6" style={{ paddingLeft: pagePadding, paddingRight: pagePadding }}>
                    <h1 className="text-6xl font-black text-blue-700 uppercase tracking-tighter mb-12" style={{ color: customColor }}>{data.jobTitle || "Resume"}</h1>
                    
                    <div className="grid grid-cols-2 items-end border-t border-blue-200 pt-4">
                        <div className="text-2xl font-bold text-slate-800">{data.fullName}</div>
                        <div className="text-right text-xs font-bold text-blue-600 space-y-1" style={{ color: customColor }}>
                            <div>{data.phone} | {data.email}</div>
                            <div>{data.website || data.linkedin}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-12 py-8" style={{ paddingLeft: pagePadding, paddingRight: pagePadding }}>
                 {/* Left Column (Main) */}
                 <div className="flex-1">
                    {leftSections.map(sid => (
                         <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="grid" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                    ))}
                 </div>
                 
                 {/* Right Column (Secondary) */}
                 <div className="w-64 pt-2">
                    {rightSections.map(sid => (
                         <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="grid" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
                    ))}
                    <div className="mt-12">
                        <h1 className="text-6xl font-black text-slate-100 uppercase tracking-tighter select-none">RESUME</h1>
                    </div>
                 </div>
            </div>
        </div>
      );
  }

  // --- LAYOUT 8: MINIMAL (Minimal, Corporate) ---
  // Default fallback
  return (
      <div style={{ ...containerStyle, padding: pagePadding }} className="h-full w-full bg-white">
          <div className="mb-12">
              <h1 className="text-5xl font-bold mb-3 text-slate-900 tracking-tight">{data.fullName}</h1>
              <div className="text-xl text-slate-500 font-light">{data.jobTitle}</div>
              <div className="flex flex-wrap gap-6 mt-6 text-sm text-slate-400 font-medium">
                  <span>{data.email}</span>
                  <span>{data.phone}</span>
                  <span>{data.location}</span>
                  {data.website && <span>{data.website}</span>}
              </div>
          </div>
          <div>
               {data.sectionOrder.map(sid => (
                   <SectionRenderer key={sid} id={sid} data={data} customColor={customColor} styleVariant="minimal" showIcons={data.showSkillIcons} marginBottom={sectionSpacing} />
               ))}
          </div>
      </div>
  );
};
