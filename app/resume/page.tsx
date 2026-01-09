// app/resume/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResumeUpload } from "@/components/resume/resume-upload"
import { ResumeAnalysisResults } from "@/components/resume/resume-analysis-results"

import {
  FileText,
  Upload,
  Brain,
  Settings
} from "lucide-react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ResumeAnalysisPage() {
  const [activeTab, setActiveTab] = useState<"analyze">("analyze")
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [isAnalysisStarted, setIsAnalysisStarted] = useState(false)
  const [resumeContent, setResumeContent] = useState<string>("")
  const [jobRole, setJobRole] = useState<string>("")

  const handleAnalysisComplete = (analysis: any) => {
    setAnalysisResults(analysis)
    setIsAnalysisStarted(false)
    if (analysis && analysis.resumeContent) setResumeContent(analysis.resumeContent)
    // if analysis doesn't include resumeContent, keep existing resumeContent
  }

  const handleUploadStart = () => setIsAnalysisStarted(true)

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 text-blue-900">
            <FileText className="h-9 w-9 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold">Resume Intelligence</h1>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Clean, professional resume analysis with AI-powered scoring, job skill matching, and concise improvement tips.
          </p>
        </div>

        {/* Tab Navigation (single tool) */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex flex-col gap-2 text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-slate-900">
              <Settings className="h-5 w-5 text-primary" />
              Resume Tools
            </CardTitle>
            <CardDescription className="text-slate-600">Upload, analyze, and refine your resume in a structured workflow.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-full">
              <Button
                variant={activeTab === "analyze" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("analyze")}
                className="px-6 rounded-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Resume Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {activeTab === "analyze" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 space-y-4">
              <ResumeUpload
                onAnalysisComplete={handleAnalysisComplete}
                onUploadStart={handleUploadStart}
              />
              {/* Job Interest Input */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">Job Interest</CardTitle>
                  <CardDescription className="text-slate-600">Enter your target job role or domain to tailor the analysis.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="Enter your interested job role or domain"
                    className="bg-white border-primary/30 focus-visible:ring-primary"
                  />
                  <p className="text-xs text-slate-500">Examples: Data Scientist, Web Developer, Embedded Engineer</p>
                  <div className="flex justify-end">
                    <Button
                      variant="default"
                      className="bg-primary text-white hover:bg-primary/90 rounded-full px-6"
                      onClick={() => setJobRole(jobRole.trim())}
                    >
                      Set Job Role
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="xl:col-span-2 space-y-6">
              {analysisResults ? (
                // pass initialAnalysis and resumeContent
                <ResumeAnalysisResults
                  initialAnalysis={analysisResults}
                  resumeContent={resumeContent}
                  jobRole={jobRole}
                />
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
                    <p className="text-sm">Get instant feedback on ATS compatibility, skills, and content using advanced BERT and NLP models.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="flex justify-center mt-8">
          <Card className="professional-card hover:scale-105 transition-transform max-w-sm">
            <CardContent className="p-6 text-center">
              <Brain className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                BERT-powered resume analysis with skill extraction and ATS optimization
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
