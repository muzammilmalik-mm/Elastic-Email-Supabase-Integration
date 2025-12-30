# Elastic Email Dashboard - Complete Step-by-Step Guide

This guide will walk you through creating a complete email dashboard with React, Supabase Edge Functions, and Elastic Email API from scratch.

## 📋 Prerequisites

- **Node.js 20.19+ or 22.12+** (required for Vite and Tailwind v4)
  - Check your version: `node -v`
  - If you have Node 22.11 or lower, update from [nodejs.org](https://nodejs.org)
- npm installed
- Supabase CLI installed: `npm install -g supabase`
- Elastic Email account with API key ([Get one here](https://elasticemail.com))
- Supabase project ([Create one here](https://supabase.com))

## 🏗️ Architecture Overview

Before diving into the implementation, let's understand the overall structure and data flow of the application.


### Project Structure

```
my-email-app/
├── 📁 supabase/                    # Supabase Edge Functions (Backend)
│   └── 📁 functions/
│       ├── 📁 send-email/
│       │   └── index.ts            # Custom HTML email sender
│       ├── 📁 send-template/
│       │   └── index.ts            # Template-based email sender
│       └── 📁 email-status/
│           └── index.ts            # Email delivery status checker
│
├── 📁 src/                         # React Application (Frontend)
│   ├── 📁 components/
│   │   ├── Dashboard.tsx           # Main app with tab navigation
│   │   ├── SendEmailForm.tsx       # Custom email form component
│   │   ├── SendTemplateForm.tsx    # Template email form component
│   │   └── EmailStatusChecker.tsx  # Status lookup component
│   ├── supabaseClient.ts           # Supabase client configuration
│   ├── index.css                   # Tailwind CSS styles
│   └── main.tsx                    # React entry point
│
├── 📄 .env                         # Environment variables (local)
├── 📄 tailwind.config.js           # Tailwind configuration
├── 📄 postcss.config.js            # PostCSS configuration
├── 📄 index.html                   # HTML entry point
└── 📄 package.json                 # Dependencies & scripts
```


### Key Integration Points

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + TypeScript | User interface & form handling |
| **Styling** | Tailwind CSS v4 | Modern responsive design |
| **API Client** | @supabase/supabase-js | Connect to Supabase services |
| **Backend** | Supabase Edge Functions | Secure API proxy (Deno runtime) |
| **Email Service** | Elastic Email API | Email delivery & tracking |
| **Secrets** | Supabase Secrets | Secure API key storage |

---

## 🚀 Step-by-Step Setup

### Step 1: Create the React Project

Open your terminal and run:

```bash
npm create vite@latest my-email-app -- --template react-ts
```

When prompted, select:
- Framework: **React**
- Variant: **TypeScript**
- Use rolldown-vite: **No**
- Install and start now: **No**

Navigate to the project:
```bash
cd my-email-app
```

**Clean up default files:**
```bash
# Delete these default files (we won't need them)
del src\App.tsx src\App.css src\index.css     # Windows
# or
rm src/App.tsx src/App.css src/index.css      # Mac/Linux
```

### Step 2: Install Dependencies

```bash
npm install
npm install react react-dom @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer
```

> ⚠️ **Tailwind v4 Change**: The PostCSS plugin has moved to `@tailwindcss/postcss` - you must install it separately!

**Manually create `tailwind.config.js`** in your project root:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Manually create `postcss.config.js`** in your project root:

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

> 💡 **Important**: Use `'@tailwindcss/postcss'` (not `tailwindcss`) in your PostCSS config for v4!

**Create `src/index.css`** with Tailwind v4 syntax:

```css
@import "tailwindcss";
```

> 💡 **Tailwind v4 Change**: Use `@import "tailwindcss";` instead of the old `@tailwind` directives.

2. High Level Architecture Diagram


3. Final Project Directory Layout
Ensure your folder structure matches this exactly. The most common error is placing the supabase folder inside the src folder; it must be at the root level.

### Step 3: Create Environment Variables File



**IMPORTANT:** Create a `.env` file in your project root (same level as `package.json`) with your Supabase credentials.

**Both values are required:**

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

**To get these values:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** → **API**
4. Copy **both** values:
   - **Project URL** → use as `VITE_SUPABASE_URL`
   - **anon public** key → use as `VITE_SUPABASE_ANON_KEY`

**Example `.env` file:**
```env
VITE_SUPABASE_URL=Supabase-Url-Here
VITE_SUPABASE_ANON_KEY=Supabase-Anon-Key-Here
```

> ⚠️ **Critical:** Both values are **required**! Without them:
> - Missing `VITE_SUPABASE_URL` → "supabaseUrl is required" error
> - Missing `VITE_SUPABASE_ANON_KEY` → Your app can't call Supabase Edge Functions

> 🔒 **Security:** Add `.env` to your `.gitignore` file to prevent committing secrets:
> ```bash
> echo .env >> .gitignore
> ```

> 💡 **Important:** After creating/editing the `.env` file, you **must restart** the dev server for changes to take effect.

**What about Elastic Email API Key?**
- The Elastic Email API key goes in **Supabase secrets** (Step 12), NOT in your `.env` file
- Your `.env` file only needs the two Supabase values above

### Step 4: Create Supabase Client

Create a new file `src/supabaseClient.ts` and add:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

> 📝 **Note:** The environment variables are accessed via `import.meta.env` in Vite. Variable names must start with `VITE_` to be exposed to your client-side code.

### Step 5: Create Components Folder

```bash
mkdir src/components
```

### Step 6: Create Dashboard Component

Create `src/components/Dashboard.tsx`:

```typescript
import React, { useState } from 'react';
import { SendEmailForm } from './SendEmailForm';
import { SendTemplateForm } from './SendTemplateForm';
import { EmailStatusChecker } from './EmailStatusChecker';

export function Dashboard() {
    const [activeTab, setActiveTab] = useState('send');

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-8">
            <header className="text-center text-white mb-8">
                <h1 className="text-4xl font-bold">📧 Elastic Email Dashboard</h1>
            </header>
            <nav className="flex gap-4 justify-center mb-8">
                <button 
                    className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 ${
                        activeTab === 'send' 
                            ? 'bg-white text-purple-600 shadow-lg' 
                            : 'bg-white/20 text-white border-2 border-white/30 hover:bg-white/30 hover:-translate-y-0.5'
                    }`} 
                    onClick={() => setActiveTab('send')}>
                    Send Email
                </button>
                <button 
                    className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 ${
                        activeTab === 'template' 
                            ? 'bg-white text-purple-600 shadow-lg' 
                            : 'bg-white/20 text-white border-2 border-white/30 hover:bg-white/30 hover:-translate-y-0.5'
                    }`} 
                    onClick={() => setActiveTab('template')}>
                    Send Template
                </button>
                <button 
                    className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 ${
                        activeTab === 'status' 
                            ? 'bg-white text-purple-600 shadow-lg' 
                            : 'bg-white/20 text-white border-2 border-white/30 hover:bg-white/30 hover:-translate-y-0.5'
                    }`} 
                    onClick={() => setActiveTab('status')}>
                    Check Status
                </button>
            </nav>
            <main className="max-w-2xl mx-auto">
                {activeTab === 'send' && <SendEmailForm />}
                {activeTab === 'template' && <SendTemplateForm />}
                {activeTab === 'status' && <EmailStatusChecker />}
            </main>
        </div>
    );
}
```

### Step 7: Create Send Email Form Component

Create `src/components/SendEmailForm.tsx`:

```typescript
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export function SendEmailForm() {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [html, setHtml] = useState('');
    const [status, setStatus] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');
        setTransactionId('');
        try {
            const { data, error } = await supabase.functions.invoke('send-email', { body: { to, subject, html } });
            if (error) { setStatus(`Error: ${error.message}`); return; }
            let parsedData = data;
            if (typeof data === 'string') parsedData = JSON.parse(data);
            if (parsedData.success === false) {
                setStatus(`Error: ${parsedData.error}`);
                return;
            }
            setTransactionId(parsedData.transactionId);
            setStatus('success');
            setTo(''); setSubject(''); setHtml('');
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-purple-600 mb-2">Send Custom Email</h2>
            <p className="text-gray-600 mb-8">Send a custom HTML email to any recipient</p>
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label htmlFor="to" className="block font-semibold mb-2 text-gray-800">Recipient Email</label>
                    <input 
                        id="to" 
                        type="email" 
                        value={to} 
                        onChange={(e) => setTo(e.target.value)} 
                        required 
                        placeholder="recipient@example.com" 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100" 
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="subject" className="block font-semibold mb-2 text-gray-800">Subject</label>
                    <input 
                        id="subject" 
                        type="text" 
                        value={subject} 
                        onChange={(e) => setSubject(e.target.value)} 
                        required 
                        placeholder="Enter your email subject" 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100" 
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="html" className="block font-semibold mb-2 text-gray-800">HTML Message</label>
                    <textarea 
                        id="html" 
                        value={html} 
                        onChange={(e) => setHtml(e.target.value)} 
                        required 
                        placeholder="<h1>Hello!</h1><p>Your message here...</p>" 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base min-h-[120px] resize-y font-mono transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100" 
                    />
                    <span className="block text-sm text-gray-500 mt-2">Enter your email content in HTML format</span>
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4 bg-purple-600 text-white rounded-lg text-base font-semibold transition-all hover:bg-purple-700 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                    {loading ? '⏳ Sending...' : '📤 Send Email'}
                </button>
            </form>
            {status && (
                <div className={`mt-6 p-4 rounded-lg animate-[slideIn_0.3s_ease] ${
                    status.includes('Error') 
                        ? 'bg-red-50 border-l-4 border-red-500' 
                        : 'bg-green-50 border-l-4 border-green-500'
                }`}>
                    <div className="font-bold mb-2">
                        {status.includes('Error') ? '❌ Error' : '✅ Email Sent Successfully!'}
                    </div>
                    {status.includes('Error') ? (
                        <p className="text-gray-600">{status}</p>
                    ) : (
                        <p className="text-sm mt-2">
                            Transaction ID: <span className="font-mono bg-black/5 px-2 py-1 rounded font-semibold">{transactionId}</span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
```

### Step 8: Create Send Template Form Component

Create `src/components/SendTemplateForm.tsx`:

```typescript
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export function SendTemplateForm() {
    const [to, setTo] = useState('');
    const [templateName, setTemplateName] = useState('');
    const [status, setStatus] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');
        setTransactionId('');
        try {
            const { data, error } = await supabase.functions.invoke('send-template', { body: { to, templateName } });
            if (error) { setStatus(`Error: ${error.message}`); return; }
            let parsedData = data;
            if (typeof data === 'string') parsedData = JSON.parse(data);
            if (parsedData.success === false) {
                setStatus(`Error: ${parsedData.error}`);
                return;
            }
            setTransactionId(parsedData.transactionId);
            setStatus('success');
            setTo(''); setTemplateName('');
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-purple-600 mb-2">Send Template Email</h2>
            <p className="text-gray-600 mb-8">Use a pre-designed template from your Elastic Email account</p>
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label htmlFor="to" className="block font-semibold mb-2 text-gray-800">Recipient Email</label>
                    <input 
                        id="to" 
                        type="email" 
                        value={to} 
                        onChange={(e) => setTo(e.target.value)} 
                        required 
                        placeholder="recipient@example.com" 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100" 
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="templateName" className="block font-semibold mb-2 text-gray-800">Template Name</label>
                    <input 
                        id="templateName" 
                        type="text" 
                        value={templateName} 
                        onChange={(e) => setTemplateName(e.target.value)} 
                        required 
                        placeholder="welcome-email" 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100" 
                    />
                    <span className="block text-sm text-gray-500 mt-2">Enter the exact name of your template from Elastic Email. Template will use its own predefined subject.</span>
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4 bg-purple-600 text-white rounded-lg text-base font-semibold transition-all hover:bg-purple-700 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                    {loading ? '⏳ Sending...' : '📋 Send Template'}
                </button>
            </form>
            {status && (
                <div className={`mt-6 p-4 rounded-lg animate-[slideIn_0.3s_ease] ${
                    status.includes('Error') 
                        ? 'bg-red-50 border-l-4 border-red-500' 
                        : 'bg-green-50 border-l-4 border-green-500'
                }`}>
                    <div className="font-bold mb-2">
                        {status.includes('Error') ? '❌ Error' : '✅ Template Sent Successfully!'}
                    </div>
                    {status.includes('Error') ? (
                        <p className="text-gray-600">{status}</p>
                    ) : (
                        <p className="text-sm mt-2">
                            Transaction ID: <span className="font-mono bg-black/5 px-2 py-1 rounded font-semibold">{transactionId}</span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
```

### Step 9: Create Email Status Checker Component

Create `src/components/EmailStatusChecker.tsx`:

```typescript
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export function EmailStatusChecker() {
    const [transactionId, setTransactionId] = useState('');
    const [status, setStatus] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatus(null);
        try {
            const { data, error: err } = await supabase.functions.invoke('email-status', { body: { transactionId } });
            if (err) { setError(err.message); return; }
            let parsedData = data;
            if (typeof data === 'string') parsedData = JSON.parse(data);
            if (parsedData.success === false) {
                setError(parsedData.error);
                return;
            }
            setStatus(parsedData);
        } catch (err) {
            setError((err as Error).message);
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-purple-600 mb-2">Check Email Status</h2>
            <p className="text-gray-600 mb-8">Track the delivery status of your sent emails</p>
            <form onSubmit={handleCheck}>
                <div className="mb-6">
                    <label htmlFor="transactionId" className="block font-semibold mb-2 text-gray-800">Transaction ID</label>
                    <input 
                        id="transactionId" 
                        type="text" 
                        value={transactionId} 
                        onChange={(e) => setTransactionId(e.target.value)} 
                        required 
                        placeholder="Enter transaction ID from sent email" 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100" 
                    />
                    <span className="block text-sm text-gray-500 mt-2">You can find the transaction ID in the success message after sending an email</span>
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4 bg-purple-600 text-white rounded-lg text-base font-semibold transition-all hover:bg-purple-700 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                    {loading ? '⏳ Checking...' : '🔍 Check Status'}
                </button>
            </form>
            {error && (
                <div className="mt-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500 animate-[slideIn_0.3s_ease]">
                    <div className="font-bold mb-2">❌ Error</div>
                    <p className="text-gray-600">{error}</p>
                </div>
            )}
            {status && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-purple-600 mb-4 font-bold">📊 Email Status Details</h3>
                    <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">{JSON.stringify(status, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
```

### Step 10: Update Main Entry Point

Replace the contents of `src/main.tsx` with:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Dashboard } from './components/Dashboard';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);
```

**Important:** Make sure you deleted `src/App.tsx`, `src/App.css` from Step 1. The `src/index.css` file should contain the Tailwind directives from Step 2.

### Step 11: Create Edge Functions

**IMPORTANT:** Create this folder structure at your **project root**, NOT inside the `src` folder!

```
my-email-app/             ← Your project root
├── supabase/             ← Create here (same level as src, not inside it!)
│   └── functions/
│       ├── send-email/
│       ├── send-template/
│       └── email-status/
├── src/                  ← Your React code is here
└── package.json
```

Create the folder structure:

```bash
mkdir supabase\functions\send-email
mkdir supabase\functions\send-template
mkdir supabase\functions\email-status
```

> ⚠️ **Common Mistake**: Do NOT create `src/supabase/functions`. The `supabase` folder should be at the project root, alongside `src`, not inside it!

> 💡 **File Extension**: Create `index.ts` files (not `index.tsx`). Edge Functions are TypeScript without JSX.

#### Create `supabase/functions/send-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as ElasticEmail from 'npm:@elasticemail/elasticemail-client';

const API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL')!;
const FROM_NAME = Deno.env.get('FROM_NAME')!;

const defaultClient = ElasticEmail.ApiClient.instance;
const apikey = defaultClient.authentications['apikey'];
apikey.apiKey = API_KEY;

const api = new ElasticEmail.EmailsApi();

serve(async (req) => {
    const { to, subject, html } = await req.json();

    const emailData = ElasticEmail.EmailMessageData.constructFromObject({
        Recipients: [new ElasticEmail.EmailRecipient(to)],
        Content: {
            Body: [ElasticEmail.BodyPart.constructFromObject({
                ContentType: "HTML",
                Content: html
            })],
            Subject: subject,
            From: `${FROM_NAME} <${FROM_EMAIL}>`
        }
    });

    return new Promise((resolve) => {
        api.emailsPost(emailData, (error, data, response) => {
            if (error) {
                resolve(new Response(JSON.stringify({ success: false, error: error.message }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }));
            } else {
                resolve(new Response(JSON.stringify({ success: true, transactionId: data.TransactionID }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }));
            }
        });
    });
});
```

#### Create `supabase/functions/send-template/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as ElasticEmail from 'npm:@elasticemail/elasticemail-client';

const API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL')!;
const FROM_NAME = Deno.env.get('FROM_NAME')!;

const defaultClient = ElasticEmail.ApiClient.instance;
const apikey = defaultClient.authentications['apikey'];
apikey.apiKey = API_KEY;

const api = new ElasticEmail.EmailsApi();

serve(async (req) => {
    const { to, templateName, templateData } = await req.json();

    const templateEmailData = ElasticEmail.EmailMessageData.constructFromObject({
        Recipients: [new ElasticEmail.EmailRecipient(to)],
        Content: {
            TemplateName: templateName,
            Merge: templateData,
            From: `${FROM_NAME} <${FROM_EMAIL}>`
        }
    });

    return new Promise((resolve) => {
        api.emailsPost(templateEmailData, (error, data, response) => {
            if (error) {
                const errorMsg = error.message || error.toString();
                if (errorMsg.includes('not found') || errorMsg.includes('does not exist') || errorMsg.includes('404')) {
                    resolve(new Response(JSON.stringify({ success: false, error: 'Template does not exist' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }));
                } else {
                    resolve(new Response(JSON.stringify({ success: false, error: error.message }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }));
                }
            } else {
                resolve(new Response(JSON.stringify({ success: true, transactionId: data.TransactionID }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }));
            }
        });
    });
});
```

#### Create `supabase/functions/email-status/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const API_KEY = Deno.env.get('ELASTIC_EMAIL_API_KEY')!;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
    }

    try {
        const { transactionId } = await req.json();
        if (!transactionId) {
            return new Response(JSON.stringify({ success: false, error: 'Transaction ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        const response = await fetch(`https://api.elasticemail.com/v4/emails/${transactionId}/status`, {
            method: 'GET',
            headers: { 'X-ElasticEmail-ApiKey': API_KEY }
        });

        const data = await response.json();
        if (!response.ok) {
            if (response.status === 404 || response.status === 400) {
                return new Response(JSON.stringify({ success: false, error: 'Transaction ID does not exist' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
            }
            return new Response(JSON.stringify({ success: false, error: data.Error || 'Failed to fetch status' }), { status: response.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: (err as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
});
```

### Step 12: Configure Supabase Secrets

**Navigate to your project root first:**
```bash
cd "my-email-app"
# Or use your actual project path
```

Set your Elastic Email credentials as Supabase secrets for the Edge Functions:

```bash
supabase secrets set ELASTIC_EMAIL_API_KEY="your-api-key-here" --project-ref YOUR_PROJECT_REF
supabase secrets set FROM_EMAIL="your-email@domain.com" --project-ref YOUR_PROJECT_REF
supabase secrets set FROM_NAME="Your Name" --project-ref YOUR_PROJECT_REF
```

> Replace `YOUR_PROJECT_REF` with your Supabase project reference ID and use your actual Elastic Email credentials.

**What these secrets are for:**
- These are **only for the Edge Functions** (backend)
- They allow your Supabase Edge Functions to send emails via Elastic Email API

**For frontend deployment:**
- The React app needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Locally: These come from your `.env` file
- In production (Vercel/Netlify/etc.): Set these as environment variables in your hosting platform's dashboard

### Step 13: Login to Supabase CLI

**Make sure you're in your project root:**
```bash
cd "C:\Users\PC\OneDrive\Music\New folder (4)\my-email-app"
# Or use your actual project path
```

Before deploying, you must authenticate with your Supabase account:

```bash
supabase login
```

This will:
1. Open your browser to authenticate
2. Ask you to authorize the Supabase CLI
3. Save your access token locally

> 💡 **Note:** You only need to do this once per machine. The token is saved and reused for future deployments.

**If you get a 403 error**, it means you're not logged in or your token expired. Run `supabase login` again.

### Step 14: Deploy Edge Functions

**IMPORTANT:** Make sure you're in your **project root directory** (where `package.json` is), not inside the `src` or `supabase` folders!


Deploy all three functions:

```bash
supabase functions deploy send-email --no-verify-jwt --project-ref YOUR_PROJECT_REF
supabase functions deploy send-template --no-verify-jwt --project-ref YOUR_PROJECT_REF
supabase functions deploy email-status --no-verify-jwt --project-ref YOUR_PROJECT_REF
```

> ⚠️ **Note**: `--no-verify-jwt` is used for testing. For production, remove this flag and implement proper authentication.

### Step 15: Run the Application

Start the development server:

```bash
npm run dev
```

Open your browser to `http://localhost:5173` (or the port shown in terminal).

## 🎉 You're Done!

Your email dashboard is now ready! You can:
- ✅ Send custom HTML emails
- ✅ Send template-based emails
- ✅ Check email delivery status

## � Deploying to Production

### Backend (Edge Functions) ✅ Already Done!
Your Edge Functions are already deployed to Supabase Cloud when you ran `supabase functions deploy`. The secrets you set are live in production.

### Frontend (React App) - Choose Your Platform

#### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. **Add environment variables** in Vercel dashboard:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
4. Deploy!

#### Option 2: Netlify
1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) and import your repository
3. **Add environment variables** in Netlify dashboard:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Deploy!

#### Option 3: Cloudflare Pages
1. Push your code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) and create a project
3. **Add environment variables**:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
4. Build command: `npm run build`
5. Build output directory: `dist`
6. Deploy!

> 💡 **Important**: Never commit your `.env` file! The environment variables should be set in your hosting platform's dashboard.

### What You Need for Production

**Supabase Edge Functions (Backend):**
- ✅ `ELASTIC_EMAIL_API_KEY` (set via `supabase secrets`)
- ✅ `FROM_EMAIL` (set via `supabase secrets`)
- ✅ `FROM_NAME` (set via `supabase secrets`)

**React Frontend:**
- ✅ `VITE_SUPABASE_URL` (set in hosting platform)
- ✅ `VITE_SUPABASE_ANON_KEY` (set in hosting platform)

## �📝 Project Structure

```
my-email-app/
├── supabase/
│   └── functions/
│       ├── send-email/index.ts
│       ├── send-template/index.ts
│       └── email-status/index.ts
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── SendEmailForm.tsx
│   │   ├── SendTemplateForm.tsx
│   │   └── EmailStatusChecker.tsx
│   ├── supabaseClient.ts
│   ├── index.css
│   └── main.tsx
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── package.json
```

## 🔧 Troubleshooting

### Supabase CLI Deployment Errors

#### "403: Your account does not have the necessary privileges"
**Cause:** You're not logged in to Supabase CLI.

**Fix:**
```bash
supabase login
```
This will open your browser to authenticate. Follow the prompts to authorize the CLI.

#### "failed to read file: The system cannot find the path specified"
**Cause:** You're running the deploy command from the wrong directory.

**Fix:**
1. Check your current directory:
   ```bash
   pwd  # Mac/Linux
   cd   # Windows
   ```

2. You should be in your **project root** (where `package.json` is):
   ```
   ✅ Correct: C:\Users\PC\OneDrive\Music\New folder (4)\my-email-app
   ❌ Wrong:   C:\Users\PC\OneDrive\Music\New folder (4)\my-email-app\src\supabase\functions
   ```

3. Navigate to project root:
   ```bash
   cd C:\Users\PC\OneDrive\Music\New folder (4)\my-email-app
   ```

4. Now deploy:
   ```bash
   supabase functions deploy send-email --no-verify-jwt --project-ref YOUR_PROJECT_REF
   ```

#### "WARNING: Docker is not running"
**Explanation:** This is just a warning. Docker is only needed for local development with Supabase. For cloud deployment, you can ignore this warning.

**To remove the warning** (optional):
- Install and start [Docker Desktop](https://www.docker.com/products/docker-desktop)

#### "Entrypoint path does not exist" / "failed to read file"
**Cause:** Your Edge Functions are in the wrong location (probably in `src/supabase/functions` instead of `supabase/functions`).

**Fix:**
1. Check where your functions currently are:
   ```
   ❌ Wrong: my-email-app\src\supabase\functions\send-email\index.ts
   ✅ Correct: my-email-app\supabase\functions\send-email\index.ts
   ```

2. **If they're in the wrong place**, create the correct structure:
   ```bash
   cd "path\to\my-email-app"
   mkdir supabase\functions\send-email
   mkdir supabase\functions\send-template
   mkdir supabase\functions\email-status
   ```

3. **Move the files** from `src\supabase\functions\` to `supabase\functions\`

4. **Delete** the `src\supabase` folder:
   ```bash
   rmdir /s src\supabase
   ```

5. **Deploy again** from project root:
   ```bash
   supabase functions deploy send-email --no-verify-jwt --project-ref YOUR_PROJECT_REF
   ```

> 💡 **Remember**: The `supabase` folder should be at your project root (same level as `src` and `package.json`), NOT inside the `src` folder!

### "could not determine executable to run" Error (Tailwind)
**Cause:** You're trying to run `npx tailwindcss init -p` which was removed in Tailwind CSS v4.

**Fix:**
1. Don't run the init command - it doesn't exist in v4
2. Manually create `tailwind.config.js` and `postcss.config.js` as shown in Step 2
3. Create `src/index.css` with `@import "tailwindcss";`
4. The config files are now created manually, not via CLI

### PostCSS Plugin Error (Tailwind v4)
**Error message:**
```
[postcss] It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin.
The PostCSS plugin has moved to a separate package...
```

**Cause:** In Tailwind v4, the PostCSS plugin moved to `@tailwindcss/postcss`.

**Fix:**
1. **Install the new package**:
   ```bash
   npm install -D @tailwindcss/postcss
   ```

2. **Update `postcss.config.js`**:
   ```javascript
   export default {
     plugins: {
       '@tailwindcss/postcss': {},  // ✅ Use this in v4
       autoprefixer: {},
     },
   }
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

### Node Version Warnings (EBADENGINE)
**Symptoms:** You see warnings about unsupported engine for Vite or plugins.

**Example:**
```
npm warn EBADENGINE Unsupported engine {
  package: 'vite@7.3.0',
  required: { node: '^20.19.0 || >=22.12.0' },
  current: { node: 'v22.11.0', npm: '10.9.0' }
}
```

**Fix:**
1. Check your Node version: `node -v`
2. If you have Node 22.11 or lower, update to Node 22.12+ or 20.19+
3. Download from [nodejs.org](https://nodejs.org)
4. After updating, clean reinstall:
   ```bash
   rm -rf node_modules package-lock.json  # Mac/Linux
   del /s /q node_modules & del package-lock.json  # Windows
   npm install
   ```

### "supabaseUrl is required" Error
**Cause:** Environment variables from `.env` file are not being loaded.

**Symptoms:**
```
Error: supabaseUrl is required.
    at supabaseClient.tsx:6:25
```

**Fix:**
1. **Verify `.env` file exists** in your project root (same level as `package.json`):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Check variable names** start with `VITE_`:
   - ✅ Correct: `VITE_SUPABASE_URL`
   - ❌ Wrong: `SUPABASE_URL` (won't work in Vite)

3. **No quotes** around values in `.env`:
   - ✅ Correct: `VITE_SUPABASE_URL=https://abc.supabase.co`
   - ❌ Wrong: `VITE_SUPABASE_URL="https://abc.supabase.co"`

4. **Restart dev server** (required for env changes):
   ```bash
   # Stop the server (Ctrl+C), then:
   npm run dev
   ```

5. **Get correct values** from Supabase Dashboard:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project → **Project Settings** → **API**
   - Copy **Project URL** and **anon public** key

6. **Check .gitignore** includes `.env` so you don't accidentally delete it:
   ```
   .env
   ```

## � Working Demo

This section showcases the working application with screenshots demonstrating each feature.

### Screenshot 1: Send Email Form
<!-- Add screenshot here -->
![Send Email Form](./screenshots/send-email-form.png)

**What to capture:**
- The "Send Custom Email" tab selected and active
- The form with fields filled in: recipient email, subject line, and HTML message
- Show the purple gradient background and modern UI styling

---

### Screenshot 2: Successful Email Sent
<!-- Add screenshot here -->
![Email Sent Success](./screenshots/email-sent-success.png)

**What to capture:**
- The green success message showing "Email Sent Successfully!"
- The Transaction ID displayed in the response
- This confirms the email was successfully sent via Elastic Email

---

### Screenshot 3: Send Template Email
<!-- Add screenshot here -->
![Send Template Email](./screenshots/send-template-email.png)

**What to capture:**
- The "Send Template" tab selected and active
- The form showing recipient email field and template name field filled in
- Example: Template name like "welcome-email" or your actual Elastic Email template name

---

### Screenshot 4: Email Status Check
<!-- Add screenshot here -->
![Email Status Check](./screenshots/email-status-check.png)

**What to capture:**
- The "Check Status" tab selected
- A Transaction ID entered in the input field
- The JSON response showing delivery status details (e.g., "Sent", "Delivered", recipient info)

---

> 💡 **Tip:** Replace the placeholder image paths above with your actual screenshot paths after capturing them from your running application.

## �🔐 Security Notes

- **API Keys**: Never commit API keys to git. Use Supabase secrets.
- **JWT Verification**: For production, remove `--no-verify-jwt` and implement proper authentication.
- **CORS**: Current setup allows all origins (`*`). For production, restrict to your domain.

## 📚 Additional Resources

- [Elastic Email API Documentation](https://elasticemail.com/developers/api-documentation)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [React Documentation](https://react.dev)

## 🆘 Need Help?

If you encounter any issues:
1. Check Supabase Edge Function logs in your dashboard
2. Verify all secrets are set correctly
3. Ensure your Elastic Email API key has proper permissions
4. Check browser console for error messages

