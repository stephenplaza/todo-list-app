/**
 * Claude AI Service Module
 * Handles Claude AI integration for todo list summarization
 */

import { authService } from './AuthService.js';
import { todoService } from './TodoService.js';

export class ClaudeService {
    constructor() {
        this.apiKey = null;
        this.proxyUrl = 'http://localhost:3001/api/claude';
    }

    /**
     * Initialize Claude service
     */
    initialize() {
        this.loadApiKey();
    }

    /**
     * Load API key from localStorage or prompt user
     */
    loadApiKey() {
        this.apiKey = localStorage.getItem('claude_api_key');
    }

    /**
     * Set Claude API key
     * @param {string} apiKey - Claude API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('claude_api_key', apiKey);
    }

    /**
     * Get Claude API key with user prompt if needed
     * @returns {string|null} API key
     */
    getApiKey() {
        if (!this.apiKey) {
            const userApiKey = prompt(
                'To use Claude summarization, please enter your Claude API key.\n\n' +
                'Get your API key from: https://console.anthropic.com/\n\n' +
                'Your key will be stored locally in your browser.'
            );

            if (userApiKey) {
                this.setApiKey(userApiKey);
                return userApiKey;
            }
        }

        return this.apiKey;
    }

    /**
     * Check if user can access Claude features
     * @returns {boolean} True if can access
     */
    canAccess() {
        return authService.canAccessClaude();
    }

    /**
     * Get todo summary from Claude
     * @returns {Promise<string>} Summary text
     */
    async getSummary() {
        if (!this.canAccess()) {
            throw new Error('You need to be signed in and have permissions to use Claude summarization.');
        }

        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Claude API key not configured. Please enter your API key when prompted.');
        }

        const todoText = todoService.getFormattedTodosForAnalysis();

        try {
            const response = await fetch(this.proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: apiKey,
                    todoText: todoText
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Claude API error:', error);
            
            // Check if it's a network error (proxy server might be down)
            if (error.message.includes('fetch')) {
                throw new Error('Unable to connect to Claude proxy server. Make sure the proxy server is running on localhost:3001');
            }
            
            throw error;
        }
    }

    /**
     * Get productivity insights from Claude
     * @returns {Promise<string>} Insights text
     */
    async getProductivityInsights() {
        if (!this.canAccess()) {
            throw new Error('You need to be signed in and have permissions to use Claude features.');
        }

        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Claude API key not configured.');
        }

        const statistics = todoService.getStatistics();
        const todoText = todoService.getFormattedTodosForAnalysis();

        const prompt = `Analyze this todo list and provide productivity insights:

${todoText}

Statistics:
- Total tasks: ${statistics.total}
- Completed: ${statistics.completed}
- Pending: ${statistics.pending}
- Completion rate: ${statistics.completionRate}%

Please provide:
1. Productivity analysis
2. Pattern identification
3. Recommendations for improvement
4. Priority suggestions`;

        try {
            const response = await fetch(this.proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: apiKey,
                    todoText: prompt
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }

    /**
     * Generate task suggestions based on current todos
     * @returns {Promise<string>} Suggestions text
     */
    async getTaskSuggestions() {
        if (!this.canAccess()) {
            throw new Error('You need to be signed in and have permissions to use Claude features.');
        }

        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Claude API key not configured.');
        }

        const todoText = todoService.getFormattedTodosForAnalysis();

        const prompt = `Based on this todo list, suggest related or follow-up tasks that might be helpful:

${todoText}

Please suggest:
1. Follow-up tasks for completed items
2. Related tasks that might be missing
3. Organizational improvements
4. Goal-oriented suggestions`;

        try {
            const response = await fetch(this.proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: apiKey,
                    todoText: prompt
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }

    /**
     * Clear stored API key
     */
    clearApiKey() {
        this.apiKey = null;
        localStorage.removeItem('claude_api_key');
    }

    /**
     * Check if API key is set
     * @returns {boolean} True if API key is available
     */
    hasApiKey() {
        return !!this.apiKey;
    }

    /**
     * Set proxy URL for Claude API calls
     * @param {string} url - Proxy server URL
     */
    setProxyUrl(url) {
        this.proxyUrl = url;
    }
}

// Export singleton instance
export const claudeService = new ClaudeService();