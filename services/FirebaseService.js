/**
 * Firebase Service Module
 * Provides a unified interface for Firebase operations
 */

export class FirebaseService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.storage = null;
        this.provider = null;
        this.initialized = false;
    }

    /**
     * Initialize Firebase with configuration
     * @param {Object} config - Firebase configuration object
     */
    async initialize(config) {
        if (this.initialized) {
            return;
        }

        try {
            // Wait for Firebase modules to be available
            if (typeof window.firebase === 'undefined') {
                throw new Error('Firebase modules not loaded');
            }

            this.app = window.firebase.app;
            this.auth = window.firebase.auth;
            this.db = window.firebase.db;
            this.storage = window.firebase.storage;
            this.provider = window.firebase.provider;

            this.initialized = true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            throw error;
        }
    }

    /**
     * Check if Firebase is initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get a reference to a Firestore collection
     * @param {string} collectionName - Name of the collection
     * @returns {Object} Collection reference
     */
    collection(collectionName) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return window.firebase.collection(this.db, collectionName);
    }

    /**
     * Get a reference to a Firestore document
     * @param {string} collectionName - Name of the collection
     * @param {string} documentId - ID of the document
     * @returns {Object} Document reference
     */
    document(collectionName, documentId) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return window.firebase.doc(this.db, collectionName, documentId);
    }

    /**
     * Add a document to a collection
     * @param {string} collectionName - Name of the collection
     * @param {Object} data - Document data
     * @returns {Promise<Object>} Document reference
     */
    async addDocument(collectionName, data) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return await window.firebase.addDoc(this.collection(collectionName), data);
    }

    /**
     * Update a document
     * @param {string} collectionName - Name of the collection
     * @param {string} documentId - ID of the document
     * @param {Object} data - Updated data
     * @returns {Promise<void>}
     */
    async updateDocument(collectionName, documentId, data) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return await window.firebase.updateDoc(this.document(collectionName, documentId), data);
    }

    /**
     * Delete a document
     * @param {string} collectionName - Name of the collection
     * @param {string} documentId - ID of the document
     * @returns {Promise<void>}
     */
    async deleteDocument(collectionName, documentId) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return await window.firebase.deleteDoc(this.document(collectionName, documentId));
    }

    /**
     * Get documents from a collection with optional query
     * @param {string} collectionName - Name of the collection
     * @param {Object} queryOptions - Query options (where, orderBy, limit)
     * @returns {Promise<Array>} Array of documents
     */
    async getDocuments(collectionName, queryOptions = {}) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }

        let query = this.collection(collectionName);

        // Apply where conditions
        if (queryOptions.where) {
            for (const condition of queryOptions.where) {
                query = window.firebase.query(query, window.firebase.where(...condition));
            }
        }

        // Apply ordering
        if (queryOptions.orderBy) {
            query = window.firebase.query(query, window.firebase.orderBy(...queryOptions.orderBy));
        }

        // Apply limit
        if (queryOptions.limit) {
            query = window.firebase.query(query, window.firebase.limit(queryOptions.limit));
        }

        const snapshot = await window.firebase.getDocs(query);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    /**
     * Set up a real-time listener for a collection
     * @param {string} collectionName - Name of the collection
     * @param {Function} callback - Callback function for updates
     * @param {Object} queryOptions - Query options
     * @returns {Function} Unsubscribe function
     */
    onDocumentsSnapshot(collectionName, callback, queryOptions = {}) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }

        let query = this.collection(collectionName);

        // Apply where conditions
        if (queryOptions.where) {
            for (const condition of queryOptions.where) {
                query = window.firebase.query(query, window.firebase.where(...condition));
            }
        }

        // Apply ordering
        if (queryOptions.orderBy) {
            query = window.firebase.query(query, window.firebase.orderBy(...queryOptions.orderBy));
        }

        return window.firebase.onSnapshot(query, (snapshot) => {
            const documents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(documents);
        }, (error) => {
            console.error('Snapshot error:', error);
            callback(null, error);
        });
    }

    /**
     * Upload a file to Firebase Storage
     * @param {string} path - Storage path
     * @param {File} file - File to upload
     * @returns {Promise<string>} Download URL
     */
    async uploadFile(path, file) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }

        const storageRef = window.firebase.ref(this.storage, path);
        await window.firebase.uploadBytes(storageRef, file);
        return await window.firebase.getDownloadURL(storageRef);
    }

    /**
     * Delete a file from Firebase Storage
     * @param {string} path - Storage path
     * @returns {Promise<void>}
     */
    async deleteFile(path) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        const storageRef = window.firebase.ref(this.storage, path);
        return await window.firebase.deleteObject(storageRef);
    }

    /**
     * Get server timestamp
     * @returns {Object} Server timestamp
     */
    getServerTimestamp() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return window.firebase.serverTimestamp();
    }

    /**
     * Sign in with Google
     * @returns {Promise<Object>} User credential
     */
    async signInWithGoogle() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return await window.firebase.signInWithPopup(this.auth, this.provider);
    }

    /**
     * Sign out
     * @returns {Promise<void>}
     */
    async signOut() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return await window.firebase.signOut(this.auth);
    }

    /**
     * Listen for auth state changes
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    onAuthStateChanged(callback) {
        if (!this.initialized) {
            throw new Error('Firebase not initialized');
        }
        return window.firebase.onAuthStateChanged(this.auth, callback);
    }
}

// Export singleton instance
export const firebaseService = new FirebaseService();