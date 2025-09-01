/**
 * Actions UI Component
 * Handles todo list actions like clear completed, clear all, etc.
 */

import { todoService } from '../services/TodoService.js';
import { authService } from '../services/AuthService.js';

export class ActionsComponent {
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
            clearCompleted: document.getElementById('clearCompleted'),
            clearAll: document.getElementById('clearAll'),
            actionsSection: document.getElementById('actionsSection')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.elements.clearCompleted.addEventListener('click', () => this.handleClearCompleted());
        this.elements.clearAll.addEventListener('click', () => this.handleClearAll());

        // Listen for todos changes to update button states
        todoService.onTodosChange(() => {
            this.updateButtonStates();
        });

        // Listen for auth changes to show/hide actions
        authService.onAuthStateChange(() => {
            this.updateVisibility();
        });
    }

    /**
     * Handle clear completed todos
     */
    async handleClearCompleted() {
        if (!this.canPerformActions()) {
            alert('You need approval to clear todos');
            return;
        }

        const todos = todoService.getTodos();
        const completedTodos = this.getRelevantCompletedTodos(todos);

        if (completedTodos.length === 0) {
            alert('No completed todos to clear.');
            return;
        }

        const message = authService.isAdmin() 
            ? `Clear all ${completedTodos.length} completed todos? (Admin action)`
            : `Clear your ${completedTodos.length} completed todos?`;

        if (confirm(message)) {
            try {
                await todoService.clearCompletedTodos();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    /**
     * Handle clear all todos
     */
    async handleClearAll() {
        if (!this.canPerformActions()) {
            alert('You need approval to clear todos');
            return;
        }

        const todos = todoService.getTodos();
        const relevantTodos = this.getRelevantTodos(todos);

        if (relevantTodos.length === 0) {
            alert('No todos to clear.');
            return;
        }

        const message = authService.isAdmin() 
            ? `Are you sure you want to clear ALL ${relevantTodos.length} todos? This action cannot be undone. (Admin action)`
            : `Are you sure you want to clear all your ${relevantTodos.length} todos? This action cannot be undone.`;

        if (confirm(message)) {
            try {
                await todoService.clearAllTodos();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    /**
     * Get relevant todos based on user permissions
     */
    getRelevantTodos(todos) {
        if (authService.isAdmin()) {
            return todos;
        }
        
        const currentUser = authService.getCurrentUser();
        return currentUser ? todos.filter(todo => todo.createdBy.uid === currentUser.uid) : [];
    }

    /**
     * Get relevant completed todos based on user permissions
     */
    getRelevantCompletedTodos(todos) {
        const relevantTodos = this.getRelevantTodos(todos);
        return relevantTodos.filter(todo => todo.completed);
    }

    /**
     * Update button states based on available todos
     */
    updateButtonStates() {
        const todos = todoService.getTodos();
        const relevantTodos = this.getRelevantTodos(todos);
        const completedTodos = this.getRelevantCompletedTodos(todos);

        // Enable/disable clear completed button
        this.elements.clearCompleted.disabled = completedTodos.length === 0;
        if (completedTodos.length === 0) {
            this.elements.clearCompleted.style.opacity = '0.5';
            this.elements.clearCompleted.style.cursor = 'not-allowed';
        } else {
            this.elements.clearCompleted.style.opacity = '1';
            this.elements.clearCompleted.style.cursor = 'pointer';
        }

        // Enable/disable clear all button
        this.elements.clearAll.disabled = relevantTodos.length === 0;
        if (relevantTodos.length === 0) {
            this.elements.clearAll.style.opacity = '0.5';
            this.elements.clearAll.style.cursor = 'not-allowed';
        } else {
            this.elements.clearAll.style.opacity = '1';
            this.elements.clearAll.style.cursor = 'pointer';
        }

        // Update button text with counts
        this.updateButtonText(completedTodos.length, relevantTodos.length);
    }

    /**
     * Update button text with counts
     */
    updateButtonText(completedCount, totalCount) {
        this.elements.clearCompleted.textContent = `Clear Completed${completedCount > 0 ? ` (${completedCount})` : ''}`;
        this.elements.clearAll.textContent = `Clear All${totalCount > 0 ? ` (${totalCount})` : ''}`;
    }

    /**
     * Update visibility based on auth state
     */
    updateVisibility() {
        if (this.canPerformActions()) {
            this.elements.actionsSection.style.display = 'flex';
        } else {
            this.elements.actionsSection.style.display = 'none';
        }
    }

    /**
     * Check if user can perform actions
     */
    canPerformActions() {
        return authService.isApproved();
    }

    /**
     * Show actions section
     */
    show() {
        this.elements.actionsSection.style.display = 'flex';
    }

    /**
     * Hide actions section
     */
    hide() {
        this.elements.actionsSection.style.display = 'none';
    }

    /**
     * Get actions statistics
     */
    getActionStats() {
        const todos = todoService.getTodos();
        const relevantTodos = this.getRelevantTodos(todos);
        const completedTodos = this.getRelevantCompletedTodos(todos);

        return {
            totalRelevant: relevantTodos.length,
            completedRelevant: completedTodos.length,
            canClearCompleted: completedTodos.length > 0,
            canClearAll: relevantTodos.length > 0
        };
    }
}