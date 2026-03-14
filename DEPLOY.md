# Deploy: Git & Hetzner

Use these whenever you deploy an update.

---

## 1. On your PC (commit and push)

```powershell
cd C:\Users\veips\yerbamate
git add .
git status
git commit -m "Your commit message"
git push origin main
```

---

## 2. On the Hetzner server (deploy)

SSH in, then run in order:

```bash
cd /opt/yerbamate
git fetch origin
git reset --hard origin/main
cd frontend
npm install
npx prisma generate --schema=./prisma/schema.prisma
npx prisma migrate deploy --schema=./prisma/schema.prisma
npm run build
pm2 restart yerbatea
```

**One-liner (same steps):**
```bash
cd /opt/yerbamate && git fetch origin && git reset --hard origin/main && cd frontend && npm install && npx prisma generate --schema=./prisma/schema.prisma && npx prisma migrate deploy --schema=./prisma/schema.prisma && npm run build && pm2 restart yerbatea
```

---

## Notes

- **Env:** `.env` must be in `/opt/yerbamate/frontend` (not only in `/opt/yerbamate`) so the build and app can read it (e.g. `DATABASE_URL`, `STRIPE_SECRET_KEY`).
- **Checks:** `pm2 list` · `pm2 logs yerbatea` · `pm2 info yerbatea`
- **First-time Git:** If the repo wasn’t set up yet: `git init` then `git remote add origin https://github.com/Veiroby/yerbamate.git`
