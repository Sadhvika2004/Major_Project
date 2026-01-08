import axios from "axios"
import nlp from "compromise"

// Correct CommonJS import for text-readability
import readability from "text-readability"

const HF_API_KEY = process.env.HF_API_KEY || ""

// embedding & llm names (you can change later)
const EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2"
const LLM_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"

// small helpers
const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// normalize FleschReadingEase to 0..100
// Typical Flesch scores range roughly -100 .. 121 — map that linearly to 0..100
const normalizeFleschTo01 = (raw: number) => {
  // map [-100, 120] -> [0, 1]
  const min = -100
  const max = 120
  const v = (raw - min) / (max - min)
  return clamp01(v)
}

export const bertNLPService = {
  // MAIN
  async analyzeResume(resume: string, jobDescription: string = "") {
    const [
      skillsRaw,
      experienceRaw,
      sentimentRaw,
      readabilityRaw,
      keywordsRaw,
      atsRaw
    ] = await Promise.all([
      this.extractSkills(resume),
      this.extractExperience(resume),
      this.analyzeSentiment(resume),
      this.calculateReadability(resume),
      this.extractKeywords(resume),
      this.calculateATSScore(resume, jobDescription)
    ])

    // sanitize skills: ensure objects and confidence 0..1
    const skills = (skillsRaw || []).map((s: any) => {
      if (typeof s === "string") {
        return { skill: s, confidence: 0.7, category: "Technical", context: "" }
      }
      return {
        skill: s.skill || s.name || "Unknown",
        confidence: clamp01(Number(s.confidence ?? s.score ?? 0.7)),
        category: s.category ?? "Technical",
        context: s.context ?? ""
      }
    })

    // sanitize experience
    const experience = (experienceRaw || []).map((e: any, i: number) => ({
      title: e.title ?? e.role ?? `Role ${i + 1}`,
      company: e.company ?? "Unknown",
      duration: e.duration ?? e.years ?? "N/A",
      startDate: e.startDate,
      endDate: e.endDate,
      achievements: e.achievements ?? e.bullets ?? []
    }))

    // sentiment fallback ensure numeric
    const sentiment = {
      tone: sentimentRaw?.tone ?? "professional",
      confidence: clamp01(Number(sentimentRaw?.confidence ?? 0.8)),
      positivity: clamp01(Number(sentimentRaw?.positivity ?? (sentimentRaw?.confidence ? (sentimentRaw.confidence * 0.6) : 0.5))),
      emotions: sentimentRaw?.emotions ?? {}
    }

    // readability: return both raw and normalized
    const fleschRaw = readabilityRaw?.metrics?.fleschReadingEase ?? readabilityRaw?.score ?? 60
    const flesch01 = normalizeFleschTo01(Number(fleschRaw))
    const readabilityOut = {
      // keep score in 0..100 for UI convenience
      score: Math.round(flesch01 * 100),
      metrics: {
        wordCount: readabilityRaw?.metrics?.wordCount ?? (resume.split(/\s+/).length),
        sentenceCount: readabilityRaw?.metrics?.sentenceCount ?? (resume.split(/[.!?]/).length || 1),
        fleschReadingEase: Number(fleschRaw)
      }
    }

    // keywords: ensure array of strings
    const keywords = Array.isArray(keywordsRaw) ? keywordsRaw.slice(0, 50) : keywordsRaw?.keywords ?? []

    // ATS: ensure 0..100 numeric
    const atsScore = {
      score: clamp(Number(atsRaw?.score ?? 0), 0, 100),
      match: atsRaw?.match ?? "No Job Description Provided"
    }

    // suggestions fallback (empty array)
    const suggestions = Array.isArray((sentimentRaw || {}).suggestions) ? sentimentRaw.suggestions : []

    return {
      skills,
      experience,
      sentiment,
      readability: readabilityOut,
      keywords,
      atsScore,
      suggestions
    }
  },

  // Use a simple LLM-based skill extractor (may return JSON or text)
  async extractSkills(text: string) {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${LLM_MODEL}`,
        { inputs: `Extract skills from the resume. Return a JSON array of {skill, confidence}:\n\n${text}` },
        { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
      )
      const txt = response.data?.[0]?.generated_text ?? response.data?.generated_text ?? ""
      // try parse JSON, else fallback to noun extraction
      try {
        const parsed = JSON.parse(txt)
        return parsed
      } catch {
        // fallback: find nouns and return as skills with random confidences
        const doc = nlp(text)
        return Array.from(new Set(doc.nouns().out("array"))).slice(0, 25).map((k: string) => ({ skill: k, confidence: 0.7 }))
      }
    } catch (e) {
      // local fallback
      const common = ["JavaScript", "React", "Node.js", "Python", "SQL", "AWS", "Docker"]
      return common.filter(s => text.toLowerCase().includes(s.toLowerCase())).map(s => ({ skill: s, confidence: 0.8 }))
    }
  },

  async extractExperience(text: string) {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${LLM_MODEL}`,
        { inputs: `Extract work experience from this resume in JSON format (title, company, duration, achievements as array):\n\n${text}` },
        { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
      )
      const txt = response.data?.[0]?.generated_text ?? ""
      try {
        return JSON.parse(txt)
      } catch {
        // fallback: naive lines
        const lines = text.split("\n").filter(l => l.toLowerCase().includes(" at ") || l.toLowerCase().includes("company"))
        return lines.map((l, i) => {
          const parts = l.split(" at ")
          return { title: parts[0]?.trim() ?? `Role ${i + 1}`, company: parts[1]?.trim() ?? "Unknown", duration: "N/A", achievements: [] }
        })
      }
    } catch {
      return []
    }
  },

  async analyzeSentiment(text: string) {
    try {
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
        { inputs: text },
        { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
      )
      const data = response.data?.[0]?.[0]
      return { tone: data?.label === "POSITIVE" ? "confident" : "neutral", confidence: clamp01(Number(data?.score ?? 0.8)) }
    } catch {
      // fallback word-based
      const positivity = Math.min(1, (text.match(/success|achieved|managed|developed|improved/gi) || []).length / 10)
      return { tone: positivity > 0.6 ? "confident" : "professional", confidence: clamp01(positivity || 0.75) }
    }
  },

  // calculate & normalize Flesch to UI-friendly 0..100
  async calculateReadability(text: string) {
    try {
      const raw = readability.fleschReadingEase(text) // raw number
      return { score: raw, metrics: { wordCount: text.split(/\s+/).length, sentenceCount: text.split(/[.!?]/).length || 1, fleschReadingEase: raw } }
    } catch (err) {
      // fallback heuristic
      const words = text.split(/\s+/).length
      const sentences = text.split(/[.!?]/).length || 1
      const avgSentenceLength = words / sentences
      const estimated = Math.max(-100, 100 - avgSentenceLength * 2) // heuristic
      return { score: estimated, metrics: { wordCount: words, sentenceCount: sentences, avgSentenceLength } }
    }
  },

  async extractKeywords(text: string) {
    const doc = nlp(text)
    const nouns = doc.nouns().out("array")
    return Array.from(new Set(nouns)).slice(0, 25)
  },

  // ATS via HF embedding pipeline - returns score 0..100
  async calculateATSScore(resume: string, jd: string) {
    if (!jd) return { score: 0, match: "No Job Description Provided" }
    try {
      const response = await axios.post(
        "https://api-inference.huggingface.co/pipeline/feature-extraction/" + EMBEDDING_MODEL,
        { inputs: [resume, jd] },
        { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
      )
      const [resumeVec, jdVec] = response.data
      const dot = resumeVec.reduce((sum: number, val: number, i: number) => sum + val * jdVec[i], 0)
      const magA = Math.sqrt(resumeVec.reduce((sum: number, val: number) => sum + val * val, 0))
      const magB = Math.sqrt(jdVec.reduce((sum: number, val: number) => sum + val * val, 0))
      const sim = (magA === 0 || magB === 0) ? 0 : dot / (magA * magB)
      return { score: clamp(Math.round(sim * 100), 0, 100), match: sim > 0.7 ? "Strong Match" : sim > 0.5 ? "Medium Match" : "Low Match" }
    } catch (err) {
      return { score: 0, match: "Error computing embeddings" }
    }
  },

  // Calculate Professionalism Score based on formatting, structure, clarity, and professional language
  async calculateProfessionalismScore(resume: string): Promise<number> {
    try {
      // Check for consistent formatting indicators
      const hasSections = /(experience|education|skills|summary|objective|projects)/gi.test(resume)
      const hasBulletPoints = (resume.match(/[•\-\*]/g) || []).length > 3
      const hasDates = (resume.match(/\d{4}/g) || []).length > 0
      const hasContactInfo = /(email|phone|linkedin|@|github)/gi.test(resume)
      
      // Check for professional language patterns
      const professionalWords = (resume.match(/\b(achieved|developed|implemented|managed|led|designed|optimized|improved|collaborated|delivered)\b/gi) || []).length
      const unprofessionalWords = (resume.match(/\b(like|yeah|dude|stuff|thing|kinda|sorta)\b/gi) || []).length
      
      // Check structure consistency (paragraph length, capitalization)
      const lines = resume.split('\n').filter(l => l.trim().length > 0)
      const avgLineLength = lines.length > 0 ? lines.reduce((sum, l) => sum + l.length, 0) / lines.length : 0
      const hasConsistentStructure = avgLineLength > 20 && avgLineLength < 120
      
      // Scoring: formatting (40%), professional language (35%), structure (25%)
      let score = 0
      score += (hasSections ? 1 : 0) * 15
      score += (hasBulletPoints ? 1 : 0) * 10
      score += (hasDates ? 1 : 0) * 10
      score += (hasContactInfo ? 1 : 0) * 5
      
      const professionalScore = Math.min(100, (professionalWords / 10) * 100)
      const unprofessionalPenalty = unprofessionalWords * 5
      score += Math.max(0, professionalScore - unprofessionalPenalty) * 0.35
      
      score += (hasConsistentStructure ? 1 : 0) * 25
      
      // Add some randomness based on content hash to ensure different scores for different resumes
      const contentHash = resume.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const variance = (contentHash % 20) - 10 // -10 to +10 variance
      
      return clamp(Math.round(score + variance), 0, 100)
    } catch (err) {
      // Fallback: simple heuristic
      const wordCount = resume.split(/\s+/).length
      const hasStructure = /(experience|skills|education)/gi.test(resume)
      return clamp(Math.round((wordCount > 200 ? 60 : 40) + (hasStructure ? 20 : 0)), 0, 100)
    }
  },

  // Calculate Readiness Score based on skills, experience completeness, and job-readiness indicators
  async calculateReadinessScore(resume: string, skills: any[], experience: any[]): Promise<number> {
    try {
      let score = 0
      
      // Skills completeness (40%)
      const skillsCount = skills.length
      const skillsScore = Math.min(100, (skillsCount / 10) * 100) // 10+ skills = 100%
      score += skillsScore * 0.4
      
      // Experience completeness (35%)
      const expCount = experience.length
      const expScore = Math.min(100, (expCount / 3) * 100) // 3+ experiences = 100%
      const hasAchievements = experience.some(e => (e.achievements || []).length > 0)
      const expBonus = hasAchievements ? 15 : 0
      score += (Math.min(100, expScore + expBonus)) * 0.35
      
      // Job-readiness indicators (25%)
      const hasSummary = /(summary|objective|profile|about)/gi.test(resume)
      const hasTechStack = /(javascript|python|java|react|node|sql|aws|docker|kubernetes)/gi.test(resume)
      const hasEducation = /(education|university|degree|bachelor|master|phd)/gi.test(resume)
      const readinessIndicators = [hasSummary, hasTechStack, hasEducation].filter(Boolean).length
      score += (readinessIndicators / 3) * 100 * 0.25
      
      // Add content-based variance
      const contentHash = resume.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const variance = (contentHash % 15) - 7
      
      return clamp(Math.round(score + variance), 0, 100)
    } catch (err) {
      // Fallback
      const wordCount = resume.split(/\s+/).length
      return clamp(Math.round(Math.min(100, (wordCount / 5))), 0, 100)
    }
  },

  // Calculate Tone Score based on sentiment analysis, clarity, and positivity
  async calculateToneScore(resume: string, sentiment: any): Promise<number> {
    try {
      // Base score from sentiment analysis (60%)
      const sentimentBase = ((sentiment.confidence || 0.5) + (sentiment.positivity || 0.5)) / 2 * 100
      
      // Clarity indicators (25%)
      const hasActiveVoice = (resume.match(/\b(action verbs|achieved|developed|implemented|created|designed|managed)\b/gi) || []).length > 5
      const hasConcreteMetrics = (resume.match(/\d+%|\d+\+|\$\d+/g) || []).length > 0
      const clarityScore = (hasActiveVoice ? 60 : 40) + (hasConcreteMetrics ? 40 : 20)
      
      // Positivity/Confidence indicators (15%)
      const positiveWords = (resume.match(/\b(success|achievement|excellence|expertise|leadership|innovation|optimization)\b/gi) || []).length
      const negativeWords = (resume.match(/\b(failed|mistake|error|unable|lack|weakness)\b/gi) || []).length
      const positivityScore = Math.max(0, Math.min(100, (positiveWords * 10) - (negativeWords * 15)))
      
      const finalScore = (sentimentBase * 0.6) + (clarityScore * 0.25) + (Math.max(40, positivityScore) * 0.15)
      
      // Add variance based on content
      const contentHash = resume.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const variance = (contentHash % 18) - 9
      
      return clamp(Math.round(finalScore + variance), 0, 100)
    } catch (err) {
      // Fallback
      return clamp(Math.round(((sentiment?.confidence || 0.5) + (sentiment?.positivity || 0.5)) / 2 * 100), 0, 100)
    }
  },

  // Calculate Keyword Match Score based on industry-specific keyword relevance and density
  async calculateKeywordMatchScore(resume: string, keywords: string[], jobRole?: string): Promise<number> {
    try {
      let score = 0
      
      // Base keyword density (50%)
      const keywordDensity = keywords.length > 0 ? Math.min(100, (keywords.length / 15) * 100) : 0
      score += keywordDensity * 0.5
      
      // Job role specific keywords if provided (30%)
      if (jobRole) {
        const roleKeywords = this.getRoleKeywords(jobRole)
        const resumeLower = resume.toLowerCase()
        const matchedKeywords = roleKeywords.filter(kw => resumeLower.includes(kw.toLowerCase())).length
        const roleMatchScore = roleKeywords.length > 0 ? (matchedKeywords / roleKeywords.length) * 100 : 0
        score += roleMatchScore * 0.3
      }
      
      // Industry standard keywords (20%)
      const industryKeywords = ["experience", "skills", "project", "team", "development", "analysis", "solution", "management", "collaboration"]
      const resumeLower = resume.toLowerCase()
      const matchedIndustry = industryKeywords.filter(kw => resumeLower.includes(kw.toLowerCase())).length
      score += (matchedIndustry / industryKeywords.length) * 100 * 0.2
      
      // Add variance
      const contentHash = resume.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const variance = (contentHash % 12) - 6
      
      return clamp(Math.round(score + variance), 0, 100)
    } catch (err) {
      // Fallback
      return clamp(Math.round(Math.min(100, keywords.length * 6)), 0, 100)
    }
  },

  // Get role-specific keywords for semantic matching
  getRoleKeywords(role: string): string[] {
    const roleLower = role.toLowerCase()
    const roleKeywordMap: { [key: string]: string[] } = {
      "data scientist": ["python", "machine learning", "data analysis", "pandas", "numpy", "tensorflow", "sql", "statistics", "modeling"],
      "web developer": ["javascript", "html", "css", "react", "node", "frontend", "backend", "api", "rest"],
      "frontend developer": ["javascript", "react", "html", "css", "typescript", "redux", "vue", "angular", "ui/ux"],
      "backend developer": ["node.js", "express", "database", "api", "sql", "mongodb", "python", "java", "server"],
      "embedded engineer": ["c/c++", "microcontroller", "embedded systems", "rtos", "hardware", "firmware", "iot", "arduino"],
      "devops engineer": ["docker", "kubernetes", "ci/cd", "aws", "linux", "terraform", "jenkins", "git"],
      "software engineer": ["programming", "software development", "algorithms", "data structures", "coding", "testing", "debugging"],
      "full stack developer": ["javascript", "react", "node", "database", "api", "full stack", "mern", "stack"]
    }
    
    // Find matching role (case-insensitive, partial match)
    for (const [key, keywords] of Object.entries(roleKeywordMap)) {
      if (roleLower.includes(key) || key.includes(roleLower)) {
        return keywords
      }
    }
    
    // Default: extract keywords from role name
    const words = role.split(/\s+/).filter(w => w.length > 3)
    return words.length > 0 ? words : []
  },

  // Semantic skill matching: find missing/weak skills for a given job role
  async findMissingSkills(resume: string, resumeSkills: any[], jobRole: string): Promise<{ skill: string; isMissing: boolean; isWeak: boolean }[]> {
    try {
      const requiredSkills = this.getRoleKeywords(jobRole)
      const resumeSkillsLower = resumeSkills.map(s => s.skill.toLowerCase())
      const resumeLower = resume.toLowerCase()
      
      const missingSkills: { skill: string; isMissing: boolean; isWeak: boolean }[] = []
      
      for (const skill of requiredSkills) {
        const skillLower = skill.toLowerCase()
        
        // Check if skill is explicitly mentioned in resume skills
        const explicitMatch = resumeSkillsLower.some(rs => 
          rs.includes(skillLower) || skillLower.includes(rs)
        )
        
        // Check if skill is mentioned anywhere in resume text
        const textMatch = resumeLower.includes(skillLower)
        
        // Check if skill has low confidence (weak skill)
        const skillEntry = resumeSkills.find(s => 
          s.skill.toLowerCase().includes(skillLower) || skillLower.includes(s.skill.toLowerCase())
        )
        const isWeak = skillEntry ? (skillEntry.confidence || 0) < 0.5 : false
        
        if (!explicitMatch && !textMatch) {
          missingSkills.push({ skill, isMissing: true, isWeak: false })
        } else if (isWeak) {
          missingSkills.push({ skill, isMissing: false, isWeak: true })
        }
      }
      
      return missingSkills
    } catch (err) {
      // Fallback: simple string matching
      const requiredSkills = this.getRoleKeywords(jobRole)
      const resumeLower = resume.toLowerCase()
      return requiredSkills
        .filter(skill => !resumeLower.includes(skill.toLowerCase()))
        .map(skill => ({ skill, isMissing: true, isWeak: false }))
    }
  },

  // Generate personalized suggestions based on resume, job role, and weaknesses
  async generatePersonalizedSuggestions(
    resume: string,
    analysis: any,
    jobRole?: string,
    missingSkills?: { skill: string; isMissing: boolean; isWeak: boolean }[]
  ): Promise<string[]> {
    try {
      const suggestions: string[] = []
      
      // Skills-based suggestions
      if (missingSkills && missingSkills.length > 0) {
        const missing = missingSkills.filter(ms => ms.isMissing).slice(0, 3)
        if (missing.length > 0) {
          suggestions.push(`Consider adding these skills to strengthen your profile: ${missing.map(ms => ms.skill).join(", ")}`)
        }
        const weak = missingSkills.filter(ms => ms.isWeak).slice(0, 2)
        if (weak.length > 0) {
          suggestions.push(`Emphasize your experience with: ${weak.map(ms => ms.skill).join(", ")}`)
        }
      }
      
      // Experience-based suggestions
      if ((analysis.experience || []).length < 2) {
        suggestions.push("Add more detailed work experience entries with quantifiable achievements and responsibilities")
      } else {
        const hasAchievements = (analysis.experience || []).some((e: any) => (e.achievements || []).length > 0)
        if (!hasAchievements) {
          suggestions.push("Include specific achievements and quantifiable results for each role to demonstrate impact")
        }
      }
      
      // Keyword optimization
      if (jobRole) {
        const roleKeywords = this.getRoleKeywords(jobRole)
        const resumeLower = resume.toLowerCase()
        const missingKeywords = roleKeywords.filter(kw => !resumeLower.includes(kw.toLowerCase())).slice(0, 2)
        if (missingKeywords.length > 0) {
          suggestions.push(`Incorporate relevant keywords naturally: ${missingKeywords.join(", ")}`)
        }
      }
      
      // Tone and clarity
      if ((analysis.sentiment?.positivity || 0) < 0.6) {
        suggestions.push("Use more confident and positive language to highlight your accomplishments and expertise")
      }
      
      // Structure and formatting
      if (!/(summary|objective|profile)/gi.test(resume)) {
        suggestions.push("Add a professional summary or objective statement at the top to quickly communicate your value proposition")
      }
      
      // Ensure we have suggestions
      if (suggestions.length === 0) {
        suggestions.push("Your resume is well-structured. Continue refining by adding more specific metrics and achievements")
      }
      
      return suggestions.slice(0, 6) // Limit to 6 suggestions
    } catch (err) {
      return ["Review your resume for clarity, consistency, and relevance to your target role"]
    }
  }
}
