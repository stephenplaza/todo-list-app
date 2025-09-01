/**
 * Main Application Module
 * Orchestrates all the modular components
 */

import { firebaseService } from './services/FirebaseService.js';
import { authService } from './services/AuthService.js';
import { todoService } from './services/TodoService.js';
import { claudeService } from './services/ClaudeService.js';

import { AuthComponent } from './components/AuthComponent.js';
import { TodoListComponent } from './components/TodoListComponent.js';
import { TodoInputComponent } from './components/TodoInputComponent.js';
import { AdminComponent } from './components/AdminComponent.js';
import { ClaudeComponent } from './components/ClaudeComponent.js';
import { ActionsComponent } from './components/ActionsComponent.js';

/**
 * Main TodoApp class that coordinates all modules
 */
export class TodoApp {
    constructor() {
        this.container = document.querySelector('.container');
        this.components = {};
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            // Wait for Firebase to be loaded
            if (typeof window.firebase === 'undefined') {
                setTimeout(() => this.init(), 100);
                return;
            }

            // Initialize services in order
            await this.initializeServices();
            
            // Initialize UI components
            this.initializeComponents();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            this.initialized = true;
            console.log('TodoApp initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize TodoApp:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    /**
     * Initialize all services
     */
    async initializeServices() {
        // Initialize Firebase service
        await firebaseService.initialize();
        
        // Initialize authentication service
        await authService.initialize();
        
        // Initialize todo service
        await todoService.initialize();
        
        // Initialize Claude service
        claudeService.initialize();
    }

    /**
     * Initialize UI components
     */
    initializeComponents() {
        // Initialize authentication component
        this.components.auth = new AuthComponent(this.container);
        
        // Initialize todo list component
        this.components.todoList = new TodoListComponent(this.container);
        
        // Initialize todo input component
        this.components.todoInput = new TodoInputComponent(this.container);
        
        // Initialize admin component
        this.components.admin = new AdminComponent(this.container);
        
        // Initialize Claude component
        this.components.claude = new ClaudeComponent(this.container);
        
        // Initialize actions component
        this.components.actions = new ActionsComponent(this.container);
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Listen for auth state changes to coordinate component visibility
        this.container.addEventListener('auth-state-changed', (event) => {
            this.handleAuthStateChange(event.detail);
        });

        // Global error handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError('An error occurred: ' + event.reason);
        });

        // Handle visibility change for better performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppHidden();
            } else {
                this.handleAppVisible();
            }
        });
    }

    /**
     * Handle authentication state changes
     */
    handleAuthStateChange(detail) {
        const { user, permissions, status } = detail;
        
        // Update component states based on auth status
        switch (status) {
            case 'admin':
                this.components.admin.show();
                this.components.claude.showSummaryButton();
                this.components.actions.show();
                break;
            case 'approved':
                this.components.admin.hide();
                this.components.claude.showSummaryButton();
                this.components.actions.show();
                break;
            default:
                this.components.admin.hide();
                this.components.claude.hideSummaryButton();
                this.components.actions.hide();
        }

        // Emit custom event for other parts of the app
        this.emit('auth-change', { user, permissions, status });
    }

    /**
     * Handle app becoming hidden (tab switch, minimize, etc.)
     */
    handleAppHidden() {
        // Pause any active operations or reduce resource usage
        console.log('App hidden - reducing activity');
    }

    /**
     * Handle app becoming visible again
     */
    handleAppVisible() {
        // Resume normal operations
        console.log('App visible - resuming normal activity');
    }

    /**
     * Show error message to user
     */
    showError(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            font-size: 14px;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
    }

    /**
     * Show success message to user
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            font-size: 14px;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }

    /**
     * Emit custom events
     */
    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        this.container.dispatchEvent(event);
    }

    /**
     * Listen for custom events
     */
    on(eventName, callback) {
        this.container.addEventListener(eventName, callback);
    }

    /**
     * Get a specific component
     */
    getComponent(name) {
        return this.components[name];
    }

    /**
     * Get all components
     */
    getComponents() {
        return this.components;
    }

    /**
     * Get service instances (for debugging or advanced usage)
     */
    getServices() {
        return {
            firebase: firebaseService,
            auth: authService,
            todo: todoService,
            claude: claudeService
        };
    }

    /**
     * Refresh the entire application
     */
    async refresh() {
        try {
            // Force refresh all data
            await todoService.initialize();
            this.showSuccess('Application refreshed');
        } catch (error) {
            console.error('Error refreshing app:', error);
            this.showError('Failed to refresh application');
        }
    }

    /**
     * Export application data (for backup or migration)
     */
    exportData() {
        const data = {
            todos: todoService.getTodos(),
            user: authService.getCurrentUser(),
            permissions: authService.getUserPermissions(),
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-app-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showSuccess('Data exported successfully');
    }

    /**
     * Get application statistics
     */
    getStats() {
        const todoStats = todoService.getStatistics();
        const authStats = {
            isAuthenticated: authService.isAuthenticated(),
            isAdmin: authService.isAdmin(),
            isApproved: authService.isApproved(),
            canAccessClaude: authService.canAccessClaude()
        };

        return {
            todos: todoStats,
            auth: authStats,
            components: Object.keys(this.components),
            initialized: this.initialized
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Clean up components
        Object.values(this.components).forEach(component => {
            if (component.destroy) {
                component.destroy();
            }
        });

        // Clean up services
        if (todoService.destroy) {
            todoService.destroy();
        }

        this.components = {};
        this.initialized = false;
    }
}

// Global instance for backward compatibility and debugging
let todoApp;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    todoApp = new TodoApp();
    await todoApp.init();
    
    // Make globally available for debugging
    window.todoApp = todoApp;
    
    // Legacy global functions for admin panel (can be removed later)
    window.approveRequest = (requestId, uid) => {
        return authService.approveRequest(requestId, uid);
    };
    
    window.denyRequest = (requestId, uid) => {
        return authService.denyRequest(requestId, uid);
    };
});

export { todoApp };