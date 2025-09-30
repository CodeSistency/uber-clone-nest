# Notification Services Configuration Guide

## Required Environment Variables

Add these variables to your `.env` file to enable notification services:

```env
# =========================================
# FIREBASE CONFIGURATION
# =========================================

# Firebase Project ID (from Firebase Console)
FIREBASE_PROJECT_ID=your-firebase-project-id

# Firebase Service Account Key (as JSON string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"}

# =========================================
# TWILIO CONFIGURATION
# =========================================

# Twilio Account SID (from Twilio Console Dashboard)
TWILIO_ACCOUNT_SID=your-twilio-account-sid

# Twilio Auth Token (from Twilio Console Dashboard)
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# Twilio Phone Number (purchased from Twilio)
TWILIO_PHONE_NUMBER=+1234567890
```

## Firebase Setup Instructions

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Google Analytics if desired

### 2. Enable Cloud Messaging
1. In Firebase Console, go to Project Settings
2. Click on "Cloud Messaging" tab
3. Note down your Server Key and Sender ID

### 3. Create Service Account
1. In Firebase Console, go to Project Settings
2. Click on "Service Accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Copy the entire JSON content and paste it as the `FIREBASE_SERVICE_ACCOUNT` value

### 4. Add Mobile Apps (Optional)
1. In Firebase Console, click the Android/iOS icons to add apps
2. Follow the setup wizard
3. Download the `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)

## Twilio Setup Instructions

### 1. Create Twilio Account
1. Go to [Twilio](https://www.twilio.com/)
2. Sign up for a free account
3. Verify your email and phone number

### 2. Get Account Credentials
1. In Twilio Console, go to Dashboard
2. Note down your:
   - **Account SID**
   - **Auth Token**

### 3. Purchase Phone Number
1. In Twilio Console, go to "Phone Numbers"
2. Click "Buy a number"
3. Choose a number with SMS capabilities
4. Note down the purchased phone number

### 4. Configure Account Settings
1. Go to "Account" → "General settings"
2. Set up your account details
3. Configure SMS/MMS settings if needed

## Testing the Configuration

### 1. Test Firebase Connection
```bash
curl -X POST http://localhost:3000/api/notifications/test/ride-request?userId=test-user-id
```

### 2. Test Twilio Connection
```bash
curl -X POST http://localhost:3000/api/notifications/test/emergency?userId=test-user-id
```

### 3. Check Service Status
```bash
curl http://localhost:3000/api/notifications/test/status
```

## Production Considerations

### Security
- Store service account keys securely
- Use environment-specific Firebase/Twilio accounts
- Rotate keys regularly
- Implement proper access controls

### Monitoring
- Monitor notification delivery rates
- Set up alerts for failed deliveries
- Track user engagement with notifications
- Monitor API usage and costs

### Rate Limiting
```env
# Add these to your .env for production
NOTIFICATION_RATE_LIMIT_PER_HOUR=100
NOTIFICATION_RATE_LIMIT_PER_MINUTE=10
```

### Analytics
```env
# Enable analytics in production
NOTIFICATION_ANALYTICS_ENABLED=true
NOTIFICATION_ANALYTICS_RETENTION_DAYS=30
```

## Troubleshooting

### Firebase Issues
- **"Invalid service account"**: Check JSON format and project ID
- **"Permission denied"**: Verify service account has FCM permissions
- **"Token not registered"**: Token may be expired, user needs to refresh

### Twilio Issues
- **"Invalid credentials"**: Check Account SID and Auth Token
- **"Phone number not verified"**: Verify the sending number in Twilio Console
- **"Insufficient funds"**: Add credits to your Twilio account

### WebSocket Issues
- **Connection failures**: Check CORS configuration
- **Message not received**: Verify room membership
- **Performance issues**: Monitor Redis connection and memory usage

## Support

For additional help:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Socket.io Documentation](https://socket.io/docs/)

---

**Note**: The notification system will work without these configurations but will only send WebSocket notifications. Firebase and Twilio are optional for push notifications and SMS fallbacks.
