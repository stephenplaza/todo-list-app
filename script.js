class FirebaseTodoApp {
    constructor() {
        this.currentUser = null;
        this.userPermissions = null;
        this.unsubscribe = null;
        this.accessRequestsUnsubscribe = null;
        this.todos = [];
        this.accessRequests = [];
        this.ADMIN_EMAIL = 'plaza.stephen@gmail.com'; // Admin email
        
        // DOM elements
        this.loginSection = document.getElementById('loginSection');
        this.userSection = document.getElementById('userSection');
        this.pendingSection = document.getElementById('pendingSection');
        this.deniedSection = document.getElementById('deniedSection');
        this.userInfo = document.getElementById('userInfo');
        this.inputSection = document.getElementById('inputSection');
        this.actionsSection = document.getElementById('actionsSection');
        this.accessRequestSection = document.getElementById('accessRequestSection');
        this.adminPanel = document.getElementById('adminPanel');
        
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.clearAll = document.getElementById('clearAll');
        
        // File upload elements
        this.fileInput = document.getElementById('fileInput');
        this.fileBtn = document.getElementById('fileBtn');
        this.filePreview = document.getElementById('filePreview');
        this.previewImg = document.getElementById('previewImg');
        this.removeFileBtn = document.getElementById('removeFile');
        this.fileName = document.getElementById('fileName');
        
        // Image modal elements
        this.imageModal = document.getElementById('imageModal');
        this.modalImage = document.getElementById('modalImage');
        this.closeModal = document.querySelector('.close-modal');
        
        // Selected file
        this.selectedFile = null;
        
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.logoutBtnPending = document.getElementById('logoutBtnPending');
        this.logoutBtnDenied = document.getElementById('logoutBtnDenied');
        
        this.accessReason = document.getElementById('accessReason');
        this.submitAccessRequest = document.getElementById('submitAccessRequest');
        this.cancelAccessRequest = document.getElementById('cancelAccessRequest');
        this.requestAccessAgain = document.getElementById('requestAccessAgain');
        this.accessRequestsList = document.getElementById('accessRequestsList');
        
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
        this.logoutBtnPending.addEventListener('click', () => this.signOut());
        this.logoutBtnDenied.addEventListener('click', () => this.signOut());
        
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTodos());
        this.clearAll.addEventListener('click', () => this.clearAllTodos());
        
        this.submitAccessRequest.addEventListener('click', () => this.submitAccessRequestHandler());
        this.cancelAccessRequest.addEventListener('click', () => this.cancelAccessRequestHandler());
        this.requestAccessAgain.addEventListener('click', () => this.showAccessRequestForm());
        
        // File upload event listeners
        this.fileBtn.addEventListener('click', () => this.triggerFileInput());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeFileBtn.addEventListener('click', () => this.removeFile());
        
        // Image modal event listeners
        this.closeModal.addEventListener('click', () => this.closeImageModal());
        this.imageModal.addEventListener('click', (e) => {
            if (e.target === this.imageModal) this.closeImageModal();
        });
    }
    
    async handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            // Check user permissions
            await this.checkUserPermissions();
            
            if (this.isAdmin()) {
                // Admin sees everything + admin panel
                this.showAdminInterface();
                this.loadAccessRequests();
            } else if (this.userPermissions?.status === 'approved') {
                // Approved user sees normal interface
                this.showApprovedInterface();
            } else if (this.userPermissions?.status === 'pending') {
                // Pending user sees pending message
                this.showPendingInterface();
            } else if (this.userPermissions?.status === 'denied') {
                // Denied user sees denied message with option to request again
                this.showDeniedInterface();
            } else {
                // New user with no permissions - show access request form
                this.showAccessRequestForm();
            }
        } else {
            // User is signed out - show login
            this.showLoginInterface();
        }
    }
    
    async checkUserPermissions() {
        if (!this.currentUser) return;
        
        try {
            const permissionsQuery = window.firebase.query(
                window.firebase.collection(window.firebase.db, 'userPermissions'),
                window.firebase.where('uid', '==', this.currentUser.uid)
            );
            const permissionsSnapshot = await window.firebase.getDocs(permissionsQuery);
            
            if (!permissionsSnapshot.empty) {
                this.userPermissions = permissionsSnapshot.docs[0].data();
            } else {
                this.userPermissions = null;
            }
        } catch (error) {
            console.error('Error checking user permissions:', error);
            this.userPermissions = null;
        }
    }
    
    isAdmin() {
        return this.currentUser?.email === this.ADMIN_EMAIL;
    }
    
    showLoginInterface() {
        this.hideAllSections();
        this.loginSection.style.display = 'block';
    }
    
    showApprovedInterface() {
        this.hideAllSections();
        this.userSection.style.display = 'flex';
        this.inputSection.style.display = 'flex';
        this.actionsSection.style.display = 'flex';
        this.userInfo.textContent = `Welcome, ${this.currentUser.displayName || this.currentUser.email}`;
    }
    
    showAdminInterface() {
        this.hideAllSections();
        this.userSection.style.display = 'flex';
        this.inputSection.style.display = 'flex';
        this.actionsSection.style.display = 'flex';
        this.adminPanel.style.display = 'block';
        this.userInfo.innerHTML = `Welcome, ${this.currentUser.displayName || this.currentUser.email} <span style="color: #ff6b6b; font-weight: bold;">[ADMIN]</span>`;
    }
    
    showPendingInterface() {
        this.hideAllSections();
        this.pendingSection.style.display = 'block';
    }
    
    showDeniedInterface() {
        this.hideAllSections();
        this.deniedSection.style.display = 'block';
    }
    
    showAccessRequestForm() {
        this.hideAllSections();
        this.accessRequestSection.style.display = 'block';
        this.accessReason.value = '';
    }
    
    hideAllSections() {
        this.loginSection.style.display = 'none';
        this.userSection.style.display = 'none';
        this.pendingSection.style.display = 'none';
        this.deniedSection.style.display = 'none';
        this.inputSection.style.display = 'none';
        this.actionsSection.style.display = 'none';
        this.accessRequestSection.style.display = 'none';
        this.adminPanel.style.display = 'none';
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
    
    async submitAccessRequestHandler() {
        const reason = this.accessReason.value.trim();
        if (!reason) {
            alert('Please provide a reason for requesting access.');
            return;
        }
        
        try {
            // Create access request
            await window.firebase.addDoc(
                window.firebase.collection(window.firebase.db, 'accessRequests'), 
                {
                    uid: this.currentUser.uid,
                    email: this.currentUser.email,
                    displayName: this.currentUser.displayName || this.currentUser.email,
                    reason: reason,
                    status: 'pending',
                    requestedAt: window.firebase.serverTimestamp(),
                    reviewedAt: null,
                    reviewedBy: null
                }
            );
            
            // Create user permissions record
            await window.firebase.addDoc(
                window.firebase.collection(window.firebase.db, 'userPermissions'),
                {
                    uid: this.currentUser.uid,
                    email: this.currentUser.email,
                    status: 'pending',
                    createdAt: window.firebase.serverTimestamp(),
                    updatedAt: window.firebase.serverTimestamp()
                }
            );
            
            this.userPermissions = { status: 'pending' };
            this.showPendingInterface();
            
        } catch (error) {
            console.error('Error submitting access request:', error);
            alert('Failed to submit access request: ' + error.message);
        }
    }
    
    cancelAccessRequestHandler() {
        this.showLoginInterface();
        this.signOut();
    }
    
    triggerFileInput() {
        // iOS Safari requires user gesture to trigger file input
        this.fileInput.click();
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        console.log('File selected:', file.name, file.type, file.size);
        
        // Validate file type (including HEIC for iOS)
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
        const isValidType = file.type.startsWith('image/') || validTypes.includes(file.type.toLowerCase());
        
        if (!isValidType) {
            alert('Please select an image file (JPG, PNG, GIF, WebP, HEIC).');
            return;
        }
        
        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert(`File size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Please choose a file smaller than 5MB.`);
            return;
        }
        
        this.selectedFile = file;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImg.src = e.target.result;
            this.previewImg.style.display = 'block';
            this.fileName.textContent = file.name;
            this.filePreview.style.display = 'flex';
            console.log('Preview loaded successfully');
        };
        reader.onerror = (e) => {
            console.error('Error reading file:', e);
            alert('Error reading the selected file. Please try again.');
        };
        reader.readAsDataURL(file);
    }
    
    removeFile() {
        this.selectedFile = null;
        this.fileInput.value = '';
        this.filePreview.style.display = 'none';
        this.previewImg.src = '';
        this.fileName.textContent = '';
    }
    
    showImageModal(imageUrl) {
        this.modalImage.src = imageUrl;
        this.imageModal.style.display = 'block';
    }
    
    closeImageModal() {
        this.imageModal.style.display = 'none';
        this.modalImage.src = '';
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
    
    loadAccessRequests() {
        if (!this.isAdmin()) return;
        
        const requestsRef = window.firebase.collection(window.firebase.db, 'accessRequests');
        const q = window.firebase.query(requestsRef, window.firebase.orderBy('requestedAt', 'desc'));
        
        this.accessRequestsUnsubscribe = window.firebase.onSnapshot(q, (snapshot) => {
            this.accessRequests = [];
            snapshot.forEach((doc) => {
                this.accessRequests.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            this.renderAccessRequests();
        }, (error) => {
            console.error('Error loading access requests:', error);
        });
    }
    
    renderAccessRequests() {
        if (!this.isAdmin()) return;
        
        this.accessRequestsList.innerHTML = '';
        
        const pendingRequests = this.accessRequests.filter(req => req.status === 'pending');
        
        if (pendingRequests.length === 0) {
            this.accessRequestsList.innerHTML = '<p style="text-align: center; color: #666;">No pending access requests.</p>';
            return;
        }
        
        pendingRequests.forEach(request => {
            const div = document.createElement('div');
            div.className = 'access-request-item';
            
            const requestDate = request.requestedAt ? 
                new Date(request.requestedAt.seconds * 1000).toLocaleDateString() : 
                'Unknown';
            
            div.innerHTML = `
                <div class="request-header">
                    <span class="request-user">${this.escapeHtml(request.displayName)}</span>
                    <span class="request-date">${requestDate}</span>
                </div>
                <div class="request-reason">"${this.escapeHtml(request.reason)}"</div>
                <div class="request-actions">
                    <button class="approve-btn" onclick="todoApp.approveRequest('${request.id}', '${request.uid}')">Approve</button>
                    <button class="deny-btn" onclick="todoApp.denyRequest('${request.id}', '${request.uid}')">Deny</button>
                </div>
            `;
            
            this.accessRequestsList.appendChild(div);
        });
    }
    
    async approveRequest(requestId, uid) {
        try {
            // Update access request
            await window.firebase.updateDoc(
                window.firebase.doc(window.firebase.db, 'accessRequests', requestId),
                {
                    status: 'approved',
                    reviewedAt: window.firebase.serverTimestamp(),
                    reviewedBy: this.currentUser.email
                }
            );
            
            // Update user permissions
            const permissionsQuery = window.firebase.query(
                window.firebase.collection(window.firebase.db, 'userPermissions'),
                window.firebase.where('uid', '==', uid)
            );
            const permissionsSnapshot = await window.firebase.getDocs(permissionsQuery);
            
            if (!permissionsSnapshot.empty) {
                const permissionDoc = permissionsSnapshot.docs[0];
                await window.firebase.updateDoc(
                    window.firebase.doc(window.firebase.db, 'userPermissions', permissionDoc.id),
                    {
                        status: 'approved',
                        updatedAt: window.firebase.serverTimestamp()
                    }
                );
            }
            
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Failed to approve request: ' + error.message);
        }
    }
    
    async denyRequest(requestId, uid) {
        try {
            // Update access request
            await window.firebase.updateDoc(
                window.firebase.doc(window.firebase.db, 'accessRequests', requestId),
                {
                    status: 'denied',
                    reviewedAt: window.firebase.serverTimestamp(),
                    reviewedBy: this.currentUser.email
                }
            );
            
            // Update user permissions
            const permissionsQuery = window.firebase.query(
                window.firebase.collection(window.firebase.db, 'userPermissions'),
                window.firebase.where('uid', '==', uid)
            );
            const permissionsSnapshot = await window.firebase.getDocs(permissionsQuery);
            
            if (!permissionsSnapshot.empty) {
                const permissionDoc = permissionsSnapshot.docs[0];
                await window.firebase.updateDoc(
                    window.firebase.doc(window.firebase.db, 'userPermissions', permissionDoc.id),
                    {
                        status: 'denied',
                        updatedAt: window.firebase.serverTimestamp()
                    }
                );
            }
            
        } catch (error) {
            console.error('Error denying request:', error);
            alert('Failed to deny request: ' + error.message);
        }
    }
    
    async addTodo() {
        if (!this.currentUser || (!this.isAdmin() && this.userPermissions?.status !== 'approved')) {
            alert('You need approval to add todos');
            return;
        }
        
        const text = this.todoInput.value.trim();
        if (text === '') return;
        
        try {
            let imageUrl = null;
            
            // Upload image if selected
            if (this.selectedFile) {
                const timestamp = Date.now();
                const fileName = `${this.currentUser.uid}_${timestamp}_${this.selectedFile.name}`;
                const storageRef = window.firebase.ref(window.firebase.storage, `todo-images/${fileName}`);
                
                // Upload file to Firebase Storage
                await window.firebase.uploadBytes(storageRef, this.selectedFile);
                
                // Get download URL
                imageUrl = await window.firebase.getDownloadURL(storageRef);
            }
            
            const todoData = {
                text: text,
                completed: false,
                imageUrl: imageUrl,
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
            
            // Reset form
            this.todoInput.value = '';
            this.removeFile();
            
        } catch (error) {
            console.error('Error adding todo:', error);
            alert('Failed to add todo: ' + error.message);
        }
    }
    
    async toggleTodo(id, completed) {
        if (!this.currentUser || (!this.isAdmin() && this.userPermissions?.status !== 'approved')) {
            alert('You need approval to modify todos');
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
        
        // Admin can delete any todo, others can only delete their own
        if (!this.isAdmin() && createdBy.uid !== this.currentUser.uid) {
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
        if (!this.currentUser || (!this.isAdmin() && this.userPermissions?.status !== 'approved')) {
            alert('You need approval to clear todos');
            return;
        }
        
        try {
            const completedTodos = this.isAdmin() 
                ? this.todos.filter(todo => todo.completed)
                : this.todos.filter(todo => todo.completed && todo.createdBy.uid === this.currentUser.uid);
            
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
        if (!this.currentUser || (!this.isAdmin() && this.userPermissions?.status !== 'approved')) {
            alert('You need approval to clear todos');
            return;
        }
        
        const userTodos = this.isAdmin() 
            ? this.todos
            : this.todos.filter(todo => todo.createdBy.uid === this.currentUser.uid);
        
        if (userTodos.length === 0) return;
        
        const confirmMessage = this.isAdmin() 
            ? `Are you sure you want to clear ALL ${userTodos.length} todos? (Admin action)`
            : `Are you sure you want to clear all your ${userTodos.length} todos?`;
        
        if (confirm(confirmMessage)) {
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
            const canModify = this.currentUser && (this.isAdmin() || this.userPermissions?.status === 'approved');
            const canDelete = this.currentUser && (this.isAdmin() || isOwnTodo);
            const creatorName = todo.createdBy.displayName || todo.createdBy.email;
            
            const hasImage = todo.imageUrl;
            
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} ${!canModify ? 'disabled' : ''}>
                <div class="todo-content">
                    <span class="todo-text ${hasImage ? 'todo-text-with-image' : ''}">${this.escapeHtml(todo.text)}</span>
                    ${hasImage ? `<img src="${todo.imageUrl}" alt="Todo image" class="todo-image" onclick="todoApp.showImageModal('${todo.imageUrl}')">` : ''}
                </div>
                <span class="creator-badge">${this.escapeHtml(creatorName)}</span>
                ${canDelete ? '<button class="delete-btn">Delete</button>' : ''}
            `;
            
            const checkbox = li.querySelector('.todo-checkbox');
            const deleteBtn = li.querySelector('.delete-btn');
            
            if (canModify) {
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

// Global instance for admin functions
let todoApp;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new FirebaseTodoApp();
});