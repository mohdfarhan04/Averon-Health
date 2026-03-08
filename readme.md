# 🏥 Averon Health

**Seamless Healthcare Contact Management Platform**

A lightweight, full-stack solution for capturing and organizing patient inquiries. Connect your website to Google Sheets in minutes—no complex databases required.

---

## ✨ What is Averon Health?

Averon Health is a modern contact management system designed specifically for healthcare providers. It bridges your patient-facing website with organized data collection, turning inquiries into actionable leads automatically.

**Perfect for:**
- 🏨 Medical practices & clinics
- 💊 Wellness & diagnostic centers  
- 🔬 Healthcare providers
- 📱 Telemedicine platforms

---

## 🎯 Key Features

| Feature | Benefit |
|---------|---------|
| 🎨 **Beautiful Forms** | Responsive, modern contact forms |
| 📊 **Auto-Organized** | Data flows directly to Google Sheets |
| ⚡ **Zero Database** | Simple, no backend infrastructure needed |
| 🔗 **Easy Integration** | Drop-in HTML forms for any website |
| 🚀 **Production Ready** | Deploy in minutes |
| 🔐 **Secure** | Google-backed authentication |

---

## 📁 Project Structure

```
averon-health/
├── 🎨 frontend/
│   ├── averon-main.html    # Landing page & main form
│   ├── main.js             # Form logic & interactions
│   └── styles.css          # Beautiful, responsive styling
│
├── ⚙️ backend/
│   ├── server.js           # Express.js application
│   ├── contact-form.html   # Embeddable form snippet
│   ├── package.json        # Dependencies
│   ├── .env               # Configuration (git-ignored)
│   ├── credentials.json   # Google Service Account (git-ignored)
│   └── .gitignore
│
└── readme.md              # This file
```

---

## 🚀 Quick Start

### Step 1 – Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2 – Set Up Google Sheets Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (`averon-health`)
3. Enable **Google Sheets API** 
   - *APIs & Services → Library → Search "Google Sheets API" → Enable*
4. Create a **Service Account**
   - *APIs & Services → Credentials → Create Credentials → Service Account*
5. Generate a **JSON Key**
   - *Click on service account → Keys → Add Key → Create new key (JSON)*
6. Download and save as `backend/credentials.json`

### Step 3 – Create Google Sheet

1. Visit [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name the first sheet tab **"Contacts"**
4. Share the sheet with your service account email (Editor access)
5. Copy your **Spreadsheet ID** from the URL
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

### Step 4 – Configure Environment

Create `backend/.env`:

```env
PORT=3000
SPREADSHEET_ID=your_spreadsheet_id_here
SHEET_NAME=Contacts
NODE_ENV=development
```

### Step 5 – Start the Server

```bash
cd backend
npm start

# For development with auto-reload:
npm run dev
```

✅ Server running at **http://localhost:3000**

### Step 6 – Open Frontend

Open `frontend/averon-main.html` in your browser or serve it:

```bash
# Quick serve (requires Python or Node)
npx http-server frontend --port 8000
```

Visit **http://localhost:8000**

---

## 📡 How It Works

```
1. User fills out contact form
   ↓
2. Frontend sends data to backend
   ↓
3. Backend validates input
   ↓
4. Data sent to Google Sheets API
   ↓
5. Entry added to spreadsheet
   ↓
6. You see it in real-time!
```

---

## 📋 Contact Form Fields

Your form captures:

| Field | Type | Purpose |
|-------|------|---------|
| **First Name** | Text | Patient's first name |
| **Last Name** | Text | Patient's last name |
| **Email** | Email | Contact email |
| **Phone** | Tel | Contact number |
| **Practice** | Text | Medical practice/facility |
| **Specialty** | Select | Medical specialty |
| **Message** | Textarea | Additional inquiry details |

---


## 🔒 Security Checklist

✅ `.env` and `credentials.json` are git-ignored  
✅ Never commit sensitive files to repository  
✅ Service account email is never exposed  
✅ Input validation on backend  
✅ CORS secured  

⚠️ **Before going live:**
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Implement request validation
- [ ] Set up error logging
- [ ] Review CORS settings

---

## 📊 Google Sheet Structure

Your submissions auto-populate with these columns:

| Timestamp | First Name | Last Name | Email | Phone | Practice | Specialty | Message |
|-----------|-----------|----------|-------|-------|----------|-----------|---------|
| 3/9/2026 10:45 | John | Doe | john@email.com | 555-0147 | Wellness Inc | Cardiology | Consultation request |

---

## 🚀 Deploy to Production

### Heroku (Recommended)

```bash
cd backend

# Login & create app
heroku login
heroku create your-app-name

# Add environment variables
heroku config:set SPREADSHEET_ID=your_id
heroku config:set SHEET_NAME=Contacts

# Upload credentials
# (In Heroku dashboard, add GOOGLE_CREDENTIALS as JSON string)

# Deploy
git push heroku main
```

### Vercel / Netlify

Frontend & backend can be deployed separately. See deployment docs for details.

---

## 🧪 Testing

```bash
cd backend

# Test the API
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "email": "test@example.com",
    "message": "Hello"
  }'
```

---

## 📚 File Guide

### Frontend (`frontend/`)
- **averon-main.html** – Main landing page with form
- **main.js** – Form submission & validation logic
- **styles.css** – Response design system

### Backend (`backend/`)
- **server.js** – Express API server
- **contact-form.html** – Embeddable form component
- **package.json** – Node dependencies

---

## 🐛 Troubleshooting

**Form submissions not appearing in sheet?**
- Verify `SPREADSHEET_ID` is correct
- Confirm service account email has Editor access to sheet
- Check browser console for errors

**Server won't start?**
- Ensure Node.js is installed: `node --version`
- Verify `credentials.json` exists in `backend/`
- Check port 3000 isn't already in use

**CORS errors?**
- Ensure frontend & backend URLs are compatible
- Check `backend/server.js` CORS settings

---

## 📞 Support

Need help? Check:
- Frontend JavaScript console for errors (F12)
- Backend terminal for server logs
- Google Cloud Console for API issues

---

## 📄 License

MIT License – Open source & free to use

---

**Built to make healthcare connections simple, secure & scalable**

✨ *Transform patient inquiries into organized action in seconds.*
