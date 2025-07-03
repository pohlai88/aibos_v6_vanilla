# 🚀 Vercel Deployment Guide for AIBOS V6

## 📋 Environment Variables Setup

### Required Environment Variables for Vercel

You need to set these environment variables in your Vercel project settings:

#### 1. Supabase Configuration
```
VITE_SUPABASE_URL=https://ivvnmiyfmugkowjwbmni.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dm5taXlmbXVna293andibW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MDI3NDYsImV4cCI6MjA2Njk3ODc0Nn0.l59BmJsJRC0iHseZ71VNAW_teKWrFx4lvExkQI3bgSw
```

#### 2. Application Configuration
```
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

## 🔧 How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://ivvnmiyfmugkowjwbmni.supabase.co`
   - **Environment**: Production, Preview, Development
4. Repeat for `VITE_SUPABASE_ANON_KEY`

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

## 🎯 What `createClient` Does

The `createClient` function creates a Supabase client instance:

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,    // Automatically refresh auth tokens
    persistSession: true,      // Save session in localStorage
    detectSessionInUrl: true   // Detect auth tokens in URL
  }
})
```

### What This Enables:
- ✅ **Authentication** - Login, signup, password reset
- ✅ **Database Access** - CRUD operations with RLS
- ✅ **Real-time Subscriptions** - Live data updates
- ✅ **File Storage** - Upload and manage files
- ✅ **Edge Functions** - Serverless functions

## 🔍 Verification Steps

### 1. Check Environment Variables
```typescript
// In your browser console, check:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

### 2. Test Supabase Connection
```typescript
// Test the connection
const { data, error } = await supabase.from('organizations').select('*').limit(1)
console.log('Connection test:', { data, error })
```

### 3. Check Authentication
```typescript
// Test auth
const { data: { session }, error } = await supabase.auth.getSession()
console.log('Auth test:', { session: !!session, error })
```

## 🚨 Common Issues & Solutions

### Issue 1: "Missing Supabase environment variables"
**Solution**: Set environment variables in Vercel dashboard

### Issue 2: "Invalid API key"
**Solution**: Verify the anon key is correct and not the service role key

### Issue 3: "CORS error"
**Solution**: Add your Vercel domain to Supabase allowed origins

### Issue 4: "RLS policy violation"
**Solution**: Check Row Level Security policies in Supabase

## 📊 Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase project configured
- [ ] Database migrations applied
- [ ] RLS policies configured
- [ ] CORS settings updated
- [ ] Domain added to allowed origins
- [ ] Authentication providers configured

## 🔗 Useful Links

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

---

**Your Supabase configuration is now properly set up for Vercel deployment!** 🎉 