import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const DEFAULT_MODEL = "gemini-3-flash-preview";

export type LegalAgentType = 
  | "clause_analyst" 
  | "risk_assessor" 
  | "compliance_checker" 
  | "terms_mapper" 
  | "recommendations_engine"
  | "plain_english"
  | "negotiator"
  | "missing_protections"
  | "freelancer_review"
  | "comparer";

export type ProjectLanguage = "es" | "en";

export const AGENT_PROMPTS: Record<LegalAgentType, (lang: ProjectLanguage) => string> = {
  clause_analyst: (l) => `You are the Clause Analyst Agent. 
Identify and categorize EVERY clause in the following contract. 
Categorize into: Payment, Termination, IP, Confidentiality, Indemnification, Liability, Dispute Resolution, etc. 
For each clause, indicate if it seems standard or unusual. 
IMPORTANT: Use the tags [BAJO RIESGO] for standard clauses and [RIESGO MEDIO] for unusual or complex clauses.
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`,
  
  risk_assessor: (l) => `You are the Risk Assessor Agent. 
Analyze the following contract for legal and financial risks. 
Assign levels using EXACTLY these tags at the beginning of each risk point:
- [ALTO RIESGO] for critical exposure, dangerous clauses, or missing fundamental protections.
- [RIESGO MEDIO] for points requiring caution or negotiation.
- [BAJO RIESGO] for standard or safe clauses.
Identify red flags like unlimited liability, IP transfers, and unfair termination.
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`,
  
  compliance_checker: (l) => `You are the Compliance Checker Agent. 
Audit the contract against regulatory frameworks: GDPR, CCPA, ADA, PCI-DSS. 
For each gap found, tag it with:
- [ALTO RIESGO] if it's a major compliance failure.
- [RIESGO MEDIO] if it's a minor gap or recommendation.
- [BAJO RIESGO] if it complies perfectly with a standard.
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`,
  
  terms_mapper: (l) => `You are the Terms Mapper Agent. 
Map all obligations, deadlines, triggers, and consequences in the contract. 
Tag items that are particularly aggressive or time-sensitive with [RIESGO MEDIO].
Standard terms should be tagged with [BAJO RIESGO].
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`,
  
  recommendations_engine: (l) => `You are the Recommendations Engine Agent. 
For every problematic clause identified, provide specific replacement language 
and negotiation talking points. 
Rank your recommendations:
- [ALTO RIESGO] for "must-fix" items.
- [RIESGO MEDIO] for "should-negotiate" items.
- [BAJO RIESGO] for "improvement" items.
Focus on protecting the reviewing party.
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`,

  plain_english: (l) => `You are the Plain English Translator.
Translate the complex legal jargon in this contract into simple, easy-to-understand language.
Explain the meaning and implications of each section.
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`,

  negotiator: (l) => `You are the Counter-Proposal Generator.
Based on the provided contract, generate a comprehensive counter-proposal that better protects our interests.
Provide specific alternative language for controversial clauses and explain the rationale for each change.
Rank points with [ALTO RIESGO] (Red) for critical changes and [RIESGO MEDIO] (Yellow) for secondary ones.
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`,

  missing_protections: (l) => `You are the Missing Protections Finder.
Analyze what is NOT in this contract but SHOULD BE to protect our party.
Check for missing indemnities, warranties, liability caps, or specific termination rights.
Tag missing items with [ALTO RIESGO] (Red) if they are essential.
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`,

  freelancer_review: (l) => `You are the Freelancer Review Agent.
Specifically review this contract from the perspective of an independent contractor/freelancer.
Identify "gotcha" clauses regarding IP ownership, payment terms, non-competes, and liability.
Tag risks with [ALTO RIESGO] etc.
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`,

  comparer: (l) => `You are the Contract Comparer Agent.
Compare the two documents (or sections) provided. Highlight differences in terms, risks, and benefits.
Identify which version is more favorable.
OUTPUT LANGUAGE: ${l === 'es' ? 'Spanish' : 'English'}.`
};

export async function analyzeLegalDocument(content: string, requestedAgents: LegalAgentType[], language: ProjectLanguage = "es") {
  // Running agents in parallel as per the original blueprint logic (emulated here)
  const agentResults = await Promise.all(
    requestedAgents.map(async (agentType) => {
      const prompt = `${AGENT_PROMPTS[agentType](language)}\n\nCONTRACT CONTENT:\n${content}\n\nReturn your analysis in Markdown format.`;
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
      });
      return {
        type: agentType,
        text: response.text || "No analysis generated.",
      };
    })
  );

  return agentResults;
}

export async function generateLegalDocument(type: string, description: string, language: ProjectLanguage = "es") {
  const prompt = `Act as a Legal Document Generator. 
Create a professional, compliant ${type} based on this description: "${description}".
Include all standard clauses, placeholders for specific details, and ensure it follows current legal best practices for the specified jurisdiction or international standards if not specified.
Format as Markdown.
OUTPUT LANGUAGE: ${language === 'es' ? 'Spanish' : 'English'}.`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
  });
  return response.text || "Failed to generate document.";
}
