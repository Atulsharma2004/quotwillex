# Quotwellix

A full-stack social quotes platform. Users can register, log in, post quotes, like/dislike, comment, and view their profile with follower counts.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite 6, Redux Toolkit, React Router 7, Axios, Tailwind CSS 3 |
| Backend | Node.js (ESM), Express 4, JWT, bcryptjs |
| Database | MongoDB + Mongoose 8 |

## Project Structure

```
Quotes/
├── backend/          # Express API (port 5000)
│   ├── config/       # MongoDB connection
│   ├── controllers/  # User & quote business logic
│   ├── middleware/   # JWT auth
│   ├── models/       # User & Quote schemas
│   ├── routes/       # API routes
│   └── server.js
└── frontend/         # React SPA (port 5173)
    └── src/
        ├── api/          # Axios client
        ├── components/   # Header, Footer, PrivateRoute, QuoteCard
        ├── pages/        # Home, Login, Signup, Quotes, Profile
        └── redux/        # Auth & quotes slices
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB)
- npm (comes with Node.js)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
PORT=5000
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/quoteDB?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/users/google/callback
```

```bash
npm install
npm run dev
```

API runs at `http://localhost:5000`. Health check: `GET /api/health`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

Google Client ID / Secret live only in `backend/.env` for the redirect flow.

### Google Sign-In setup (OAuth redirect + Client Secret)

This app uses the **authorization-code redirect flow** (same idea as NextAuth on [quote-app-at](https://github.com/Atulsharma2004/quote-app-at)):

1. Browser → `GET /api/users/google`
2. Google consent screen
3. Google → `GET /api/users/google/callback?code=...`
4. Backend exchanges `code` with **Client Secret**, issues JWT
5. Redirect → `http://localhost:5173/auth/callback?token=...`

#### Google Cloud Console

1. Open [Credentials](https://console.cloud.google.com/apis/credentials) → your **Web application** client
2. **Authorized redirect URIs** — must be exactly:

```text
http://localhost:5000/api/users/google/callback
```

(You can keep old NextAuth URIs too if needed.)

3. **Authorized JavaScript origins** (optional for this flow, still fine to keep):

```text
http://localhost:5173
http://localhost:5000
```

4. Copy **Client ID** and the **new Client Secret** into `backend/.env`:

```env
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/users/google/callback
```

5. Restart the backend (`npm run dev`) after saving `.env`.

Frontend only needs:

```env
VITE_API_URL=http://localhost:5000/api
```

## How to Run (Quick Start)

Open two terminals:

```bash
# Terminal 1 — API
cd backend
npm run dev

# Terminal 2 — UI
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

| Script | Location | Purpose |
|--------|----------|---------|
| `npm run dev` | backend | Start API with nodemon |
| `npm start` | backend | Start API (production) |
| `npm run dev` | frontend | Vite dev server |
| `npm run build` | frontend | Production build |
| `npm run preview` | frontend | Preview production build |

---

## Website Flow

```
Home → Sign Up → Login → Profile / Quotes feed
                              ↓
                    Create · Like · Dislike · Comment
                              ↓
                         Edit / Delete (own posts or admin)
```

### 1. Home (`/`)

- Guests see an interactive landing: rotating sample quotes, Get started / Login CTAs, and Google Sign-In.
- Logged-in users see a welcome and a link to the Quotes feed.

### 2. Sign Up (`/signup`)

1. Optionally continue with **Google** (creates account + logs in), or
2. Click the avatar to upload a profile picture (stored as base64).
3. Enter name, email, password, and optional bio.
4. Submit → account is created → redirected to **Login**.
5. New email accounts are always created with role `user`.

### 3. Login (`/login`)

1. Continue with **Google**, or enter email and password.
2. On success, JWT + user are stored in Redux and `localStorage`.
3. Redirected to **Profile**.

### 4. Quotes feed (`/quotes`) — protected

- View all quotes (newest first).
- Add a new quote.
- Like / dislike any quote.
- Comment; load more comments; edit/delete your own comments.
- Edit or delete your own quotes (admins can edit/delete any).

### 5. Profile (`/profile`) — protected

- Shows avatar, name, email, bio.
- Shows Posts / Followers / Following counts (profile refreshed from API).
- Lists only quotes authored by the current user (same like/comment/edit actions).

### 6. Logout

- Clears auth state and `localStorage`, returns to Home.

---

## API Overview

Base URL: `http://localhost:5000/api`

### Users — `/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Returns `{ token, user }` |
| GET | `/google` | No | Start Google OAuth redirect |
| GET | `/google/callback` | No | Google OAuth callback → redirect to frontend with JWT |
| GET | `/profile` | Yes | Current user + posts + counts |
| PUT | `/profile` | Yes | Update name / picture / bio |
| PUT | `/follow/:id` | Yes | Follow a user |
| PUT | `/unfollow/:id` | Yes | Unfollow a user |

### Quotes — `/quotes` (all require JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all quotes |
| POST | `/` | Create quote |
| PUT | `/:id` | Update quote (author or admin) |
| DELETE | `/:id` | Delete quote (author or admin) |
| PUT | `/:id/like` | Like (removes dislike) |
| PUT | `/:id/dislike` | Dislike (removes like) |
| PUT | `/:id/comment` | Add comment |
| PUT | `/:id/comment/:commentId` | Edit comment |
| DELETE | `/:id/comment/:commentId` | Delete comment |

Send the token as:

```http
Authorization: Bearer <token>
```

---

## Auth Notes

- JWT expires in **1 day**.
- Protected frontend routes (`/quotes`, `/profile`) redirect to `/login` when unauthenticated.
- The Axios client attaches the token from `localStorage` on every request.

## Production Build

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` folder with any static host, and point `VITE_API_URL` at your deployed API before building.
