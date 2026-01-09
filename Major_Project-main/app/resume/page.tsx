"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ResumeUpload } from "@/components/resume/resume-upload"
import { ResumeAnalysisResults } from "@/components/resume/resume-analysis-results"
import { 
  FileText, 
  Upload, 
  Brain
} from "lucide-react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ResumeAnalysisPage() {
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false)
  const [resumeContent, setResumeContent] = useState<string>("")

  const handleAnalysisComplete = (analysis: any) => {
    setAnalysisResults(analysis)
    setIsAnalysisStarted(false)
    if (analysis.resumeContent) setResumeContent(analysis.resumeContent)
  }

  const handleUploadStart = () => setIsAnalysisStarted(true)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Resume Intelligence</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered resume analysis and optimization
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <ResumeUpload 
              onAnalysisComplete={handleAnalysisComplete} 
              onUploadStart={handleUploadStart}
            />
          </div>
          <div className="xl:col-span-2 space-y-6">
            {analysisResults ? (
              <ResumeAnalysisResults resumeContent={resumeContent} />
            ) : isAnalysisStarted ? (
              <Card className="professional-card h-full flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg font-semibold">Analysis in Progress</p>
                  <p className="text-sm">Please wait while we analyze your resume...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="professional-card h-full flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-semibold">Upload your resume to start analysis</p>
                  <p className="text-sm">Get instant feedback on ATS compatibility using advanced NLP models.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
