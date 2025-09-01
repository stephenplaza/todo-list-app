/**
 * Authentication UI Component
 * Handles authentication-related UI rendering and interactions
 */

import { authService } from '../services/AuthService.js';

export class AuthComponent {
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
            // Sections
            loginSection: document.getElementById('loginSection'),
            userSection: document.getElementById('userSection'),
            pendingSection: document.getElementById('pendingSection'),
            deniedSection: document.getElementById('deniedSection'),
            accessRequestSection: document.getElementById('accessRequestSection'),
            
            // User info
            userInfo: document.getElementById('userInfo'),
            
            // Buttons
            loginBtn: document.getElementById('loginBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            logoutBtnPending: document.getElementById('logoutBtnPending'),
            logoutBtnDenied: document.getElementById('logoutBtnDenied'),
            requestAccessAgain: document.getElementById('requestAccessAgain'),
            
            // Access request form
            accessReason: document.getElementById('accessReason'),
            submitAccessRequest: document.getElementById('submitAccessRequest'),
            cancelAccessRequest: document.getElementById('cancelAccessRequest')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.elements.loginBtn.addEventListener('click', () => this.handleSignIn());
        this.elements.logoutBtn.addEventListener('click', () => this.handleSignOut());
        this.elements.logoutBtnPending.addEventListener('click', () => this.handleSignOut());
        this.elements.logoutBtnDenied.addEventListener('click', () => this.handleSignOut());
        this.elements.requestAccessAgain.addEventListener('click', () => this.showAccessRequestForm());
        
        this.elements.submitAccessRequest.addEventListener('click', () => this.handleSubmitAccessRequest());
        this.elements.cancelAccessRequest.addEventListener('click', () => this.handleCancelAccessRequest());

        // Listen for auth state changes
        authService.onAuthStateChange((user, permissions) => {
            this.handleAuthStateChange(user, permissions);
        });
    }

    /**
     * Handle sign in
     */
    async handleSignIn() {
        try {
            await authService.signIn();
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * Handle sign out
     */
    async handleSignOut() {
        try {
            await authService.signOut();
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * Handle submit access request
     */
    async handleSubmitAccessRequest() {
        const reason = this.elements.accessReason.value.trim();
        if (!reason) {
            alert('Please provide a reason for requesting access.');
            return;
        }

        try {
            await authService.submitAccessRequest(reason);
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * Handle cancel access request
     */
    handleCancelAccessRequest() {
        this.handleSignOut();
    }

    /**
     * Handle auth state changes
     */
    handleAuthStateChange(user, permissions) {
        const status = authService.getUserStatus();
        
        switch (status) {
            case 'unauthenticated':
                this.showLoginInterface();
                break;
            case 'admin':
                this.showAdminInterface(user);
                break;
            case 'approved':
                this.showApprovedInterface(user);
                break;
            case 'pending':
                this.showPendingInterface();
                break;
            case 'denied':
                this.showDeniedInterface();
                break;
            default:
                this.showAccessRequestForm();
        }

        // Emit custom event for other components
        this.container.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: { user, permissions, status }
        }));
    }

    /**
     * Show login interface
     */
    showLoginInterface() {
        this.hideAllSections();
        this.elements.loginSection.style.display = 'block';
    }

    /**
     * Show approved user interface
     */
    showApprovedInterface(user) {
        this.hideAllSections();
        this.elements.userSection.style.display = 'flex';
        this.elements.userInfo.textContent = `Welcome, ${user.displayName || user.email}`;
        
        // Show input and actions sections
        this.showUserFeatures();
    }

    /**
     * Show admin interface
     */
    showAdminInterface(user) {
        this.hideAllSections();
        this.elements.userSection.style.display = 'flex';
        this.elements.userInfo.innerHTML = `Welcome, ${user.displayName || user.email} <span style="color: #ff6b6b; font-weight: bold;">[ADMIN]</span>`;
        
        // Show input and actions sections
        this.showUserFeatures();
        this.showAdminFeatures();
    }

    /**
     * Show pending interface
     */
    showPendingInterface() {
        this.hideAllSections();
        this.elements.pendingSection.style.display = 'block';
    }

    /**
     * Show denied interface
     */
    showDeniedInterface() {
        this.hideAllSections();
        this.elements.deniedSection.style.display = 'block';
    }

    /**
     * Show access request form
     */
    showAccessRequestForm() {
        this.hideAllSections();
        this.elements.accessRequestSection.style.display = 'block';
        this.elements.accessReason.value = '';
    }

    /**
     * Show user features (input and actions)
     */
    showUserFeatures() {
        const inputSection = document.getElementById('inputSection');
        const actionsSection = document.getElementById('actionsSection');
        const summarizeBtn = document.getElementById('summarizeBtn');
        
        if (inputSection) inputSection.style.display = 'flex';
        if (actionsSection) actionsSection.style.display = 'flex';
        if (summarizeBtn) summarizeBtn.style.display = 'inline-block';
    }

    /**
     * Show admin features
     */
    showAdminFeatures() {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.style.display = 'block';
    }

    /**
     * Hide all authentication sections
     */
    hideAllSections() {
        this.elements.loginSection.style.display = 'none';
        this.elements.userSection.style.display = 'none';
        this.elements.pendingSection.style.display = 'none';
        this.elements.deniedSection.style.display = 'none';
        this.elements.accessRequestSection.style.display = 'none';
        
        // Hide user features by default
        const inputSection = document.getElementById('inputSection');
        const actionsSection = document.getElementById('actionsSection');
        const adminPanel = document.getElementById('adminPanel');
        const summarizeBtn = document.getElementById('summarizeBtn');
        
        if (inputSection) inputSection.style.display = 'none';
        if (actionsSection) actionsSection.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'none';
        if (summarizeBtn) summarizeBtn.style.display = 'none';
    }

    /**
     * Get current authentication status
     */
    getStatus() {
        return authService.getUserStatus();
    }

    /**
     * Check if user can perform actions
     */
    canPerformActions() {
        return authService.isApproved();
    }
}