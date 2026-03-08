# Averon Health – Contact Form Backend

Stores contact form submissions directly into a Google Sheet.

---

## Folder Structure

```
backend/
├── server.js           ← Express server (main entry point)
├── contact-form.html   ← Drop-in form snippet for your HTML page
├── credentials.json    ← 🔑 Your Google Service Account key (see setup)
├── .env                ← Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## Quick Setup (5 steps)

### Step 1 – Install dependencies
```bash
npm install
```

### Step 2 – Create a Google Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g. `averon-health`)
3. Enable **Google Sheets API** → *APIs & Services → Library*
4. Go to *APIs & Services → Credentials → Create Credentials → Service Account*
5. Name it, click **Done**
6. Click the service account email → **Keys** tab → **Add Key → JSON**
7. A JSON file downloads – **replace `credentials.json` with its contents**

### Step 3 – Create your Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a new sheet
2. Name the first tab **Contacts** (or whatever you set in `.env`)
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  ← COPY THIS PART →  /edit
   ```
4. **Share the sheet** with the `client_email` from your credentials.json (give Editor access)

### Step 4 – Configure .env
```env
PORT=3000
SPREADSHEET_ID=paste_your_spreadsheet_id_here
SHEET_NAME=Contacts
```

### Step 5 – Run the server
```bash
npm start
# or for auto-reload during development:
npm run dev
```

Server starts at **http://localhost:3000**

---

## API Endpoint

### `POST /api/contact`

**Request body (JSON):**
| Field       | Required | Description              |
|-------------|----------|--------------------------|
| firstName   | ✅       | Contact's first name     |
| lastName    |          | Contact's last name      |
| email       | ✅       | Email address            |
| phone       |          | Phone number             |
| practice    |          | Practice/company name    |
| specialty   |          | Medical specialty        |
| message     |          | Message / notes          |

**Success response:**
```json
{ "success": true, "message": "Thank you! We'll be in touch shortly." }
```

**Error response:**
```json
{ "success": false, "message": "First name and email are required." }
```

---

## Google Sheet Columns

The sheet will be auto-populated with these columns:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Timestamp | First Name | Last Name | Email | Phone | Practice Name | Specialty | Message | Source |

---

## Connecting to Your HTML Page

1. Open `contact-form.html`
2. Copy the HTML form and `<script>` block
3. Paste it into your existing `averon-health.html` where the contact section is
4. Update the `BACKEND_URL` constant at the top of the script:
   ```js
   // Local dev:
   const BACKEND_URL = 'http://localhost:3000/api/contact';
   
   // Production (if deployed):
   const BACKEND_URL = 'https://yourdomain.com/api/contact';
   ```

---

## Security Notes

- `credentials.json` and `.env` are in `.gitignore` – **never commit them**
- For production, use environment variables instead of the credentials file
- Consider adding rate limiting (`express-rate-limit`) before going live