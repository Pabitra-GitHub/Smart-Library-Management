# 📚 AI Smart Library Management System

> **B.Tech CSE — 7th Semester Minor Project**  
> A futuristic, production-ready digital library management system built with sleek glassmorphism, floating pill navigation, automated 14-day loan circulation, late fee calculations, and an **AI Smart Book Search** that understands natural language queries.

---

## ⚡ How to Run in 3 Easy Steps (No Coding Knowledge Needed!)

Even if you have never coded before, you can run this project in under 2 minutes:

### Step 1: Install Node.js (Only need to do this once)
1. Go to the official website: **[https://nodejs.org](https://nodejs.org)**
2. Download and install the **LTS (Recommended for Most Users)** version (simply click Next, Next, Finish).

### Step 2: Start the Application
- **On Windows**:
  - Simply **double-click** the file named **`run.bat`** in this folder!
  - It automatically checks dependencies and opens the system in your browser.
- **On Mac or Linux**:
  - Open terminal, navigate to this folder, and run:
    ```bash
    bash run.sh
    ```
- **Alternative (via command line)**:
  ```bash
  npm install
  npm start
  ```

### Step 3: Open in Your Web Browser
If your browser does not open automatically, visit:  
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔐 First Launch & Account Creation (Password-Protected)

The system starts in a **clean, production-ready state with zero example records** — ready for real collegiate use!

When you open the app, you are greeted with the **Create Account** screen:

### 1. 👔 Creating a Librarian (Admin) Account
To prevent unauthorized students from registering themselves as administrators, librarian registration is protected by a **Master Passcode**:
- **Role**: Select `Librarian (Admin)`
- **Full Name**: Enter your name (e.g., `Dr. Alok Verma`)
- **Email**: Enter your staff email (e.g., `librarian@college.edu`)
- **Create Password**: Set your private account password
- **Librarian Master Passcode**: Enter `admin123` *(Master security key)*
- Click **Create Account & Enter Library**

### 2. 🎓 Creating a Student Account
- **Role**: Select `Student`
- **Full Name**: Enter student name (e.g., `Rahul Sharma`)
- **Email**: Enter student email (e.g., `rahul.cse@college.edu`)
- **Department & Semester**: Select branch (`CSE`, `IT`, `ECE`, `MECH`, `CIVIL`) and semester
- **Create Password**: Set student password
- Click **Create Account & Enter Library**
- *Note*: Students are automatically registered into the official Student Registry and assigned a unique Student ID (`STU-YYYY-NNN`).

---

## ✨ Futuristic UI & Design Highlights

1. **Floating Pill Glass Navigation Bar**:
   - Suspended top-center with ultra-sleek frosted blur (`backdrop-filter: blur(24px)`).
   - Dynamically renders role-specific links (Dashboard, Books, Students, Issues, AI Search).
   - Features quick theme switcher (🌙 Dark Obsidian / ☀️ Frosted Light) and user badge with instant sign-out.

2. **Obsidian Glassmorphism Theme**:
   - Deep cybernetic dark mode with neon indigo and cyan luminous accents.
   - Smooth hover micro-interactions, responsive card grids, and accessible native modals.

---

## 🧭 System Features & Workflow

### 1. 📊 Librarian Dashboard & Live Overview
- **Real-Time KPIs**: Total Book Titles, Copies on Shelf, Issued Copies, Overdue Books, Registered Students, and Total Fines (Collected & Pending).
- **Automated Overdue Banner**: Highlights books exceeding the 14-day borrowing duration with 1-click **"Process Return"**.
- **Category Distribution**: Visual progress breakdown of books by technical subject.
- **⚙ Library Settings**: Configurable loan duration (default 14 days), fine rate (default ₹5/day), and max quota (default 4 books/student).

### 2. 📚 Books Catalog & Management
- **Add / Edit / Delete**: Add books with title, author, category, total copies, shelf location, description, and tags.
- **Safety Deletion Guard**: Prevents deleting any book if copies are currently issued to students.
- **Dual View Modes**: Switch between Grid Card layout and Table View.
- **Instant Search & Filter**: Search by title, author, ISBN, or shelf number, with category chip filters.

### 3. 👥 Student Registry & Profiles
- View enrolled students across engineering departments (`CSE`, `IT`, `ECE`, etc.).
- Real-time active loan counter tracking each student's 4-book borrowing limit.
- Individual profile modal showing full borrowing history and accumulated dues.

### 4. 🔄 Automated Issue & Return Circulation
- **Issue a Book**:
  - Validates student active status and verifies available copies on shelf.
  - Automatically sets **Due Date to 14 days from today**.
  - Decrements shelf stock atomically.
- **Return a Book & Fine Calculation**:
  - Calculates late days automatically:  
    $$\text{Overdue Days} = \max(0, \text{Return Date} - \text{Due Date})$$  
    $$\text{Fine Amount} = \text{Overdue Days} \times ₹5/\text{day}$$
  - Collects fee, updates student record, restores available shelf count, and generates a printable transaction receipt.

### 5. ✨ AI Smart Book Search (Natural Language Understanding)
Ask for books in natural conversational English, just like asking a human librarian:
- *"I want a beginner book for learning Python"*  
  ➔ Extracts: `[Python, Programming, Beginner]`, detects `Beginner` level, and ranks Python beginner books at the top.
- *"I need an easy book to learn Java and OOP"*  
  ➔ Recommends introductory Java textbooks.
- *"Advanced algorithms and data structures for semester exams"*  
  ➔ Recommends DSA and algorithms textbooks.
- Features live pipeline analysis showing extracted keywords, detected intent, and percentage relevance score.

---

## 📤 How to Push to GitHub

The repository is pre-configured with a clean **`.gitignore`** to ensure heavy system folders like `node_modules` and local temporary files are never pushed.

### Step-by-Step GitHub Upload:

1. **Open Terminal / Command Prompt** in this folder:
   ```bash
   cd "d:/My Coding/Smart Library Management"
   ```

2. **Stage all clean project files**:
   ```bash
   git add .
   ```

3. **Commit the code**:
   ```bash
   git commit -m "feat: AI Smart Library Management System with glassmorphism UI and NLP search"
   ```

4. **Create a new repository on GitHub**:
   - Go to [https://github.com/new](https://github.com/new)
   - Name it `ai-smart-library` (or your preferred name)
   - Leave "Initialize with README" **unchecked** (we already have this README).
   - Click **Create repository**.

5. **Link and Push**:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/ai-smart-library.git
   git branch -M main
   git push -u origin main
   ```

### 📋 Files Included in GitHub Push:
- ✅ Backend server & REST API (`server.js`, `src/`)
- ✅ Single-page frontend app (`public/index.html`, `public/js/`, `public/css/`)
- ✅ Initial clean database schema (`data/library_db.json`)
- ✅ 1-Click launcher scripts (`run.bat`, `run.sh`, `package.json`)
- ❌ `node_modules/` is automatically excluded by `.gitignore`

---

## 🎓 Minor Project Defense / Viva Q&A

**Q1: What architecture is used?**  
*Answer*: MVC (Model-View-Controller) architecture using Node.js/Express REST APIs, atomic persistent JSON storage (`src/data/db.js`), and modular Vanilla JavaScript/CSS components without third-party UI framework bloat.

**Q2: How does the AI Smart Search work?**  
*Answer*: It executes a multi-step NLP pipeline:
1. Tokenization and punctuation stripping
2. Removal of common English stopwords ("want", "find", "for", "please")
3. Intent clustering (identifying difficulty level: Beginner/Intermediate/Advanced)
4. Domain matching (Python, Java, AI, DBMS, OS, Networks)
5. Weighted multi-field ranking scoring matches across title, category, tags, and descriptions.

**Q3: How is student quota and overdue fine enforced?**  
*Answer*: The system enforces a strict 4-book limit per student. Every issue is stamped with a 14-day due date. When returned, the difference in calendar days calculates fines at ₹5 per late day.

---

**Developed for B.Tech CSE 7th Semester Minor Project**
