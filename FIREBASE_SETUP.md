# Firebase Setup Instructions

Follow these steps to configure Firebase for your todo list app:

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "todo-list-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click on the "Sign-in method" tab
3. Enable "Google" as a sign-in provider:
   - Click on "Google"
   - Toggle the "Enable" switch
   - Enter your project's public-facing name
   - Select a support email
   - Click "Save"

## 3. Set Up Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

## 4. Configure Security Rules

Replace the default Firestore rules with these rules that allow:
- Anyone to read todos
- Only authenticated users to write todos
- Users can only delete their own todos

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{document} {
      // Allow anyone to read todos
      allow read: if true;
      
      // Allow authenticated users to create todos
      allow create: if request.auth != null;
      
      // Allow users to update any todo (for completing/uncompleting)
      allow update: if request.auth != null;
      
      // Allow users to delete only their own todos
      allow delete: if request.auth != null && resource.data.createdBy.uid == request.auth.uid;
    }
  }
}
```

## 5. Get Firebase Configuration

1. In your Firebase project, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click on the web icon (</>) to add a web app
4. Enter an app nickname (e.g., "todo-web-app")
5. Click "Register app"
6. Copy the Firebase configuration object

## 6. Update Your Code

In your `index.html` file, replace the placeholder Firebase config (around line 72) with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-messaging-sender-id",
  appId: "your-actual-app-id"
};
```

## 7. Test Your App

1. Open your website
2. Try signing in with Google
3. Add a few todos
4. Test that anyone can view todos without signing in
5. Test that only signed-in users can add/modify todos
6. Test that users can only delete their own todos

## Features

✅ **Public Reading**: Anyone can view all todos without authentication
✅ **Authenticated Writing**: Only signed-in users can add todos
✅ **Creator Attribution**: Each todo shows who created it
✅ **Personal Management**: Users can only delete their own todos
✅ **Real-time Updates**: All changes are reflected immediately across all browsers
✅ **Google Authentication**: Secure sign-in with Google accounts

## Troubleshooting

- **Authentication not working**: Check that Google sign-in is enabled in Firebase Console
- **Database errors**: Verify Firestore rules are set correctly
- **Config errors**: Make sure your Firebase config is correctly copied from the Firebase Console
- **CORS errors**: Ensure you're serving the app from a proper HTTP server (not file://)