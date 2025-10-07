# Deploying Bold Horizons AI Hub to GoDaddy

## What's New ✨
- **Spanish Language Support**: Toggle between English/Spanish with full UI translation
- **Speech-to-Text**: Click the 🎤 microphone button to speak your questions
- **Enhanced UI**: Professional Bold Horizons branding with glassmorphism design
- **Bilingual AI**: AI assistant responds in the selected language

## Deployment Options

### Option 1: Deploy to GoDaddy with Node.js Hosting

#### Prerequisites
- GoDaddy account with cPanel access
- Node.js hosting (GoDaddy Web Hosting Plus or higher)
- SSH access enabled

#### Steps

1. **Access cPanel**
   - Log into your GoDaddy account
   - Navigate to your hosting dashboard
   - Click on cPanel

2. **Upload Files via File Manager**
   - In cPanel, open File Manager
   - Navigate to `/public_html/hub` (or create this directory)
   - Upload all files from `wgt-ai-hub-starter` folder:
     - `server.js`
     - `package.json`
     - `.env.example` (rename to `.env`)
     - `public/` folder (entire folder)

3. **Set Environment Variables**
   - Edit `.env` file and add your Gemini API key:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     PORT=3000
     ```

4. **Install Dependencies via SSH**
   ```bash
   cd /home/yourusername/public_html/hub
   npm install
   ```

5. **Start the Application**
   ```bash
   node server.js
   ```

6. **Set up as a Service (Optional)**
   - Use PM2 to keep the app running:
   ```bash
   npm install -g pm2
   pm2 start server.js --name boldhorizons-hub
   pm2 save
   pm2 startup
   ```

7. **Configure Domain/Subdomain**
   - In cPanel, go to "Domains" > "Subdomains"
   - Create subdomain: `hub.boldhorizonsfinancial.com`
   - Point to `/public_html/hub`
   - Set up proxy pass to port 3000

### Option 2: Deploy Static Version (No Server Required)

If you want a simpler deployment without running a Node server, you can deploy the frontend to GoDaddy's static hosting and use Render for the backend:

#### Steps

1. **Keep Backend on Render**
   - Your current Render deployment stays as-is
   - Note the Render URL (e.g., `https://your-app.onrender.com`)

2. **Update Frontend API Calls**
   - Edit `public/script.js` and replace all `/api/` endpoints with your Render URL:
   ```javascript
   // Change from:
   fetch("/api/chat", ...)

   // To:
   fetch("https://your-app.onrender.com/api/chat", ...)
   ```

3. **Upload to GoDaddy**
   - Upload only the `public/` folder contents to `/public_html/hub/`
   - Files needed:
     - `index.html`
     - `script.js`

4. **Configure Subdomain**
   - Point `hub.boldhorizonsfinancial.com` to `/public_html/hub/`

### Option 3: Use GoDaddy's Managed WordPress with Custom Page

If you're already using WordPress:

1. Create a new page template
2. Copy the HTML from `public/index.html`
3. Enqueue the JavaScript from `public/script.js`
4. API calls will still go to Render backend

## Testing Before Going Live

1. **Test Locally First**
   ```bash
   cd wgt-ai-hub-starter
   npm install
   # Create .env file with your GEMINI_API_KEY
   npm start
   ```
   - Visit `http://localhost:3000`

2. **Test All Features**
   - ✅ Chat functionality (English & Spanish)
   - ✅ Language switching
   - ✅ Speech-to-text (🎤 button)
   - ✅ Text-to-speech (🔊 button)
   - ✅ Calendly link

## For Your Client Call

**Key Updates to Highlight:**

1. **Bilingual Support**
   - Full English/Spanish interface
   - AI responds in selected language
   - Great for Latino community outreach

2. **Voice Input**
   - Hands-free interaction
   - Better accessibility
   - Modern user experience

3. **Professional Branding**
   - Bold Horizons colors (Navy & Gold)
   - Glassmorphic design
   - Mobile-responsive

4. **Smart AI**
   - Powered by Google Gemini
   - Understands context
   - Financial services expertise

## Quick Deploy Checklist

- [ ] Copy updated files from `C:\Users\gisel\Downloads\wgt-ai-hub-starter`
- [ ] Set `GEMINI_API_KEY` in `.env`
- [ ] Upload to GoDaddy via cPanel File Manager
- [ ] Install dependencies (`npm install`)
- [ ] Start server (`node server.js` or `pm2 start server.js`)
- [ ] Test at hub.boldhorizonsfinancial.com
- [ ] Verify Spanish toggle works
- [ ] Verify microphone button works
- [ ] Verify AI responses in both languages

## Troubleshooting

**Microphone not working?**
- Must use HTTPS (not HTTP)
- Browser must support Web Speech API (Chrome, Edge, Safari)
- User must grant microphone permission

**Spanish not working?**
- Check that `system` prompt is being sent in API call
- Verify Gemini API key is set
- Check browser console for errors

**Can't access on GoDaddy?**
- Verify Node.js is installed
- Check port 3000 is accessible
- Ensure subdomain points to correct directory
- Check file permissions (755 for directories, 644 for files)

## Need Help?

If you encounter issues during deployment:
1. Check the browser console (F12)
2. Check server logs (`pm2 logs` if using PM2)
3. Verify your Gemini API key is valid
4. Ensure all files uploaded correctly
