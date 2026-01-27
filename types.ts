
export interface ResumeExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface ResumeEducation {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface ResumeProject {
  id: string;
  name: string;
  description: string;
  link?: string;
}

export interface CustomSectionItem {
  id: string;
  name: string;
  description: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface CoverLetterData {
  recipientName: string;
  recipientTitle: string;
  companyName: string;
  companyAddress: string;
  content: string;
}

export interface ResumeData {
  fullName: string;
  jobTitle?: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  softwares: CustomSectionItem[];
  projects: ResumeProject[];
  customSections: CustomSection[];
  sectionOrder: string[];
  showSkillIcons?: boolean;
  coverLetter?: CoverLetterData;
}

export enum TemplateType {
  MODERN = 'modern',
  CLASSIC = 'classic',
  MINIMAL = 'minimal',
  EXECUTIVE = 'executive',
  CREATIVE = 'creative',
  DESIGNER = 'designer',
  ANALYST = 'analyst',
  TECHNICAL = 'technical',
  ACADEMIC = 'academic',
  STARTUP = 'startup',
  SERVICE = 'service',
  ELEGANT = 'elegant',
  CORPORATE = 'corporate',
  CONTRAST = 'contrast',
  GRID = 'grid'
}

export interface GenerationState {
  isGenerating: boolean;
  type: 'summary' | 'experience' | 'review' | 'import' | 'cover-letter' | 'fix' | null;
  targetId?: string;
}

export type ATSIssueSeverity = 'critical' | 'warning' | 'info';

export interface ATSIssue {
  id: string;
  severity: ATSIssueSeverity;
  title: string;
  description: string;
  section?: string; // e.g., 'summary', 'experience', 'skills'
  targetId?: string; // ID of the specific item (e.g., experience ID)
  canAutoFix: boolean;
}

export interface ATSScoreData {
  score: number;
  issues: ATSIssue[];
}
