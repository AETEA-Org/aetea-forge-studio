# AETEA Deployment Guide

This guide covers running the app locally and deploying to Vercel (or other platforms).

---

## Environment Variables

Your app requires these environment variables:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |

### Current Values (for your existing Supabase project)

```env
VITE_SUPABASE_URL=https://sprbamfghyaimfuvpgmp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcmJhbWZnaHlhaW1mdXZwZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNzkzMDEsImV4cCI6MjA4MjY1NTMwMX0.FSHZXMlXgh3ez3OiZjQSYDNC5kFkZq3QyG5plGWYkLc
```

---

## Running Locally

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <project-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the project root:
   ```env
   VITE_SUPABASE_URL=https://sprbamfghyaimfuvpgmp.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcmJhbWZnaHlhaW1mdXZwZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNzkzMDEsImV4cCI6MjA4MjY1NTMwMX0.FSHZXMlXgh3ez3OiZjQSYDNC5kFkZq3QyG5plGWYkLc
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open** `http://localhost:8080` in your browser

---

## Deploying to Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**

2. **Go to [vercel.com](https://vercel.com)** and sign in

3. **Click "New Project"** → Import your GitHub repository

4. **Configure Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add Environment Variables:**
   In the "Environment Variables" section, add:
   
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://sprbamfghyaimfuvpgmp.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcmJhbWZnaHlhaW1mdXZwZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNzkzMDEsImV4cCI6MjA4MjY1NTMwMX0.FSHZXMlXgh3ez3OiZjQSYDNC5kFkZq3QyG5plGWYkLc` |

6. **Click "Deploy"**

### Option 2: Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
4. **Add environment variables** when prompted, or via:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
   ```

---

## Post-Deployment: Configure Supabase Auth

After deploying, you **must** update your Supabase authentication settings:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/sprbamfghyaimfuvpgmp/auth/url-configuration)

2. Under **Authentication → URL Configuration**:
   - **Site URL**: Set to your deployed URL (e.g., `https://your-app.vercel.app`)
   - **Redirect URLs**: Add both:
     - `https://your-app.vercel.app`
     - `http://localhost:8080` (for local development)

3. If using **Google OAuth**, ensure your Google Cloud Console has the correct redirect URIs.

---

## Using a Different Supabase Project

If you want to use a completely different Supabase project:

### 1. Create a new Supabase project at [supabase.com](https://supabase.com)

### 2. Get your credentials
   - Go to **Settings → API** in your new project
   - Copy the **Project URL** and **anon public key**

### 3. Set up the Edge Function secret
   In your new Supabase project:
   - Go to **Settings → Edge Functions**
   - Add secret: `AETEA_API_TOKEN` with your AETEA backend API token

### 4. Deploy the Edge Function
   The `api-proxy` edge function in `supabase/functions/api-proxy/` needs to be deployed:
   ```bash
   npx supabase functions deploy api-proxy --project-ref YOUR_PROJECT_REF
   ```

### 5. Run database migrations
   Apply any necessary database migrations from `supabase/migrations/`

### 6. Update environment variables
   Use your new project's URL and anon key

---

## Troubleshooting

### "Invalid API key" or auth errors
- Verify `VITE_SUPABASE_PUBLISHABLE_KEY` is correct
- Check that the key hasn't expired

### Google OAuth not working
- Ensure Site URL and Redirect URLs are configured in Supabase
- Verify Google Cloud Console OAuth settings match your deployed URL

### Edge function errors
- Check that `AETEA_API_TOKEN` secret is set in Supabase
- View logs at: Supabase Dashboard → Edge Functions → api-proxy → Logs

### CORS errors
- The edge function already includes CORS headers
- Ensure you're calling the correct Supabase URL
