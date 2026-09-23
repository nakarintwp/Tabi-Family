# V5.1 — Modern Winter UI

V5.1 removes the Japanese visual motifs and red theme from V5 while keeping the snow effect.

## Changes
- Removed Japanese seal/characters and Japanese subtitle
- Removed red sun, red primary buttons, red active navigation and red underline accents
- Replaced theme with Arctic Blue / Ice / White
- Replaced mountain/sun composition with abstract winter light blobs
- Kept CSS-only falling snow
- Updated login and header branding to `TF`
- Kept all V4.3.2 functionality unchanged
- No SQL migration required
- No new API or paid service required

## Upgrade
Copy this version over the existing project while keeping `.git` and `.env.local`, then:

```powershell
git add .
git commit -m "V5.1 modern winter blue UI"
git push
```
