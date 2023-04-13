const {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
require('dotenv').config();

// Set up the OAuth2 client
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET =  process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost";
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});

// Set up the Gmail API client
const gmail = google.gmail({version: 'v1', auth: oAuth2Client});

const LABEL_NAME = 'Auto';


async function checkForNewEmails() {
    try {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread', // Filter for unread messages only
      });
  
      const messages = res.data.messages || [];
  
      // Iterate over messages
      for (const message of messages) {
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });
  
        const {payload} = messageData.data;
        const headers = payload.headers || [];
  
        // Check if email has no replies
        const hasReplied = headers.some(header => {
          return header.name === 'In-Reply-To';
        });
  
        if (!hasReplied) {
          // Send reply

          const reply = {

            subject: 'Auto-Reply: I am currently on vacation',
            message: 'Thank you for your email. I am currently on vacation and will not be able to respond until my return. Best regards, Akshay'
          };

          const rawReply = Buffer.from(
            `To: ${headers.find(header => header.name === 'From').value}\n` +
            `Subject: ${reply.subject}\n` +
            `Content-Type: text/html; charset=utf-8\n\n` +
            `${reply.message}`
          ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

          await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: rawReply,
              threadId: message.threadId,
            },
          });
  


          function getOrCreateLabel() {
            return new Promise((resolve, reject) => {
              gmail.users.labels.list({ userId: 'me' }, (err, res) => {
                if (err) {
                  reject(err);
                  return;
                }
          
                const labels = res.data.labels;
                let label = labels.find((label) => label.name === LABEL_NAME);
          
                if (!label) {
                  gmail.users.labels.create(
                    {
                      userId: 'me',
                      resource: {
                        name: LABEL_NAME,
                        labelListVisibility: 'labelShow',
                        messageListVisibility: 'show'
                      }
                    },
                    (err, res) => {
                      if (err) {
                        reject(err);
                        return;
                      }
          
                      label = res.data;
                      resolve(label);
                    }
                  );
                } else {
                  resolve(label);
                }
              });
            });
          }


          // Add label to email and move
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id,
            requestBody: {
              addLabelIds: [getOrCreateLabel().id], 
              removeLabelIds: ['INBOX'], 
            },
          });
        }
      }
    } catch (err) {
      console.error('Error checking for new emails:', err);
    }
  

    const interval = Math.floor(Math.random() * (120 - 45 + 1) + 45);
    console.log(`Waiting for ${interval} seconds before checking for new emails again...`);
    setTimeout(checkForNewEmails, interval * 1000);
  }

  checkForNewEmails();