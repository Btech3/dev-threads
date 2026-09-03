# Dev Thread - Quick Reference Guide

**A fast-track guide to understand and run the Dev Thread project**

---

## ⚡ Quick Start (Frontend)

### 1. Install & Run (2 minutes)
```bash
cd "d:\Social media app"
npm install
npm run dev
```
Open: `http://localhost:5173`

### 2. Environment Setup
Create `.env.local`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
```

### 3. Login
- Click "Sign In" button
- Use Clerk authentication
- See full app interface

---

## 📱 App Navigation

```
/                 → Login or Feed (if authenticated)
/                 → Feed (home timeline)
/message          → All conversations
/message/:userId  → Chat with specific user
/connection       → Followers/following/pending
/discover         → Search and discover users
/create-post      → Create new post
/profile          → Your profile
/profile/:id      → Other user's profile
```

---

## 📦 Project Files Overview

| File | Purpose |
|------|---------|
| `README.md` | Project overview & setup guide |
| `BACKEND_SETUP.md` | Complete backend implementation |
| `PROJECT_ANALYSIS.md` | Detailed status report |
| `src/App.jsx` | Main app with routing |
| `src/pages/*` | All app pages (9 total) |
| `src/components/*` | Reusable UI components |
| `src/assets/assets.js` | Dummy data & imports |
| `vite.config.js` | Build configuration |
| `package.json` | Dependencies & scripts |

---

## 🛠️ Available Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix linting issues
```

---

## 🎨 Current Features

✅ **User Authentication** - Clerk OAuth  
✅ **Feed/Posts** - View and create posts  
✅ **Messaging** - Send and receive messages  
✅ **Connections** - Follow/unfollow users  
✅ **Discover** - Search and explore users  
✅ **Profiles** - User profiles with bio  
✅ **Stories** - Temporary story sharing  
✅ **Responsive Design** - Mobile, tablet, desktop  

---

## ⚠️ What's NOT Working (Backend Needed)

❌ **Data Persistence** - No database yet  
❌ **Real Messaging** - Uses dummy data  
❌ **Real Posts** - Sample posts only  
❌ **User Sync** - No backend API  
❌ **File Uploads** - No storage  

**All currently displayed data is from dummy data in `src/assets/assets.js`**

---

## 🚀 Backend Setup (Quick Version)

### Option A: Simple (Local Only)
```bash
# Create backend folder
mkdir dev-thread-backend
cd dev-thread-backend

# Setup
npm init -y
npm install express cors dotenv mongoose

# Create server.js (see BACKEND_SETUP.md)

# Run
npm start
```

### Option B: Full Setup (Recommended)
Follow **BACKEND_SETUP.md** for:
- MongoDB Atlas setup
- Clerk webhook configuration
- All API endpoints
- Database models
- Complete project structure

---

## 📝 File Structure

```
src/
├── pages/
│   ├── login.jsx          (Clerk auth)
│   ├── feed.jsx           (Posts & stories)
│   ├── profile.jsx        (User profile)
│   ├── message.jsx        (Conversations)
│   ├── chatbox.jsx        (Chat UI)
│   ├── connection.jsx     (Followers)
│   ├── dicover.jsx        (Discover users)
│   ├── createpost.jsx     (Post composer)
│   └── Layout.jsx         (Main wrapper)
├── components/
│   ├── sidebar.jsx        (Nav sidebar)
│   ├── StoriesBar.jsx     (Stories carousel)
│   ├── Menuitems.jsx      (Menu items)
│   └── loading.jsx        (Loading state)
└── assets/
    └── assets.js          (Dummy data)
```

---

## 🔑 Key Technologies

| Tech | Purpose | Version |
|------|---------|---------|
| React | UI Framework | 19.2.6 |
| Vite | Build Tool | 8.0.12 |
| React Router | Routing | 7.15.0 |
| Tailwind | Styling | 4.3.0 |
| Clerk | Authentication | 6.6.6 |
| Lucide | Icons | 1.14.0 |

---

## 🎯 Development Workflow

### Making Changes
```bash
# Start dev server
npm run dev

# Edit files in src/
# Changes auto-reload (HMR)

# Check code quality
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Building for Production
```bash
npm run build          # Creates optimized dist/
npm run preview        # Test production build
```

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Clerk not working | Check `.env.local` has `VITE_CLERK_PUBLISHABLE_KEY` |
| Styles not loading | Restart dev server |
| Pages not rendering | Check browser console for errors |
| Components not found | Verify import paths match file names |
| Port 5173 in use | Change port: `npm run dev -- --port 3000` |

---

## 📚 Dummy Data

Located in `src/assets/assets.js`:
- `dummyUserData` - Current user
- `dummyUserData2` & `3` - Other users
- `dummyStoriesData` - Stories array
- `dummyPostsData` - Posts array
- `dummyConnectionsData` - Users list
- `menuItemsData` - Navigation items

Replace with API calls once backend is ready.

---

## 🔗 Important Files Reference

| File | Line | Purpose |
|------|------|---------|
| [App.jsx](App.jsx#L1) | 1 | Main routing setup |
| [Layout.jsx](src/pages/Layout.jsx#L1) | 1 | App layout wrapper |
| [feed.jsx](src/pages/feed.jsx#L1) | 1 | Feed page |
| [assets.js](src/assets/assets.js#L1) | 1 | Dummy data |

---

## ✅ Deployment Checklist

### Before Production
- [ ] Update Clerk keys for production environment
- [ ] Set backend API URL in frontend
- [ ] Test all routes and features
- [ ] Run linter: `npm run lint`
- [ ] Build: `npm run build`
- [ ] Test build: `npm run preview`

### Hosting Options
- **Frontend:** Vercel, Netlify, AWS S3
- **Backend:** Heroku, Railway, AWS, DigitalOcean
- **Database:** MongoDB Atlas, AWS RDS, PostgreSQL Cloud

---

## 📞 Getting Help

1. **Frontend Issues** → Check [React Docs](https://react.dev)
2. **Styling Issues** → Check [Tailwind Docs](https://tailwindcss.com)
3. **Auth Issues** → Check [Clerk Docs](https://clerk.com/docs)
4. **Backend Guide** → Read `BACKEND_SETUP.md`
5. **Project Status** → Read `PROJECT_ANALYSIS.md`

---

## 🎓 Learning Path

**If you're new to this project:**

1. Read `README.md` - Overview
2. Read `PROJECT_ANALYSIS.md` - Status report
3. Run `npm install && npm run dev` - See it working
4. Explore `src/pages/*` - Understand structure
5. Check `src/assets/assets.js` - Understand data
6. When ready → Read `BACKEND_SETUP.md` - Build API

---

## 🚀 Next: Backend Development

**Ready to build the backend?**

→ Follow the complete guide in **BACKEND_SETUP.md**

Key steps:
1. Create Node/Express server
2. Set up MongoDB database
3. Build 15+ API endpoints
4. Connect Clerk webhooks
5. Integrate frontend with backend

**Estimated time:** 4-6 weeks

---

## 📊 Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend UI | ✅ 100% | Fully functional |
| Pages | ✅ 9/9 | All complete |
| Components | ✅ 4/4 | All working |
| Styling | ✅ 100% | Responsive design |
| Authentication | ✅ Integrated | Clerk setup |
| Backend API | ❌ 0% | To be built |
| Database | ❌ 0% | To configure |
| Real-time | ❌ 0% | Socket.IO needed |

---

**Last Updated:** June 2026  
**Frontend Complete:** Yes ✅  
**Ready for Backend:** Yes 🚀
