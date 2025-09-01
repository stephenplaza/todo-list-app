/**
 * Admin UI Component
 * Handles admin panel functionality for managing access requests
 */

import { authService } from '../services/AuthService.js';
import { firebaseService } from '../services/FirebaseService.js';

export class AdminComponent {
    constructor(container) {
        this.container = container;
        this.elements = this.findElements();
        this.accessRequests = [];
        this.unsubscribe = null;
        this.setupEventListeners();
    }

    /**
     * Find DOM elements
     */
    findElements() {
        return {
            adminPanel: document.getElementById('adminPanel'),
            accessRequestsList: document.getElementById('accessRequestsList')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for auth state changes
        authService.onAuthStateChange((user, permissions) => {
            if (authService.isAdmin()) {
                this.loadAccessRequests();
            } else {
                this.cleanup();
            }
        });
    }

    /**
     * Load access requests from Firestore
     */
    loadAccessRequests() {
        if (!authService.isAdmin()) return;

        this.unsubscribe = firebaseService.onDocumentsSnapshot(
            'accessRequests',
            (requests, error) => {
                if (error) {
                    console.error('Error loading access requests:', error);
                    return;
                }
                
                this.accessRequests = requests;
                this.renderAccessRequests();
            },
            {
                orderBy: ['requestedAt', 'desc']
            }
        );
    }

    /**
     * Render access requests
     */
    renderAccessRequests() {
        if (!authService.isAdmin()) return;

        this.elements.accessRequestsList.innerHTML = '';

        const pendingRequests = this.accessRequests.filter(req => req.status === 'pending');

        if (pendingRequests.length === 0) {
            this.elements.accessRequestsList.innerHTML = '<p style="text-align: center; color: #666;">No pending access requests.</p>';
            return;
        }

        pendingRequests.forEach(request => {
            const div = this.createRequestElement(request);
            this.elements.accessRequestsList.appendChild(div);
        });
    }

    /**
     * Create access request element
     */
    createRequestElement(request) {
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
                <button class="approve-btn" data-request-id="${request.id}" data-uid="${request.uid}">Approve</button>
                <button class="deny-btn" data-request-id="${request.id}" data-uid="${request.uid}">Deny</button>
            </div>
        `;

        // Add event listeners
        const approveBtn = div.querySelector('.approve-btn');
        const denyBtn = div.querySelector('.deny-btn');

        approveBtn.addEventListener('click', () => this.handleApproveRequest(request.id, request.uid));
        denyBtn.addEventListener('click', () => this.handleDenyRequest(request.id, request.uid));

        return div;
    }

    /**
     * Handle approve request
     */
    async handleApproveRequest(requestId, uid) {
        try {
            await authService.approveRequest(requestId, uid);
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Failed to approve request: ' + error.message);
        }
    }

    /**
     * Handle deny request
     */
    async handleDenyRequest(requestId, uid) {
        try {
            await authService.denyRequest(requestId, uid);
        } catch (error) {
            console.error('Error denying request:', error);
            alert('Failed to deny request: ' + error.message);
        }
    }

    /**
     * Show admin panel
     */
    show() {
        if (authService.isAdmin()) {
            this.elements.adminPanel.style.display = 'block';
        }
    }

    /**
     * Hide admin panel
     */
    hide() {
        this.elements.adminPanel.style.display = 'none';
    }

    /**
     * Get pending requests count
     */
    getPendingRequestsCount() {
        return this.accessRequests.filter(req => req.status === 'pending').length;
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
     * Cleanup resources
     */
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.accessRequests = [];
    }

    /**
     * Destroy component
     */
    destroy() {
        this.cleanup();
    }
}