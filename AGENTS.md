# AGENTS.md - Awsaml Repository Guide

This document provides essential information for agents working in the awsaml repository. Awsaml is an Electron desktop application that provides automatically rotated temporary AWS credentials via SAML authentication.

## Project Overview

- **Type**: Electron desktop application (cross-platform: macOS, Linux, Windows)
- **Language**: JavaScript (Node.js backend) + TypeScript (React frontend)
- **Architecture**: Electron main process + React renderer process
- **Key Purpose**: Automatically rotates AWS credentials every hour via SAML/identity provider authentication

## Directory Structure

```
awsaml/
├── src/
│   ├── main/                 # Electron main process (Node.js)
│   │   ├── index.js         # Application entry point
│   │   ├── api/             # Express server & auth logic
│   │   │   ├── auth.js      # SAML authentication class
│   │   │   ├── aws-credentials.js  # AWS credential management
│   │   │   ├── server.js    # Express app setup
│   │   │   ├── routes/      # API routes
│   │   │   ├── reloader/    # Credential refresh manager
│   │   │   └── storage.js   # Local data persistence
│   │   ├── containers/      # IPC handlers for main process
│   │   ├── menu.js          # Application menu
│   │   ├── protocol.js      # Custom protocol handler
│   │   └── touchbar.js      # macOS Touch Bar integration
│   └── renderer/            # React UI (TypeScript)
│       ├── index.tsx        # React entry point
│       ├── containers/      # Page components
│       │   ├── App.tsx      # Main router & layout
│       │   ├── configure/   # SAML metadata configuration
│       │   ├── select-role/ # AWS role selection
│       │   └── refresh/     # Credential display & refresh
│       ├── components/      # Reusable UI components
│       └── constants/       # UI constants & styles
├── test/                    # Jest test suite
├── public/                  # Static assets (favicon, manifest)
├── build.js                 # Electron Forge build script
├── forge.config.js          # Electron Forge configuration
├── vite.config.mjs          # Vite (React build tool) configuration
├── eslint.config.mjs        # ESLint rules (new flat config format)
└── jest.config.js           # Jest test configuration
```

## Essential Commands

### Development

```bash
# Install dependencies
yarn install

# Start React dev server (port 3000) - run this in one terminal
yarn react-start

# In another terminal, start Electron with hot reload
yarn electron-dev
```

The Vite dev server proxies `/api` and `/sso` requests to `http://localhost:2600` (the Express server running in Electron).

### Building & Packaging

```bash
# Build for current platform (uses electron-forge)
yarn build

# Build for specific platforms (darwin, linux, win32 - comma-separated)
PLATFORM=darwin yarn build
PLATFORM=darwin,linux yarn build

# Build for specific architectures (ia32, x64, armv7l, arm64, universal, all)
ARCH=arm64 PLATFORM=darwin yarn build

# Clean build artifacts
yarn clean
```

The build process:
1. Vite builds React assets to `build/` directory
2. Electron Forge packages the app using `forge.config.js` settings

### Testing & Linting

```bash
# Run all tests
yarn test

# Run linter on JS/TS files
yarn lint

# Run both lint and test
yarn lint && yarn test
```

## Code Patterns & Conventions

### File Organization

- **Electron main process**: CommonJS (`require`) in `src/main/**/*.js`
- **React components**: ES modules (`import`) with TypeScript in `src/renderer/**/*.tsx`
- **Tests**: Jest in `test/**/*.js` using `describe`/`it` syntax

### TypeScript Configuration

- **Target**: ES2020, DOM
- **Strict mode**: Enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- **Scope**: Only `src/renderer/` and `tsconfig.node.json`; main process remains JavaScript
- **Import extensions**: Must be omitted (`.js`/`.ts`/`.tsx` not specified in imports)

### ESLint Rules

- **Format**: Modern flat config format (`.mjs`)
- **Code style**: Single quotes, no semicolons
- **React**: React 18+, no need for `React` in scope (via `jsx: 'react-jsx'`)
- **TypeScript**: Allows unused parameters starting with underscore (`_param`)
- **Env**: Browser globals for renderer, Node globals for main process

### Styling

- **Framework**: Styled-components (CSS-in-JS)
- **UI Library**: Reactstrap + Bootstrap 5
- **Icons**: FontAwesome 6
- **Theme**: Respects system dark/light mode via CSS media queries

### React Patterns

- **Hooks**: Functional components with hooks (useState, useRef, etc.)
- **Routing**: React Router v6 with `MemoryRouter` (no URL bar needed)
- **State Management**: Local component state via `useState`
- **DnD**: `react-dnd` for drag-and-drop (see `src/renderer/containers/configure/Login.tsx`)
- **Type Props**: Components use TypeScript interfaces for prop validation

### Electron Patterns

- **IPC**: Communication via `ipcMain`/`ipcRenderer` in `src/main/containers/*.js`
- **Storage**: Persistent data via `src/main/api/storage.js` (JSON file at `~/.config/Awsaml/data.json`)
- **Global Access**: Main process exposes `global.Storage` and `global.Manager` for use in API
- **Custom Protocol**: `awsaml://` protocol handled in `src/main/protocol.js`

### API Patterns

- **Server**: Express.js in `src/main/api/server.js`
- **SAML Auth**: `@node-saml/passport-saml` strategy in `src/main/api/auth.js`
- **Routes**: Standard Express route handlers in `src/main/api/routes/`
- **Credentials**: AWS SDK v3 (`@aws-sdk/client-sts`) in `src/main/api/aws-credentials.js`

## Key Technologies

### Runtime
- **Electron**: ^31.7.7 (desktop framework)
- **Node.js**: >=16.0.0
- **Yarn**: 4.12.0 (package manager)

### Frontend
- **React**: ^18.3.1
- **Vite**: ^5.4.21 (build tool)
- **React Router**: ^6.30.3
- **Styled-components**: ^6.3.11
- **Reactstrap**: ^9.2.3 (Bootstrap components)

### Backend
- **Express**: ^4.22.1
- **Passport**: ^0.7.0 with SAML strategy
- **AWS SDK**: @aws-sdk/client-sts ^3.1000.0

### Development
- **TypeScript**: ^5.9.3
- **ESLint**: ^8.57.1 (with plugins for React, TypeScript, Jest)
- **Babel**: ^7.29.0
- **Jest**: ^29.7.0 (test runner)

## Testing

### Jest Setup

- **Test files**: Located in `test/` directory
- **Pattern**: `test/**/*.js` (CommonJS, not TypeScript)
- **Coverage**: Enabled by default (`clearMocks: true`, `collectCoverage: true`)
- **Reporters**: Default + JUnit XML output (`jest-junit`)

### Example Test Pattern

```javascript
describe('FeatureName', () => {
  beforeEach(() => {
    // setup
  });

  it('should do something', (done) => {
    expect(result).toEqual(expected);
    done();
  });
});
```

## Important Gotchas & Non-obvious Patterns

### 1. **Main Process is NOT TypeScript**
The Electron main process (`src/main/**/*.js`) uses CommonJS and remains JavaScript. Only the React renderer (`src/renderer/**/*.tsx`) is TypeScript. Never move main process files to `.ts`.

### 2. **Global Objects in Main Process**
- `global.Storage` is initialized at `src/main/index.js:38` from `src/main/api/storage.js`
- `global.Manager` is the credential refresh manager
- Always check these are set before using in API handlers

### 3. **Storage Migration**
The codebase migrated storage schema from object to array format (see `src/main/index.js:41-50`). New code should use the array format: `{ name, url }` objects.

### 4. **Express Server Runs in Electron Main**
The Express server (`src/main/api/server.js`) runs on port 2600 inside the Electron process. Dev server proxies requests to it. Never assume it's a separate process.

### 5. **Build Directory is Transient**
The `build/` directory is deleted and regenerated during packaging (see `forge.config.js:76-82`). Don't rely on it persisting between builds.

### 6. **Windows Path Handling**
The codebase has special handling for Windows paths (see git history). Use `path.join()` and forward slashes; the codebase handles platform differences.

### 7. **Import Extensions Are Omitted**
ESLint enforces no import extensions (`.js`, `.ts`, `.tsx` omitted). This applies to all imports:
```javascript
// ✓ Correct
import Auth from './api/auth';
import Component from './containers/App';

// ✗ Incorrect
import Auth from './api/auth.js';
import Component from './containers/App.tsx';
```

### 8. **React Router Uses MemoryRouter**
React Router is configured with `MemoryRouter` (not `BrowserRouter`) because there's no traditional URL bar in the Electron window. Routes are fully controlled by app state.

### 9. **SAML Response Reuse**
Credentials are rotated by reusing the SAML response from the identity provider. Users don't re-authenticate every hour. See `src/main/api/reloader/` for rotation logic.

### 10. **Environment Variables**
- `NODE_ENV=development` enables debug mode
- `ELECTRON_START_URL=http://localhost:3000` points to dev server
- `SESSION_SECRET` is required for Express session in production
- Build credentials use `BUILD_NUMBER`, `NOTARIZE_CREDS_USR`, etc. for macOS signing

## Git & Branching

- **Current branch**: Check `git branch` output (usually `convert-to-vite` or `master`)
- **Recent major changes**: Migration to Vite (v4.3.0+), TypeScript in renderer (v4.5.0+)
- **Releases**: Published via `@electron-forge/publisher-github` to GitHub Releases

## Common Development Tasks

### Adding a New Page

1. Create a component in `src/renderer/containers/YourPage.tsx`
2. Add route in `src/renderer/containers/App.tsx`
3. Import using omitted extension: `import YourPage from './YourPage'`
4. Style with styled-components; use Reactstrap for layout

### Adding a New API Endpoint

1. Create route file in `src/main/api/routes/your-route.js`
2. Export a function that accepts `(app, auth)` parameters
3. Register in `src/main/api/server.js`: `app.use('/api/your-route', require('./routes/your-route')(app, auth))`
4. Use `auth.guard` middleware for authentication

### Adding Tests

1. Create test file in `test/feature-name.js`
2. Import the code to test
3. Use Jest's `describe`/`it` syntax
4. Run `yarn test` to verify

## Linting & Formatting

Run before committing:

```bash
yarn lint   # Check for ESLint violations
yarn test   # Ensure tests pass
```

ESLint is strict on TypeScript files (unused variables, type safety). Fix linting errors; don't disable rules without justification.

## Continuous Integration

GitHub Actions (`.github/workflows/node.js.yml`):
- Runs on Node 18.x and 20.x
- Steps: checkout → setup Node → install dependencies → lint → test
- Triggered on pull requests
- Uses Yarn cache for faster builds

## Packaging & Distribution

- **Electron Forge**: Generates installers for all platforms
- **Makers**: Squirrel (Windows), DMG (macOS), DEB (Linux), ZIP (macOS)
- **Publishers**: GitHub Releases (draft mode by default)
- **Code Signing**: macOS requires notarization (see `forge.config.js:125-134`)

## Memory Notes for Future Sessions

- Keep this document up-to-date as patterns evolve
- Record any discovered commands or workarounds here
- Update sections if project structure changes
