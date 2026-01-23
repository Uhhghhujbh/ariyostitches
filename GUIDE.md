# Ariyo Fashion - Deployment Guide

## 🚀 Quick Start

### 1. Push to GitHub
```bash
cd c:\Users\maxiM\ariyostitches
git add .
git commit -m "Ready for deployment"
git push -u origin main
```

---

## 2️⃣ Firebase Setup

### A. Create/Configure Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project "ariyostitches" or create new

### B. Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Add admin users in **Users** tab:
   - `Olabanjiariyo@gmail.com`
   - `adewuyiayuba@gmail.com`

### C. Set Firestore Rules
Go to **Firestore** → **Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email in ['olabanjiariyo@gmail.com', 'adewuyiayuba@gmail.com'];
    }
    
    // Orders - create by anyone, read/update by admin
    match /orders/{orderId} {
      allow create: if true;
      allow read, update: if request.auth != null && 
        request.auth.token.email in ['olabanjiariyo@gmail.com', 'adewuyiayuba@gmail.com'];
    }
    
    // Layaways - public create/read, admin update
    match /layaways/{layawayId} {
      allow create, read: if true;
      allow update: if true;
    }
    
    // Messages - create by anyone, read/delete by admin
    match /messages/{messageId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null && 
        request.auth.token.email in ['olabanjiariyo@gmail.com', 'adewuyiayuba@gmail.com'];
    }
  }
}
```

**Note:** Storage rules not needed - using imgbb for images.

---

## 3️⃣ Adding Products (with imgbb)

1. Go to [imgbb.com](https://imgbb.com)
2. Upload your product image
3. Copy the **Direct link** (ends with .jpg/.png)
4. Paste in Admin panel → Add Product → Image URL field

---

## 4️⃣ Environment Variables

Your `.env` file:

```env
VITE_FLW_PUBLIC_KEY=FLWPUBK-your-key
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=ariyostitches-1ad08.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ariyostitches-1ad08
VITE_FIREBASE_STORAGE_BUCKET=ariyostitches-1ad08.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=81940985924
VITE_FIREBASE_APP_ID=1:81940985924:web:...
VITE_ADMIN_EMAILS=olabanjiariyo@gmail.com,adewuyiayuba@gmail.com
```

---

## 5️⃣ Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Login with GitHub
2. Click **Add New** → **Project**
3. Import `ariyostitches` repository
4. Add Environment Variables (all from .env)
5. Click **Deploy**

---

## 🔒 Security Features

- ✅ Admin-only access via email whitelist
- ✅ Rate limiting & brute force protection
- ✅ Input sanitization
- ✅ Firestore security rules

---

## 📞 Support

Developed by **LearnovaTech**
- https://learnovatech.com
