# NetStream - Movies & TV

## Overview
NetStream is a Netflix-inspired movie and TV show browsing application. It uses the OMDb API to fetch and display movie/show data, with user authentication (register/login) backed by a PostgreSQL database.

## Architecture
- **Frontend**: Static HTML/CSS/JS served by Express
  - `index.html` - Main movie browsing page
  - `login.html` - User login page
  - `register.html` - User registration page
  - `script.js` - Frontend logic (OMDb API calls, search, watchlist)
  - `style.css` - Styling
- **Backend**: Node.js + Express (port 5000)
  - `backend/server.js` - Express server with auth endpoints and static file serving
  - `backend/db.js` - PostgreSQL connection pool
- **Database**: PostgreSQL (Replit built-in)
  - `users` table for authentication

## API Endpoints
- `POST /register` - User registration
- `POST /login` - User login
- `GET /health` - Health check

## Key Dependencies
- express, cors, bcrypt, pg

## External APIs
- OMDb API (key in script.js)
