import { GoogleGenAI, Type, Chat } from "@google/genai";
import { ResumeData, ATSScoreData, ATSIssue } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = 'gemini-3-flash-preview';

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are a helpful AI assistant for a Resume Builder app called 'Resume Architect'. You help users with resume writing tips, career advice, interview preparation, and questions about how to write better resumes. Keep answers concise and helpful.",
    }
  });
};

// --- REAL-TIME LOCAL SCORING ENGINE ---
// This runs locally to avoid API latency/cost on every keystroke
export const calculateLocalATSScore = (data: ResumeData): ATSScoreData => {
  let score = 0;
  const issues: ATSIssue[] = [];

  // 1. Contact Info (Max 15)
  let contactScore = 0;
  if (data.email) contactScore += 5; else issues.push({ id: 'missing_email', severity: 'critical', title: 'Missing Email', description: 'Add your email address so recruiters can contact you.', section: 'personal', canAutoFix: false });
  if (data.phone) contactScore += 5; else issues.push({ id: 'missing_phone', severity: 'critical', title: 'Missing Phone', description: 'Add your phone number.', section: 'personal', canAutoFix: false });
  if (data.location) contactScore += 5; else issues.push({ id: 'missing_location', severity: 'warning', title: 'Missing Location', description: 'Add your City, State.', section: 'personal', canAutoFix: false });
  score += contactScore;

  // 2. Summary (Max 15)
  if (data.summary) {
    if (data.summary.length > 50) {
      score += 15;
    } else {
      score += 5;
      issues.push({ id: 'short_summary', severity: 'warning', title: 'Summary Too Short', description: 'Your summary is too brief. Expand it to 2-3 sentences highlighting key achievements.', section: 'summary', canAutoFix: true });
    }
  } else {
    issues.push({ id: 'missing_summary', severity: 'critical', title: 'Missing Summary', description: 'A professional summary is crucial for ATS parsing.', section: 'summary', canAutoFix: true });
  }

  // 3. Experience (Max 30)
  if (data.experience.length > 0) {
    score += 10; // Base points for having experience
    let hasNumbers = false;
    let hasActionVerbs = false;
    const numberRegex = /\d+|one|two|three|four|five|six|seven|eight|nine|ten/i;
    // Simple heuristic for action verbs (not exhaustive, but fast)
    const actionVerbRegex = /^(Led|Managed|Created|Developed|Designed|Implemented|Achieved|Increased|Decreased|Saved|Won|Awarded|Built|Engineered|Architected|Generated|Optimized)/i;

    data.experience.forEach(exp => {
      if (numberRegex.test(exp.description)) hasNumbers = true;
      if (actionVerbRegex.test(exp.description)) hasActionVerbs = true;
      
      if (exp.description.length < 20) {
         issues.push({ id: `short_exp_${exp.id}`, severity: 'warning', title: 'Role Description Too Short', description: `Expand the description for ${exp.position} at ${exp.company}.`, section: 'experience', targetId: exp.id, canAutoFix: true });
      }
    });

    if (hasNumbers) score += 10; 
    else issues.push({ id: 'exp_no_metrics', severity: 'warning', title: 'Missing Metrics', description: 'Quantify your achievements (e.g., "Improved X by 20%").', section: 'experience', canAutoFix: false }); // Hard to auto-fix metrics without input
    
    if (hasActionVerbs) score += 10;
    else issues.push({ id: 'exp_passive', severity: 'warning', title: 'Weak Action Verbs', description: 'Start bullet points with strong action verbs (e.g., Led, Created).', section: 'experience', canAutoFix: true });

  } else {
    issues.push({ id: 'missing_exp', severity: 'critical', title: 'No Experience Listed', description: 'Add your work history. This is the most important section.', section: 'experience', canAutoFix: false });
  }

  // 4. Skills (Max 20)
  if (data.skills.length + data.softwares.length >= 5) {
    score += 20;
  } else if (data.skills.length + data.softwares.length > 0) {
    score += 10;
    issues.push({ id: 'low_skills', severity: 'warning', title: 'Few Skills Listed', description: 'Add more relevant skills. ATS systems scan for these keywords.', section: 'skills', canAutoFix: false });
  } else {
    issues.push({ id: 'missing_skills', severity: 'critical', title: 'No Skills', description: 'List your technical and soft skills.', section: 'skills', canAutoFix: false });
  }

  // 5. Education (Max 10)
  if (data.education.length > 0) {
    score += 10;
  } else {
    issues.push({ id: 'missing_edu', severity: 'warning', title: 'No Education', description: 'Add your educational background.', section: 'education', canAutoFix: false });
  }

  // 6. Formatting/Completeness (Max 10)
  if (data.fullName) score += 5;
  if (data.jobTitle) score += 5; else issues.push({ id: 'missing_jobtitle', severity: 'critical', title: 'Missing Job Title', description: 'Add your target job title under your name.', section: 'personal', canAutoFix: false });

  return { score: Math.min(100, score), issues };
};


export const generateProfessionalSummary = async (resume: ResumeData, jobTitle: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert career coach specializing in the "${jobTitle}" field. Write a high-impact, ATS-optimized professional summary (3-4 sentences) for a "${jobTitle}" resume.
      
      Candidate Profile:
      - Target Role: ${jobTitle}
      - Core Skills: ${resume.skills.join(', ')}
      - Experience Count: ${resume.experience.length} roles.
      - Current Role: ${resume.experience[0]?.position || 'N/A'} at ${resume.experience[0]?.company || 'N/A'}.
      
      Instructions:
      1. Open with a power statement defining the professional identity (e.g., "Innovative ${jobTitle} with a proven track record in...").
      2. Weave in the most critical keywords from the skills provided.
      3. Focus on value creation, problem-solving, and industry expertise.
      4. Use active, professional language suitable for the ${jobTitle} industry.
      5. Do NOT use first-person pronouns (I, me, my).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || '';
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
};

export const enhanceBulletPoint = async (text: string, role: string): Promise<string> => {
  try {
    const prompt = `
      You are a senior resume strategist. Rewrite the following bullet point for a "${role}" position to maximize impact and ATS ranking.
      
      Original Bullet: "${text}"
      
      Instructions:
      1. Start with a high-impact action verb specific to ${role} (e.g., Engineered, Orchestrated, Spearheaded).
      2. Structure using the "Action + Context + Result" framework.
      3. Quantify results where possible. If the user hasn't provided numbers, insert realistic placeholders like "[X]%" or "$[Y]k" that the user can fill in.
      4. Inject relevant industry keywords for ${role}.
      5. Remove fluff and passive language.
      
      Output ONLY the rewritten bullet point text.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Error enhancing text:", error);
    return text;
  }
};

export const improveText = async (text: string, type: 'grammar' | 'polish' | 'concise', contextInfo?: string): Promise<string> => {
  try {
    let instruction = "";
    switch (type) {
      case 'grammar':
        instruction = "Correct all grammar, spelling, and punctuation errors. maintain the original meaning.";
        break;
      case 'polish':
        instruction = "Elevate the tone to be more professional, authoritative, and persuasive. Use active voice.";
        break;
      case 'concise':
        instruction = "Condense the text to be direct and punchy without losing key details.";
        break;
    }

    const prompt = `
      You are an expert editor for professional documents.
      Task: ${instruction}
      ${contextInfo ? `Context: This is for a "${contextInfo}" role. Ensure the terminology and tone align with industry standards for this position.` : ''}
      
      Input Text:
      "${text}"
      
      Return ONLY the improved text. No explanations.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Error improving text:", error);
    return text;
  }
};

export const generateCoverLetter = async (resume: ResumeData): Promise<string> => {
  try {
    const latestRole = resume.experience[0];
    const targetCompany = resume.coverLetter?.companyName || 'the company';
    const targetRole = resume.coverLetter?.recipientTitle || latestRole?.position || 'the role';
    const recipient = resume.coverLetter?.recipientName || 'Hiring Manager';

    const prompt = `
      Write a compelling cover letter for a ${targetRole} position at ${targetCompany}.

      Candidate: ${resume.fullName}
      Current Role: ${latestRole?.position || 'N/A'} at ${latestRole?.company || 'N/A'}
      Contact: ${resume.email} | ${resume.phone}
      
      Professional Summary: ${resume.summary}
      Top Skills: ${resume.skills.join(', ')}
      
      Key Experience Highlights:
      ${resume.experience.map(exp => `- ${exp.position} at ${exp.company}: ${exp.description}`).join('\n')}

      Guidelines:
      - Format: Standard business letter.
      - Length: Under 300 words.
      - Tone: Professional, confident, and enthusiastic.
      - Content: Connect the candidate's skills specifically to the needs of a ${targetRole}. Show, don't just tell.
      - Address to: ${recipient}.
      - Output: Body text only (no header dates/addresses).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text?.trim() || '';
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw error;
  }
};

export const parseResume = async (base64Data: string, mimeType: string): Promise<Partial<ResumeData>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Extract data from this resume. If a field is missing, leave it empty or omit it. For dates, use 'YYYY' or 'Month YYYY' format. For boolean current, infer from 'Present' or 'Current' in dates. Separate general Skills (soft skills, core competencies) from specific Software/Tools (e.g. VS Code, Jira, Slack, Photoshop, Excel, Git)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            location: { type: Type.STRING },
            website: { type: Type.STRING },
            linkedin: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            softwares: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  position: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  current: { type: Type.BOOLEAN },
                  description: { type: Type.STRING },
                }
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  school: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  field: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                }
              }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  link: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    const parsed = JSON.parse(text);
    
    // Map string array to object array for softwares
    const mappedSoftwares = parsed.softwares ? parsed.softwares.map((s: string) => ({
        id: crypto.randomUUID(),
        name: s,
        description: ''
    })) : [];

    return { ...parsed, softwares: mappedSoftwares };
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};

export const fixIssueWithAI = async (issueId: string, data: ResumeData): Promise<Partial<ResumeData>> => {
    if (issueId === 'short_summary' || issueId === 'missing_summary') {
        const summary = await generateProfessionalSummary(data, data.jobTitle || 'Professional');
        return { summary };
    }

    if (issueId === 'exp_passive' || issueId.startsWith('short_exp_')) {
        let updatedExp = [...data.experience];
        const targetId = issueId.startsWith('short_exp_') ? issueId.replace('short_exp_', '') : updatedExp[0]?.id;
        
        const targetIndex = updatedExp.findIndex(e => e.id === targetId);
        if (targetIndex !== -1) {
            const currentDesc = updatedExp[targetIndex].description;
            const role = updatedExp[targetIndex].position;
            const improvedDesc = await improveText(currentDesc, 'polish', role);
            updatedExp[targetIndex] = { ...updatedExp[targetIndex], description: improvedDesc };
            return { experience: updatedExp };
        }
    }

    return {};
};