import React from 'react';
import { ResumeData, TemplateType } from '../types';
import { MapPin, Mail, Phone, Globe, Linkedin, ExternalLink } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  template: TemplateType;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, template }) => {
  
  // -- Template: Classic (Times New Roman-esque, very traditional ATS safe) --
  if (template === TemplateType.CLASSIC) {
    return (
      <div className="w-full h-full bg-white p-8 text-black font-serif leading-relaxed print:p-0">
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">{data.fullName}</h1>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>| {data.phone}</span>}
            {data.location && <span>| {data.location}</span>}
            {data.linkedin && <span>| {data.linkedin}</span>}
          </div>
        </div>

        {data.summary && (
          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-2">Professional Summary</h2>
            <p className="text-sm text-justify">{data.summary}</p>
          </div>
        )}

        {data.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3">Experience</h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between font-bold">
                  <span>{exp.company}</span>
                  <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div className="italic mb-1">{exp.position}</div>
                <div className="text-sm whitespace-pre-line pl-4">{exp.description}</div>
              </div>
            ))}
          </div>
        )}

        {data.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <div className="flex justify-between font-bold">
                  <span>{edu.school}</span>
                  <span>{edu.startDate} - {edu.endDate}</span>
                </div>
                <div className="text-sm">{edu.degree} in {edu.field}</div>
              </div>
            ))}
          </div>
        )}

        {data.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-2">Skills</h2>
            <p className="text-sm">{data.skills.join(' • ')}</p>
          </div>
        )}
      </div>
    );
  }

  // -- Template: Minimal (Clean sans-serif, gray accents) --
  if (template === TemplateType.MINIMAL) {
    return (
      <div className="w-full h-full bg-white p-10 text-gray-800 font-sans print:p-0">
        <header className="mb-8">
          <h1 className="text-4xl font-light text-gray-900 mb-2">{data.fullName}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {data.location && <div className="flex items-center gap-1"><MapPin size={12}/> {data.location}</div>}
            {data.email && <div className="flex items-center gap-1"><Mail size={12}/> {data.email}</div>}
            {data.phone && <div className="flex items-center gap-1"><Phone size={12}/> {data.phone}</div>}
            {data.linkedin && <div className="flex items-center gap-1"><Linkedin size={12}/> {data.linkedin}</div>}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {data.summary && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Profile</h3>
              <p className="text-sm leading-6 text-gray-700">{data.summary}</p>
            </section>
          )}

          {data.experience.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Work History</h3>
              <div className="space-y-6">
                {data.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                      <span className="text-xs text-gray-500">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{exp.company}</div>
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-2 gap-8">
            {data.education.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Education</h3>
                {data.education.map((edu) => (
                  <div key={edu.id} className="mb-3">
                    <div className="font-medium text-sm text-gray-900">{edu.school}</div>
                    <div className="text-xs text-gray-600">{edu.degree}, {edu.field}</div>
                    <div className="text-xs text-gray-400">{edu.endDate}</div>
                  </div>
                ))}
              </section>
            )}

            {data.skills.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -- Template: Executive (Sophisticated, serif headers, strong structure) --
  if (template === TemplateType.EXECUTIVE) {
    return (
      <div className="w-full h-full bg-white text-gray-800 font-serif leading-relaxed print:p-0">
        <header className="border-b-4 border-gray-900 pb-6 mb-8 px-10 pt-10">
            <h1 className="text-4xl font-bold uppercase tracking-widest text-gray-900 mb-4">{data.fullName}</h1>
            <div className="flex flex-wrap gap-6 text-sm font-sans text-gray-600">
               {data.email && <span className="flex items-center gap-2"><Mail size={14} className="text-gray-900"/> {data.email}</span>}
               {data.phone && <span className="flex items-center gap-2"><Phone size={14} className="text-gray-900"/> {data.phone}</span>}
               {data.location && <span className="flex items-center gap-2"><MapPin size={14} className="text-gray-900"/> {data.location}</span>}
               {data.linkedin && <span className="flex items-center gap-2"><Linkedin size={14} className="text-gray-900"/> {data.linkedin}</span>}
            </div>
        </header>

        <div className="px-10">
            {data.summary && (
              <section className="mb-8">
                <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-2 mb-4 font-sans">Executive Profile</h2>
                <p className="text-sm leading-7 text-gray-700">{data.summary}</p>
              </section>
            )}

            {data.experience.length > 0 && (
              <section className="mb-8">
                 <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-2 mb-6 font-sans">Professional Experience</h2>
                 <div className="space-y-6">
                   {data.experience.map(exp => (
                     <div key={exp.id}>
                       <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold text-lg text-gray-900">{exp.position}</h3>
                          <span className="text-sm font-sans font-medium text-gray-600">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                       </div>
                       <div className="text-md font-semibold text-gray-700 mb-2 italic">{exp.company}</div>
                       <p className="text-sm text-gray-700 whitespace-pre-line leading-6">{exp.description}</p>
                     </div>
                   ))}
                 </div>
              </section>
            )}

            <div className="grid grid-cols-2 gap-10">
               {data.education.length > 0 && (
                 <section>
                   <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-2 mb-4 font-sans">Education</h2>
                   {data.education.map(edu => (
                     <div key={edu.id} className="mb-4">
                       <div className="font-bold text-gray-900">{edu.school}</div>
                       <div className="text-sm text-gray-700">{edu.degree}, {edu.field}</div>
                       <div className="text-sm text-gray-500 font-sans">{edu.startDate} – {edu.endDate}</div>
                     </div>
                   ))}
                 </section>
               )}

               {data.skills.length > 0 && (
                 <section>
                   <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-2 mb-4 font-sans">Core Competencies</h2>
                   <div className="flex flex-wrap gap-2">
                      {data.skills.map((skill, i) => (
                        <span key={i} className="text-sm font-medium text-gray-800 bg-gray-100 px-3 py-1 border border-gray-200">
                          {skill}
                        </span>
                      ))}
                   </div>
                 </section>
               )}
            </div>
        </div>
      </div>
    );
  }

  // -- Template: Creative (Sidebar layout, Teal theme, visual flair) --
  if (template === TemplateType.CREATIVE) {
    return (
      <div className="w-full h-full bg-white flex text-slate-800 font-sans print:flex">
         {/* Sidebar */}
         <aside className="w-[35%] bg-teal-900 text-white p-8 flex flex-col gap-8 shrink-0">
            <div className="text-center">
               <div className="w-24 h-24 bg-teal-800 rounded-full mx-auto flex items-center justify-center text-3xl font-bold border-4 border-teal-700 mb-4 uppercase">
                 {data.fullName.split(' ').map(n => n[0]).join('').substring(0,2)}
               </div>
               <h1 className="text-2xl font-bold leading-tight mb-2">{data.fullName}</h1>
               <p className="text-teal-200 text-sm font-medium">{data.experience[0]?.position || 'Professional'}</p>
            </div>

            <div className="space-y-3 text-sm text-teal-100">
               {data.email && <div className="flex items-center gap-2 break-all"><Mail size={14} className="shrink-0"/> {data.email}</div>}
               {data.phone && <div className="flex items-center gap-2"><Phone size={14} className="shrink-0"/> {data.phone}</div>}
               {data.location && <div className="flex items-center gap-2"><MapPin size={14} className="shrink-0"/> {data.location}</div>}
               {data.website && <div className="flex items-center gap-2"><Globe size={14} className="shrink-0"/> {data.website}</div>}
            </div>

            {data.skills.length > 0 && (
              <div>
                <h3 className="font-bold uppercase tracking-widest border-b border-teal-700 pb-2 mb-4 text-sm">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill, i) => (
                    <span key={i} className="bg-teal-800 text-xs px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.education.length > 0 && (
               <div>
                  <h3 className="font-bold uppercase tracking-widest border-b border-teal-700 pb-2 mb-4 text-sm">Education</h3>
                  {data.education.map(edu => (
                    <div key={edu.id} className="mb-4 text-sm">
                       <div className="font-bold text-white">{edu.school}</div>
                       <div className="text-teal-200 mb-1">{edu.degree}</div>
                       <div className="text-xs text-teal-400">{edu.endDate}</div>
                    </div>
                  ))}
               </div>
            )}
         </aside>

         {/* Main Content */}
         <main className="flex-1 p-10 space-y-8">
            {data.summary && (
              <section>
                 <h2 className="text-2xl font-bold text-teal-900 mb-4 border-b-2 border-teal-100 pb-2">Profile</h2>
                 <p className="text-slate-600 leading-relaxed">{data.summary}</p>
              </section>
            )}

            {data.experience.length > 0 && (
              <section>
                 <h2 className="text-2xl font-bold text-teal-900 mb-6 border-b-2 border-teal-100 pb-2">Experience</h2>
                 <div className="space-y-8 border-l-2 border-teal-100 ml-2 pl-6">
                    {data.experience.map(exp => (
                      <div key={exp.id} className="relative">
                         <div className="absolute -left-[31px] top-1 w-4 h-4 bg-teal-500 rounded-full border-4 border-white"></div>
                         <h3 className="font-bold text-lg text-slate-800">{exp.position}</h3>
                         <div className="text-teal-600 font-medium mb-1">{exp.company}</div>
                         <div className="text-xs text-slate-400 mb-3 uppercase tracking-wide">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</div>
                         <p className="text-slate-600 text-sm whitespace-pre-line">{exp.description}</p>
                      </div>
                    ))}
                 </div>
              </section>
            )}

            {data.projects.length > 0 && (
               <section>
                  <h2 className="text-2xl font-bold text-teal-900 mb-4 border-b-2 border-teal-100 pb-2">Projects</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {data.projects.map(proj => (
                      <div key={proj.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <div className="font-bold text-slate-800 mb-1">{proj.name}</div>
                         {proj.link && <a href={proj.link} className="text-xs text-teal-600 hover:underline mb-2 block">{proj.link}</a>}
                         <p className="text-sm text-slate-600">{proj.description}</p>
                      </div>
                    ))}
                  </div>
               </section>
            )}
         </main>
      </div>
    );
  }

  // -- Template: Modern (Blue accents, robust structure) --
  return (
    <div className="w-full h-full bg-white p-0 flex flex-col h-full text-slate-800 font-sans print:block">
      <div className="bg-slate-900 text-white p-8">
        <h1 className="text-4xl font-bold mb-2">{data.fullName}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
           {data.email && <span className="flex items-center gap-1"><Mail size={14} /> {data.email}</span>}
           {data.phone && <span className="flex items-center gap-1"><Phone size={14} /> {data.phone}</span>}
           {data.location && <span className="flex items-center gap-1"><MapPin size={14} /> {data.location}</span>}
           {data.website && <span className="flex items-center gap-1"><Globe size={14} /> {data.website}</span>}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {data.summary && (
          <div>
             <h3 className="text-slate-900 font-bold uppercase border-b-2 border-blue-500 inline-block mb-3">About Me</h3>
             <p className="text-sm leading-relaxed text-slate-600">{data.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            {data.experience.length > 0 && (
              <div>
                <h3 className="text-slate-900 font-bold uppercase border-b-2 border-blue-500 inline-block mb-4">Experience</h3>
                <div className="space-y-5">
                  {data.experience.map((exp) => (
                    <div key={exp.id} className="relative pl-4 border-l-2 border-slate-200">
                       <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                       <h4 className="font-bold text-slate-800">{exp.position}</h4>
                       <div className="text-blue-600 text-sm font-medium mb-1">{exp.company}</div>
                       <div className="text-xs text-slate-400 mb-2">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</div>
                       <p className="text-sm text-slate-600 whitespace-pre-line">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.projects.length > 0 && (
              <div>
                 <h3 className="text-slate-900 font-bold uppercase border-b-2 border-blue-500 inline-block mb-4">Projects</h3>
                 <div className="space-y-4">
                  {data.projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800">{proj.name}</h4>
                        {proj.link && <a href={proj.link} target="_blank" rel="noreferrer"><ExternalLink size={12} className="text-blue-500"/></a>}
                      </div>
                      <p className="text-sm text-slate-600">{proj.description}</p>
                    </div>
                  ))}
                 </div>
              </div>
            )}
          </div>

          <div className="col-span-1 space-y-6">
             {data.skills.length > 0 && (
               <div>
                  <h3 className="text-slate-900 font-bold uppercase border-b-2 border-blue-500 inline-block mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, i) => (
                      <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
               </div>
             )}

             {data.education.length > 0 && (
               <div>
                  <h3 className="text-slate-900 font-bold uppercase border-b-2 border-blue-500 inline-block mb-4">Education</h3>
                  <div className="space-y-3">
                    {data.education.map((edu) => (
                      <div key={edu.id}>
                        <div className="font-bold text-slate-800 text-sm">{edu.school}</div>
                        <div className="text-xs text-slate-600">{edu.degree}</div>
                        <div className="text-xs text-blue-500">{edu.field}</div>
                        <div className="text-xs text-slate-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
