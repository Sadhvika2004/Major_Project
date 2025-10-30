"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Brain, 
  Clock, 
  Target, 
  TrendingUp, 
  Star,
  Code,
  Database,
  Cloud,
  Smartphone,
  Globe
} from "lucide-react"

interface AvailableAssessmentsProps {
  onStartAssessment: () => void
}

const assessmentCategories = [
  {
    id: "frontend",
    name: "Frontend Development",
    icon: Code,
    color: "bg-blue-100 text-blue-600",
    description: "HTML, CSS, JavaScript, React, Vue, Angular",
    assessments: [
      {
        id: "frontend-basics",
        title: "Frontend Basics",
        difficulty: "Beginner",
        duration: "30 min",
        questions: 25,
        completion: 0,
        rating: 4.8
      },
      {
        id: "react-fundamentals",
        title: "React Fundamentals",
        difficulty: "Intermediate",
        duration: "45 min",
        questions: 30,
        completion: 0,
        rating: 4.9
      },
      {
        id: "advanced-css",
        title: "Advanced CSS",
        difficulty: "Advanced",
        duration: "40 min",
        questions: 28,
        completion: 0,
        rating: 4.7
      }
    ]
  },
  {
    id: "backend",
    name: "Backend Development",
    icon: Database,
    color: "bg-green-100 text-green-600",
    description: "Node.js, Python, Java, APIs, Databases",
    assessments: [
      {
        id: "python-basics",
        title: "Python Basics",
        difficulty: "Beginner",
        duration: "35 min",
        questions: 22,
        completion: 0,
        rating: 4.6
      },
      {
        id: "nodejs-apis",
        title: "Node.js & APIs",
        difficulty: "Intermediate",
        duration: "50 min",
        questions: 32,
        completion: 0,
        rating: 4.8
      },
      {
        id: "database-design",
        title: "Database Design",
        difficulty: "Advanced",
        duration: "45 min",
        questions: 30,
        completion: 0,
        rating: 4.7
      }
    ]
  },
  {
    id: "devops",
    name: "DevOps & Cloud",
    icon: Cloud,
    color: "bg-purple-100 text-purple-600",
    description: "Docker, Kubernetes, AWS, CI/CD",
    assessments: [
      {
        id: "docker-basics",
        title: "Docker Basics",
        difficulty: "Beginner",
        duration: "25 min",
        questions: 20,
        completion: 0,
        rating: 4.5
      },
      {
        id: "kubernetes",
        title: "Kubernetes",
        difficulty: "Advanced",
        duration: "60 min",
        questions: 35,
        completion: 0,
        rating: 4.9
      },
      {
        id: "aws-fundamentals",
        title: "AWS Fundamentals",
        difficulty: "Intermediate",
        duration: "40 min",
        questions: 28,
        completion: 0,
        rating: 4.7
      }
    ]
  },
  {
    id: "mobile",
    name: "Mobile Development",
    icon: Smartphone,
    color: "bg-orange-100 text-orange-600",
    description: "React Native, Flutter, iOS, Android",
    assessments: [
      {
        id: "react-native",
        title: "React Native",
        difficulty: "Intermediate",
        duration: "45 min",
        questions: 30,
        completion: 0,
        rating: 4.8
      },
      {
        id: "flutter-basics",
        title: "Flutter Basics",
        difficulty: "Beginner",
        duration: "35 min",
        questions: 25,
        completion: 0,
        rating: 4.6
      }
    ]
  },
  {
    id: "data-science",
    name: "Data Science",
    icon: TrendingUp,
    color: "bg-red-100 text-red-600",
    description: "Python, ML, Statistics, Data Analysis",
    assessments: [
      {
        id: "python-ml",
        title: "Python for ML",
        difficulty: "Intermediate",
        duration: "50 min",
        questions: 32,
        completion: 0,
        rating: 4.9
      },
      {
        id: "statistics",
        title: "Statistics Fundamentals",
        difficulty: "Beginner",
        duration: "30 min",
        questions: 22,
        completion: 0,
        rating: 4.5
      }
    ]
  },
  {
    id: "web3",
    name: "Web3 & Blockchain",
    icon: Globe,
    color: "bg-yellow-100 text-yellow-600",
    description: "Solidity, Ethereum, Smart Contracts",
    assessments: [
      {
        id: "solidity-basics",
        title: "Solidity Basics",
        difficulty: "Intermediate",
        duration: "40 min",
        questions: 28,
        completion: 0,
        rating: 4.7
      },
      {
        id: "ethereum",
        title: "Ethereum Development",
        difficulty: "Advanced",
        duration: "55 min",
        questions: 35,
        completion: 0,
        rating: 4.8
      }
    ]
  }
]

export function AvailableAssessments({ onStartAssessment }: AvailableAssessmentsProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {assessmentCategories.map((category) => (
        <div key={category.id} className="fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${category.color}`}>
              <category.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{category.name}</h3>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.assessments.map((assessment) => (
              <Card 
                key={assessment.id} 
                className="professional-card hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={onStartAssessment}
              >
                <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                    <Badge className={getDifficultyColor(assessment.difficulty)}>
                      {assessment.difficulty}
                    </Badge>
                </div>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                      {assessment.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      {assessment.questions} questions
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{assessment.completion}%</span>
                </div>
                    <Progress value={assessment.completion} className="h-2" />

              <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{assessment.rating}</span>
                      </div>
                      <Button size="sm" className="premium-button">
                        Start Assessment
                  </Button>
              </div>
            </div>
                </CardContent>
              </Card>
          ))}
          </div>
        </div>
      ))}

      {/* Featured Assessment */}
      {/* <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Star className="h-4 w-4" />
            Featured Assessment
          </div>
          <h3 className="text-2xl font-bold mb-2">Full Stack Developer Assessment</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Comprehensive assessment covering frontend, backend, and DevOps skills. 
            Perfect for developers looking to validate their full-stack capabilities.
          </p>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">120</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">90</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">4.9</div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
          </div>
          <Button size="lg" className="premium-button">
            <Target className="h-4 w-4 mr-2" />
            Take Featured Assessment
          </Button>
        </div>
      </div> */}
    </div> 
  )
}

