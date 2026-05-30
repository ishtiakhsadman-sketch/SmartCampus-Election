# 🗳️ SmartCampus Election - Full-Stack Setup Guide

Follow this quick start guide to get the SmartCampus Election full-stack application running on your local machine.

---

## 💻 Backend Setup

1. **Navigate & Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   > [!NOTE]
   > The default environment configuration has the API server running on port **`5001`** and expects a running MongoDB instance at `mongodb://127.0.0.1:27017/smartcampus_election`.

3. **Database Seeding**:
   Make sure MongoDB is running locally, then run the database seeder to pre-populate default roles, notices, candidates, and election settings:
   ```bash
   npm run seed
   ```

4. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   The backend API will now be listening on [http://localhost:5001](http://localhost:5001).

---

## 🎨 Frontend Setup

1. Open the `frontend` folder in VS Code.
2. Run the site using **Live Server** (VS Code extension).
3. The default Live Server port is set to `5501` in `.vscode/settings.json` (running at `http://127.0.0.1:5501` or `http://localhost:5501`).

---

## 🔑 Sample Login Credentials

Use these seeded credentials to log in and test different user roles:

| Role | Email / ID | Password |
|---|---|---|
| **Student (Voter)** | `student@smartcampus.edu` or `SC-2026-1001` | `Student@12345` |
| **Candidate** | `candidate@smartcampus.edu` or `SC-2026-2001` | `Candidate@12345` |
| **Administrator** | `admin@smartcampus.edu` or `ADMIN-001` | `Admin@12345` |

---

## 🌐 API Configuration

The frontend dynamically communicates with the backend via the following configuration in [api.js](file:///e:/WEB%20PROJECTS/SmartCampus-Election-FullStack-Final/SmartCampus-Election-FullStack/frontend/assets/js/api.js):

```js
const API_BASE_URL = window.SMARTCAMPUS_API_BASE_URL || "http://localhost:5001/api";
```

