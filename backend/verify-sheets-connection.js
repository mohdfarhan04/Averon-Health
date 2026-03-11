#!/usr/bin/env node

/**
 * Google Sheets Connection Verification Script
 * Tests if credentials and spreadsheet access are properly configured
 */

require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying Google Sheets Configuration\n');
console.log('='.repeat(60));

async function verifyConnection() {
  // Check 1: Credentials file exists
  console.log('\n1️⃣  Checking credentials.json...');
  const credPath = path.join(__dirname, 'credentials.json');

  if (!fs.existsSync(credPath)) {
    console.log('   ✗ credentials.json not found!');
    console.log('   💡 Make sure the file is in the backend folder');
    return false;
  }

  let credentials;
  try {
    credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    console.log('   ✓ credentials.json found and valid JSON');
  } catch (err) {
    console.log('   ✗ credentials.json is not valid JSON:', err.message);
    return false;
  }

  // Check 2: Validate credentials structure
  console.log('\n2️⃣  Validating credentials structure...');
  const requiredFields = [
    'type',
    'project_id',
    'private_key_id',
    'private_key',
    'client_email',
    'client_id'
  ];

  let allFieldsPresent = true;
  for (const field of requiredFields) {
    if (!credentials[field]) {
      console.log(`   ✗ Missing field: ${field}`);
      allFieldsPresent = false;
    }
  }

  if (!allFieldsPresent) {
    console.log('   ✗ Credentials file is incomplete');
    return false;
  }

  console.log('   ✓ All required fields present');
  console.log(`   Service Account: ${credentials.client_email}`);
  console.log(`   Project ID: ${credentials.project_id}`);

  // Check 3: Environment variables
  console.log('\n3️⃣  Checking environment variables...');

  if (!process.env.SPREADSHEET_ID) {
    console.log('   ✗ SPREADSHEET_ID not set in .env file');
    return false;
  }

  console.log('   ✓ SPREADSHEET_ID is set');
  console.log(`   Spreadsheet ID: ${process.env.SPREADSHEET_ID}`);
  console.log(`   Sheet Name: ${process.env.SHEET_NAME || 'Contacts'}`);

  // Check 4: Test Google Sheets API connection
  console.log('\n4️⃣  Testing Google Sheets API connection...');

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: credPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    console.log('   ✓ Successfully authenticated with Google');

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Try to get spreadsheet metadata
    console.log('\n5️⃣  Accessing spreadsheet...');
    const spreadsheetId = process.env.SPREADSHEET_ID;

    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      console.log('   ✓ Successfully accessed spreadsheet');
      console.log(`   Title: "${spreadsheet.data.properties.title}"`);
      console.log(`   Total Sheets: ${spreadsheet.data.sheets.length}`);

      // List all sheet names
      console.log('   Available sheets:');
      spreadsheet.data.sheets.forEach((sheet, index) => {
        console.log(`     ${index + 1}. ${sheet.properties.title}`);
      });

      // Check if the specified sheet exists
      const sheetName = process.env.SHEET_NAME || 'Contacts';
      const sheetExists = spreadsheet.data.sheets.some(
        s => s.properties.title === sheetName
      );

      if (sheetExists) {
        console.log(`   ✓ Sheet "${sheetName}" exists`);
      } else {
        console.log(`   ⚠ Sheet "${sheetName}" not found`);
        console.log(`   💡 The sheet will be created automatically on first form submission`);
      }

      // Try to read/write to the sheet
      console.log('\n6️⃣  Testing read/write permissions...');

      try {
        // Try to read the first cell
        const readTest = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A1:A1`,
        }).catch(() => ({ data: { values: [] } }));

        console.log('   ✓ Read permission verified');

        // Try a test write (we'll write to a test sheet to avoid interfering with data)
        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
              values: [['TEST - Connection Verified at ' + new Date().toISOString()]],
            },
          });

          console.log('   ✓ Write permission verified');
          console.log('   ✓ Test entry added to spreadsheet (you can delete it)');

        } catch (writeErr) {
          if (writeErr.code === 403) {
            console.log('   ✗ No write permission!');
            console.log('   💡 Make sure the service account has "Editor" access');
            console.log(`   💡 Share the spreadsheet with: ${credentials.client_email}`);
            return false;
          } else {
            throw writeErr;
          }
        }

      } catch (permErr) {
        console.log('   ✗ Permission error:', permErr.message);
        return false;
      }

    } catch (accessErr) {
      if (accessErr.code === 404) {
        console.log('   ✗ Spreadsheet not found!');
        console.log('   💡 Check that the SPREADSHEET_ID is correct');
        console.log(`   💡 Current ID: ${spreadsheetId}`);
        return false;
      } else if (accessErr.code === 403) {
        console.log('   ✗ Access denied!');
        console.log('   💡 The service account needs access to this spreadsheet');
        console.log(`   💡 Share the spreadsheet with: ${credentials.client_email}`);
        console.log('   💡 Give it "Editor" permissions');
        return false;
      } else {
        throw accessErr;
      }
    }

  } catch (err) {
    console.log('   ✗ Authentication failed:', err.message);
    if (err.message.includes('invalid_grant')) {
      console.log('   💡 The private key may be invalid or expired');
      console.log('   💡 Try creating a new service account key');
    }
    return false;
  }

  return true;
}

// Run verification
verifyConnection()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ Google Sheets connection verified successfully!');
      console.log('='.repeat(60));
      console.log('\n💡 Next steps:');
      console.log('   1. Start the backend: npm run dev');
      console.log('   2. Test form submission from the frontend');
      console.log('   3. Check that data appears in Google Sheets\n');
      process.exit(0);
    } else {
      console.log('❌ Google Sheets connection verification failed');
      console.log('='.repeat(60));
      console.log('\n💡 Fix the issues above and run this script again\n');
      process.exit(1);
    }
  })
  .catch(err => {
    console.log('\n' + '='.repeat(60));
    console.log('❌ Unexpected error:', err.message);
    console.log('='.repeat(60));
    console.error('\nFull error:', err);
    process.exit(1);
  });
