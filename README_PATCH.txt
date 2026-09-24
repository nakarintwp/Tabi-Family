Tabi Family V7.3.4 MINIMAL PATCH

This patch only replaces 7 files required for V7.3.4:
- package.json
- app/globals.css
- app/trips/new/page.tsx
- app/version/route.ts
- components/AppHeader.tsx
- components/PwaRegister.tsx
- public/sw.js

Recommended on Windows PowerShell:
1) Extract this ZIP.
2) Open PowerShell in the extracted folder.
3) Run:
   Set-ExecutionPolicy -Scope Process Bypass
   .\APPLY_V734.ps1
4) Verify it prints package version: 0.7.3-4
5) Then run the git commands printed by the script.

After push, Vercel must clone a NEW commit hash and the build log must show:
> japan-family-trip-planner@0.7.3-4 build
