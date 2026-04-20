# 🚀 Setup & Installation Guide

A step-by-step guide to set up and run the Browser Memory Inspector project.

## Prerequisites

Before starting, ensure you have installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

Verify installation:
```bash
node --version
npm --version
```

## Project Setup

### 1. Clone or Download the Project

```bash
# If using Git
git clone <repository-url>
cd Browser-Memory-Inspector

# Or navigate to the project folder if already downloaded
cd Browser-Memory-Inspector
```

### 2. Backend Installation & Setup

Navigate to the Backend folder:

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

The `.env` file should contain:
```
PORT=5000
NODE_ENV=development
```

Start the backend server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

You should see:
```
🚀 Browser Memory Inspector Backend running on http://localhost:5000
📊 API Health Check: http://localhost:5000/api/health
```

### 3. Frontend Installation & Setup

In a new terminal, navigate to the Frontend folder:

```bash
cd Frontend
```

Install dependencies:

```bash
npm install
```

This may take a few minutes as it installs all React and build tool dependencies.

Start the development server:

```bash
npm run dev
```

You should see:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### 4. Open the Application

1. Open your browser
2. Navigate to: **http://localhost:3000**
3. The Browser Memory Inspector dashboard should load

## First Run Walkthrough

### Initial Dashboard

When you first load the app, you'll see:
- **Stats Cards**: Showing total items and risk counts
- **Filter Panel**: Search and filter options
- **Storage Viewer**: A table of all your browser storage data

### Using the Application

1. **View Storage Data**:
   - The app automatically scans your browser's cookies, localStorage, and sessionStorage
   - Data is displayed in a table with type badges

2. **Search & Filter**:
   - Use the search box to find specific entries
   - Filter by storage type (Cookies, Local Storage, Session Storage)
   - Filter by risk level (High, Medium, Low)
   - Toggle "Sensitive Only" to see potentially risky data

3. **Inspect Details**:
   - Click on any row to expand and see full details
   - View metadata for cookies
   - See detected security patterns
   - Read recommendations for high-risk items

4. **Take Actions**:
   - **Eye icon**: Toggle value visibility
   - **Copy icon**: Copy value to clipboard
   - **Trash icon**: Delete localStorage/sessionStorage entries
   - **Refresh button**: Re-scan storage
   - **Report button**: Generate security report

5. **Generate Reports**:
   - Click the "Report" button to generate a security analysis
   - Review findings and recommendations
   - Export as JSON or CSV format

## Development Tasks

### Building for Production

#### Frontend Production Build

```bash
cd Frontend
npm run build
```

Creates optimized build in `Frontend/dist/` folder.

#### Serve Production Build Locally

```bash
npm run preview
```

### Running Tests (When Available)

```bash
cd Frontend
npm run test
```

### Code Quality Checks

```bash
# Run ESLint
npm run lint

# Type checking
npm run type-check
```

## Troubleshooting

### Common Issues

#### "Port already in use" Error

**Frontend (Port 3000)**:
```bash
# Find and kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

**Backend (Port 5000)**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

#### "Cannot find module" Error

Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

#### Backend not connecting

1. Ensure backend is running on port 5000
2. Check http://localhost:5000/api/health returns `{"status":"ok"}`
3. Verify no CORS issues in browser console

#### No data showing in dashboard

1. Refresh the page (F5)
2. Click the "Refresh" button in the dashboard
3. Check browser console for errors (F12)
4. Verify you have storage data (some storage might be empty)

### Debug Mode

Check browser console (F12 -> Console tab) for:
- Any error messages
- Storage data being logged
- Security analysis results

## Production Deployment

### Backend Deployment

1. Build the frontend first
2. Configure environment variables
3. Deploy Node.js app to:
   - Heroku
   - AWS EC2
   - DigitalOcean
   - Any Node.js hosting

```bash
# Install production dependencies only
npm install --production

# Start server
npm start
```

### Frontend Deployment

Deploy the built `dist/` folder to:
- GitHub Pages
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting

```bash
# Build
npm run build

# Upload contents of dist/ folder to hosting
```

## Environment Variables

### Backend (.env)

```
PORT=5000
NODE_ENV=development
```

### Frontend

No environment variables needed for basic setup.

## Project Structure Reference

```
Browser-Memory-Inspector/
├── Backend/
│   ├── server.js           # Express server
│   ├── package.json
│   ├── .env                # Environment variables (create from .env.example)
│   └── README.md
│
├── Frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # Business logic
│   │   ├── store/          # State management
│   │   ├── utils/          # Utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
└── README.md               # Main documentation
```

## Next Steps

1. **Explore the codebase**: Check `Plan.md` for architecture details
2. **Read documentation**: Review Backend and Frontend READMEs
3. **Run the app**: Follow the Quick Start guide above
4. **Analyze storage**: Use the dashboard to inspect browser storage
5. **Generate reports**: Create security reports

## Getting Help

- **Documentation**: Check [Plan.md](./Plan.md)
- **Frontend Docs**: See [Frontend/README.md](./Frontend/README.md)
- **Backend Docs**: See [Backend/README.md](./Backend/README.md)
- **Browser Console**: Press F12 to see detailed error messages

## Tips & Best Practices

1. **Security First**: Remember this is a client-side tool only
2. **Regular Scanning**: Periodically check your browser storage
3. **Report Generation**: Export reports for security audits
4. **Data Privacy**: All analysis happens locally, nothing is sent to servers
5. **Version Control**: Always commit code before major changes

---

**Happy securing! 🔒 If you encounter issues, check the troubleshooting section above.**
