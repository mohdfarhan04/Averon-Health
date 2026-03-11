require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Compression middleware
app.use(compression());

// Middleware
// If ALLOWED_ORIGINS is set in .env (comma-separated), restrict to those origins.
// Otherwise allow all origins so the form works out-of-the-box on any domain.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : null;

const corsOptions = {
  origin: allowedOrigins
    ? (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        console.warn(`CORS blocked origin: ${origin}`);
        cb(new Error('Not allowed by CORS'));
      }
    : true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Simple rate limiting (in-memory)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10;

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const timestamps = requestCounts.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);

  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.'
    });
  }

  timestamps.push(now);
  requestCounts.set(ip, timestamps);
  next();
}

// Clean up rate limit data every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestCounts.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (validTimestamps.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, validTimestamps);
    }
  }
}, 300000);

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

// Input validation helpers
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().substring(0, 500); // Limit length to prevent abuse
}

// Health check — visit /api/health to confirm the backend is running
app.get('/api/health', (req, res) => {
  const hasCredentials = fs.existsSync(path.join(__dirname, 'credentials.json'));
  const hasSpreadsheetId = !!process.env.SPREADSHEET_ID;
  const isHealthy = hasCredentials && hasSpreadsheetId;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    credentialsFile: hasCredentials ? 'found' : 'MISSING — Google Sheets will fail',
    spreadsheetId: hasSpreadsheetId ? 'set' : 'MISSING — set SPREADSHEET_ID in .env',
    sheetName: process.env.SHEET_NAME || 'Contacts',
    port: process.env.PORT || 3000,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
});

// POST /api/contact
app.post('/api/contact', rateLimitMiddleware, async (req, res) => {
  const startTime = Date.now();

  try {
    const { firstName, lastName, email, phone, practice, specialty, size, service, message } = req.body;

    // Validate required fields
    if (!firstName || !email) {
      console.warn(`[${new Date().toISOString()}] Validation failed: Missing required fields`);
      return res.status(400).json({
        success: false,
        message: 'First name and email are required.',
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      console.warn(`[${new Date().toISOString()}] Validation failed: Invalid email format - ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      console.warn(`[${new Date().toISOString()}] Validation failed: Invalid phone format`);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number.',
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      email: sanitizeInput(email),
      phone: sanitizeInput(phone),
      practice: sanitizeInput(practice),
      specialty: sanitizeInput(specialty),
      size: sanitizeInput(size),
      service: sanitizeInput(service),
      message: sanitizeInput(message),
    };

    console.log(`[${new Date().toISOString()}] Processing contact submission from ${sanitizedData.email}`);

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME || 'Contacts';

    if (!spreadsheetId) {
      throw new Error('SPREADSHEET_ID not configured in .env file');
    }

    // Ensure header row exists
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:K1`,
    }).catch(() => null);

    if (!headerCheck || !headerCheck.data.values || headerCheck.data.values.length === 0) {
      console.log(`[${new Date().toISOString()}] Creating header row in sheet: ${sheetName}`);
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
          sanitizedData.firstName,
          sanitizedData.lastName,
          sanitizedData.email,
          sanitizedData.phone,
          sanitizedData.practice,
          sanitizedData.specialty,
          sanitizedData.size,
          sanitizedData.service,
          sanitizedData.message,
          'website',
        ]],
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ✓ Contact submission saved successfully (${duration}ms) - ${sanitizedData.email}`);

    res.json({
      success: true,
      message: "Thank you! We'll be in touch shortly."
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] ✗ Error saving contact (${duration}ms):`, err.message);
    console.error('Stack trace:', err.stack);

    // Provide more specific error messages based on error type
    let errorMessage = 'Something went wrong. Please try again later.';

    if (err.message.includes('credentials.json')) {
      errorMessage = 'Server configuration error. Please contact support.';
    } else if (err.message.includes('SPREADSHEET_ID')) {
      errorMessage = 'Server configuration error. Please contact support.';
    } else if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'averon-main.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Averon Health Backend Server');
  console.log('='.repeat(60));
  console.log(`🌐 Server:        http://localhost:${PORT}`);
  console.log(`🏥 Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`📝 API Endpoint:  http://localhost:${PORT}/api/contact`);
  console.log(`📊 Spreadsheet:   ${process.env.SPREADSHEET_ID ? 'Configured ✓' : 'MISSING ✗'}`);
  console.log(`🔑 Credentials:   ${fs.existsSync(path.join(__dirname, 'credentials.json')) ? 'Found ✓' : 'MISSING ✗'}`);
  console.log(`🌍 Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏱  Started:       ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('');
});
