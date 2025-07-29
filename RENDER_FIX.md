# Render Deployment Fix

## The Problem
Render failed with: `sh: 1: vite: not found`

## The Solution
The build tools need to be in `dependencies` (not `devDependencies`) for Render to access them during build.

## Manual Fix Steps

### 1. Edit package.json on GitHub
Go to your repository: https://github.com/maine300/-smartgrow-plant-monitor

Click on `package.json` → Edit (pencil icon)

### 2. Move These Dependencies
Find these in `devDependencies` and move them to `dependencies`:

```json
"vite": "^5.4.19",
"esbuild": "^0.25.0",
"@vitejs/plugin-react": "^4.3.2",
"autoprefixer": "^10.4.20",
"postcss": "^8.4.47",
"tailwindcss": "^3.4.17",
"typescript": "5.6.3"
```

### 3. Your dependencies section should include:
```json
"dependencies": {
  // ... all existing dependencies ...
  "vite": "^5.4.19",
  "esbuild": "^0.25.0",
  "@vitejs/plugin-react": "^4.3.2",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.47",
  "tailwindcss": "^3.4.17",
  "typescript": "5.6.3"
}
```

### 4. Remove from devDependencies
Delete those same packages from the `devDependencies` section.

### 5. Commit Changes
Commit message: "Fix: Move build tools to production dependencies for Render"

### 6. Redeploy
Go to your Render dashboard and click "Manual Deploy" or wait for auto-deploy.

## Expected Result
Build should succeed and show:
```
✅ Dependencies installed
✅ Vite build completed
✅ ESBuild bundle created
✅ Deploy complete
```

Your SmartGrow app will be live!