# React Email App - Setup Instructions

## 1. Configure Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=https://qfyomvwcugkqlbskhzhu.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

**Get your anon key from:** Supabase Dashboard → Settings → API

## 2. Run the App

```bash
npm run dev
```

Visit: http://localhost:5173

## 3. Usage Flow

1. **Sign Up** - Create a new account
2. **Login** - Enter your credentials
3. **Send Email** - Fill in:
   - Your Elastic Email API Key
   - Recipient email
   - Subject
   - HTML content
4. **Click Send!**

## Features

✅ Supabase Authentication (Signup/Login)  
✅ Send emails via Elastic Email API  
✅ Automatic sender detection from your Elastic Email account  
✅ Clean, modern UI with gradient design  
✅ Real-time feedback on email sending  

## Production Deploy

```bash
npm run build
```

Deploy the `dist/` folder to:
- Vercel
- Netlify  
- Any static host

**Remember to set environment variables on your hosting platform!**
