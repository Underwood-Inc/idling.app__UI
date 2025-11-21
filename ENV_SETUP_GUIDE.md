# Environment Variables Setup Guide

Your `.env.local` file has been created with default values. Here's what you need to do to get authentication working.

## 🔴 REQUIRED: Twitch OAuth Setup

The app uses Twitch for authentication. You **MUST** set this up to use the app.

### Steps:

1. **Go to Twitch Developers Console:**
   https://dev.twitch.tv/console/apps

2. **Register a New Application:**
   - Click "Register Your Application"
   - Name: `Idling App Local Dev` (or whatever you want)
   - OAuth Redirect URLs: `http://localhost:3000/api/auth/callback/twitch`
   - Category: Choose any (e.g., "Website Integration")
   - Click "Create"

3. **Get Your Credentials:**
   - Click "Manage" on your new application
   - Copy the **Client ID**
   - Click "New Secret" to generate a **Client Secret**
   - Copy the secret (you can only see it once!)

4. **Update `.env.local`:**
   ```env
   AUTH_TWITCH_ID=paste_your_client_id_here
   AUTH_TWITCH_SECRET=paste_your_client_secret_here
   ```

---

## 🟢 OPTIONAL: Google OAuth Setup

Google authentication is optional but recommended.

### Steps:

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials

2. **Create a Project** (if you don't have one):
   - Click "Select a project" > "New Project"
   - Name it whatever you want
   - Click "Create"

3. **Enable Google+ API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: `Idling App Local Dev`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Click "Create"

5. **Get Your Credentials:**
   - Copy the **Client ID**
   - Copy the **Client Secret**

6. **Update `.env.local`:**
   ```env
   GOOGLE_CLIENT_ID=paste_your_client_id_here
   GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
   ```

---

## 🗄️ Database Configuration

The database settings are already configured for local Docker development:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=idling
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

**Note:** When running in Docker, `POSTGRES_HOST` is automatically changed to `postgres` (the Docker service name).

---

## 🔐 NextAuth Secret

A random secure secret has been generated for you:

```env
NEXTAUTH_SECRET=v4od7gLQxB4zaSXiSGceYsLl1r3nC4rSjG2L++B99PU=
```

This is fine for local development. **In production, generate a new one and keep it secret!**

To generate a new one:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ✅ Verification Checklist

Before running the app, make sure:

- [ ] `.env.local` file exists in project root
- [ ] Twitch Client ID is set (REQUIRED)
- [ ] Twitch Client Secret is set (REQUIRED)
- [ ] Google credentials are set (optional but recommended)
- [ ] Database settings look correct
- [ ] Docker Desktop is running

---

## 🚀 Next Steps

1. **Edit `.env.local`** and add your OAuth credentials
2. **Restart your terminal** (if you just installed Node/pnpm)
3. **Start Docker Desktop** and wait for it to be ready
4. **Install dependencies:**
   ```bash
   pnpm install
   ```
5. **Start the containers:**
   ```bash
   pnpm dev:docker:win
   ```
   Select option 1 to start containers

6. **Open your browser:**
   - Main app: http://localhost:3000
   - Docs: http://localhost:3001

---

## 🆘 Troubleshooting

### "Invalid client" error when logging in
- Double-check your Twitch Client ID and Secret in `.env.local`
- Make sure the redirect URL in Twitch console exactly matches: `http://localhost:3000/api/auth/callback/twitch`

### Database connection errors
- Make sure Docker Desktop is running
- Check that the PostgreSQL container started: `docker ps`
- Try restarting containers: `pnpm dev:docker:win` > option 3 (stop & remove) > option 1 (start)

### "NEXTAUTH_URL" error
- Make sure `NEXTAUTH_URL=http://localhost:3000` is in your `.env.local`
- Don't add a trailing slash

---

## 📝 What Each Variable Does

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `POSTGRES_HOST` | Database server location | ✅ Yes |
| `POSTGRES_PORT` | Database port | ✅ Yes |
| `POSTGRES_DB` | Database name | ✅ Yes |
| `POSTGRES_USER` | Database username | ✅ Yes |
| `POSTGRES_PASSWORD` | Database password | ✅ Yes |
| `DATABASE_URL` | Full database connection string | ✅ Yes |
| `NEXTAUTH_URL` | Your app's URL | ✅ Yes |
| `NEXTAUTH_SECRET` | Secret for encrypting tokens | ✅ Yes |
| `AUTH_TRUST_HOST` | Trust the host header | ✅ Yes |
| `AUTH_TWITCH_ID` | Twitch OAuth Client ID | ✅ Yes |
| `AUTH_TWITCH_SECRET` | Twitch OAuth Client Secret | ✅ Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ⚠️ Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ⚠️ Optional |
| `NODE_ENV` | Environment mode | ✅ Yes |
| `IS_DOCKERIZED` | Running in Docker? | ✅ Yes |

---

## 🎉 You're Ready!

Once you've set up your OAuth credentials, you're good to go! The app will be able to authenticate users with Twitch (and optionally Google).

Happy coding! 🚀

