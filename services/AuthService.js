/**
 * Authentication Service Module
 * Handles user authentication and permissions management
 */

import { firebaseService } from './FirebaseService.js';

export class AuthService {
    constructor() {
        this.currentUser = null;
        this.userPermissions = null;
        this.authStateListeners = [];
        this.ADMIN_EMAIL = 'plaza.stephen@gmail.com';
    }

    /**
     * Initialize the authentication service
     */
    async initialize() {
        if (!firebaseService.isInitialized()) {
            throw new Error('FirebaseService must be initialized first');
        }

        // Set up auth state listener
        firebaseService.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });
    }

    /**
     * Handle authentication state changes
     * @param {Object} user - Firebase user object
     */
    async handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            await this.checkUserPermissions();
        } else {
            this.userPermissions = null;
        }

        // Notify all listeners
        this.authStateListeners.forEach(callback => {
            callback(this.currentUser, this.userPermissions);
        });
    }

    /**
     * Add a listener for auth state changes
     * @param {Function} callback - Callback function
     */
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
                this.authStateListeners.splice(index, 1);
            }
        };
    }

    /**
     * Check user permissions from Firestore
     */
    async checkUserPermissions() {
        if (!this.currentUser) {
            this.userPermissions = null;
            return;
        }

        try {
            const permissions = await firebaseService.getDocuments('userPermissions', {
                where: [['uid', '==', this.currentUser.uid]]
            });

            if (permissions.length > 0) {
                this.userPermissions = permissions[0];
            } else {
                this.userPermissions = null;
            }
        } catch (error) {
            console.error('Error checking user permissions:', error);
            this.userPermissions = null;
        }
    }

    /**
     * Sign in with Google
     */
    async signIn() {
        try {
            await firebaseService.signInWithGoogle();
        } catch (error) {
            console.error('Sign in failed:', error);
            throw new Error('Sign in failed: ' + error.message);
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            await firebaseService.signOut();
        } catch (error) {
            console.error('Sign out failed:', error);
            throw new Error('Sign out failed: ' + error.message);
        }
    }

    /**
     * Submit access request
     * @param {string} reason - Reason for requesting access
     */
    async submitAccessRequest(reason) {
        if (!this.currentUser || !reason.trim()) {
            throw new Error('User must be authenticated and reason must be provided');
        }

        try {
            // Create access request
            await firebaseService.addDocument('accessRequests', {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName || this.currentUser.email,
                reason: reason.trim(),
                status: 'pending',
                requestedAt: firebaseService.getServerTimestamp(),
                reviewedAt: null,
                reviewedBy: null
            });

            // Create user permissions record
            await firebaseService.addDocument('userPermissions', {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                status: 'pending',
                createdAt: firebaseService.getServerTimestamp(),
                updatedAt: firebaseService.getServerTimestamp()
            });

            this.userPermissions = { status: 'pending' };
        } catch (error) {
            console.error('Error submitting access request:', error);
            throw new Error('Failed to submit access request: ' + error.message);
        }
    }

    /**
     * Approve an access request (admin only)
     * @param {string} requestId - ID of the access request
     * @param {string} uid - User ID
     */
    async approveRequest(requestId, uid) {
        if (!this.isAdmin()) {
            throw new Error('Only admin can approve requests');
        }

        try {
            // Update access request
            await firebaseService.updateDocument('accessRequests', requestId, {
                status: 'approved',
                reviewedAt: firebaseService.getServerTimestamp(),
                reviewedBy: this.currentUser.email
            });

            // Update user permissions
            const permissions = await firebaseService.getDocuments('userPermissions', {
                where: [['uid', '==', uid]]
            });

            if (permissions.length > 0) {
                await firebaseService.updateDocument('userPermissions', permissions[0].id, {
                    status: 'approved',
                    updatedAt: firebaseService.getServerTimestamp()
                });
            }
        } catch (error) {
            console.error('Error approving request:', error);
            throw new Error('Failed to approve request: ' + error.message);
        }
    }

    /**
     * Deny an access request (admin only)
     * @param {string} requestId - ID of the access request
     * @param {string} uid - User ID
     */
    async denyRequest(requestId, uid) {
        if (!this.isAdmin()) {
            throw new Error('Only admin can deny requests');
        }

        try {
            // Update access request
            await firebaseService.updateDocument('accessRequests', requestId, {
                status: 'denied',
                reviewedAt: firebaseService.getServerTimestamp(),
                reviewedBy: this.currentUser.email
            });

            // Update user permissions
            const permissions = await firebaseService.getDocuments('userPermissions', {
                where: [['uid', '==', uid]]
            });

            if (permissions.length > 0) {
                await firebaseService.updateDocument('userPermissions', permissions[0].id, {
                    status: 'denied',
                    updatedAt: firebaseService.getServerTimestamp()
                });
            }
        } catch (error) {
            console.error('Error denying request:', error);
            throw new Error('Failed to deny request: ' + error.message);
        }
    }

    /**
     * Get current user
     * @returns {Object|null} Current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get user permissions
     * @returns {Object|null} User permissions
     */
    getUserPermissions() {
        return this.userPermissions;
    }

    /**
     * Check if current user is admin
     * @returns {boolean} True if admin
     */
    isAdmin() {
        return this.currentUser?.email === this.ADMIN_EMAIL;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Check if user is approved
     * @returns {boolean} True if approved
     */
    isApproved() {
        return this.isAdmin() || this.userPermissions?.status === 'approved';
    }

    /**
     * Check if user can access Claude features
     * @returns {boolean} True if can access Claude
     */
    canAccessClaude() {
        return this.isAuthenticated() && this.isApproved();
    }

    /**
     * Get user status for UI rendering
     * @returns {string} User status: 'unauthenticated', 'pending', 'approved', 'denied', 'admin'
     */
    getUserStatus() {
        if (!this.currentUser) {
            return 'unauthenticated';
        }
        
        if (this.isAdmin()) {
            return 'admin';
        }
        
        return this.userPermissions?.status || 'new';
    }
}

// Export singleton instance
export const authService = new AuthService();