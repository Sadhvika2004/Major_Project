// Minimal ChatbotService placeholder to satisfy imports and TypeScript
export class ChatbotService {
	async sendMessage(message: string): Promise<{ reply: string }> {
		// Simple echo placeholder — in the real app this would call an LLM or chat API
		return { reply: `Echo: ${message}` }
	}
  
	// Compatibility method used elsewhere in the app
		async getResponse(message: string, online = true): Promise<{ content: string; mode: 'online' | 'offline' }> {
			const res = await this.sendMessage(message)
			return { content: res.reply, mode: online ? 'online' : 'offline' }
		}
}

export const chatbotService = new ChatbotService()

export default ChatbotService
