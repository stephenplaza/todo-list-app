class FirebaseTodoApp {
    constructor() {
        this.currentUser = null;
        this.unsubscribe = null;
        this.todos = [];
        
        // DOM elements
        this.loginSection = document.getElementById('loginSection');
        this.userSection = document.getElementById('userSection');
        this.userInfo = document.getElementById('userInfo');
        this.inputSection = document.getElementById('inputSection');
        this.actionsSection = document.getElementById('actionsSection');
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.clearAll = document.getElementById('clearAll');
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        this.init();
    }
    
    init() {
        // Wait for Firebase to be loaded
        if (typeof window.firebase === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Listen for auth state changes
        window.firebase.onAuthStateChanged(window.firebase.auth, (user) => {
            this.handleAuthStateChange(user);
        });
        
        // Load todos (anyone can read)
        this.loadTodos();
    }
    
    setupEventListeners() {
        this.loginBtn.addEventListener('click', () => this.signIn());
        this.logoutBtn.addEventListener('click', () => this.signOut());
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTodos());
        this.clearAll.addEventListener('click', () => this.clearAllTodos());
    }
    
    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            // User is signed in
            this.loginSection.style.display = 'none';
            this.userSection.style.display = 'flex';
            this.inputSection.style.display = 'flex';
            this.actionsSection.style.display = 'flex';
            this.userInfo.textContent = `Welcome, ${user.displayName || user.email}`;
        } else {
            // User is signed out
            this.loginSection.style.display = 'block';
            this.userSection.style.display = 'none';
            this.inputSection.style.display = 'none';
            this.actionsSection.style.display = 'none';
        }
    }
    
    async signIn() {
        try {
            await window.firebase.signInWithPopup(window.firebase.auth, window.firebase.provider);
        } catch (error) {
            console.error('Sign in failed:', error);
            alert('Sign in failed: ' + error.message);
        }
    }
    
    async signOut() {
        try {
            await window.firebase.signOut(window.firebase.auth);
        } catch (error) {
            console.error('Sign out failed:', error);
            alert('Sign out failed: ' + error.message);
        }
    }
    
    loadTodos() {
        // Set up real-time listener for todos
        const todosRef = window.firebase.collection(window.firebase.db, 'todos');
        const q = window.firebase.query(todosRef, window.firebase.orderBy('createdAt', 'desc'));
        
        this.unsubscribe = window.firebase.onSnapshot(q, (snapshot) => {
            this.todos = [];
            snapshot.forEach((doc) => {
                this.todos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            this.render();
        }, (error) => {
            console.error('Error loading todos:', error);
        });
    }
    
    async addTodo() {
        if (!this.currentUser) {
            alert('Please sign in to add todos');
            return;
        }
        
        const text = this.todoInput.value.trim();
        if (text === '') return;
        
        try {
            const todoData = {
                text: text,
                completed: false,
                createdAt: window.firebase.serverTimestamp(),
                createdBy: {
                    uid: this.currentUser.uid,
                    displayName: this.currentUser.displayName || this.currentUser.email,
                    email: this.currentUser.email
                }
            };
            
            await window.firebase.addDoc(
                window.firebase.collection(window.firebase.db, 'todos'), 
                todoData
            );
            
            this.todoInput.value = '';
        } catch (error) {
            console.error('Error adding todo:', error);
            alert('Failed to add todo: ' + error.message);
        }
    }
    
    async toggleTodo(id, completed) {
        if (!this.currentUser) {
            alert('Please sign in to modify todos');
            return;
        }
        
        try {
            const todoRef = window.firebase.doc(window.firebase.db, 'todos', id);
            await window.firebase.updateDoc(todoRef, {
                completed: !completed
            });
        } catch (error) {
            console.error('Error updating todo:', error);
            alert('Failed to update todo: ' + error.message);
        }
    }
    
    async deleteTodo(id, createdBy) {
        if (!this.currentUser) {
            alert('Please sign in to delete todos');
            return;
        }
        
        // Only allow the creator to delete their own todos
        if (createdBy.uid !== this.currentUser.uid) {
            alert('You can only delete your own todos');
            return;
        }
        
        try {
            const todoRef = window.firebase.doc(window.firebase.db, 'todos', id);
            await window.firebase.deleteDoc(todoRef);
        } catch (error) {
            console.error('Error deleting todo:', error);
            alert('Failed to delete todo: ' + error.message);
        }
    }
    
    async clearCompletedTodos() {
        if (!this.currentUser) {
            alert('Please sign in to clear todos');
            return;
        }
        
        try {
            const completedTodos = this.todos.filter(todo => 
                todo.completed && todo.createdBy.uid === this.currentUser.uid
            );
            
            const deletePromises = completedTodos.map(todo => {
                const todoRef = window.firebase.doc(window.firebase.db, 'todos', todo.id);
                return window.firebase.deleteDoc(todoRef);
            });
            
            await Promise.all(deletePromises);
        } catch (error) {
            console.error('Error clearing completed todos:', error);
            alert('Failed to clear completed todos: ' + error.message);
        }
    }
    
    async clearAllTodos() {
        if (!this.currentUser) {
            alert('Please sign in to clear todos');
            return;
        }
        
        const userTodos = this.todos.filter(todo => todo.createdBy.uid === this.currentUser.uid);
        
        if (userTodos.length === 0) return;
        
        if (confirm(`Are you sure you want to clear all your ${userTodos.length} todos?`)) {
            try {
                const deletePromises = userTodos.map(todo => {
                    const todoRef = window.firebase.doc(window.firebase.db, 'todos', todo.id);
                    return window.firebase.deleteDoc(todoRef);
                });
                
                await Promise.all(deletePromises);
            } catch (error) {
                console.error('Error clearing all todos:', error);
                alert('Failed to clear all todos: ' + error.message);
            }
        }
    }
    
    render() {
        this.todoList.innerHTML = '';
        
        this.todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            const isOwnTodo = this.currentUser && todo.createdBy.uid === this.currentUser.uid;
            const creatorName = todo.createdBy.displayName || todo.createdBy.email;
            
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} ${!this.currentUser ? 'disabled' : ''}>
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <span class="creator-badge">${this.escapeHtml(creatorName)}</span>
                ${isOwnTodo ? '<button class="delete-btn">Delete</button>' : ''}
            `;
            
            const checkbox = li.querySelector('.todo-checkbox');
            const deleteBtn = li.querySelector('.delete-btn');
            
            if (this.currentUser) {
                checkbox.addEventListener('change', () => this.toggleTodo(todo.id, todo.completed));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id, todo.createdBy));
            }
            
            this.todoList.appendChild(li);
        });
        
        this.updateStats();
    }
    
    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        
        this.totalTasks.textContent = `Total: ${total}`;
        this.completedTasks.textContent = `Completed: ${completed}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FirebaseTodoApp();
});