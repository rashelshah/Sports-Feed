# 🏆 SportsFeed - Full-Stack Social Platform

A modern, full-stack social media platform for athletes, coaches, and sports enthusiasts built with React, Express, TypeScript, and Supabase.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)

---

## 📁 Project Structure

This is a **monorepo** containing both frontend and backend:

```
Sports_final123/
├── 📱 Frontend (Root Level)
│   ├── src/                    # React + TypeScript source
│   ├── index.html              # Entry point
│   ├── package.json            # Frontend dependencies
│   └── vite.config.ts          # Vite configuration
│
├── 🔧 Backend (backend/)
│   ├── src/                    # Express + TypeScript API
│   ├── package.json            # Backend dependencies
│   └── README.md               # Backend documentation
│
└── 🗄️ Database (supabase/)
    └── migrations/             # Database schema migrations
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 8+
- **Supabase** account ([Sign up](https://supabase.com))
- **Cloudinary** account for media storage ([Sign up](https://cloudinary.com))

### 1. Clone & Install

```bash
cd Sports_final123

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Environment Variables

#### Frontend Configuration

Create `.env` in the root directory:
```bash
cp .env.example .env
```

Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### Backend Configuration

Create `backend/.env`:
```bash
cd backend
cp .env.example .env
```

Fill in the required values:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_secure_random_string

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

> **Generate JWT Secret:** Run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 3. Set Up Database

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Navigate to SQL Editor
4. Run the migration: `supabase/migrations/001_create_profiles.sql`
5. (Optional) Run the full schema: `backend/schema_only.sql`

### 4. Run Development Servers

#### Start Frontend (Terminal 1)
```bash
npm run dev
```
**Runs on:** http://127.0.0.1:5173

#### Start Backend (Terminal 2)
```bash
cd backend
npm run dev
```
**Runs on:** http://localhost:3000

---

## 📦 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Zustand** - State management
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time features
- **React Hook Form + Yup** - Form handling

### Backend
- **Express** - Web framework
- **TypeScript** - Type safety
- **Socket.IO** - WebSocket server
- **Supabase** - Database and auth
- **Cloudinary** - Media storage
- **Winston** - Logging
- **Helmet** - Security headers
- **Joi** - Request validation
- **Jest** - Testing

### Database
- **Supabase** (PostgreSQL)
- **Row Level Security (RLS)**
- **Real-time subscriptions**

---

## 📚 Documentation

- **Backend API:** See [backend/README.md](./backend/README.md) for comprehensive API documentation
- **Supabase Setup:** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **AI Features:** See [AI_FEATURES.md](./AI_FEATURES.md)

---

## 🧪 Testing

### Frontend
```bash
npm test
```
*(Note: Testing framework needs to be set up)*

### Backend
```bash
cd backend
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## 🏗️ Building for Production

### Frontend
```bash
npm run build
npm run preview  # Preview production build
```

### Backend
```bash
cd backend
npm run build    # Compiles TypeScript to dist/
npm start        # Runs production server
```

---

## 🔧 Available Scripts

### Frontend (Root)
- `npm run dev` - Start Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

---

## 🌐 Environment Variables

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes |

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ Yes |
| `JWT_SECRET` | Secret for JWT signing | ✅ Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ Yes |
| `PORT` | Backend server port | Optional (default: 3000) |
| `CORS_ORIGIN` | Allowed CORS origins | Optional |

---

## 🚢 Deployment

### Frontend (Vercel, Netlify, etc.)
1. Build the frontend: `npm run build`
2. Deploy the `dist/` folder
3. Set environment variables in hosting platform

### Backend (Render, Railway, Heroku, etc.)
1. Push code to Git repository
2. Configure environment variables
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`

**Deployment configs included:**
- `backend/Procfile` - Heroku/Render
- `backend/render.yaml` - Render.com

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Vite](https://vitejs.dev/)
- Backend with [Express](https://expressjs.com/)
- Real-time by [Socket.IO](https://socket.io/)
- Database by [Supabase](https://supabase.com/)
- Media by [Cloudinary](https://cloudinary.com/)

---

**Happy coding! 🚀**