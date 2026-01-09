// Minimal API service placeholders used by widgets to avoid TypeScript errors
export const jobMarketAPI = {
	async fetchTrends() {
		return { trends: [] as any[] }
	}
	,
	async getTrendingSkills() {
			return [
				{ skill: 'React', demand: 85, growth: 12, averageSalary: 120000, jobCount: 45000 },
				{ skill: 'TypeScript', demand: 78, growth: 9, averageSalary: 130000, jobCount: 38000 },
				{ skill: 'Python', demand: 82, growth: 10, averageSalary: 125000, jobCount: 41000 },
			] as any[]
	}
}

export const learningAPI = {
	async fetchLiveCourses() {
		return { courses: [] as any[] }
	}
	,
	async getTrendingCourses() {
		return [] as any[]
	}
}

export default { jobMarketAPI, learningAPI }

// Additional convenience methods used by widgets
export async function getTrendingSkills() {
	return [] as string[]
}

export async function getTrendingCourses() {
	return [] as any[]
}
