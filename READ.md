# Quiz Site

> A full-stack quiz web application with a Node.js/Express backend, MySQL/SQLite database, and a Docker-ready deployment setup.

🔗 **Live:** [quizsite-chi.vercel.app](https://quizsite-chi.vercel.app)

---

## Overview

A server-driven quiz platform featuring user authentication, assessment management, and a clean HTML/JS frontend. The backend exposes a REST API consumed by the frontend, with support for both MySQL (production) and SQLite (local dev). The project is fully containerized with Docker and includes GCC/G++ for server-side code evaluation capabilities.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18 |
| Framework | Express 5 |
| Database | MySQL2 / SQLite3 |
| Frontend | HTML5 + Vanilla JS |
| Container | Docker (node:18-bullseye) |
| Deploy | Vercel |

---

## Features

- REST API with Express 5
- Dual database support — MySQL for production, SQLite for local development
- User authentication and session management
- Assessment seeding via `seed_assessments.js`
- Server-side C/C++ code evaluation (GCC installed in Docker image)
- CORS-enabled API for frontend/backend separation
- Vercel deployment config (`vercel.json`)

---

## Project Structure

```
quiz_site/
├── server.js                  # Express app entry point
├── public/                    # Static frontend (HTML, CSS, JS)
├── PF_Quiz_20Questions.html   # Standalone quiz template
├── seed_assessments.js        # Database seeding script
├── add_test_user.js           # Utility to create test users
├── database_backup.sql        # MySQL DB backup
├── database_backup_utf8.sql   # UTF-8 encoded DB backup
├── Dockerfile                 # Docker image config
├── vercel.json                # Vercel deployment config
└── package.json               # Dependencies & scripts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL (for production) or SQLite (zero-config local)

### Local Setup

```bash
git clone https://github.com/illusionoftalha/quiz_site.git
cd quiz_site
npm install
node server.js
```

Server runs on `http://localhost:3000`.

### Seed the Database

```bash
node seed_assessments.js
node add_test_user.js
```

### Run with Docker

```bash
docker build -t quiz_site .
docker run -p 3000:3000 quiz_site
```

---

## Environment Variables

Create a `.env` file in the root (not committed):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=quiz_db
PORT=3000
```

---

## Dependencies

```json
"express":  "^5.2.1"
"mysql2":   "^3.22.3"
"sqlite3":  "^6.0.1"
"cors":     "^2.8.5"
```

---

## License

ISC
