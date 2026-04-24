# Browser Memory Inspector - Development Plan

> A client-side security tool for inspecting and analyzing browser storage, detecting potential security risks, and generating security reports.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Architecture](#core-architecture)
3. [Feature Breakdown](#feature-breakdown)
4. [Technical Implementation](#technical-implementation)
5. [Security Analysis Engine](#security-analysis-engine)
6. [Development Phases](#development-phases)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Options](#deployment-options)
9. [Enhanced Features (Professional Extensions)](#enhanced-features-professional-extensions)
10. [Execution Plan - Dynamic Vulnerability Flow](#execution-plan---dynamic-vulnerability-flow)
11. [Cross-Application Dynamic Inspection Plan](#cross-application-dynamic-inspection-plan)
12. [Execution Plan - IndexedDB and Site Comparison](#execution-plan---indexeddb-and-site-comparison)
13. [Level 3 (Advanced) - Enhanced Detection Features](#-level-3-advanced---enhanced-detection-features)
14. [Level 4 (Pro) - AI & Advanced Reporting](#-level-4-pro---ai--advanced-reporting)

---

## Execution Plan - Dynamic Vulnerability Flow

### Goal
Make the app continuously and dynamically scan browser storage, classify risk as High/Medium/Low, and clearly show users where High and Medium vulnerabilities exist.

### Implementation Steps
- [x] Add live scan triggers (startup, interval, window focus, storage events)
- [x] Show vulnerability location details (storage type + key + reason)
- [x] Refresh risk results automatically after delete actions
- [x] Add a dedicated vulnerability summary panel for High and Medium findings
- [x] Validate end-to-end behavior with TypeScript checks

### Success Criteria
- Users can immediately see High/Medium vulnerabilities while using the app
- Vulnerability list updates without manual reload
- Findings include where the issue is detected

---

## Cross-Application Dynamic Inspection Plan

### Product Objective
When a user opens Browser Inspector and browses another application/site (for example YouTube), the inspector should dynamically detect vulnerabilities and show:
- Cookie risks
- localStorage risks
- sessionStorage risks
- Other browser storage usage signals
- Exact vulnerability level (High / Medium / Low)
- Exact location (site + storage type + key name)

### Important Technical Constraint
A normal website cannot directly read storage from a different domain due to browser same-origin policy.

### Required Architecture (To support other apps/sites)
- Browser Extension (Manifest v3)
- Content Script injected per active tab
- Background Service Worker for tab coordination
- DevTools Panel / Extension Popup UI for live results
- Message channel between content script and inspector UI

### Implementation Status
- [x] Manifest v3 extension scaffold created
- [x] Content script dynamic scanner implemented (cookies/localStorage/sessionStorage)
- [x] Background service worker implemented for active tab coordination
- [x] Popup dashboard implemented for live High/Medium vulnerability display
- [x] Manual refresh trigger added for active-tab re-scan
- [x] Host/location/reason shown for each vulnerability finding

### Dynamic Flow (Real-Time, Not Hardcoded)
1. User opens an external site (example: YouTube)
2. Content script reads runtime data from that same tab origin:
   - `document.cookie` (accessible portion)
   - `localStorage`
   - `sessionStorage`
3. Data is streamed to analyzer every few seconds and on change events
4. Risk engine scores each item as High / Medium / Low
5. UI updates live with:
   - Vulnerability count by severity
   - Affected keys/items
   - Why flagged
   - Recommended fix

### Data Collection Scope
- Cookies: name, value length, security flags, expiry, domain, path
- localStorage: key, value length, detected sensitive patterns
- sessionStorage: key, value length, detected sensitive patterns
- Optional (phase 2): IndexedDB summary metadata

### Vulnerability Rules (Initial)
- High:
  - Exposed auth token/JWT/API key/credential patterns
  - Payment or identity patterns (credit card, SSN)
- Medium:
  - Sensitive keywords in key/value without direct credential pattern
  - Long encoded blobs stored in non-secure keys
- Low:
  - Non-sensitive app preferences/settings

### UI Requirements
- Live dashboard (auto-refresh)
- Severity cards (High / Medium / Low)
- Per-site findings table
- Filter by site, storage type, and severity
- Click row to view raw value, reasons, and remediation suggestions

### Dynamic Behavior Requirements
- Update on tab switch
- Update on page navigation/reload
- Update on storage mutation
- Update on timer (fallback polling)
- No hardcoded site names or key lists in UI logic

### Security & Privacy Requirements
- Run analysis locally in browser by default
- No external upload unless user explicitly exports
- Mask sensitive value preview by default

### Phased Delivery Plan
- Phase A: Extension scaffold + tab-level data capture
- Phase B: Dynamic vulnerability scoring + live UI binding
- Phase C: Multi-tab/site comparison + export reports
- Phase D: Advanced detections + compliance checks

### Acceptance Criteria
- User can inspect vulnerabilities on external sites dynamically
- High and Medium findings clearly visible with location
- Results refresh automatically without manual hardcoded flow

---

## Execution Plan - IndexedDB and Site Comparison

### Goal
Add dynamic IndexedDB metadata inspection and a popup comparison view so users can compare vulnerability posture across multiple sites.

### Scope
- IndexedDB metadata scan (database names, object stores, key paths, version, estimated size signals)
- Site-to-site comparison of High/Medium findings
- Dynamic updates with no hardcoded site logic

### Implementation Steps
- [x] Extend content scanner to collect IndexedDB metadata safely per site
- [x] Add IndexedDB metadata normalization in scan payload
- [x] Add analyzer rules for IndexedDB risk signals
- [x] Persist scans by host in background state with latest timestamp
- [x] Build popup comparison table for multi-site High/Medium counts
- [x] Add filters and sorting (host, severity, latest scan time)
- [x] Add drill-down for each site (storage type, key, reason)
- [x] Add privacy guardrails (mask previews, local-only processing)
- [ ] Validate with manual test matrix across at least 3 sites

### IndexedDB Collection Design
- Read metadata only by default (no full record extraction)
- Capture:
  - Database name
  - Version
  - Object store names
  - Key path info (if available)
  - Approximate item count when accessible
- Timeout/guard for blocked or restricted IndexedDB access

### Risk Classification Additions
- High:
  - IndexedDB keys/store names suggesting tokens, credentials, payment or identity secrets
  - Strong credential-like patterns in sampled metadata labels
- Medium:
  - Sensitive keywords in DB or object store names
  - Oversized opaque blobs associated with auth-like store names
- Low:
  - Generic app cache/setting store names with no sensitive indicators

### Popup Comparison UI Plan
- Summary cards:
  - Total scanned sites
  - Sites with High findings
  - Sites with Medium findings
- Comparison table columns:
  - Host
  - High count
  - Medium count
  - Total findings
  - Last scan time
- Site drill-down panel:
  - Cookies/localStorage/sessionStorage/IndexedDB sections
  - Top reasons and recommendations

### Dynamic Behavior Requirements
- Auto-refresh active tab scan
- Update comparison table when switching tabs/sites
- Keep recent scan history per host in extension storage
- No manual page reload required

### Acceptance Criteria
- IndexedDB metadata appears in scan payload and UI
- User can compare at least 3 scanned sites side by side
- High/Medium counts update dynamically by host
- Drill-down shows where vulnerability is found and why

---

## 🎯 Project Overview

**Browser Memory Inspector** is a client-side security inspection tool that helps developers and security professionals:
- Audit browser storage for sensitive data exposure
- Detect potential security vulnerabilities
- Generate compliance-friendly reports
- Educate users about data privacy risks

### Key Principles
- ✅ **Privacy-First**: No external data transmission—100% client-side execution
- ✅ **Developer-Friendly**: Fast, intuitive UI with minimal clicks
- ✅ **Production-Ready**: Responsive design, real-time updates, efficient rendering
- ✅ **Educational**: Clear risk reporting to help teams improve security practices

---

## 🏗️ Core Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Memory Inspector                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          UI Layer (React Components)                 │  │
│  │  ┌─────────────┬──────────────┬──────────────────┐  │  │
│  │  │  Dashboard  │  Storage Tab │  Analytics View  │  │  │
│  │  └─────────────┴──────────────┴──────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Logic & Business Layer (Services)             │  │
│  │  ┌──────────────┬────────────────┬──────────────┐   │  │
│  │  │StorageReader │RiskAnalyzer    │DataFormatter │   │  │
│  │  └──────────────┴────────────────┴──────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Data Extraction & Processing                    │  │
│  │  ┌──────────┬─────────────┬──────────────┐            │  │
│  │  │ Cookies  │ localStorage │ sessionStorage│           │  │
│  │  └──────────┴─────────────┴──────────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Layer Definitions

**UI Layer**
- React components for dashboard, tabs, modals
- Real-time data binding using React hooks
- Responsive grid/table layouts
- Dark/light theme support

**Logic Layer**
- `StorageReader`: Extracts data from all storage APIs
- `RiskAnalyzer`: Runs security rules and risk scoring
- `DataFormatter`: Normalizes data across storage types
- `ExportService`: Generates JSON reports

**Data Layer**
- In-memory state management (React Context or Zustand)
- No persistence (data cleared on refresh for privacy)
- Efficient caching to minimize re-reads

---

## 🎨 Feature Breakdown

### Phase 1: MVP (Basic Version) ✅

**Features:**
- ✅ Display all cookies with: name, value, domain, expiry, path, httpOnly, secure flags
- ✅ Display all localStorage entries with: key, value, size
- ✅ Display all sessionStorage entries with: key, value
- ✅ Tabbed interface switching between storage types
- ✅ Manual refresh button to reload all data
- ✅ Clean, developer-friendly UI with data grid

**Implementation Focus:**
- Core storage reader APIs: `document.cookie`, `localStorage`, `sessionStorage`
- Basic React components with styled-components or Tailwind CSS
- State management with React hooks (useState, useEffect)

---

### Phase 2: Intermediate Version ⚡

**Features:**
- 🔍 **Search**: Full-text search across all storage (keys + values)
- 🔽 **Filter**: By storage type, domain (for cookies), date range
- 🗑️ **Delete**: Remove individual entries with confirmation
- 🧹 **Clear All**: Clear all items in a category with warning
- 🎯 **Highlight Sensitive Data**: Color-code fields containing keywords like "token", "password", "auth"
- 📊 **Basic Statistics**: Total items, storage size breakdown
- 🔄 **Auto-Refresh**: Optional 5/10/30-second intervals

**Implementation Focus:**
- State management for search/filter logic
- Modal dialogs for confirmations
- Service layer for fuzzy search
- CSS for visual highlighting (badges, background colors)

---

### Phase 3: Advanced Version 🔥

**Features:**
- 🚨 **Risk Scoring System**:
  - Low (🟢): Normal application data
  - Medium (🟡): Potentially sensitive but expected
  - High (🔴): Clear security risk (exposed tokens, credentials)
- 🧠 **Pattern Detection**:
  - JWT format detection (3 base64 segments separated by dots)
  - Base64-like string detection (possible encoded tokens)
  - Email patterns validation
  - Phone number patterns
- 📋 **Security Report**:
  - Summary of findings per storage type
  - Risk breakdown (count by severity)
  - Recommendations for each high-risk item
  - Export as JSON file
- 📈 **Detailed Analytics**:
  - Storage quota usage percentage
  - Data categorization (auth, user-info, analytics, etc.)
  - Most common key patterns

**Implementation Focus:**
- Regex-based pattern matching engine
- Risk scoring algorithm with configurable weights
- Report generation and formatting
- File export functionality (blob + download link)

---

### Phase 4: Expert Version 💣 (Professional Extensions)

**Features:**
- 🤖 **AI-Powered Analysis** (Optional OpenAI integration):
  - Contextual risk assessment
  - Data purpose inference
  - Security recommendations
- 🧩 **Browser Extension**:
  - Persistent UI in dev tools
  - Multi-tab inspection
  - Real-time monitoring of storage changes
- 📡 **DevTools Integration**:
  - Network request tracking alongside storage inspection
  - Timeline of storage mutations
  - Performance metrics for storage operations
- 🔐 **Advanced Detection**:
  - PII detection (SSNs, credit card patterns)
  - API key format detection (AWS, GitHub, etc.)
  - GDPR compliance check (if EU personal data detected)
- 📤 **Export Options**:
  - PDF reports with risk visualization
  - CSV export for spreadsheet analysis
  - SARIF format for integration with security tools

**Implementation Focus:**
- Manifest v3 for Chrome extension
- Content scripts for multi-tab communication
- DevTools protocol for deeper inspection
- OpenAI API integration with rate limiting and caching
- Advanced regex patterns library (maintained rule set)

---

## ⚙️ Technical Implementation

### Tech Stack (Recommended)

```
Frontend Framework:     React 18+ (TypeScript)
State Management:       Zustand or Context API
Styling:               Tailwind CSS + Radix/Shadcn UI
Build Tool:            Vite (for fast HMR and builds)
Testing:               Vitest + React Testing Library
Code Quality:          ESLint + Prettier
Package Manager:       pnpm or npm
```

### Project Structure

```
browser-memory-inspector/
├── public/
│   ├── index.html
│   └── manifest.json (for extension version)
├── src/
│   ├── components/           # React components
│   │   ├── Dashboard.tsx
│   │   ├── StorageViewer.tsx
│   │   ├── RiskIndicator.tsx
│   │   ├── FilterPanel.tsx
│   │   └── ReportModal.tsx
│   ├── services/             # Business logic
│   │   ├── storageReader.ts
│   │   ├── riskAnalyzer.ts
│   │   ├── reportGenerator.ts
│   │   └── patterns.ts       # Regex patterns
│   ├── store/                # State management
│   │   ├── storageStore.ts
│   │   └── filterStore.ts
│   ├── types/                # TypeScript interfaces
│   │   └── index.ts
│   ├── utils/                # Helper functions
│   │   ├── formatter.ts
│   │   └── detection.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Core Modules Implementation

#### 1. StorageReader Service

```typescript
// services/storageReader.ts
interface StorageEntry {
  type: 'cookie' | 'localStorage' | 'sessionStorage';
  key: string;
  value: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export class StorageReader {
  readCookies(): StorageEntry[] {
    // Parse document.cookie and normalize
    // Extract: name, value, domain, path, expires, httpOnly, secure
  }

  readLocalStorage(): StorageEntry[] {
    // Iterate localStorage and normalize
  }

  readSessionStorage(): StorageEntry[] {
    // Iterate sessionStorage and normalize
  }

  readAll(): StorageEntry[] {
    // Combine all three sources with consistent format
  }
}
```

#### 2. RiskAnalyzer Service

```typescript
// services/riskAnalyzer.ts
interface RiskAlert {
  entry: StorageEntry;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  recommendation: string;
}

export class RiskAnalyzer {
  analyze(entries: StorageEntry[]): RiskAlert[] {
    // 1. Check for sensitive keywords
    // 2. Detect patterns (JWT, Base64, Email, etc.)
    // 3. Apply scoring algorithm
    // 4. Return sorted by risk level
  }

  private detectKeywords(value: string): string[] {
    // Match: "token", "password", "auth", "secret", "key", "credential"
  }

  private detectPatterns(value: string): string[] {
    // JWT: /^[\w-]*\.[\w-]*\.[\w-]*$/
    // Base64: /^[A-Za-z0-9+/]*={0,2}$/ (20+ chars)
    // Email: standard email regex
    // API Key formats: AWS, GitHub, etc.
  }

  private scoreRisk(keywords: string[], patterns: string[]): RiskLevel {
    // Weighted scoring algorithm
  }
}
```

#### 3. ReportGenerator Service

```typescript
// services/reportGenerator.ts
interface SecurityReport {
  timestamp: string;
  summary: {
    totalItems: number;
    riskLevels: { low: number; medium: number; high: number };
  };
  findings: RiskAlert[];
  recommendations: string[];
}

export class ReportGenerator {
  generate(alerts: RiskAlert[]): SecurityReport {
    // Aggregate findings by risk level
    // Generate recommendations
    // Format with timestamp
  }

  exportJSON(report: SecurityReport): string {
    return JSON.stringify(report, null, 2);
  }

  downloadReport(report: SecurityReport): void {
    // Create blob and trigger download
  }
}
```

---

## 🔍 Security Analysis Engine

### Detection Rules

#### Keyword-Based Detection
```typescript
const SENSITIVE_KEYWORDS = [
  'token', 'auth', 'password', 'secret', 'key',
  'credential', 'api_key', 'private', 'access',
  'bearer', 'authorization', 'session', 'nonce'
];

// Case-insensitive matching with word boundaries
const keywordRegex = new RegExp(`\b(${SENSITIVE_KEYWORDS.join('|')})\b`, 'i');
```

#### Pattern Detection Rules
```typescript
const PATTERNS = {
  JWT: /^[\w-]*\.[\w-]*\.[\w-]*$/,
  BASE64: /^[A-Za-z0-9+/]{20,}={0,2}$/,
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  AWS_KEY: /^AKIA[0-9A-Z]{16}$/,
  GITHUB_TOKEN: /^ghp_[a-zA-Z0-9]{36}$/,
  CREDIT_CARD: /\b\d{13,19}\b/,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/
};
```

### Risk Scoring Algorithm

```typescript
function calculateRiskScore(
  keywords: string[],
  patterns: string[],
  keyName: string
): 'low' | 'medium' | 'high' {
  let score = 0;

  // Keyword in value: +30
  if (keywords.length > 0) score += 30;

  // Keyword in key name: +40 (more suspicious)
  if (SENSITIVE_KEYWORDS.some(k => keyName.toLowerCase().includes(k))) {
    score += 40;
  }

  // JWT detected: +50
  if (patterns.includes('JWT')) score += 50;

  // AWS/GitHub key detected: +70
  if (patterns.includes('AWS_KEY') || patterns.includes('GITHUB_TOKEN')) {
    score += 70;
  }

  // Credit card or SSN: +80
  if (patterns.includes('CREDIT_CARD') || patterns.includes('SSN')) {
    score += 80;
  }

  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
```

### Recommendations Engine

```typescript
const RECOMMENDATIONS = {
  high: [
    "⚠️ CRITICAL: Exposed sensitive data detected",
    "✅ Action: Clear this data immediately",
    "✅ Review: How this data got stored in browser",
    "✅ Implement: Server-side session storage instead"
  ],
  medium: [
    "⚠️ Potentially sensitive data detected",
    "✅ Action: Verify this is necessary to store",
    "✅ Consider: Encrypting before storage"
  ],
  low: [
    "ℹ️ Normal application data",
    "✅ No immediate action needed"
  ]
};
```

---

## 📅 Development Phases

### Phase 1: MVP (Weeks 1-2)

**Tasks:**
- [ ] Set up React + TypeScript project with Vite
- [ ] Build UI shell (Dashboard, tabs, data grid)
- [ ] Implement StorageReader service
- [ ] Add manual refresh functionality
- [ ] Deploy to GitHub Pages
- [ ] Documentation: README, features list

**Deliverables:**
- Functional web app viewing all storage
- Basic styling (Tailwind CSS)
- GitHub repository with CI/CD

---

### Phase 2: Intermediate (Weeks 3-4)

**Tasks:**
- [ ] Search & filter functionality
- [ ] Delete entry pattern detection
- [ ] Real-time highlighting
- [ ] Auto-refresh timer
- [ ] Export basic JSON
- [ ] Unit tests for core services
- [ ] UI/UX refinement

**Deliverables:**
- Enhanced feature set
- 70%+ test coverage
- Improved UX

---

### Phase 3: Advanced (Weeks 5-6)

**Tasks:**
- [ ] Implement RiskAnalyzer service
- [ ] Build risk scoring algorithm
- [ ] Security report generation
- [ ] Analytics dashboard
- [ ] Advanced pattern detection
- [ ] Integration tests
- [ ] Performance optimization

**Deliverables:**
- Full security analysis capability
- Reporting system
- Performance benchmarks

---

### Phase 4: Expert (Weeks 7+)

**Tasks:**
- [ ] Browser extension development
- [ ] OpenAI integration (optional)
- [ ] DevTools integration
- [ ] Multi-tab support
- [ ] Advanced export formats (PDF, SARIF)
- [ ] E2E tests

**Deliverables:**
- Production-grade browser extension
- Enhanced integrations
- Comprehensive documentation

---

## 🧪 Testing Strategy

### Unit Tests (Services Layer)

```typescript
// tests/unit/riskAnalyzer.test.ts
describe('RiskAnalyzer', () => {
  test('detects JWT tokens', () => {
    const entry = { value: 'eyJhbGc...eyJzdWI...' };
    const alerts = analyzer.analyze([entry]);
    expect(alerts[0].riskLevel).toBe('high');
  });

  test('detects keyword "password"', () => {
    const entry = { value: 'my-secure-password' };
    const alerts = analyzer.analyze([entry]);
    expect(alerts[0].reasons).toContain('Keyword: password');
  });

  test('ignores false positives', () => {
    const entry = { value: 'normal-user-id-12345' };
    const alerts = analyzer.analyze([entry]);
    expect(alerts[0].riskLevel).toBe('low');
  });
});
```

### Integration Tests

```typescript
// tests/integration/dashboard.test.tsx
describe('Dashboard Integration', () => {
  test('displays cookies with risk indicators', () => {
    render(<Dashboard />);
    expect(screen.getByText(/high risk/i)).toBeInTheDocument();
  });

  test('export generates valid JSON', async () => {
    render(<Dashboard />);
    await userEvent.click(screen.getByRole('button', { name: /export/i }));
    // Verify JSON structure
  });
});
```

### Edge Cases to Test

```
- Empty storage (no cookies, localStorage, sessionStorage)
- Special characters in values (quotes, unicode, null bytes)
- Large values (5MB+ data)
- XSS attempt in storage values
- Cookie attributes edge cases (SameSite, Partitioned)
- Private browsing mode (reduced storage access)
- Performance with 1000+ entries
```

---

## 📦 Deployment Options

### Option 1: Static Web App (Recommended for MVP)

**Platform:** GitHub Pages, Netlify, or Vercel  
**Deployment:**
```bash
npm run build
# Built files in dist/ folder
# Push to gh-pages branch or connect to Netlify
```

**Advantages:**
- Free hosting
- Zero backend infrastructure
- Global CDN
- Easy versioning

---

### Option 2: Browser Extension

**Chrome Web Store:**
1. Package as `.zip` with `manifest.json`
2. Create developer account
3. Submit for review
4. Publish (2-3 days approval)

**manifest.json (v3):**
```json
{
  "manifest_version": 3,
  "name": "Browser Memory Inspector",
  "version": "1.0.0",
  "permissions": ["cookies"],
  "action": {
    "default_popup": "index.html",
    "default_title": "Memory Inspector"
  }
}
```

---

### Option 3: Hybrid Approach

- **Web App:** For general users and demo
- **Extension:** For power users and developers
- **DevTools:** For integrated workflow

---

## 🚀 Enhanced Features (Professional Extensions)

### My Recommended Additions to Your Plan

#### 1. **Data Encryption Status Check**
- Detect if localStorage contains obviously unencrypted PII
- Suggest encryption before storage
- Flag plain-text URLs or credentials

#### 2. **Cookie Security Assessment**
```typescript
// Analyze cookie flags
- Missing HttpOnly flag → potential XSS vector
- Missing Secure flag → transmittable over HTTP
- Missing SameSite → possible CSRF vector
- Overly broad domain → subdomain exposure risk
```

#### 3. **Historical Change Tracking**
- Track storage mutations with timestamps
- Diff view for changed values
- Timeline visualization
- Detect unusual access patterns

#### 4. **Compliance Checklist**
- GDPR: Data minimization check
- CCPA: User consent verification
- ISO 27001: Security baseline assessment
- Generate compliance report

#### 5. **Integration with Security Tools**
- SAST: Generate findings for SonarQube
- DAST: Export to Burp Suite format
- SIEM: Forward alerts to security tools
- Slack webhook for critical findings

#### 6. **API Token Validation**
- Verify token expiration from JWT claims
- Check token scope permissions
- Revocation status check (via optional backend)
- Token rotation recommendations

#### 7. **Visual Risk Dashboard**
```
┌────────────────────────────────┐
│  Storage Risk Summary          │
├────────────────────────────────┤
│  🟢 Low: 45 items  (60%)       │
│  🟡 Med: 20 items  (27%)       │
│  🔴 Hi:  8 items   (11%)       │
│                                │
│  ⚠️ Action Items: 8            │
└────────────────────────────────┘
```

#### 8. **Automated Alerts**
- Notification when high-risk data is stored
- Email summary before browser close
- Custom alert rules

---

## 📊 Success Metrics

### MVP
- ✅ Display all storage correctly
- ✅ <1 second load time
- ✅ Mobile responsive

### Intermediate
- ✅ 95%+ accuracy in sensitive data detection
- ✅ Search returns results in <100ms
- ✅ Support for 5000+ storage entries

### Advanced
- ✅ Risk detection catches 99% of exposed credentials
- ✅ Report generation in <500ms
- ✅ Extension installs: 1000+

---

## 📚 Documentation Checklist

- [ ] **README.md**: Features, screenshots, quickstart
- [ ] **ARCHITECTURE.md**: System design, data flow
- [ ] **CONTRIBUTING.md**: Development setup, contribution guidelines
- [ ] **API.md**: Service interfaces and types
- [ ] **SECURITY.md**: How analysis works, limitations
- [ ] **DEPLOYMENT.md**: Release process and hosting
- [ ] **USER_GUIDE.md**: How to use the tool

---

## 🎓 Resume Value

This project demonstrates:

✅ **Full-Stack Development**: React frontend, TypeScript, responsive design  
✅ **Security Expertise**: Pattern matching, risk scoring, compliance awareness  
✅ **Software Architecture**: Modular services, separation of concerns, testability  
✅ **DevTools Integration**: Browser APIs, extension development  
✅ **Performance Optimization**: Efficient rendering, caching strategies  
✅ **Algorithm Design**: Risk scoring, pattern recognition  
✅ **Project Management**: Phased rollout, MVP to advanced features  

**Comparable Tools:**
- Burp Suite (penetration testing)
- OWASP ZAP (security scanning)
- Chrome DevTools (built-in browser tools)

---

## 🔐 Cookie Security Check Implementation

### What to Check
For each cookie, analyze:
```typescript
interface CookieSecurityFlags {
  httpOnly: boolean;        // Protects from XSS
  secure: boolean;          // HTTPS only
  sameSite: 'Strict' | 'Lax' | 'None' | 'Unspecified';  // CSRF protection
  maxAge?: number;          // Expiration
  domain: string;           // Scope
  path: string;             // Path scope
}
```

### Risk Rules
- Missing `HttpOnly` flag → 🟡 **Medium Risk** (XSS-accessible)
- Missing `Secure` flag → 🟡 **Medium Risk** (HTTP-transmittable)
- Missing `SameSite` → 🟡 **Medium Risk** (CSRF-vulnerable)
- All flags present + Short expiry → 🟢 **Low Risk**
- Sensitive keywords (token, auth, password) + Missing flags → 🔴 **High Risk**

### Implementation
```typescript
// services/cookieSecurityAnalyzer.ts
interface CookieRisk {
  name: string;
  missingFlags: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

export function analyzeCookieSecurity(cookieString: string): CookieRisk[] {
  // Parse Set-Cookie or document.cookie format
  // Check for HttpOnly, Secure, SameSite attributes
  // Score based on missing flags + sensitive keywords
}
```

---

## 🚨 Advanced XSS Detection

### Detection Patterns
```typescript
const XSS_PATTERNS = {
  SCRIPT_TAG: /<script[\s\S]*?<\/script>/gi,
  EVENT_HANDLER: /on\w+\s*=\s*["'][^"']*["']/gi,
  JAVASCRIPT_URL: /javascript:/gi,
  IFRAME_INJECTION: /<iframe[\s\S]*?<\/iframe>/gi,
  IMG_ONERROR: /<img[\s\S]*?onerror[\s\S]*?>/gi,
  SVG_SCRIPT: /<svg[\s\S]*?<script[\s\S]*?<\/script>/gi,
  ENCODED_SCRIPT: /&#x3c;script|&#60;script|%3Cscript/gi
};
```

### Risk Scoring
- Plain `<script>` detected → 🔴 **High Risk** (Direct execution)
- JavaScript URL (`javascript:`) → 🔴 **High Risk**
- Encoded HTML/JS → 🟡 **Medium Risk** (May decode and execute)
- Event handlers → 🟡 **Medium Risk**

### Implementation
```typescript
// services/xssDetector.ts
export function detectXSS(value: string): {
  detected: boolean;
  patterns: string[];
  riskLevel: 'high' | 'medium' | 'low';
}
```

---

## 📋 Report Generator with Export

### Report Structure
```typescript
interface SecurityReport {
  timestamp: string;                    // Generation time
  domain: string;                       // Current domain
  summary: {
    totalItems: number;
    totalRiskCount: number;
    breakdown: {
      high: number;
      medium: number;
      low: number;
    };
    storageTypes: {
      cookies: number;
      localStorage: number;
      sessionStorage: number;
      indexedDB?: number;
    };
  };
  findings: {
    high: RiskAlert[];
    medium: RiskAlert[];
    low: RiskAlert[];
  };
  recommendations: string[];            // Priority actions
  exportDate: string;
  browserInfo?: string;
}

interface RiskAlert {
  id: string;
  storageType: 'cookie' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  key: string;
  valuePreview: string;                 // Masked for security
  riskLevel: 'high' | 'medium' | 'low';
  reasons: string[];                    // Why flagged
  recommendation: string;               // How to fix
  detectedPatterns: string[];           // JWT, Email, etc.
  timestamp: number;
}
```

### Export Formats

#### 1. **JSON Export**
```typescript
// Full detailed report, importable for analysis
export function exportJSON(report: SecurityReport): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json'
  });
  downloadFile(blob, `security-report-${Date.now()}.json`);
}
```

#### 2. **CSV Export** (for spreadsheet analysis)
```typescript
// Columns: StorageType, Key, RiskLevel, Reason, Recommendation
export function exportCSV(report: SecurityReport): void {
  // Generate CSV with headers
  // One row per finding
  // Sortable by risk level
}
```

#### 3. **HTML Report** (visual, printable)
```typescript
export function exportHTML(report: SecurityReport): void {
  // Generate styled HTML with:
  // - Executive summary
  // - Risk breakdown charts
  // - Detailed findings table
  // - Recommendations section
  // - Print-friendly styling
}
```

### Report UI Component
```typescript
// components/ReportModal.tsx
<button onClick={() => setShowReport(true)}>
  📊 Generate Report
</button>

// Modal with 3 export buttons:
// - Download JSON (for analysis tools)
// - Download CSV (for spreadsheets)
// - Download HTML (for reading/printing)
// - Copy JSON (for clipboard)
// - Share via QR (optional)
```

---

## 🔄 Browser Extension - Full Dynamic Implementation

### Architecture Overview

**Extension Components:**
1. **Manifest v3** - Permissions, script configuration
2. **Content Script** - Injected on all_urls, collects storage data
3. **Background Service Worker** - Coordinates tabs, persists state
4. **Popup UI** - Dashboard for extension popup
5. **Icon Badge** - Shows risk count on extension icon

### Content Script Features
```typescript
// Real-time collection:
- On page load (document_idle)
- On focus event
- On storage event (localStorage/sessionStorage mutation)
- On timer (5s fallback)
- On manual refresh button

// Collect:
- All cookies (with flags)
- localStorage entries
- sessionStorage entries
- IndexedDB metadata
- XSS threats in stored values
```

### Background Worker Features
```typescript
// Persistent state:
- Per-host scan history (last 50 hosts)
- Latest High/Medium/Low counts per host
- Last scan timestamp per host
- Message routing between tabs

// Auto-triggers:
- onTabActivated → Request fresh scan
- onTabUpdated (complete) → Request fresh scan
- onStartup → Hydrate state from chrome.storage.local
```

### Popup UI Features
```typescript
// Main Dashboard:
✅ Active tab statistics (High/Medium/Low counts)
✅ Scanned sites list (comparison table)
✅ Last scan timestamp

// Comparison View:
✅ Site-to-site comparison table
✅ Filter by host name
✅ Sort by: Latest, High count, Medium count, Host name
✅ Click site row → drill-down view

// Drill-down View:
✅ Show all findings for selected site
✅ Group by storage type (Cookies, localStorage, sessionStorage, IndexedDB)
✅ Click finding → show full details, recommendations
✅ Copy to clipboard, delete entry

// Export:
✅ Download full scan history as JSON
✅ Download current site report as CSV/HTML
✅ Clear all history (confirmation dialog)
```

---

## 🎯 Dynamic Behavior Specification

### Trigger Points
```
1. **Page Load** 
   - When content script initializes
   - Full collection + analysis

2. **Window Focus**
   - User switches to tab
   - Trigger fresh scan in background

3. **Storage Mutation**
   - localStorage.setItem/removeItem
   - sessionStorage.setItem/removeItem
   - Cookie changes detected
   - Incremental re-analysis

4. **Tab Change**
   - User clicks different tab in Chrome
   - Background worker detects and triggers scan

5. **Timer Fallback**
   - 5-second polling interval
   - Ensures data freshness even if events miss

6. **Manual Refresh**
   - User clicks "Refresh Scan" button
   - Immediate re-collection and re-analysis

7. **Page Visibility**
   - Tab becomes visible after hidden
   - Light refresh scan
```

### Data Flow (Per Tab)
```
Content Script:
├─ collectStorageData()
│  ├─ parseCookies()
│  ├─ readLocalStorage()
│  ├─ readSessionStorage()
│  └─ getIndexedDBMetadata()
│
├─ analyzeForRisks()
│  ├─ checkSensitiveKeywords()
│  ├─ detectPatterns()
│  ├─ validateCookieFlags()
│  ├─ detectXSSThreats()
│  └─ scoreRisk()
│
└─ publishScan()
   └─ chrome.runtime.sendMessage({
      type: 'BMI_SCAN_RESULT',
      host: document.location.host,
      data: { ... },
      timestamp: Date.now()
   })

Background Worker:
├─ onMessage('BMI_SCAN_RESULT')
│  ├─ Update scansByHost[host]
│  ├─ Persist to chrome.storage.local
│  └─ Notify popup UI
│
└─ broadcastState()
   └─ Send to popup: current state with all hosts

Popup UI:
├─ onMessage('BMI_STATE_UPDATE')
│  └─ Re-render comparison table with fresh data
│
└─ User interactions:
   ├─ Click site → Show drill-down
   ├─ Filter/Sort → Update visible rows
   ├─ Export → Generate report
   └─ Delete → Request content script to remove
```

---

## 📝 Implementation Checklist for Browser Extension

### Phase A: Core Infrastructure
- [x] Manifest v3 setup with permissions
- [x] Content script injection on all_urls
- [x] Background service worker registration
- [x] Message passing between components
- [x] Basic event listeners (focus, storage, timer)

### Phase B: Data Collection & Analysis
- [x] Cookie parser with attribute extraction
- [x] localStorage/sessionStorage enumeration
- [x] IndexedDB metadata async collection
- [x] Risk analyzer with scoring algorithm
- [x] Pattern detection (JWT, Base64, Email, Phone, AWS, GitHub, CC, SSN)
- [x] Cookie security flag validator
- [x] XSS threat detector
- [x] Report generator with export formats

### Phase C: State Management & Persistence
- [x] Per-host scan history storage
- [x] State persistence to chrome.storage.local
- [x] State hydration on startup
- [x] Host history trimming (max 50 hosts)
- [x] Message routing for tab coordination

### Phase D: UI & Export
- [x] Popup dashboard with statistics
- [x] Site comparison table
- [x] Filtering and sorting
- [x] Drill-down view for selected site
- [x] Export to JSON/CSV/HTML
- [x] Report template with styled HTML
- [x] Copy-to-clipboard for findings

### Phase E: Dynamic & Real-Time
- [x] Auto-scan on tab switch
- [x] Auto-scan on page load
- [x] Manual refresh trigger
- [x] Storage event listener
- [x] 5-second fallback polling
- [x] Icon badge with risk count

---

## ✅ Quick Start Checklist

```
- [x] Initialize Vite React + TypeScript project
- [x] Install Tailwind CSS, Zustand, Vitest
- [x] Create project folder structure
- [x] Implement StorageReader service
- [x] Build Dashboard component
- [x] Add manual refresh
- [x] Deploy to GitHub Pages (Backend + Frontend)
- [x] Implement RiskAnalyzer service
- [x] Implement Pattern detection
- [x] Build Browser Extension (Manifest v3)
- [x] Content script with storage collection
- [x] Background service worker
- [x] Popup UI with comparison table
- [x] IndexedDB metadata scanning
- [x] Cookie security flag validator
- [x] XSS threat detector
- [x] Report generator (JSON/CSV/HTML)
- [x] Export functionality (JSON, CSV, HTML, Copy)
- [x] Icon badge with risk count
- [ ] Manual 3+ site testing and validation
- [ ] Documentation update with examples
```

---

## 📞 Next Steps

1. ✅ **Plan review** - Complete with all details
2. ✅ **Implementation complete**:
   - ✅ Cookie security validator added
   - ✅ XSS detector added
   - ✅ Report generator + export implemented
   - ✅ Icon badge implemented
3. ✅ **Browser Extension ready**:
   - ✅ Content script with full detection
   - ✅ Background worker with state persistence
   - ✅ Popup UI with export options
   - ✅ Badge with risk count
4. ⏳ **Final Testing**:
   - Load extension in Chrome
   - Test on 3+ real sites (YouTube, GitHub, Twitter, etc.)
   - Verify all features work dynamically
   - Document results

---

## 🔥 Level 3 (Advanced) - Enhanced Detection Features

### Goal
Add sophisticated pattern recognition and entropy analysis to detect even obfuscated tokens and API keys in browser storage.

### 3.1 Advanced Regex Detection

#### Credit Card Detection
```typescript
const CREDIT_CARD_PATTERNS = {
  VISA: /\b(?:4[0-9]{12}(?:[0-9]{3})?)\b/,           // Visa: 4xxx xxxx xxxx xxxx
  MASTERCARD: /\b(?:5[1-5][0-9]{14})\b/,              // MC: 51-55 + 14 digits
  AMEX: /\b(?:3[47][0-9]{13})\b/,                     // AMEX: 34 or 37 + 13 digits
  DISCOVER: /\b(?:6(?:011|5[0-9]{2})[0-9]{12})\b/,   // Discover: 6011 or 65xx + 12 digits
  DINERS: /\b(?:3(?:0[0-5]|[68][0-9])[0-9]{11})\b/,  // Diners: 300-305, 36, 38
  LUHN_VALID: /\b\d{13,19}\b/ // Post-validation via Luhn algorithm
};

function validateCreditCard(cardNumber) {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}
```

#### JWT Validation Enhancement
```typescript
function validateJWT(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  
  try {
    // Decode header and payload (no verification needed for detection)
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    // Check for typical JWT claims
    return (
      header?.alg &&
      (payload?.exp || payload?.iat || payload?.sub || payload?.aud)
    );
  } catch {
    return false;
  }
}
```

#### API Key Format Detection
```typescript
const API_KEY_PATTERNS = {
  AWS_ACCESS: /ASIA[0-9A-Z]{16}/,                     // AWS Temporary (4-20)
  AWS_SECRET: /aws_secret_access_key|wJalrXUtnFEMI/,  // AWS Secret pattern
  GITHUB_PAT: /ghp_[A-Za-z0-9_]{36,255}/,             // GitHub Personal Access Token
  GITHUB_OAUTH: /gho_[A-Za-z0-9_]{36,255}/,           // GitHub OAuth token
  GITHUB_APP: /ghu_[A-Za-z0-9_]{36,255}/,             // GitHub App token
  SLACK_BOT: /xoxb-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{24,34}/,  // Slack Bot
  SLACK_USER: /xoxp-[0-9]{10,13}-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{32}/,  // Slack User
  STRIPE_TEST: /sk_test_[A-Za-z0-9]{24,}/,            // Stripe Secret Key
  STRIPE_LIVE: /sk_live_[A-Za-z0-9]{24,}/,            // Stripe Live Key
  HEROKU_API: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,  // Heroku API
  CLOUDFLARE: /Bearer [A-Za-z0-9_-]{40,}/,            // Cloudflare API
  MONGODB_URI: /mongodb\+srv:\/\/[^@]+@/,             // MongoDB connection string
  DATABASE_URL: /postgresql:\/\/|mysql:\/\/|mongodb:\/\//,  // DB connection strings
  PRIVATE_KEY: /-----BEGIN (RSA|OPENSSH|PRIVATE) KEY-----/,  // Private key files
};
```

### 3.2 Entropy Analysis (Shannon Entropy)

Detect random/high-entropy strings that are likely tokens or encrypted data.

```typescript
function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;
  
  const frequencies = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  
  let entropy = 0;
  for (const count of Object.values(frequencies)) {
    const probability = count / str.length;
    entropy -= probability * Math.log2(probability);
  }
  
  return entropy; // 0-8 bits per character (higher = more random)
}

function isLikelyToken(str, minLength = 16) {
  // High entropy + sufficient length = likely token
  if (str.length < minLength) return false;
  
  const entropy = calculateEntropy(str);
  // Tokens typically have entropy > 4.0
  // Normal text has entropy 4.5-5.5
  // Encrypted data has entropy > 7.0
  
  const isHighEntropy = entropy > 4.0;
  const hasLowReadability = /^[A-Za-z0-9+/=_-]*$/.test(str); // Base64-like chars
  const isNotCommonWords = !/(password|secret|key|token|auth)/i.test(str);
  
  return isHighEntropy && hasLowReadability && isNotCommonWords;
}
```

### 3.3 DOM Scanning (Hidden Inputs)

Scan the DOM for hidden inputs containing sensitive data.

```typescript
function scanHiddenInputs() {
  const findings = [];
  
  // Scan hidden input fields
  const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
  for (const input of hiddenInputs) {
    const { name, value } = input;
    if (isLikelyToken(value) || isSensitiveKeyName(name)) {
      findings.push({
        type: 'hidden_input',
        name,
        valuePreview: maskValue(value),
        location: 'DOM - Hidden Input',
        risk: detectRisk(value)
      });
    }
  }
  
  // Scan data attributes
  const dataElements = document.querySelectorAll('[data-token], [data-key], [data-api], [data-secret]');
  for (const elem of dataElements) {
    const keys = Array.from(elem.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => ({ key: attr.name, value: attr.value }));
    
    for (const { key, value } of keys) {
      findings.push({
        type: 'data_attribute',
        key,
        valuePreview: maskValue(value),
        location: `DOM - Element ${elem.tagName}`,
        risk: detectRisk(value)
      });
    }
  }
  
  // Scan inline scripts for credentials
  const scripts = document.querySelectorAll('script:not([src])');
  for (const script of scripts) {
    const matches = script.textContent.match(/(api_key|token|password|secret)\s*[:=]\s*["']([^"']+)["']/gi);
    if (matches) {
      findings.push({
        type: 'inline_script',
        content: `Found ${matches.length} credential assignments`,
        location: 'DOM - Inline Script',
        risk: 'high'
      });
    }
  }
  
  return findings;
}

function maskValue(value, showChars = 4) {
  if (value.length <= showChars) return '***';
  return value.substring(0, showChars) + '*'.repeat(Math.max(3, value.length - showChars));
}

function isSensitiveKeyName(name) {
  const sensitivePatterns = [
    /token/i, /api/i, /key/i, /secret/i, /password/i,
    /auth/i, /credential/i, /session/i, /jwt/i, /bearer/i
  ];
  return sensitivePatterns.some(pattern => pattern.test(name));
}
```

### 3.4 URL Endpoint Detection

Detect API endpoints in page URLs, localStorage, and network data.

```typescript
function detectAPIEndpoints() {
  const endpoints = new Set();
  
  // Current page URL
  const urlPatterns = /\/api\/v\d+\/[a-z0-9_-]+|\/graphql|\/rest\/|\/webhooks?\/|\/oauth/gi;
  const matches = window.location.href.match(urlPatterns);
  if (matches) endpoints.add(...matches);
  
  // localStorage/sessionStorage
  for (let i = 0; i < localStorage.length; i++) {
    const value = localStorage.getItem(localStorage.key(i)) || '';
    const apiMatches = value.match(urlPatterns);
    if (apiMatches) endpoints.add(...apiMatches);
  }
  
  // Check for common API hostnames
  const apiHosts = /api\.|api-|backend\.|gateway\.|service\.|auth\./i;
  if (apiHosts.test(window.location.hostname)) {
    return {
      endpoint: window.location.origin,
      type: 'api_host',
      risk: 'medium'
    };
  }
  
  return Array.from(endpoints).map(endpoint => ({
    endpoint,
    type: 'detected_endpoint',
    risk: 'low'
  }));
}

// Monitor network requests (via fetch interception)
function monitorNetworkRequests() {
  const originalFetch = window.fetch;
  const requests = [];
  
  window.fetch = function(...args) {
    const [resource] = args;
    const url = typeof resource === 'string' ? resource : resource?.url;
    
    if (url && /api|graphql|auth|oauth/i.test(url)) {
      requests.push({
        endpoint: new URL(url, window.location.origin).pathname,
        timestamp: Date.now(),
        type: 'network_request'
      });
    }
    
    return originalFetch.apply(this, args);
  };
  
  return requests;
}
```

### 3.5 Risk Scoring Algorithm (Enhanced)

```typescript
function calculateAdvancedRiskScore(value, keyName) {
  let score = 0;
  const factors = [];
  
  // 1. Pattern detection (0-100)
  for (const [patternName, pattern] of Object.entries(ALL_PATTERNS)) {
    if (pattern.test(value)) {
      const patternScores = {
        CREDIT_CARD: 95,
        AWS_KEY: 90,
        GITHUB_TOKEN: 88,
        JWT: 85,
        PRIVATE_KEY: 100,
        DATABASE_URL: 92,
        // ... other patterns
      };
      score = Math.max(score, patternScores[patternName] || 50);
      factors.push(`Pattern: ${patternName}`);
    }
  }
  
  // 2. Entropy analysis (0-100)
  const entropy = calculateEntropy(value);
  if (entropy > 6.5 && value.length > 20) {
    score = Math.max(score, 70);
    factors.push(`High entropy (${entropy.toFixed(2)} bits)`);
  }
  
  // 3. Keyword matching (0-60)
  const keywords = detectKeywords(value, keyName);
  if (keywords.length > 0) {
    score = Math.max(score, 40 + keywords.length * 5);
    factors.push(`Keywords: ${keywords.join(", ")}`);
  }
  
  // 4. String characteristics (0-40)
  if (/^[A-Za-z0-9+/=_-]{32,}$/.test(value)) { // Base64-like, long
    score = Math.max(score, 35);
    factors.push("Base64-like encoding");
  }
  
  if (/^[a-f0-9]{32,}$/.test(value)) { // Hex string, long
    score = Math.max(score, 30);
    factors.push("Hexadecimal encoding");
  }
  
  // 5. Length analysis
  if (value.length > 100) {
    factors.push("Long string (likely certificate or key)");
  }
  
  return {
    score: Math.min(score, 100),
    level: score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low',
    factors
  };
}

// Classification mapping
function getRiskLevel(score) {
  if (score >= 80) return { level: 'high', color: '#ef4444', icon: '🔴' };
  if (score >= 60) return { level: 'medium', color: '#f59e0b', icon: '🟠' };
  if (score >= 40) return { level: 'low', color: '#eab308', icon: '🟡' };
  return { level: 'minimal', color: '#22c55e', icon: '🟢' };
}
```

### 3.6 Phase 3 Implementation Checklist

```
- [ ] Implement credit card detection with Luhn validation
- [ ] Add JWT payload decoding and validation
- [ ] Create API key pattern detection library (10+ formats)
- [ ] Implement Shannon entropy calculator
- [ ] Add DOM scanner for hidden inputs and data attributes
- [ ] Implement inline script credential detector
- [ ] Add URL endpoint detection
- [ ] Monitor and log network requests dynamically
- [ ] Integrate advanced risk scoring algorithm
- [ ] Create risk factor explanation UI
- [ ] Add unit tests for entropy calculation
- [ ] Performance test with large storage datasets
```

---

## 🔥 Level 4 (Pro) - AI & Advanced Reporting

### Goal
Add AI-powered explanations, automatic security report generation, and sophisticated risk visualization.

### 4.1 AI Explanation System

#### OpenAI Integration (Optional)
```typescript
interface AIExplanation {
  finding: string;
  riskDescription: string;
  businessImpact: string;
  remediation: string[];
  complianceNotes: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

async function getAIExplanation(finding: RiskAlert): Promise<AIExplanation> {
  // Only call if user has enabled AI (opt-in)
  if (!chrome.storage.sync.AIEnabled) {
    return generateDefaultExplanation(finding);
  }
  
  const apiKey = await getOpenAIKey(); // User's own API key
  
  const prompt = `
Analyze this security finding and provide a brief, technical explanation:

Finding: ${finding.location.key} in ${finding.location.storageType}
Risk Level: ${finding.riskLevel}
Detected Patterns: ${finding.detectedPatterns.join(", ")}
Reasons: ${finding.reasons.join(", ")}

Provide response in JSON format:
{
  "riskDescription": "Why this is risky (1-2 sentences)",
  "businessImpact": "Real-world consequences if exploited",
  "remediation": ["Action 1", "Action 2", "Action 3"],
  "complianceNotes": "GDPR/CCPA/HIPAA implications if applicable"
}`;
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      })
    });
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
    
  } catch (error) {
    // Fallback to local explanation
    return generateDefaultExplanation(finding);
  }
}

function generateDefaultExplanation(finding): AIExplanation {
  // Rule-based fallback when AI not available
  const explanations = {
    JWT: {
      riskDescription: "JSON Web Token detected in browser storage",
      businessImpact: "If compromised, attacker can impersonate user indefinitely",
      remediation: [
        "Store JWT only in secure HTTP-only cookies",
        "Implement short token expiry (15-30 minutes)",
        "Use refresh tokens stored in secure storage"
      ],
      complianceNotes: "OWASP A07:2021 - Cross-Site Request Forgery"
    },
    // ... more explanations
  };
  
  const pattern = finding.detectedPatterns[0];
  return explanations[pattern] || {
    riskDescription: finding.reasons[0] || "Sensitive data detected",
    businessImpact: "Potential unauthorized access or data breach",
    remediation: ["Remove from browser storage", "Use secure alternatives"],
    complianceNotes: "Review data classification policies"
  };
}
```

#### Dynamic Application-Wide AI Vulnerability Scan

##### Goal
Summarize all vulnerabilities found in the active application dynamically, not just one item at a time.

##### Dynamic Inputs
- High, medium, and low findings from the current scan
- Keyword matches from the risk engine
- Context factors: host, storage type, key name, page URL
- Validation signals: JWT parsing, Luhn checks, entropy, XSS indicators
- IndexedDB metadata, DOM findings, and API endpoint detections

##### Required Output
```json
{
  "overview": "high-level security posture of the current app",
  "vulnerabilities": [
    {
      "type": "JWT in localStorage",
      "severity": "high",
      "where": "site + storage type + key",
      "why": "keyword/context/validation explanation",
      "impact": "what can happen if exploited",
      "fix": ["step 1", "step 2"],
      "confidence": 0.92
    }
  ],
  "priorityOrder": ["first fix", "second fix"],
  "complianceNotes": ["GDPR", "PCI", "secret handling"],
  "executiveSummary": "business-readable summary"
}
```

##### Dynamic Behavior
- Re-run automatically whenever a new scan arrives
- Reflect the currently selected host or active scan
- Do not use hardcoded site names or key names
- Fall back to rule-based summaries if Gemini is unavailable

##### Implementation Steps
- [ ] Build a prompt from the current scan report
- [ ] Send the prompt to Gemini with the locally saved key
- [ ] Parse JSON output and render it in the popup
- [ ] Show the application-wide vulnerability summary in the AI panel
- [ ] Keep the local fallback so scanning still works without AI

#### Local LLM Alternative (Ollama)
```typescript
async function getLocalAIExplanation(finding: RiskAlert): Promise<AIExplanation> {
  // Use local LLM if running (privacy-first alternative)
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    body: JSON.stringify({
      model: "mistral", // or llama2
      prompt: buildExplanationPrompt(finding),
      stream: false
    })
  });
  
  const result = await response.json();
  return parseAIResponse(result.response);
}
```

### 4.2 Auto Security Report Generator

#### Report Types
```typescript
interface SecurityReport {
  reportId: string;
  generatedAt: string;
  reportType: 'executive' | 'technical' | 'compliance' | 'full';
  domain: string;
  
  executive: {
    summary: string;
    riskScore: number;         // 0-100
    overallRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    topThreats: string[];
    recommendations: string[];
  };
  
  technical: {
    findings: DetailedFinding[];
    patterns: string[];
    vulnerabilities: string[];
    metrics: {
      storageUsageBytes: number;
      criticalFindings: number;
      remediationTime: string;
    };
  };
  
  compliance: {
    gdpr: {
      applicable: boolean;
      personalDataFound: string[];
      dataProcessingNotes: string;
      dpaNotificationRequired: boolean;
    };
    ccpa: {
      applicable: boolean;
      findings: string[];
    };
    hipaa: {
      applicable: boolean;
      piiDetected: boolean;
    };
  };
  
  timeline: {
    timestamp: number;
    scanDuration: number;
    lastModified: number[];
  };
}

async function generateAutoReport(
  allFindings: RiskAlert[],
  domain: string,
  reportType: string = 'full'
): Promise<SecurityReport> {
  
  const criticalFindings = allFindings.filter(f => f.riskLevel === 'high');
  const highScore = calculateSecurityScore(allFindings);
  
  const report: SecurityReport = {
    reportId: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    generatedAt: new Date().toISOString(),
    reportType,
    domain,
    
    executive: {
      summary: generateExecutiveSummary(allFindings, domain),
      riskScore: highScore,
      overallRating: scoreToGrade(highScore),
      topThreats: extractTopThreats(allFindings),
      recommendations: generateRecommendations(allFindings)
    },
    
    technical: {
      findings: allFindings.map(f => ({
        key: f.location.key,
        storage: f.location.storageType,
        risk: f.riskLevel,
        patterns: f.detectedPatterns,
        reasons: f.reasons
      })),
      patterns: [...new Set(allFindings.flatMap(f => f.detectedPatterns))],
      vulnerabilities: identifyVulnerabilities(allFindings),
      metrics: {
        storageUsageBytes: estimateStorageUsage(allFindings),
        criticalFindings: criticalFindings.length,
        remediationTime: estimateRemediationTime(criticalFindings)
      }
    },
    
    compliance: {
      gdpr: analyzeGDPR(allFindings),
      ccpa: analyzeCCPA(allFindings),
      hipaa: analyzeHIPAA(allFindings)
    },
    
    timeline: {
      timestamp: Date.now(),
      scanDuration: performance.now(),
      lastModified: allFindings.map(f => f.entry?.timestamp || 0)
    }
  };
  
  return report;
}

function generateExecutiveSummary(findings: RiskAlert[], domain: string): string {
  const high = findings.filter(f => f.riskLevel === 'high').length;
  const medium = findings.filter(f => f.riskLevel === 'medium').length;
  
  return `
Security scan of ${domain} found ${findings.length} total storage items with 
${high} critical and ${medium} medium-severity vulnerabilities. 
Immediate action recommended for storage remediation.
`;
}

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function extractTopThreats(findings: RiskAlert[]): string[] {
  return findings
    .sort((a, b) => 
      ({ high: 3, medium: 2, low: 1 }[b.riskLevel] || 0) -
      ({ high: 3, medium: 2, low: 1 }[a.riskLevel] || 0)
    )
    .slice(0, 3)
    .map(f => `${f.reasons[0]} in ${f.location.key}`);
}

function identifyVulnerabilities(findings: RiskAlert[]): string[] {
  const vulns = new Set<string>();
  
  for (const finding of findings) {
    if (finding.xssPatterns?.length > 0) {
      vulns.add('DOM-based XSS via stored scripts');
    }
    if (finding.detectedPatterns.includes('JWT')) {
      vulns.add('Unencrypted JWT tokens in storage');
    }
    if (finding.detectedPatterns.includes('PRIVATE_KEY')) {
      vulns.add('Private keys exposed in client storage');
    }
    if (finding.riskLevel === 'high' && finding.location.storageType === 'localStorage') {
      vulns.add('XSS-accessible sensitive data');
    }
  }
  
  return Array.from(vulns);
}
```

#### Export Formats
```typescript
// PDF with charts and visualizations
async function exportReportPDF(report: SecurityReport): Promise<Blob> {
  // Use jsPDF library
  const pdf = new jsPDF();
  
  // Title page
  pdf.setFontSize(20);
  pdf.text('Security Assessment Report', 20, 30);
  
  // Summary cards with risk gauge
  pdf.setFontSize(12);
  pdf.text(`Overall Risk: ${report.executive.overallRating}`, 20, 60);
  pdf.text(`Score: ${report.executive.riskScore}/100`, 20, 70);
  
  // Findings table
  pdf.autoTable({
    head: [['Finding', 'Risk Level', 'Storage', 'Pattern']],
    body: report.technical.findings.map(f => [
      f.key.substring(0, 20),
      f.risk,
      f.storage,
      f.patterns.join(', ')
    ])
  });
  
  return pdf.output('blob');
}

// SARIF format for security tools integration
function exportReportSARIF(report: SecurityReport): object {
  return {
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name: 'Browser Memory Inspector',
          version: '2.0.0',
          informationUri: 'https://github.com/yourusername/browser-memory-inspector'
        }
      },
      results: report.technical.findings.map(f => ({
        ruleId: f.patterns[0],
        level: f.risk === 'high' ? 'error' : f.risk === 'medium' ? 'warning' : 'note',
        message: { text: f.reasons[0] },
        locations: [{
          physicalLocation: {
            artifactLocation: {
              uri: `${report.domain}#${f.storage}/${f.key}`
            }
          }
        }]
      }))
    }]
  };
}
```

### 4.3 Advanced Risk Scoring System

```typescript
interface RiskMetrics {
  storageScore: number;        // Based on what's stored
  exposureScore: number;       // Based on accessibility (XSS risk)
  cryptoScore: number;         // Based on encryption status
  accessibilityScore: number;  // Based on HttpOnly, Secure flags
  overallScore: number;        // Weighted average
  trend: 'improving' | 'stable' | 'degrading';
}

function calculateMetricsOverTime(scans: Scan[]): RiskMetrics {
  const latestScan = scans[scans.length - 1];
  const previousScan = scans[scans.length - 2] || latestScan;
  
  const storageScore = calculateStorageRisk(latestScan.entries);
  const exposureScore = calculateExposureRisk(latestScan.entries);
  const cryptoScore = calculateCryptoRisk(latestScan.entries);
  const accessibilityScore = calculateAccessibilityRisk(latestScan.entries);
  
  // Weighted average
  const weights = {
    storage: 0.35,
    exposure: 0.30,
    crypto: 0.20,
    accessibility: 0.15
  };
  
  const overallScore =
    storageScore * weights.storage +
    exposureScore * weights.exposure +
    cryptoScore * weights.crypto +
    accessibilityScore * weights.accessibility;
  
  // Trend analysis
  const previousScore = calculateTotalScore(previousScan);
  let trend: 'improving' | 'stable' | 'degrading' = 'stable';
  
  if (overallScore < previousScore - 5) trend = 'improving';
  if (overallScore > previousScore + 5) trend = 'degrading';
  
  return {
    storageScore,
    exposureScore,
    cryptoScore,
    accessibilityScore,
    overallScore,
    trend
  };
}

function calculateStorageRisk(entries: StorageEntry[]): number {
  // What kind of data is being stored?
  let score = 0;
  
  for (const entry of entries) {
    if (isPersonallyIdentifiable(entry.value)) score += 30;
    if (isFinancialData(entry.value)) score += 40;
    if (isHealthData(entry.value)) score += 50;
    if (isAuthToken(entry.value)) score += 45;
  }
  
  return Math.min(100, score);
}

function calculateExposureRisk(entries: StorageEntry[]): number {
  // Is this data accessible to XSS attacks?
  let score = 0;
  
  for (const entry of entries) {
    if (entry.type === 'localStorage' || entry.type === 'sessionStorage') {
      // Accessible to JavaScript
      if (isSensitive(entry.value)) score += 25;
    }
    if (entry.type === 'cookie') {
      // Check flags
      if (!entry.httpOnly && isSensitive(entry.value)) score += 15;
      if (!entry.secure && isSensitive(entry.value)) score += 10;
    }
  }
  
  return Math.min(100, score);
}

function calculateCryptoRisk(entries: StorageEntry[]): number {
  // Is sensitive data encrypted?
  let score = 0;
  
  for (const entry of entries) {
    if (isSensitive(entry.value) && !isEncrypted(entry.value)) {
      score += 20;
    }
  }
  
  return Math.min(100, score);
}

function calculateAccessibilityRisk(entries: StorageEntry[]): number {
  // Cookie security flags
  let score = 0;
  
  for (const entry of entries) {
    if (entry.type === 'cookie') {
      if (!entry.httpOnly) score += 10;
      if (!entry.secure) score += 10;
      if (!entry.sameSite) score += 5;
    }
  }
  
  return Math.min(100, score);
}
```

### 4.4 Risk Scoring Visualization

```typescript
// UI Component for risk score display
interface RiskVisualization {
  gaugeChart: CanvasGradient;      // Main risk score 0-100
  trendChart: LineChart;            // Historical trend
  heatmap: HeatmapData;             // Risk distribution by storage type
  timeline: TimelineEvent[];        // Security events over time
}

// Risk gauge with color zones
function renderRiskGauge(score: number) {
  const ctx = canvas.getContext('2d');
  const radius = 100;
  const centerX = 150;
  const centerY = 150;
  
  // Red zone (80-100)
  drawGaugeSection(ctx, centerX, centerY, radius, 0.8, 1.0, '#ef4444');
  // Orange zone (60-80)
  drawGaugeSection(ctx, centerX, centerY, radius, 0.6, 0.8, '#f59e0b');
  // Yellow zone (40-60)
  drawGaugeSection(ctx, centerX, centerY, radius, 0.4, 0.6, '#eab308');
  // Green zone (0-40)
  drawGaugeSection(ctx, centerX, centerY, radius, 0.0, 0.4, '#22c55e');
  
  // Needle pointing to score
  const angle = (score / 100) * Math.PI;
  const needleX = centerX + radius * Math.cos(angle - Math.PI / 2);
  const needleY = centerY + radius * Math.sin(angle - Math.PI / 2);
  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(needleX, needleY);
  ctx.stroke();
  
  // Score text
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(score)}`, centerX, centerY + 40);
}
```

### 4.5 Phase 4 Implementation Checklist

```
- [ ] Integrate OpenAI API with opt-in privacy controls
- [ ] Create local LLM fallback (Ollama integration)
- [ ] Build rule-based explanation engine as default
- [ ] Implement auto-report generation (4 types)
- [ ] Add PDF export with jsPDF
- [ ] Add SARIF format for tool integration
- [ ] Create risk metrics calculation engine
- [ ] Implement trend analysis over time
- [ ] Build risk visualization components (gauge, charts)
- [ ] Add custom risk weighting UI
- [ ] Implement caching for performance
- [ ] Add compliance detection (GDPR, CCPA, HIPAA)
- [ ] Create email/Slack webhook export
- [ ] Build scheduled report generation
```

---

**Plan Status**: ✅ Implementation Complete - Ready for Testing  
**Estimated Total Duration**: 6-8 weeks (MVP to Advanced)  
**Team Size**: 1-2 developers  
**Difficulty**: Intermediate → Advanced  
**Current Phase**: Testing & Validation

---

## 5. Full Vulnerability Hunter Mode (Plan Only)

### 5.1 Important Scope Rules

This section defines a defensive application security scanner for authorized targets only.

- Only scan applications you own or have explicit written permission to test.
- Default mode must be passive + safe checks.
- Active testing (mutation/fuzzing) must be opt-in per host.
- Add per-scan rate limiting and stop controls to avoid service disruption.

Execution status for this section:

- Plan created only.
- No implementation work is executed until user says: execute.

### 5.2 Goal

Upgrade Browser Memory Inspector into a broad web app vulnerability assessment platform that can detect, prioritize, and report vulnerabilities similar to manual hunter workflows, including but not limited to:

- IDOR/BOLA
- Broken authentication/session issues
- XSS (reflected, stored, DOM)
- CSRF
- SSRF indicators
- SQLi/NoSQLi indicators
- Template injection indicators
- Open redirect
- CORS misconfiguration
- Clickjacking
- CSP weakness
- Insecure cookie/token storage
- Sensitive data exposure
- GraphQL misconfiguration
- API authorization flaws
- Client-side secrets
- Dependency/component exposures (where feasible from client context)

### 5.3 Target Architecture

Add a hybrid scanning pipeline:

- Browser extension (in-browser telemetry and client-side checks)
- Optional local scanner backend service for deeper active checks
- Unified findings engine with confidence, evidence, and remediation

Data flow:

1. Crawl and collect attack surface (URLs, params, forms, APIs, GraphQL, JS assets).
2. Build endpoint and identity map (users/roles/resources when available).
3. Run passive analyzers first.
4. Run active checks only in authorized mode.
5. Correlate duplicates and rank findings.
6. Generate executive + technical + developer remediation reports.

### 5.4 Modules To Add

1. Crawler and Endpoint Discovery
- Route discovery from DOM, SPA navigation, scripts, source maps (if present), XHR/fetch logs.
- Form and input model extraction.
- API inventory from network traffic and URL patterns.

2. Authentication and Session Analyzer
- Token lifecycle and exposure checks.
- Cookie policy checks (HttpOnly, Secure, SameSite, Path/Domain scope).
- Session fixation and weak logout invalidation indicators.

3. Authorization Analyzer (IDOR/BOLA Focus)
- Resource access model: resource ID locations (path/query/body/header).
- Cross-context replay tests using controlled role/account profiles.
- Object ownership mismatch detection.
- Horizontal and vertical access control mismatch checks.

4. Input Security Analyzer
- Reflected/stored/DOM XSS payload safety checks with strict guardrails.
- Injection indicator checks for SQLi/NoSQLi/SSTI patterns.
- Open redirect parameter checks.

5. Browser Security Header Analyzer
- CSP quality scoring.
- CORS policy evaluation (origin reflection, wildcard + credentials).
- X-Frame-Options/frame-ancestors checks.
- HSTS, Referrer-Policy, Permissions-Policy analysis.

6. API and GraphQL Analyzer
- REST verb/method misuse checks.
- Broken object level authorization indicators.
- GraphQL introspection exposure and excessive data fields checks.
- Mass assignment indicator checks.

7. Sensitive Data and Secret Analyzer
- PII/PCI/credential leakage in responses and client storage.
- Hardcoded keys/tokens in JS bundles and inline scripts.
- Verbose error message leaks (stack traces, internal IDs).

8. Reporting and Triage Engine
- Confidence score and exploitability context.
- Duplicate clustering and root-cause grouping.
- False positive suppression rules.
- Repro steps and safe remediation guidance.

### 5.5 Detection Matrix (Minimum Coverage)

Authentication and Session:
- Weak token storage, long-lived tokens, missing rotation.
- Insecure cookie flags and scope.

Authorization:
- IDOR/BOLA on numeric and opaque IDs.
- Role bypass indicators in API endpoints.

Input Validation:
- Reflected/stored/DOM XSS indicators.
- SQLi/NoSQLi/SSTI indicators.
- Path traversal indicators.

Browser and Transport:
- CSP, CORS, clickjacking, HSTS and mixed content weaknesses.

API Security:
- Verb tampering, over-permissive endpoints, mass assignment indicators.
- GraphQL schema and resolver exposure risks.

Data Exposure:
- PII/financial/session identifiers in storage, URLs, logs, and responses.

### 5.6 IDOR/BOLA Plan (Detailed)

Phase A: Resource Mapping
- Identify candidate resource identifiers from:
  - URL paths
  - Query params
  - JSON body keys
  - Headers
- Classify identifier types:
  - Sequential numeric
  - UUID
  - Hash-like or opaque tokens

Phase B: Identity Context Model
- Support multiple authenticated contexts:
  - Account A (low privilege)
  - Account B (peer user)
  - Optional admin
- Keep strict session isolation across contexts.

Phase C: Authorization Probing (Authorized Mode)
- Replay safe read requests with alternate identifiers.
- Compare response status, body shape, and sensitive field leakage.
- Flag potential IDOR when unauthorized resource appears accessible.

Phase D: Confidence and Noise Reduction
- Require multiple correlated signals before high severity:
  - Ownership mismatch evidence
  - Data uniqueness mismatch
  - Reproducible cross-context access

### 5.7 Active vs Passive Modes

Passive mode default:
- No payload mutation beyond observation.
- No repeated stress testing.

Active mode opt-in:
- Controlled payload mutation with rate limits.
- Endpoint allowlist required.
- Safety stop on error spikes and latency degradation.

### 5.8 UX Requirements

Popup additions:
- Scan Mode switch: passive / active.
- Scope config: current host only / subdomains / allowlist paths.
- Identity profiles manager for authorization tests.
- Findings board with filters:
  - vulnerability class
  - severity
  - confidence
  - verified/unverified

Finding card must include:
- Type and severity
- Confidence score
- Evidence snippet
- Repro steps
- Remediation steps
- Compliance impact (GDPR/PCI/OWASP mapping)

### 5.9 Data Model Additions

Add normalized types:

```typescript
type VulnCategory =
  | 'idor_bola'
  | 'broken_auth'
  | 'xss'
  | 'csrf'
  | 'sqli_nosqli'
  | 'ssrf'
  | 'cors'
  | 'clickjacking'
  | 'security_headers'
  | 'sensitive_data'
  | 'api_authz'
  | 'graphql';

interface Evidence {
  requestFingerprint: string;
  endpoint: string;
  method: string;
  signal: string;
  preview?: string;
}

interface VulnerabilityFinding {
  id: string;
  category: VulnCategory;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  host: string;
  path: string;
  evidence: Evidence[];
  verified: boolean;
  remediation: string[];
  references: string[]; // OWASP/CWE
  firstSeen: number;
  lastSeen: number;
}
```

### 5.10 Implementation Phases (Execution Later)

Phase 1: Foundation
- Refactor scanner pipeline into plugin architecture.
- Add common finding model and severity/confidence engine.
- Add passive endpoint and parameter inventory.

Phase 2: Core Vulnerability Coverage
- Add XSS, header, CORS, clickjacking, sensitive data modules.
- Add authentication/session analyzer upgrades.

Phase 3: IDOR/BOLA and API Authorization
- Add identity profile system.
- Add safe cross-context authorization checks.
- Add correlation engine for high-confidence IDOR findings.

Phase 4: Advanced API and GraphQL
- REST method tampering checks.
- GraphQL analyzer and schema exposure checks.
- Mass assignment indicator module.

Phase 5: Triage and Reporting
- Deduplication and root-cause clustering.
- Developer-ready repro/remediation templates.
- Export: JSON, CSV, HTML, SARIF.

Phase 6: Validation and Hardening
- Add test lab and regression suite.
- Add false-positive benchmark and tuning.
- Add performance and safety guardrails.

### 5.11 Testing Plan

- Unit tests for each detector module.
- Integration tests against intentionally vulnerable local labs.
- False positive/negative benchmark set.
- Performance targets:
  - passive scan latency budget
  - active scan request-per-minute caps

### 5.12 Deliverables Checklist (Plan Stage)

- [x] Define plugin-based scanner interfaces.
- [x] Define unified vulnerability schema.
- [x] Build endpoint/parameter discovery inventory.
- [ ] Implement passive security header + CORS + clickjacking analyzers. (CSP/clickjacking added; CORS analyzer pending)
- [x] Implement XSS and injection indicator analyzers.
- [ ] Implement identity profile manager for authz testing.
- [ ] Implement IDOR/BOLA correlation engine. (IDOR candidate detector added; correlation/verification pending)
- [x] Implement API + GraphQL analyzer modules.
- [x] Implement dedupe + confidence scoring.
- [ ] Implement export/report pipeline (JSON/CSV/HTML/SARIF).
- [ ] Add safety controls (rate limit, kill switch, allowlist).
- [ ] Add regression tests and benchmark suite.

### 5.13 Command Gate

Execution command received (`execute`) and initial implementation started on April 24, 2026.
Remaining checklist items stay pending for subsequent execution passes.

Accepted command examples:

- execute section 5
- execute phase 1
- execute idor module

