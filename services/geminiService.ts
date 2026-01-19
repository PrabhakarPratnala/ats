import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = 'gemini-3-flash-preview';

export const generateProfessionalSummary = async (resume: ResumeData, jobTitle: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert career coach. Write a professional, concise, and ATS-friendly resume summary (max 3-4 sentences) for a ${jobTitle}.
      
      Here is the candidate's background context:
      Skills: ${resume.skills.join(', ')}
      Experience count: ${resume.experience.length} roles.
      Latest Role: ${resume.experience[0]?.position || 'N/A'} at ${resume.experience[0]?.company || 'N/A'}.
      
      Focus on value proposition and key achievements. Do not use first person pronouns excessively.
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
      You are an expert resume writer. Rewrite the following bullet point for a ${role} position to be more impactful, action-oriented, and result-driven.
      Use strong action verbs. Quantify results if possible (using placeholders like [X] if exact numbers aren't known).
      Keep it ATS friendly (avoid tables, complex formatting).
      
      Original text: "${text}"
      
      Return ONLY the improved bullet point text.
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

export const analyzeResume = async (resume: ResumeData): Promise<string> => {
  try {
    const prompt = `
      Analyze this resume data for ATS (Applicant Tracking System) compatibility and general best practices.
      
      Resume Data:
      ${JSON.stringify(resume, null, 2)}
      
      Provide a brief critique in valid Markdown format.
      1. Give a score out of 100.
      2. List 3 strengths.
      3. List 3 critical improvements needed for ATS parsing (e.g., keywords, formatting risks, missing sections).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for deeper reasoning
      contents: prompt,
    });

    return response.text || '';
  } catch (error) {
    console.error("Error analyzing resume:", error);
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
            { text: "Extract data from this resume. If a field is missing, leave it empty or omit it. For dates, use 'YYYY' or 'Month YYYY' format. For boolean current, infer from 'Present' or 'Current' in dates." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            location: { type: Type.STRING },
            website: { type: Type.STRING },
            linkedin: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};