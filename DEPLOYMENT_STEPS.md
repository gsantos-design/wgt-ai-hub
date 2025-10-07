# Deployment to hub.boldhorizonsfinancial.com

## Current Status
✅ Tested locally - everything works!
✅ Spanish support working
✅ Speech-to-text working
✅ Enhanced UI working

## Deployment Options

### Option 1: Update Render Deployment (RECOMMENDED - Fastest)

Since hub.boldhorizonsfinancial.com is already pointing to Render, we just need to update the code there.

**Steps:**

1. **Check your Render dashboard**
   - Go to https://dashboard.render.com
   - Find your service (likely called "wgt-ai-hub" or similar)

2. **Update the code** - Choose ONE method:

   **Method A: Via Git (if connected to GitHub)**
   - Push these files to your GitHub repo
   - Render will auto-deploy

   **Method B: Via Render Manual Deploy**
   - Upload the updated files via Render dashboard
   - Files to upload:
     - `server.js` (updated with dotenv)
     - `package.json` (updated with dotenv dependency)
     - `public/index.html` (new version)
     - `public/script.js` (new version)

   **Method C: Re-deploy from this folder**
   - Delete the old service on Render
   - Create new service pointing to: `C:\Users\gisel\Downloads\wgt-ai-hub-starter`
   - Set GEMINI_API_KEY in Render environment variables
   - Deploy

3. **Verify Environment Variable**
   - In Render dashboard, go to Environment
   - Confirm `GEMINI_API_KEY` is set to: `AIzaSyCbIB4LFLFpzAB9oMCOuR90d7kROFXaS2M`

4. **Test**
   - Visit hub.boldhorizonsfinancial.com
   - Verify Spanish toggle works
   - Verify microphone works
   - Verify AI responds

**Time: 10-15 minutes**

---

### Option 2: Deploy to GoDaddy

See `GODADDY_DEPLOY.md` for full instructions.

**Time: 2-4 hours**

---

## Quick Render Re-Deploy Instructions

If you want to completely re-deploy on Render:

1. **Go to Render Dashboard**
   - https://dashboard.render.com

2. **Delete Old Service (Optional)**
   - Click on your current hub service
   - Settings > Delete Service

3. **Create New Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect to GitHub repo OR upload files

4. **Configuration**
   ```
   Name: boldhorizons-hub
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

5. **Environment Variables**
   Add these in the Environment section:
   ```
   GEMINI_API_KEY=AIzaSyCbIB4LFLFpzAB9oMCOuR90d7kROFXaS2M
   GEMINI_CHAT_MODEL=gemini-2.0-flash
   GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
   GEMINI_TTS_VOICE=Kore
   PORT=3000
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Copy the Render URL (e.g., https://boldhorizons-hub-xyz.onrender.com)

7. **Update DNS (if needed)**
   - In GoDaddy DNS settings
   - Point hub.boldhorizonsfinancial.com to your new Render URL
   - Use CNAME record

---

## Files to Deploy

All files are in: `C:\Users\gisel\Downloads\wgt-ai-hub-starter\`

**Required files:**
- `server.js` ✅ (updated with dotenv)
- `package.json` ✅ (includes dotenv dependency)
- `public/index.html` ✅ (new bilingual UI)
- `public/script.js` ✅ (Spanish + speech-to-text)
- `.gitignore`
- `render.yaml`

**NOT needed for deployment:**
- `.env` (set API key in Render dashboard instead)
- `node_modules/` (auto-generated)
- `GODADDY_DEPLOY.md` (documentation only)
- `CLIENT_DEMO_TALKING_POINTS.md` (documentation only)

---

## Post-Deployment Checklist

After deploying, test these at hub.boldhorizonsfinancial.com:

- [ ] Page loads with Bold Horizons branding
- [ ] "English" and "Español" buttons visible
- [ ] Click "Español" - UI translates to Spanish
- [ ] Type question in Spanish - AI responds in Spanish
- [ ] Click 🎤 microphone - can speak questions
- [ ] Click "🔊 Speak" - generates audio
- [ ] "Book Free Consultation" link works
- [ ] Status badge shows "Connected" (green)

---

## Rollback Plan

If something goes wrong:

1. **Render keeps previous deployments**
   - In Render dashboard, click "Manual Deploy"
   - Select previous deployment from dropdown
   - Click "Deploy selected commit"

2. **Or restore from backup**
   - The old version is still in your Render history
   - Can restore with one click

---

## Need Help?

**Common Issues:**

**"Not connected" status**
- Check GEMINI_API_KEY is set in Render environment
- Check API key is valid
- Check Render logs for errors

**Microphone not working**
- Must be HTTPS (Render provides this automatically)
- Browser must support Web Speech API
- User must grant permission

**Spanish not working**
- Check that new `script.js` was uploaded
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors

---

## Current Working Version

Your localhost version at `http://localhost:3000` is the reference implementation. Everything that works there will work in production once deployed.

Server is currently running with shell ID: 555074
To stop: Use the KillShell tool or close the terminal
