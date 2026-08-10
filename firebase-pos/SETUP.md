# POS - Fitness Exclusive (Firebase)
## Setup Guide — 15 minutes lang!

---

## STEP 1: Gumawa ng Firebase Project (FREE)

1. Pumunta sa: https://console.firebase.google.com/
2. Click **"Create a project"** (o "Add project")
3. Project name: `pos-fitness-exclusive`
4. Google Analytics: **OFF** (hindi kailangan) → Click **Create Project**
5. Wait... tapos click **Continue**

---

## STEP 2: Create Firestore Database

1. Sa Firebase Console (left panel), click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Piliin: **"Start in test mode"** (para walang restriction muna)
4. Location: piliin **asia-southeast1** (Singapore, pinakamalapit)
5. Click **Enable**

---

## STEP 3: Register Web App

1. Sa Firebase Console, click ⚙️ gear (Project settings) → **"Your apps"** section
2. Click **"</>"** icon (Web)
3. App nickname: `POS Web App`
4. Check ✅ **"Also set up Firebase Hosting"**
5. Click **Register app**
6. May lalabas na **firebaseConfig** — COPY mo ito! Ganito hitsura:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "pos-fitness-exclusive.firebaseapp.com",
  projectId: "pos-fitness-exclusive",
  storageBucket: "pos-fitness-exclusive.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

7. Click **Continue to console**

---

## STEP 4: Paste Firebase Config

1. Open ang file **`firebase-config.js`**
2. Palitan ang placeholder values ng **actual config** mo from Step 3:

```javascript
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};
```

3. Save

---

## STEP 5: Deploy (Firebase Hosting)

### Option A: Firebase CLI (Recommended)

1. Install Node.js: https://nodejs.org/ (download LTS version)
2. Open terminal/command prompt
3. Install Firebase CLI:
```
npm install -g firebase-tools
```
4. Login:
```
firebase login
```
5. Sa folder ng `firebase-pos`, run:
```
firebase init hosting
```
   - Use existing project → piliin `pos-fitness-exclusive`
   - Public directory: `.` (period — current folder)
   - Single-page app: **No**
   - Overwrite index.html: **No**

6. Deploy:
```
firebase deploy --only hosting
```

7. **DONE!** May URL na:
```
https://pos-fitness-exclusive.web.app
```

### Option B: Manual Upload (Walang CLI needed)

1. Sa Firebase Console → **Hosting** → **Get started**
2. Follow the prompts
3. O kaya upload via the Firebase Console UI

### Option C: Free Hosting Alternatives

Kung ayaw mo ng Firebase Hosting, pwede rin sa:
- **Netlify** (drag & drop lang ang folder): https://app.netlify.com/drop
- **Vercel**: https://vercel.com
- **GitHub Pages**: free static hosting

Para sa Netlify (pinaka-madali):
1. Go to https://app.netlify.com/drop
2. Drag the entire `firebase-pos` folder
3. Done! May URL ka na agad

---

## STEP 6: Share sa 10 Users

I-send ang URL sa staff:
```
https://pos-fitness-exclusive.web.app
```

O kung Netlify:
```
https://your-site-name.netlify.app
```

**Tip:** Sa phone → Open sa Chrome → 3 dots → "Add to Home screen" → Parang native app na!

---

## DONE! 🎉

---

## File Structure

```
firebase-pos/
├── index.html          ← Main HTML page
├── styles.css          ← CSS styles
├── app.js              ← App logic (CRUD, auto-compute)
├── firebase-config.js  ← Firebase credentials (EDIT THIS)
└── SETUP.md            ← This file
```

---

## Security (IMPORTANT — gawin after testing)

Pagka-confirm na gumagana, i-update ang Firestore Rules:

1. Firebase Console → Firestore → **Rules** tab
2. Palitan ng:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Ito ay "open" — anyone with the URL can read/write. Para sa 10 staff lang na trusted users, okay na ito.

Kung gusto mo may login later, pwede magdagdag ng Firebase Authentication.

---

## FAQ

**Q: Magkano?**
A: FREE. Firebase Spark plan walang bayad for small usage.

**Q: Kailangan ba internet?**
A: Oo. Pero once loaded, fast na ang operations.

**Q: Pano mag-backup?**
A: Firebase auto-backups. Pwede rin mag-export from Console.

**Q: Pano mag-add ng items/staff?**
A: Sa app mismo — click "Settings" sa sidebar.

**Q: Pwede ba sa phone?**
A: Oo! Responsive design — optimized for mobile.

**Q: Paano kung gusto ko i-export to Excel?**
A: Firebase Console → Firestore → Export. O kaya mag-add ng Export button (future feature).

**Q: Saan makikita ang data?**
A: Firebase Console → Firestore Database → Browse collections (sales, stockIn, inventory, etc.)
