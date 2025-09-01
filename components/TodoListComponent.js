/**
 * Todo List UI Component
 * Handles todo list rendering and interactions
 */

import { todoService } from '../services/TodoService.js';
import { authService } from '../services/AuthService.js';

export class TodoListComponent {
    constructor(container) {
        this.container = container;
        this.elements = this.findElements();
        this.todos = [];
        this.setupEventListeners();
    }

    /**
     * Find DOM elements
     */
    findElements() {
        return {
            todoList: document.getElementById('todoList'),
            totalTasks: document.getElementById('totalTasks'),
            completedTasks: document.getElementById('completedTasks'),
            imageModal: document.getElementById('imageModal'),
            modalImage: document.getElementById('modalImage'),
            closeModal: document.querySelector('.close-modal')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for todo changes
        todoService.onTodosChange((todos) => {
            this.todos = todos;
            this.render();
        });

        // Image modal event listeners
        this.elements.closeModal.addEventListener('click', () => this.closeImageModal());
        this.elements.imageModal.addEventListener('click', (e) => {
            if (e.target === this.elements.imageModal) this.closeImageModal();
        });
    }

    /**
     * Render the todo list
     */
    render() {
        this.elements.todoList.innerHTML = '';

        this.todos.forEach(todo => {
            const li = this.createTodoElement(todo);
            this.elements.todoList.appendChild(li);
        });

        this.updateStatistics();
    }

    /**
     * Create a todo list item element
     * @param {Object} todo - Todo object
     * @returns {HTMLElement} List item element
     */
    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        const canModify = todoService.canModifyTodo(todo);
        const canDelete = todoService.canDeleteTodo(todo);
        const creatorName = todo.createdBy.displayName || todo.createdBy.email;
        const hasImage = todo.imageUrl;

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} ${!canModify ? 'disabled' : ''}>
            <div class="todo-content">
                <span class="todo-text ${hasImage ? 'todo-text-with-image' : ''}">${this.escapeHtml(todo.text)}</span>
                ${hasImage ? `<img src="${todo.imageUrl}" alt="Todo image" class="todo-image" data-image-url="${todo.imageUrl}">` : ''}
            </div>
            <span class="creator-badge">${this.escapeHtml(creatorName)}</span>
            ${canDelete ? '<button class="delete-btn">Delete</button>' : ''}
        `;

        // Add event listeners
        const checkbox = li.querySelector('.todo-checkbox');
        const deleteBtn = li.querySelector('.delete-btn');
        const todoImage = li.querySelector('.todo-image');

        if (canModify && checkbox) {
            checkbox.addEventListener('change', () => this.handleToggleTodo(todo.id, todo.completed));
        }

        if (canDelete && deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDeleteTodo(todo.id, todo.createdBy));
        }

        if (todoImage) {
            todoImage.addEventListener('click', () => this.showImageModal(todo.imageUrl));
        }

        return li;
    }

    /**
     * Handle toggle todo completion
     */
    async handleToggleTodo(todoId, completed) {
        try {
            await todoService.toggleTodo(todoId, completed);
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * Handle delete todo
     */
    async handleDeleteTodo(todoId, createdBy) {
        try {
            await todoService.deleteTodo(todoId, createdBy);
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * Show image modal
     */
    showImageModal(imageUrl) {
        this.elements.modalImage.src = imageUrl;
        this.elements.imageModal.style.display = 'block';
    }

    /**
     * Close image modal
     */
    closeImageModal() {
        this.elements.imageModal.style.display = 'none';
        this.elements.modalImage.src = '';
    }

    /**
     * Update statistics display
     */
    updateStatistics() {
        const stats = todoService.getStatistics();
        this.elements.totalTasks.textContent = `Total: ${stats.total}`;
        this.elements.completedTasks.textContent = `Completed: ${stats.completed}`;
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
     * Get current todos
     */
    getTodos() {
        return this.todos;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return todoService.getStatistics();
    }
}