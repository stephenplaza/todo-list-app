/**
 * Claude AI UI Component
 * Handles Claude AI integration UI and modal interactions
 */

import { claudeService } from '../services/ClaudeService.js';
import { todoService } from '../services/TodoService.js';

export class ClaudeComponent {
    constructor(container) {
        this.container = container;
        this.elements = this.findElements();
        this.setupEventListeners();
    }

    /**
     * Find DOM elements
     */
    findElements() {
        return {
            summarizeBtn: document.getElementById('summarizeBtn'),
            claudeModal: document.getElementById('claudeModal'),
            claudeSummary: document.getElementById('claudeSummary'),
            claudeClose: document.querySelector('.claude-close'),
            closeSummary: document.getElementById('closeSummary')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.elements.summarizeBtn.addEventListener('click', () => this.showSummary());
        this.elements.claudeClose.addEventListener('click', () => this.hideModal());
        this.elements.closeSummary.addEventListener('click', () => this.hideModal());

        // Close modal when clicking outside
        this.elements.claudeModal.addEventListener('click', (e) => {
            if (e.target === this.elements.claudeModal) {
                this.hideModal();
            }
        });
    }

    /**
     * Show Claude summary modal
     */
    async showSummary() {
        if (!claudeService.canAccess()) {
            alert('You need to be signed in and have permissions to use Claude summarization.');
            return;
        }

        this.elements.claudeModal.style.display = 'block';
        this.elements.claudeSummary.innerHTML = '<div class="loading">Analyzing your todo list with Claude...</div>';

        try {
            const summary = await claudeService.getSummary();
            this.elements.claudeSummary.innerHTML = `<p>${this.formatText(summary)}</p>`;
        } catch (error) {
            console.error('Claude API error:', error);
            this.elements.claudeSummary.innerHTML = this.createErrorMessage(error.message);
        }
    }

    /**
     * Show productivity insights
     */
    async showProductivityInsights() {
        if (!claudeService.canAccess()) {
            alert('You need to be signed in and have permissions to use Claude features.');
            return;
        }

        this.elements.claudeModal.style.display = 'block';
        this.elements.claudeSummary.innerHTML = '<div class="loading">Getting productivity insights from Claude...</div>';

        try {
            const insights = await claudeService.getProductivityInsights();
            this.elements.claudeSummary.innerHTML = `<div class="insights">${this.formatText(insights)}</div>`;
        } catch (error) {
            console.error('Claude API error:', error);
            this.elements.claudeSummary.innerHTML = this.createErrorMessage(error.message);
        }
    }

    /**
     * Show task suggestions
     */
    async showTaskSuggestions() {
        if (!claudeService.canAccess()) {
            alert('You need to be signed in and have permissions to use Claude features.');
            return;
        }

        this.elements.claudeModal.style.display = 'block';
        this.elements.claudeSummary.innerHTML = '<div class="loading">Getting task suggestions from Claude...</div>';

        try {
            const suggestions = await claudeService.getTaskSuggestions();
            this.elements.claudeSummary.innerHTML = `<div class="suggestions">${this.formatText(suggestions)}</div>`;
        } catch (error) {
            console.error('Claude API error:', error);
            this.elements.claudeSummary.innerHTML = this.createErrorMessage(error.message);
        }
    }

    /**
     * Hide Claude modal
     */
    hideModal() {
        this.elements.claudeModal.style.display = 'none';
    }

    /**
     * Create error message HTML
     */
    createErrorMessage(errorMessage) {
        return `
            <div style="color: #d73502; background: #fdf2f2; padding: 15px; border-radius: 5px; border: 1px solid #f5c6cb;">
                <strong>Error:</strong> ${this.escapeHtml(errorMessage)}<br>
                <small>Make sure you've set up your Claude API key and the proxy server is running. See console for more details.</small>
            </div>
        `;
    }

    /**
     * Format text with basic markdown-like formatting
     */
    formatText(text) {
        if (!text) return '';

        // Convert line breaks to HTML
        let formatted = text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
        
        // Wrap in paragraph tags
        if (!formatted.startsWith('<p>')) {
            formatted = `<p>${formatted}</p>`;
        }

        // Basic formatting
        formatted = formatted
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/`(.*?)`/g, '<code>$1</code>'); // Code

        return formatted;
    }

    /**
     * Show summary button
     */
    showSummaryButton() {
        this.elements.summarizeBtn.style.display = 'inline-block';
    }

    /**
     * Hide summary button
     */
    hideSummaryButton() {
        this.elements.summarizeBtn.style.display = 'none';
    }

    /**
     * Check if Claude is accessible
     */
    isAccessible() {
        return claudeService.canAccess();
    }

    /**
     * Set up API key
     */
    setupApiKey() {
        const apiKey = prompt(
            'To use Claude summarization, please enter your Claude API key.\n\n' +
            'Get your API key from: https://console.anthropic.com/\n\n' +
            'Your key will be stored locally in your browser.'
        );

        if (apiKey) {
            claudeService.setApiKey(apiKey);
            alert('API key saved successfully!');
        }
    }

    /**
     * Clear API key
     */
    clearApiKey() {
        claudeService.clearApiKey();
        alert('API key cleared.');
    }

    /**
     * Check if API key is set
     */
    hasApiKey() {
        return claudeService.hasApiKey();
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get current todos count for context
     */
    getTodosContext() {
        const todos = todoService.getTodos();
        const stats = todoService.getStatistics();
        
        return {
            totalTodos: todos.length,
            completedTodos: stats.completed,
            pendingTodos: stats.pending,
            hasTodos: todos.length > 0
        };
    }
}