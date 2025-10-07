# How to Update hub.boldhorizonsfinancial.com on Render

## ⚡ FASTEST METHOD: Manual File Update

### Step 1: Access Render Dashboard
1. Go to https://dashboard.render.com
2. Log in to your account
3. Click on your hub service (look for "boldhorizons" or "wgt-ai-hub")

### Step 2: Update via GitHub (If Connected)

**If your service shows a GitHub repository:**
1. Go to your GitHub repository
2. Upload these files (replace existing):
   - `server.js`
   - `package.json`
   - `public/index.html`
   - `public/script.js`
3. Commit with message: "Add Spanish support and speech-to-text"
4. Render will auto-deploy (takes 2-3 minutes)

### Step 3: Update Manually (If Not Connected to GitHub)

**Option A: Via Render Shell**
1. In Render dashboard, click your service
2. Click "Shell" tab
3. Run these commands:
```bash
# Backup current version
cp server.js server.js.backup
cp public/index.html public/index.html.backup
cp public/script.js public/script.js.backup

# Upload new files (you'll need to paste the content)
# Or use git if your repo is accessible
```

**Option B: Re-deploy from Scratch (EASIEST)**
1. Keep your current service running
2. Create a new service
3. Upload the zip file I created: `boldhorizons-hub-UPDATED-[date].zip`
4. Configure (see below)
5. Test the new URL
6. Update DNS to point to new service
7. Delete old service

---

## 📦 Using the Deployment Package

I created a zip file at:
`C:\Users\gisel\Downloads\boldhorizons-hub-UPDATED-[date].zip`

**To deploy this on Render:**

### Method 1: Via GitHub
1. Create a new GitHub repo or use existing one
2. Extract the zip
3. Push all files to GitHub
4. In Render: New Web Service > Connect Repository
5. Configure and deploy

### Method 2: Render Blueprint (render.yaml)
1. The zip includes `render.yaml`
2. In Render: New > Blueprint
3. Upload the zip or connect to repo
4. Click "Apply"

### Method 3: Manual Web Service
1. Extract the zip to a local folder
2. Create a new Git repo:
```bash
cd C:\Users\gisel\Downloads\wgt-ai-hub-starter
git init
git add .
git commit -m "Updated hub with Spanish and speech-to-text"
```
3. Push to GitHub
4. Connect to Render

---

## ⚙️ Render Configuration

When creating/updating the service, use these settings:

**Build Settings:**
```
Build Command: npm install
Start Command: npm start
```

**Environment Variables:**
```
GEMINI_API_KEY=AIzaSyCbIB4LFLFpzAB9oMCOuR90d7kROFXaS2M
GEMINI_CHAT_MODEL=gemini-2.0-flash
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
GEMINI_TTS_VOICE=Kore
```

**Health Check:**
```
Health Check Path: /api/healthz
```

---

## 🎯 RECOMMENDED: Simple GitHub Update

**This is the easiest if you have GitHub connected:**

1. **Find your GitHub repo** (check Render dashboard for the repo name)

2. **Clone or open the repo locally**

3. **Replace these 4 files:**
   - Copy from: `C:\Users\gisel\Downloads\wgt-ai-hub-starter\`
   - `server.js` → Your repo
   - `package.json` → Your repo
   - `public/index.html` → Your repo
   - `public/script.js` → Your repo

4. **Commit and push:**
```bash
git add .
git commit -m "Add Spanish support and speech-to-text features"
git push origin main
```

5. **Render auto-deploys** (watch the dashboard)

6. **Test at hub.boldhorizonsfinancial.com** after 2-3 minutes

---

## 🔧 Troubleshooting Render Deployment

**"Missing GEMINI_API_KEY" error:**
- Go to Render dashboard > Your service > Environment
- Add the API key variable
- Click "Save Changes"
- Render will redeploy automatically

**Build fails:**
- Check the Render logs (Logs tab in dashboard)
- Common issue: `package.json` not uploaded
- Solution: Make sure all files are in the repo root

**Microphone doesn't work:**
- This is expected! Render provides HTTPS automatically
- Microphone requires HTTPS to work
- It will work once deployed to Render

**Still showing old version:**
- Clear browser cache: Ctrl + Shift + R
- Check Render logs to confirm new deployment succeeded
- Verify deployment time matches recent commit

---

## ✅ Post-Deployment Testing

After deploying to Render, test at hub.boldhorizonsfinancial.com:

1. **Page loads** - See Bold Horizons branding
2. **Language toggle** - Click "Español", see Spanish UI
3. **AI chat** - Ask question in Spanish, get Spanish response
4. **Microphone** - Click 🎤, speak, get transcription
5. **TTS** - Type text, click 🔊, hear voice
6. **Status** - Green "Connected" badge

---

## 📞 For Your Client Call

**If deployment isn't done before your call:**
- Demo from localhost:3000 (it works perfectly!)
- Tell them: "This is the final version, currently being deployed to production"
- Show them both versions: old (live) vs new (localhost)
- Commit to having it live by [specific time]

**If deployment IS done:**
- Go directly to hub.boldhorizonsfinancial.com
- Show the live working version
- Demo all features
- Explain the value: bilingual reach, voice input, professional brand

---

## 🚀 Next Steps After Deployment

1. **Test all features** on live site
2. **Share with your team** for feedback
3. **Monitor Render logs** for any errors
4. **Track usage** (consider adding analytics)
5. **Iterate** based on real user feedback

---

## Need Immediate Help?

**Can't access Render dashboard?**
- Check your email for Render login link
- Try password reset
- Look for Render confirmation emails

**Don't have GitHub connected?**
- That's okay! Use the zip file method
- Or create a new service and upload files directly

**Running out of time before call?**
- Demo from localhost - it's fully functional
- Deploy after the call when there's no pressure
