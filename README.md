# 🚀 Trackr - Premium Accountability & Learning Tracker Platform

<div align="center">
  <img src="C:/Users/samir/.gemini/antigravity/scratch/trackr/public/logo.png" alt="Trackr Logo" width="120" height="120" style="object-contain" />
  
  <h3>Grow 1% better every day. Share daily learning progress, build consistency, and level up with peer accountability.</h3>

  [![Next.js Framework](https://img.shields.io/badge/Framework-Next.js%2016-blueviolet?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React Version](https://img.shields.io/badge/Library-React%2019-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![Database & Storage](https://img.shields.io/badge/Backend-Supabase-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Deployments](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
</div>

---

## 🌟 Overview

**Trackr** is a state-of-the-art web application engineered for serious learners and students. It eliminates standard social media distractions, providing a focused, clean space to share daily milestones, maintain study streaks, tackle collaborative challenges, and showcase a professional learner profile.

🔗 **Workable Live Deployment:** [trackr-ten-eta.vercel.app](https://trackr-ten-eta.vercel.app/)

---

## ✨ Premium Features

### 👤 1. Reverted Supabase Authentication & Branded UI
*   **Safe Supabase Auth:** Rebuilt completely using Supabase client/server sync contexts, avoiding slow OAuth bindings and fully preserving standard Google OAuth and direct password authentication.
*   **Responsive Top-Right Profile Link:** Fully clickable profile icon in the global header which navigates straight to `/profile`.
*   **Spacious & Scrollable Desktop Sidebar:** A gorgeously spaced vertical navigation bar that includes automatic vertical overflow scrolling to guarantee the bottom **"View Profile"** action card remains 100% visible on all monitor sizes.
*   **Natural Mobile Greeting Wrapping:** Fully responsive wave emoji `👋` and greeting text wrapper layout built explicitly for smaller device profiles.

### 📄 2. Interactive Resume Upload & Profile Bio Badges
*   **Drag-and-Drop Uploader:** Added an interactive, sleek file uploader directly in the "Edit Profile" dialog supporting PDF and Word documents up to **5MB**.
*   **Supabase Public Storage integration:** Securely uploads files to a public `resumes` storage bucket using unique collision-proof hashes (`${userId}-resume-${timestamp}.ext`) to prevent overwriting.
*   **Dynamic Violet Bio Badges:** Renders a gorgeous, custom clickable file badge displaying your actual resume name directly beneath your bio. Clicking the badge opens your PDF/doc resume in a **new tab**.
*   **Multi-User Sandbox Safety:** Users can manage and upload their own resumes, while visitors can view/download public profiles but cannot edit them.

### 📨 3. Mobile "Contact" Support Dialog
*   Found inside the mobile hamburger navigation menu, it immediately opens a dedicated support/contact modal routing email communications securely to **sa8103339@gmail.com**.

---

## 💻 Tech Stack

*   **Frontend Framework:** Next.js 16.2.4 (React 19, utilizing Turbopack compilation)
*   **Core Architecture:** App Router (pages located in `/src/app`)
*   **Database & API:** Supabase SSR (Session synchronization and secure JWT cookie contexts)
*   **CSS Design Tokens:** Tailwind CSS v4 (Harmonious violet color tokens and custom animations)
*   **Storage Buckets:** Supabase Storage (publicly readable `resumes` bucket with strict RLS policies)

---

## 🛠️ Local Development & Setup

### 1. Prerequisites
Make sure you have **Node.js 20+** and **npm** installed on your system.

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/samiralam321/NewTrackr.git
cd NewTrackr/trackr-project
npm install
```

### 3. Configure your Environment Variables
Create a `.env.local` file in the root of the `trackr-project` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bsqqdfkdycziocmgiani.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Database Setup (Supabase SQL Editor)
Execute the SQL code located in `supabase_schema.sql` inside your Supabase SQL Editor. This adds the `resume_url` and `resume_name` columns to your profiles, configures your custom storage bucket, and implements Row Level Security (RLS) policies:

```sql
-- Create resumes bucket and set security policies
insert into storage.buckets (id, name, public) 
values ('resumes', 'resumes', true);

create policy "Anyone can view resumes" 
on storage.objects for select using (bucket_id = 'resumes');

create policy "Users can upload their own resumes" 
on storage.objects for insert with check (
  bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 5. Run the Local Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view your live local application.

---

## ⚡ Production Deployment (Vercel)

This project is fully optimized and configured for seamless deployment on **Vercel** with automatic Git integration:

1.  **Framework Preset:** Next.js
2.  **Root Directory:** `trackr-project`
3.  **Required Production Variables:**
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📄 License
This project is licensed under the MIT License. Created with 💖 for serious learners worldwide.
