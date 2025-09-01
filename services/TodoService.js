/**
 * Todo Service Module
 * Handles all todo-related operations and data management
 */

import { firebaseService } from './FirebaseService.js';
import { authService } from './AuthService.js';

export class TodoService {
    constructor() {
        this.todos = [];
        this.todoListeners = [];
        this.unsubscribe = null;
    }

    /**
     * Initialize the todo service
     */
    async initialize() {
        if (!firebaseService.isInitialized()) {
            throw new Error('FirebaseService must be initialized first');
        }

        this.setupTodoListener();
    }

    /**
     * Set up real-time listener for todos
     */
    setupTodoListener() {
        this.unsubscribe = firebaseService.onDocumentsSnapshot(
            'todos',
            (todos, error) => {
                if (error) {
                    console.error('Error loading todos:', error);
                    return;
                }
                
                this.todos = todos;
                this.notifyTodoListeners();
            },
            {
                orderBy: ['createdAt', 'desc']
            }
        );
    }

    /**
     * Add a listener for todo changes
     * @param {Function} callback - Callback function
     */
    onTodosChange(callback) {
        this.todoListeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.todoListeners.indexOf(callback);
            if (index > -1) {
                this.todoListeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all todo listeners
     */
    notifyTodoListeners() {
        this.todoListeners.forEach(callback => {
            callback(this.todos);
        });
    }

    /**
     * Add a new todo
     * @param {string} text - Todo text
     * @param {File} file - Optional file attachment
     */
    async addTodo(text, file = null) {
        const user = authService.getCurrentUser();
        
        if (!user || !authService.isApproved()) {
            throw new Error('You need approval to add todos');
        }

        if (!text.trim()) {
            throw new Error('Todo text cannot be empty');
        }

        try {
            let imageUrl = null;

            // Upload image if provided
            if (file) {
                const timestamp = Date.now();
                const fileName = `${user.uid}_${timestamp}_${file.name}`;
                const path = `todo-images/${fileName}`;
                imageUrl = await firebaseService.uploadFile(path, file);
            }

            const todoData = {
                text: text.trim(),
                completed: false,
                imageUrl: imageUrl,
                createdAt: firebaseService.getServerTimestamp(),
                createdBy: {
                    uid: user.uid,
                    displayName: user.displayName || user.email,
                    email: user.email
                }
            };

            await firebaseService.addDocument('todos', todoData);
        } catch (error) {
            console.error('Error adding todo:', error);
            throw new Error('Failed to add todo: ' + error.message);
        }
    }

    /**
     * Toggle todo completion status
     * @param {string} todoId - Todo ID
     * @param {boolean} currentStatus - Current completion status
     */
    async toggleTodo(todoId, currentStatus) {
        if (!authService.isApproved()) {
            throw new Error('You need approval to modify todos');
        }

        try {
            await firebaseService.updateDocument('todos', todoId, {
                completed: !currentStatus
            });
        } catch (error) {
            console.error('Error updating todo:', error);
            throw new Error('Failed to update todo: ' + error.message);
        }
    }

    /**
     * Delete a todo
     * @param {string} todoId - Todo ID
     * @param {Object} createdBy - Creator information
     */
    async deleteTodo(todoId, createdBy) {
        const user = authService.getCurrentUser();
        
        if (!user) {
            throw new Error('Please sign in to delete todos');
        }

        // Admin can delete any todo, others can only delete their own
        if (!authService.isAdmin() && createdBy.uid !== user.uid) {
            throw new Error('You can only delete your own todos');
        }

        try {
            await firebaseService.deleteDocument('todos', todoId);
        } catch (error) {
            console.error('Error deleting todo:', error);
            throw new Error('Failed to delete todo: ' + error.message);
        }
    }

    /**
     * Clear completed todos
     */
    async clearCompletedTodos() {
        const user = authService.getCurrentUser();
        
        if (!user || !authService.isApproved()) {
            throw new Error('You need approval to clear todos');
        }

        try {
            const completedTodos = authService.isAdmin() 
                ? this.todos.filter(todo => todo.completed)
                : this.todos.filter(todo => todo.completed && todo.createdBy.uid === user.uid);

            const deletePromises = completedTodos.map(todo => 
                firebaseService.deleteDocument('todos', todo.id)
            );

            await Promise.all(deletePromises);
        } catch (error) {
            console.error('Error clearing completed todos:', error);
            throw new Error('Failed to clear completed todos: ' + error.message);
        }
    }

    /**
     * Clear all todos (user's own or all if admin)
     */
    async clearAllTodos() {
        const user = authService.getCurrentUser();
        
        if (!user || !authService.isApproved()) {
            throw new Error('You need approval to clear todos');
        }

        const userTodos = authService.isAdmin() 
            ? this.todos
            : this.todos.filter(todo => todo.createdBy.uid === user.uid);

        if (userTodos.length === 0) {
            return;
        }

        const confirmMessage = authService.isAdmin() 
            ? `Are you sure you want to clear ALL ${userTodos.length} todos? (Admin action)`
            : `Are you sure you want to clear all your ${userTodos.length} todos?`;

        if (confirm(confirmMessage)) {
            try {
                const deletePromises = userTodos.map(todo => 
                    firebaseService.deleteDocument('todos', todo.id)
                );

                await Promise.all(deletePromises);
            } catch (error) {
                console.error('Error clearing all todos:', error);
                throw new Error('Failed to clear all todos: ' + error.message);
            }
        }
    }

    /**
     * Get all todos
     * @returns {Array} Array of todos
     */
    getTodos() {
        return this.todos;
    }

    /**
     * Get todos statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;

        return {
            total,
            completed,
            pending,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    /**
     * Get formatted todos for Claude analysis
     * @returns {string} Formatted todo text
     */
    getFormattedTodosForAnalysis() {
        if (this.todos.length === 0) {
            return 'No todos currently in the list.';
        }

        let formatted = `Todo List Analysis (${this.todos.length} items):\n\n`;

        const completedTodos = this.todos.filter(t => t.completed);
        const pendingTodos = this.todos.filter(t => !t.completed);

        formatted += `COMPLETED TASKS (${completedTodos.length}):\n`;
        completedTodos.forEach((todo, index) => {
            const creator = todo.createdBy ? ` (by ${todo.createdBy.displayName || todo.createdBy.email})` : '';
            formatted += `${index + 1}. ✅ ${todo.text}${creator}\n`;
        });

        formatted += `\nPENDING TASKS (${pendingTodos.length}):\n`;
        pendingTodos.forEach((todo, index) => {
            const creator = todo.createdBy ? ` (by ${todo.createdBy.displayName || todo.createdBy.email})` : '';
            formatted += `${index + 1}. ⏳ ${todo.text}${creator}\n`;
        });

        return formatted;
    }

    /**
     * Check if user can modify a todo
     * @param {Object} todo - Todo object
     * @returns {boolean} True if can modify
     */
    canModifyTodo(todo) {
        return authService.isApproved();
    }

    /**
     * Check if user can delete a todo
     * @param {Object} todo - Todo object
     * @returns {boolean} True if can delete
     */
    canDeleteTodo(todo) {
        const user = authService.getCurrentUser();
        return user && (authService.isAdmin() || todo.createdBy.uid === user.uid);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.todoListeners = [];
        this.todos = [];
    }
}

// Export singleton instance
export const todoService = new TodoService();