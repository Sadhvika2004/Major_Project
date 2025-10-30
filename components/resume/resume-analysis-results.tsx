"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Star,
  FileText,
  Zap,
  BarChart3,
  Lightbulb,
  Award,
  Clock,
  Users,
  Briefcase,
  RefreshCw
} from "lucide-react"
// The actual service file is `lib/bertNLPService.ts` (camelCase). Use that import path.
import { bertNLPService } from "@/lib/bertNLPService"
import { toast } from "sonner"

interface SkillEntity {
  skill: string
  confidence: number
  category: string
  context: string
}

interface ExperienceEntity {
  title: string
  company: string
  duration: string
  startDate?: string
  endDate?: string
  achievements: string[]
}

interface SentimentResult {
  tone: 'professional' | 'casual' | 'confident' | 'modest'
  confidence: number
  positivity: number
  emotions?: { [key: string]: number }
}

interface ResumeAnalysis {
  skills: SkillEntity[]
  experience: ExperienceEntity[]
  sentiment: SentimentResult
  entities: { [key: string]: string[] }
  keywords: string[]
  readability: {
    score: number
    metrics: {
      wordCount: number
      sentenceCount: number
      avgSentenceLength: number
      fleschReadingEase: number
      gunningFogIndex: number
    }
  }
} 

interface ResumeAnalysisResultsProps {
  resumeContent: string
  jobTitle?: string
}

export function ResumeAnalysisResults({ resumeContent, jobTitle }: ResumeAnalysisResultsProps) {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [overallScore, setOverallScore] = useState<number>(0)
  const [atsScore, setAtsScore] = useState<number>(0)

  useEffect(() => {
    if (resumeContent) {
      analyzeResume()
    }
  }, [resumeContent, jobTitle])

  const analyzeResume = async () => {
    if (!resumeContent.trim()) {
      toast.error("No resume content to analyze")
      return
    }

    setIsAnalyzing(true)
    try {
      console.log('Starting BERT/NLP analysis...')
      console.log('Resume content length:', resumeContent.length)
      console.log('Job title:', jobTitle)

      // Use the real BERT NLP service
      const bertAnalysis = await bertNLPService.analyzeResume(resumeContent, jobTitle)
      
      console.log('BERT Analysis completed:', bertAnalysis)

      // Calculate overall score based on real analysis
      const calculatedOverallScore = calculateOverallScore(bertAnalysis)
      const calculatedAtsScore = calculateATSScore(bertAnalysis, jobTitle)
      
      setOverallScore(calculatedOverallScore)
      setAtsScore(calculatedAtsScore)

      setAnalysis(bertAnalysis as any)
      
      toast.success("Resume analysis completed using BERT and NLP!")
      
    } catch (error) {
      console.error('Resume analysis error:', error)
      toast.error("Failed to analyze resume. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const calculateOverallScore = (analysis: ResumeAnalysis): number => {
    let score = 0
    let totalWeight = 0

    // Skills weight: 25%
    const skillsScore = analysis.skills.length > 0 ? 
      Math.min(100, analysis.skills.length * 5 + analysis.skills.reduce((acc, skill) => acc + skill.confidence * 100, 0) / analysis.skills.length) : 0
    score += skillsScore * 0.25
    totalWeight += 0.25

    // Readability weight: 20%
    const readabilityScore = analysis.readability.score
    score += readabilityScore * 0.20
    totalWeight += 0.20

    // Experience weight: 20%
    const experienceScore = analysis.experience.length > 0 ? 
      Math.min(100, analysis.experience.length * 20 + analysis.experience.reduce((acc, exp) => acc + exp.achievements.length * 10, 0)) : 0
    score += experienceScore * 0.20
    totalWeight += 0.20

    // Keywords weight: 15%
    const keywordsScore = analysis.keywords.length > 0 ? 
      Math.min(100, analysis.keywords.length * 6.67) : 0
    score += keywordsScore * 0.15
    totalWeight += 0.15

    // Sentiment weight: 20%
    const sentimentScore = (analysis.sentiment.confidence + analysis.sentiment.positivity) * 50
    score += sentimentScore * 0.20
    totalWeight += 0.20

    const finalScore = Math.round(score / totalWeight)
    return Math.max(0, Math.min(100, finalScore))
  }

  const calculateATSScore = (analysis: ResumeAnalysis, jobTitle?: string): number => {
    let score = 0
    let totalWeight = 0

    // Keywords matching weight: 40%
    const keywordScore = jobTitle ? 
      calculateKeywordMatch(analysis.keywords, jobTitle) : 
      Math.min(100, analysis.keywords.length * 6.67)
    score += keywordScore * 0.40
    totalWeight += 0.40

    // Skills relevance weight: 30%
    const skillsScore = analysis.skills.length > 0 ? 
      Math.min(100, analysis.skills.filter(skill => skill.confidence > 0.8).length * 5) : 0
    score += skillsScore * 0.30
    totalWeight += 0.30

    // Readability weight: 20%
    const readabilityScore = analysis.readability.score
    score += readabilityScore * 0.20
    totalWeight += 0.20

    // Format weight: 10%
    const formatScore = analysis.readability.metrics.avgSentenceLength < 25 ? 100 : 
      Math.max(0, 100 - (analysis.readability.metrics.avgSentenceLength - 25) * 2)
    score += formatScore * 0.10
    totalWeight += 0.10

    const finalScore = Math.round(score / totalWeight)
    return Math.max(0, Math.min(100, finalScore))
  }

  const calculateKeywordMatch = (keywords: string[], jobTitle: string): number => {
    const jobKeywords = getJobKeywords(jobTitle)
    const matchedKeywords = keywords.filter(keyword => 
      jobKeywords.some(jobKeyword => 
        keyword.toLowerCase().includes(jobKeyword.toLowerCase()) ||
        jobKeyword.toLowerCase().includes(keyword.toLowerCase())
      )
    )
    
    return Math.min(100, (matchedKeywords.length / jobKeywords.length) * 100)
  }

  const getJobKeywords = (jobTitle: string): string[] => {
    const jobKeywords: { [key: string]: string[] } = {
      'software engineer': ['programming', 'development', 'coding', 'algorithms', 'data structures', 'software', 'engineering'],
      'data scientist': ['machine learning', 'statistics', 'python', 'r', 'sql', 'analytics', 'data', 'science'],
      'product manager': ['strategy', 'roadmap', 'agile', 'scrum', 'user research', 'metrics', 'product', 'management'],
      'devops engineer': ['docker', 'kubernetes', 'ci/cd', 'aws', 'azure', 'infrastructure', 'devops'],
      'frontend developer': ['react', 'javascript', 'html', 'css', 'vue', 'angular', 'frontend', 'ui'],
      'backend developer': ['node.js', 'python', 'java', 'databases', 'apis', 'microservices', 'backend'],
      'full stack': ['frontend', 'backend', 'full stack', 'web development', 'fullstack'],
      'mobile developer': ['ios', 'android', 'mobile', 'app development', 'swift', 'kotlin'],
      'ui/ux designer': ['design', 'user experience', 'user interface', 'figma', 'adobe', 'prototyping'],
      'data analyst': ['sql', 'excel', 'data analysis', 'reporting', 'visualization', 'analytics']
    }

    const lowerTitle = jobTitle.toLowerCase()
    for (const [job, keywords] of Object.entries(jobKeywords)) {
      if (lowerTitle.includes(job)) {
        return keywords
      }
    }

    // Default keywords for any job
    return ['communication', 'leadership', 'problem solving', 'teamwork', 'project management']
  }

  const generateRecommendations = () => {
    if (!analysis) return []
    
    const recommendations = []

    // ATS Optimization recommendations
    if (atsScore < 80) {
      recommendations.push({
        priority: 'high' as const,
        category: 'ATS Optimization',
        suggestion: `Add missing keywords for ${jobTitle || 'your target role'} to improve ATS matching`,
        impact: 'High - Will improve ATS matching by 15-25%'
      })
    }

    // Skills recommendations
    if (analysis.skills.length < 8) {
      recommendations.push({
        priority: 'high' as const,
        category: 'Skills',
        suggestion: 'Add more specific technical and soft skills to demonstrate your expertise',
        impact: 'High - Will show comprehensive skill set to recruiters'
      })
    }

    // Readability recommendations
    if (analysis.readability.metrics.avgSentenceLength > 25) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'Content',
        suggestion: 'Break down long sentences for better readability and ATS parsing',
        impact: 'Medium - Will improve readability and ATS compatibility'
      })
    }

    // Experience recommendations
    if (analysis.experience.length === 0) {
      recommendations.push({
        priority: 'high' as const,
        category: 'Experience',
        suggestion: 'Add work experience, internships, or project details to showcase your background',
        impact: 'High - Essential for demonstrating practical experience'
      })
    }

    // Keywords recommendations
    if (analysis.keywords.length < 10) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'Keywords',
        suggestion: 'Include more industry-specific terms and technologies in your resume',
        impact: 'Medium - Will improve searchability and relevance'
      })
    }

    // Sentiment recommendations
    if (analysis.sentiment.confidence < 0.7) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'Tone',
        suggestion: 'Use more confident and professional language throughout your resume',
        impact: 'Medium - Will project stronger professional image'
      })
    }

    // Format recommendations
    if (analysis.readability.score < 70) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'Formatting',
        suggestion: 'Improve overall structure and formatting for better readability',
        impact: 'Medium - Will enhance professional appearance'
      })
    }

    return recommendations.slice(0, 6) // Show top 6 recommendations
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional': return 'bg-blue-100 text-blue-800'
      case 'confident': return 'bg-green-100 text-green-800'
      case 'casual': return 'bg-yellow-100 text-yellow-800'
      case 'modest': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isAnalyzing) {
    return (
  <Card className="bg-white dark:bg-slate-900 shadow-sm border rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Resume Analysis in Progress
          </CardTitle>
          <CardDescription>
            Analyzing your resume content using BERT and NLP models...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-muted-foreground">
              Please wait while we process your resume...
            </span>
          </div>
          <Progress value={65} className="h-2 mt-4" />
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
  <Card className="bg-white dark:bg-slate-900 shadow-sm border rounded-lg">
        <CardHeader>
          <CardTitle>Resume Analysis</CardTitle>
          <CardDescription>
            Upload a resume to get analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No resume uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-slate-900 shadow-sm border rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          ATS Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center my-8">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(atsScore)}`}>
            <span className={`text-5xl font-bold ${getScoreColor(atsScore)}`}>{atsScore}%</span>
          </div>
          <p className="mt-4 text-muted-foreground text-lg">This is your resume's ATS (Applicant Tracking System) compatibility score.</p>
        </div>
      </CardContent>
    </Card>
  )
}
