# FinAscend - Financial Decision Assistant

This is the FinAscend frontend and core layer repository built with Next.js and PostgreSQL via Supabase.

## 👥 Team Setup Guide (For the 4-Person Dev Team)

Since GitHub does not allow (and you should never) commit passwords or secrets, follow this exact workflow to get the project running on your local machine:

### Step 1: Clone the Repository
```bash
git clone <your-github-repo-url>
cd fin-ascent-app
npm install
```

### Step 2: Set up Environment Variables
The repository comes with a `.env.example` file that shows **which** keys you need, but not the actual secret values.
1. Create a **new file** in the root directory and name it exactly `.env.local`
   *(Next.js automatically prevents `.env.local` from being uploaded to GitHub via `.gitignore`).*
2. Copy the contents of `.env.example` into your new `.env.local` file.
3. Replace the placeholder values with the real Supabase project URL and Anon keys. 
   *(Ask the Project Owner to share these keys securely in your WhatsApp or Discord group. Do not post them in GitHub issues!)*

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 🔐 Database & Data Seeding
Before working on the frontend dashboards, ensure your database has the minimum required mock data running.

1. Make sure Python is installed.
2. Install the dependencies for the seeder:
```bash
pip install -q supabase python-dotenv faker
```
3. Run the data seeder:
```bash
python scripts/data.py
```
*(This script automatically reads the `.env.local` file you just created to connect safely!)*
