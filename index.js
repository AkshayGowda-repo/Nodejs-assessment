const {google} = require('googleapis');
const readline = require('readline');
const fs = require('fs');

const CLIENT_ID = '229540454095-p135cv9sa1f81mplok2vt5aos3j15o4d.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'; // Desktop app redirect URI
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify']; // Gmail API scopes

// Create OAuth2 client object
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate authorization URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline', // Required to get a refresh token
  scope: SCOPES,
});

// Open authorization URL in browser and get authorization code
console.log('Authorize this app by visiting this URL:', authUrl);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.question('Enter the code from that page here: ', async code => {
  rl.close();

  try {
    // Get access token using authorization code
    const {tokens} = await oAuth2Client.getToken(code);
    console.log('Access token:', tokens.access_token);
    console.log('Refresh token:', tokens.refresh_token);

    // Save refresh token to file
    fs.writeFileSync('refresh-token.json', JSON.stringify(tokens));
    console.log('Refresh token saved to file.');
  } catch (err) {
    console.error('Error getting access token:', err);
  }
});
