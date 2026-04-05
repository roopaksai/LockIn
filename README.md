# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Feedback setup (no database)

The app includes a Settings -> Feedback form that submits to a webhook.
To enable it, set this environment variable before running/building the app:

```bash
EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL=https://script.google.com/macros/s/your-web-app-id/exec
```

Quick start in this repo:

1. Copy `.env.example` to `.env.local`.
2. Put your Apps Script Web App URL in `EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL`.
3. Restart Metro and run `npm run android`.
4. Open Settings -> Send Feedback and submit a test message.
5. Verify a new row appears in your Google Sheet.

### Recommended backend: Google Apps Script + Google Sheet

1. Create a Google Sheet with columns:
    `createdAt`, `message`, `contact`, `platform`, `appVersion`, `mode`, `targetDays`, `progressEnabled`, `taskCount`
2. Open Extensions -> Apps Script and deploy a Web App (execute as you, access: anyone with link).
3. Use this script and replace `YOUR_SHEET_ID` and `Feedback`.

```javascript
function doPost(e) {
   try {
      var sheet = SpreadsheetApp.openById('YOUR_SHEET_ID').getSheetByName('Feedback');
      var body = JSON.parse(e.postData.contents || '{}');
      var ctx = body.context || {};

      sheet.appendRow([
         body.createdAt || new Date().toISOString(),
         body.message || '',
         body.contact || '',
         ctx.platform || '',
         ctx.appVersion || '',
         ctx.mode || '',
         ctx.targetDays || '',
         ctx.progressEnabled || false,
         ctx.taskCount || 0,
      ]);

      return ContentService
         .createTextOutput(JSON.stringify({ ok: true }))
         .setMimeType(ContentService.MimeType.JSON);
   } catch (err) {
      return ContentService
         .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
         .setMimeType(ContentService.MimeType.JSON);
   }
}
```

After deployment, paste the Web App URL into `EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL`.
You can view all user feedback directly in that Google Sheet.

### Optional endpoint smoke test (PowerShell)

Use this to verify your webhook before testing in-app:

```powershell
$url = "https://script.google.com/macros/s/your-web-app-id/exec"
$payload = @{
   message = "LockIn feedback endpoint test"
   contact = ""
   createdAt = (Get-Date).ToString("o")
   context = @{
      platform = "android"
      appVersion = "1.0.0"
      mode = "year"
      targetDays = 365
      progressEnabled = $true
      taskCount = 3
   }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType "application/json"
```

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
