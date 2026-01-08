"use client"

import { useState, useEffect } from "react"
import {
  Card, CardHeader, CardContent, CardTitle, CardDescription
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { bertNLPService } from "@/lib/bertNLPService"
import {
  Brain, TrendingUp, FileText, Sparkles, Award, Target, MessageSquare, Search
} from "lucide-react"

// ---------- Types ----------
interface SkillEntity { skill: string; confidence: number; category?: string; context?: string }
interface ExperienceEntity { title: string; company: string; duration: string; startDate?: string; endDate?: string; achievements?: string[] }
interface SentimentResult { tone: string; confidence: number; positivity?: number; emotions?: { [key: string]: number } }
interface Readability { score: number; metrics: { wordCount?: number; sentenceCount?: number; avgSentenceLength?: number; fleschReadingEase?: number } }
interface ATSScore { score: number; match: string }
interface MissingSkill { skill: string; isMissing: boolean; isWeak: boolean }
interface ResumeAnalysis { 
  skills: SkillEntity[]
  experience: ExperienceEntity[]
  sentiment: SentimentResult
  keywords: string[]
  readability: Readability
  atsScore?: ATSScore
  suggestions?: string[]
  professionalismScore?: number
  readinessScore?: number
  toneScore?: number
  keywordMatchScore?: number
}

// clamp helper for UI
const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

interface ResumeAnalysisResultsProps {
  resumeContent: string
  initialAnalysis?: any
  jobRole?: string
}

export function ResumeAnalysisResults({ resumeContent, initialAnalysis, jobRole }: ResumeAnalysisResultsProps) {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedJobRole, setSelectedJobRole] = useState<string>("")
  const [jobRoleInput, setJobRoleInput] = useState<string>("")
  const [missingSkills, setMissingSkills] = useState<MissingSkill[]>([])
  const [professionalismScore, setProfessionalismScore] = useState<number>(0)
  const [readinessScore, setReadinessScore] = useState<number>(0)
  const [toneScore, setToneScore] = useState<number>(0)
  const [keywordMatchScore, setKeywordMatchScore] = useState<number>(0)
  const [currentResumeContent, setCurrentResumeContent] = useState<string>("")

  useEffect(() => {
    // Get resume content from initialAnalysis if available, otherwise use resumeContent prop
    const content = initialAnalysis?.resumeContent || resumeContent
    
    if (content && content.trim()) {
      // Analyze the resume content to get full scores
      analyzeResumeWithContent(content)
    } else {
      setAnalysis(null)
      resetScores()
      setCurrentResumeContent("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeContent, initialAnalysis])

  useEffect(() => {
    if (analysis && selectedJobRole) {
      updateJobRoleAnalysis(selectedJobRole)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobRole, analysis])

  // Sync external job role
  useEffect(() => {
    if (!jobRole) {
      setSelectedJobRole("")
      setJobRoleInput("")
      setMissingSkills([])
      return
    }
    if (jobRole !== selectedJobRole) {
      setJobRoleInput(jobRole)
      setSelectedJobRole(jobRole)
      updateJobRoleAnalysis(jobRole)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobRole])

  const analyzeResumeWithContent = async (content: string) => {
    setIsAnalyzing(true)
    setCurrentResumeContent(content)
    try {
      const result = await bertNLPService.analyzeResume(content, "")
      const safe: ResumeAnalysis = {
        skills: (result.skills || []).map((s: any) => ({ skill: s.skill ?? s.name ?? s, confidence: clamp(Number(s.confidence ?? s.score ?? 0.7), 0, 1), category: s.category, context: s.context })),
        experience: result.experience || [],
        sentiment: {
          tone: result.sentiment?.tone ?? "professional",
          confidence: clamp(Number(result.sentiment?.confidence ?? 0.8), 0, 1),
          positivity: clamp(Number(result.sentiment?.positivity ?? (result.sentiment?.confidence ?? 0.8) * 0.6), 0, 1),
          emotions: result.sentiment?.emotions ?? {}
        },
        keywords: result.keywords || [],
        readability: { score: clamp(Number(result.readability?.score ?? 0), 0, 100), metrics: result.readability?.metrics ?? {} },
        atsScore: result.atsScore ? { score: clamp(Number(result.atsScore.score ?? 0), 0, 100), match: result.atsScore.match ?? "" } : undefined,
        suggestions: result.suggestions || []
      }
      setAnalysis(safe)
      await calculateScores(safe, content)
    } catch (err) {
      console.error(err)
      toast.error("Failed to analyze resume")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const calculateScores = async (data: ResumeAnalysis, content: string) => {
    try {
      const [profScore, readyScore, tone, keywordScore] = await Promise.all([
        bertNLPService.calculateProfessionalismScore(content),
        bertNLPService.calculateReadinessScore(content, data.skills || [], data.experience || []),
        bertNLPService.calculateToneScore(content, data.sentiment),
        bertNLPService.calculateKeywordMatchScore(content, data.keywords || [])
      ])
      
      setProfessionalismScore(profScore)
      setReadinessScore(readyScore)
      setToneScore(tone)
      setKeywordMatchScore(keywordScore)
      
      // Update analysis with scores
      setAnalysis({
        ...data,
        professionalismScore: profScore,
        readinessScore: readyScore,
        toneScore: tone,
        keywordMatchScore: keywordScore
      })
      
      // Generate initial suggestions if no job role
      if (!selectedJobRole && data.suggestions && data.suggestions.length === 0) {
        const suggestions = await bertNLPService.generatePersonalizedSuggestions(content, data)
        setAnalysis({ ...data, suggestions })
      }
    } catch (err) {
      console.error("Error calculating scores:", err)
    }
  }

  const updateJobRoleAnalysis = async (role: string) => {
    if (!analysis || !currentResumeContent) return
    
    try {
      // Find missing skills for the role
      const missing = await bertNLPService.findMissingSkills(currentResumeContent, analysis.skills || [], role)
      setMissingSkills(missing)
      
      // Recalculate keyword match score with job role
      const keywordScore = await bertNLPService.calculateKeywordMatchScore(currentResumeContent, analysis.keywords || [], role)
      setKeywordMatchScore(keywordScore)
      
      // Generate personalized suggestions based on job role and missing skills
      const suggestions = await bertNLPService.generatePersonalizedSuggestions(currentResumeContent, analysis, role, missing)
      setAnalysis({ ...analysis, suggestions, keywordMatchScore: keywordScore })
    } catch (err) {
      console.error("Error updating job role analysis:", err)
      toast.error("Failed to analyze job role match")
    }
  }

  const handleJobRoleSubmit = () => {
    if (!jobRoleInput.trim()) {
      toast.error("Please enter a job role or domain")
      return
    }
    setSelectedJobRole(jobRoleInput.trim())
  }

  const resetScores = () => {
    setProfessionalismScore(0)
    setReadinessScore(0)
    setToneScore(0)
    setKeywordMatchScore(0)
    setMissingSkills([])
  }

  const getScoreColor = (score: number) =>
    score >= 80 ? "text-blue-700" : score >= 60 ? "text-blue-600" : "text-blue-500"

  // Download JSON report
  const downloadReport = () => {
    if (!analysis) return
    const report = {
      analysis,
      scores: {
        professionalism: professionalismScore,
        readiness: readinessScore,
        tone: toneScore,
        keywordMatch: keywordMatchScore
      },
      jobRole: selectedJobRole,
      missingSkills
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "resume-analysis.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isAnalyzing) {
    return (
      <Card className="p-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 animate-pulse" /> Analyzing Resume...</CardTitle></CardHeader>
        <CardContent><Progress value={50} className="h-2" /></CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="p-6 text-center">
        <FileText className="mx-auto h-12 w-12 opacity-50 mb-2" /><CardTitle>No resume uploaded yet</CardTitle><CardDescription>Upload a resume to start analysis</CardDescription>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Job Role Input */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Target className="h-5 w-5 text-primary" /> Job Interest & Domain Analysis
          </CardTitle>
          <CardDescription className="text-slate-600">Enter your interested job role or domain to get personalized skill gap analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={jobRoleInput}
              onChange={(e) => setJobRoleInput(e.target.value)}
              placeholder="e.g., Data Scientist, Web Developer, Embedded Engineer"
              className="flex-1 bg-white border-primary/30 focus-visible:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJobRoleSubmit()
                }
              }}
            />
            <Button className="bg-primary text-white hover:bg-primary/90" onClick={handleJobRoleSubmit}>
              <Search className="h-4 w-4 mr-2" /> Analyze
            </Button>
          </div>
          {selectedJobRole && (
            <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Selected Role:</span> {selectedJobRole}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resume Scoring - Replace Bar Graph */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <TrendingUp className="h-5 w-5 text-primary" /> Resume Score Analysis
          </CardTitle>
          <CardDescription className="text-slate-600">AI-powered analysis based on NLP techniques</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Overall Resume Score */}
          <div className="mb-6 p-6 border-2 border-primary/30 rounded-xl bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-slate-900">Overall Resume Score</span>
              </div>
              <span className={`text-3xl font-bold ${getScoreColor(Math.round((professionalismScore + readinessScore + toneScore + keywordMatchScore) / 4))}`}>
                {Math.round((professionalismScore + readinessScore + toneScore + keywordMatchScore) / 4)}%
              </span>
            </div>
            <Progress value={Math.round((professionalismScore + readinessScore + toneScore + keywordMatchScore) / 4)} className="h-3" />
            <p className="text-xs text-slate-600 mt-2">
              Calculated from Professionalism, Readiness, Tone, and Keyword Match scores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Professionalism Score */}
            <div className="p-4 border border-slate-200 rounded-xl bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Professionalism Score</span>
                </div>
                <span className={`text-lg font-bold ${getScoreColor(professionalismScore)}`}>
                  {professionalismScore}%
                </span>
              </div>
              <Progress value={professionalismScore} className="h-2" />
              <p className="text-xs text-slate-600 mt-2">
                Formatting, structure, clarity, and professional language
              </p>
            </div>

            {/* Readiness Score */}
            <div className="p-4 border border-slate-200 rounded-xl bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Readiness Score</span>
                </div>
                <span className={`text-lg font-bold ${getScoreColor(readinessScore)}`}>
                  {readinessScore}%
                </span>
              </div>
              <Progress value={readinessScore} className="h-2" />
              <p className="text-xs text-slate-600 mt-2">
                Job-readiness based on skills, experience, and completeness
              </p>
            </div>

            {/* Tone Score */}
            <div className="p-4 border border-slate-200 rounded-xl bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Tone Score</span>
                </div>
                <span className={`text-lg font-bold ${getScoreColor(toneScore)}`}>
                  {toneScore}%
                </span>
              </div>
              <Progress value={toneScore} className="h-2" />
              <p className="text-xs text-slate-600 mt-2">
                Writing tone: formal, confident, clear, and positive
              </p>
            </div>

            {/* Keyword Match Score */}
            <div className="p-4 border border-slate-200 rounded-xl bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Keyword Match Score</span>
                </div>
                <span className={`text-lg font-bold ${getScoreColor(keywordMatchScore)}`}>
                  {keywordMatchScore}%
                </span>
              </div>
              <Progress value={keywordMatchScore} className="h-2" />
              <p className="text-xs text-slate-600 mt-2">
                Industry-specific keyword relevance and density
                {selectedJobRole && <span className="block mt-1 text-blue-600">(Matched with: {selectedJobRole})</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Skills Detection */}
      {selectedJobRole && missingSkills.length > 0 && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Brain className="h-5 w-5 text-primary" /> Missing Skills for Selected Job Role
            </CardTitle>
            <CardDescription className="text-slate-600">Skills that need to be added or strengthened based on semantic analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {missingSkills.filter(ms => ms.isMissing).length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-slate-900">Missing Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.filter(ms => ms.isMissing).map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-sm border-primary/50 text-primary">
                        {skill.skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {missingSkills.filter(ms => ms.isWeak).length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-slate-900">Weak Skills (Low Confidence):</h4>
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.filter(ms => ms.isWeak).map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-sm border-primary/40 text-blue-700 bg-primary/5">
                        {skill.skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-5 w-5 text-primary" /> Personalized Resume Improvement Suggestions
            </CardTitle>
            <CardDescription>
              {selectedJobRole 
                ? `AI-generated suggestions tailored for ${selectedJobRole}`
                : "AI-generated suggestions based on your resume content"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-5 space-y-2 text-gray-700">
              {analysis.suggestions.map((tip, i) => (
                <li key={i} className="text-sm">{tip}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Download Report Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={downloadReport}>
          Download Report
        </Button>
      </div>
    </div>
  )
}
