# Browser Memory Inspector - Frontend

A React-based client-side security tool for inspecting and analyzing browser storage, detecting potential security risks, and generating security reports.

## Features

### Phase 1: MVP ✅
- Display all cookies with metadata (domain, path, expires, httpOnly, secure)
- Display localStorage and sessionStorage entries
- Tabbed interface for switching between storage types
- Manual refresh functionality
- Clean, developer-friendly UI

### Phase 2: Intermediate ⚡
- Full-text search across all storage
- Filter by storage type, risk level
- Delete individual entries or clear all
- Highlight sensitive data
- Basic statistics
- Auto-refresh timer

### Phase 3: Advanced 🔥
- Risk scoring system (Low/Medium/High)
- Pattern detection (JWT, Base64, Email, API Keys, etc.)
- Security report generation
- Detailed analytics
- Export as JSON/CSV

## Tech Stack

- **React 18+** with TypeScript
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for building and development

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will start on `http://localhost:3000`

### Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Preview

```bash
npm run preview
```

## Project Structure

```
Frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── StorageViewer.tsx   # Storage table
│   │   ├── FilterPanel.tsx     # Search and filters
│   │   ├── RiskIndicator.tsx   # Risk badges
│   │   ├── ReportModal.tsx     # Report generation
│   │   └── StatsCard.tsx       # Stats display
│   ├── services/            # Business logic
│   │   ├── storageReader.ts    # Read storage APIs
│   │   ├── riskAnalyzer.ts    # Security analysis
│   │   ├── reportGenerator.ts  # Report generation
│   │   └── patterns.ts        # Regex patterns
│   ├── store/               # State management
│   │   └── storageStore.ts     # Zustand store
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   └── formatter.ts
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Styles
├── public/
│   └── index.html           # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── package.json             # Dependencies
```

## Usage

1. Open the app in your browser
2. The dashboard will automatically load all browser storage data
3. Use filters to search and analyze data
4. Click on entries to see detailed information
5. Generate a security report with the "Report" button
6. Export reports as JSON or CSV

## Security Features

### Pattern Detection
- JWT tokens
- Base64 encoded strings
- Email addresses
- Phone numbers
- AWS API keys
- GitHub tokens
- Credit card numbers
- Social Security Numbers

### Risk Scoring
- **High Risk**: Exposed sensitive data, credentials, API keys
- **Medium Risk**: Potentially sensitive data needing verification
- **Low Risk**: Normal application data

### Recommendations
- Clear sensitive data immediately
- Implement server-side session management
- Use HTTP-only cookies
- Encrypt sensitive data before storage

## Development

### Available Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

### Testing

The project is set up for testing with Vitest and React Testing Library. Tests can be added in a `tests/` directory.

### Code Quality

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting

## Performance

- Fast HMR (Hot Module Replacement) with Vite
- Optimized production builds
- Efficient state management with Zustand
- Lazy loading of components

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Future Enhancements

- Browser extension for DevTools integration
- Real-time storage monitoring
- Multi-tab inspection
- AI-powered security analysis
- GDPR compliance checking
- Advanced PII detection
