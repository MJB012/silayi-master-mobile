# 📱 Silayi Master Mobile — Build & Deployment Guide (Without QR Code)

This guide shows you how to build and run the **Silayi Master** app without scanning QR codes or using Expo Go.

---

## 🚀 Option 1: Standalone Android APK (`.apk` File)

A standalone APK file can be installed directly on any Android smartphone via WhatsApp, email, or direct download. It runs natively as a full app without Expo Go and without any QR code.

### Step 1: Login to your Expo account (Free)
If you don't already have an Expo account, create one at [expo.dev/signup](https://expo.dev/signup). Then log in via your terminal:
```bash
cd silayi-master-mobile
npx eas-cli login
```

### Step 2: Build the APK
Run the configured preview build command:
```bash
npm run build:apk
# Or:
npx eas-cli build -p android --profile preview
```

### What Happens:
1. EAS (Expo Application Services) compiles the native Android app in the cloud.
2. When finished, it gives you a **direct download link** (and QR code for direct download if desired) to the `.apk` file.
3. Download the `.apk` on your Android phone and tap **Install**.
4. Open **Silayi Master** on your phone! It connects directly to `https://silayi-master-backend.mjbsoft.tech`.

---

## 🌐 Option 2: Run in Any Browser (Web Mode)

You can use the full app on your computer, tablet, or phone browser without any QR code or mobile installation:

### Development Web Server:
```bash
cd silayi-master-mobile
npm run web
```
Opens automatically in your browser at `http://localhost:8081`.

---

## 📦 Option 3: Production Static Web Build

The app has already been exported to the `dist/` directory. You can serve it using any HTTP server:

```bash
cd silayi-master-mobile

# 1. Build / Export latest changes
npm run build:web

# 2. Serve the production build locally
npx serve dist -l 5000
```
Open `http://localhost:5000` in any browser.

You can also host the contents of `dist/` on Vercel, Netlify, Cloudflare Pages, or on your server using Nginx/Apache.

---

## ⚙️ Configuration Reference

- **Package ID**: `com.silayimaster.app` (configured in [`app.json`](./app.json))
- **Production API**: `https://silayi-master-backend.mjbsoft.tech` (configured in [`eas.json`](./eas.json) and [`.env`](./.env))
- **Build Configuration**: [`eas.json`](./eas.json) defines the `preview` profile with `buildType: "apk"`.
