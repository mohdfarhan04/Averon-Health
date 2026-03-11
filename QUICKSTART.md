# Quick Start Guide

## 🚀 Starting the Application

### 1. Install Dependencies (if not already done)
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

You should see:
```
============================================================
✅ Averon Health Backend Server
============================================================
🌐 Server:        http://localhost:3000
🏥 Health Check:  http://localhost:3000/api/health
📝 API Endpoint:  http://localhost:3000/api/contact
📊 Spreadsheet:   Configured ✓
🔑 Credentials:   Found ✓
🌍 Environment:   development
⏱  Started:       [timestamp]
============================================================
```

### 3. Test the Backend
```bash
# Run automated tests
npm test

# OR manually test the health endpoint
curl http://localhost:3000/api/health
```

### 4. Open the Frontend
Open `frontend/averon-main.html` in your browser or serve it with:
```bash
# If you have a simple HTTP server
cd frontend
python -m http.server 8080
# Then open http://localhost:8080/averon-main.html
```

## ✅ Verification Checklist

- [ ] Backend server starts without errors
- [ ] Health check returns status "ok"
- [ ] Credentials file is found
- [ ] Spreadsheet ID is configured
- [ ] Frontend loads without console errors
- [ ] Form submission works
- [ ] Data appears in Google Sheets
- [ ] Error messages display properly for invalid input

## 🧪 Testing Form Submissions

Try these test cases:

### Valid Submission
1. Fill in First Name: "John"
2. Fill in Email: "john@example.com"
3. Fill other fields (optional)
4. Submit
5. ✓ Should see success message
6. ✓ Form should reset
7. ✓ Data should appear in Google Sheets

### Invalid Email
1. Fill in First Name: "John"
2. Fill in Email: "invalid-email"
3. Submit
4. ✓ Should see "Please provide a valid email address"

### Missing Required Fields
1. Leave First Name empty
2. Fill in Email: "john@example.com"
3. Try to submit
4. ✓ Should see "Please enter your first name"

### Rate Limiting
1. Submit the form 10 times rapidly
2. On the 11th attempt
3. ✓ Should see "Too many requests. Please try again later."

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Verify `.env` file exists with correct configuration
- Make sure `credentials.json` exists in the backend folder

### Form submission fails
- Check browser console for errors (F12)
- Verify backend is running
- Check network tab for API request status
- Review backend logs for error messages

### CORS errors
- Check the `ALLOWED_ORIGINS` setting in `.env`
- For local development, leave it commented out
- For production, add your domain

### Data not saving to Google Sheets
- Verify `SPREADSHEET_ID` is correct
- Check that the service account has edit permissions
- Review backend logs for Google API errors

## 📊 Monitoring

The backend now logs all requests with timing:
```
[2026-03-11T...] POST /api/contact - 200 (145ms)
[2026-03-11T...] GET /api/health - 200 (12ms)
```

Watch these logs to:
- Monitor response times
- Identify errors
- Track usage patterns
- Debug issues

## 🔐 Security Notes

- Rate limiting is enabled (10 requests/minute per IP)
- All inputs are sanitized
- Email validation is enforced
- Security headers are set
- Use HTTPS in production!

## 📈 Next Steps

Once everything is working:
1. Deploy to a production server
2. Set up HTTPS
3. Configure `ALLOWED_ORIGINS` for your domain
4. Consider adding:
   - Email notifications for new submissions
   - Database backup
   - Monitoring/analytics
   - CAPTCHA for additional security

## 💡 Tips

- Use `npm run dev` during development for auto-reload
- Check `http://localhost:3000/api/health` to verify configuration
- Run `npm test` before deploying to production
- Monitor the server logs for any issues
- Keep `credentials.json` secure and never commit it to git

---

**Need Help?** Check `FIXES_APPLIED.md` for detailed documentation on all changes.
