require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use('/reference', express.static(path.join(__dirname, '..', 'reference')));
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));

// Google Sheets auth
async function getAuthClient() {
  const credPath = path.join(__dirname, 'credentials.json');
  if (!fs.existsSync(credPath)) {
    throw new Error('credentials.json not found. See README for setup instructions.');
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: credPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, practice, specialty, size, service, message } = req.body;

    // Validate required fields
    if (!firstName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name and email are required.',
      });
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME || 'Contacts';

    // Ensure header row exists
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:K1`,
    }).catch(() => null);

    if (!headerCheck || !headerCheck.data.values || headerCheck.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:K1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Timestamp', 'First Name', 'Last Name', 'Email', 'Phone', 'Practice Name', 'Specialty', 'Practice Size', 'Service Interest', 'Message', 'Source']],
        },
      });
    }

    // Append data row
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:K`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          timestamp,
          firstName || '',
          lastName || '',
          email || '',
          phone || '',
          practice || '',
          specialty || '',
          size || '',
          service || '',
          message || '',
          'website',
        ]],
      },
    });

    res.json({ success: true, message: "Thank you! We'll be in touch shortly." });
  } catch (err) {
    console.error('Error saving contact:', err.message, err.stack);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      error: err.message,
    });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'averon-main.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Averon Health backend running on http://localhost:${PORT}`);
});
