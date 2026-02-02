# Firebase setup for Impulse (shared dashboard)

So users can access **https://hyperalz.github.io/Impulse-Project/** and all edit the same data, the app uses Firestore when you add your Firebase config.

## 1. Get your Firebase config

1. Open [Firebase Console](https://console.firebase.google.com/) and select your project **impulse**.
2. Go to **Project settings** (gear) → **General** → **Your apps**.
3. If you don’t have a web app, click **Add app** → **Web** (</>). Otherwise use the existing web app.
4. Copy the `firebaseConfig` object (apiKey, authDomain, projectId, etc.).

## 2. Add config to the app

In **Impulse Project/index.html**, find the `firebaseConfig` object (near the top of the first `<script>` block) and replace the placeholders with your values:

```js
const firebaseConfig = {
  apiKey: 'YOUR_ACTUAL_API_KEY',
  authDomain: 'impulse-xxxxx.firebaseapp.com',
  projectId: 'impulse-xxxxx',
  storageBucket: 'impulse-xxxxx.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:xxxxx'
};
```

Save the file and commit/push so the live site (GitHub Pages) uses this config.

## 3. Firestore security rules

1. In Firebase Console: **Build** → **Firestore Database** → **Rules**.
2. Use rules that allow read/write to the shared dashboard (e.g. the contents of **firestore.rules** in this folder):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dashboard/{docId} {
      allow read, write: if true;
    }
  }
}
```

3. Click **Publish**.

**Note:** `if true` lets anyone with the link read and write. For a public shared dashboard that’s fine. If you add Firebase Auth later, you can restrict to `if request.auth != null`.

## 4. Authorized domain (if needed)

If the app is served from **https://hyperalz.github.io**:

1. In Firebase Console: **Build** → **Authentication** → **Settings** → **Authorized domains**.
2. Add **hyperalz.github.io** if it’s not already there.

(Firestore does not require Auth for read/write unless your rules say so.)

## 5. Deploy and test

1. Commit and push the updated **index.html** (and **firestore.rules** if you use it as reference).
2. Open **https://hyperalz.github.io/Impulse-Project/**.
3. Add or edit a row; wait a couple of seconds.
4. Open the same URL in another browser or incognito and refresh — you should see the same data.

Data is stored in Firestore in the document **dashboard/impulse** (risk register, plan table, and project tile). LocalStorage is still used as a cache so the app works offline; when Firebase is configured, changes are also synced to Firestore so everyone sees the same data.
