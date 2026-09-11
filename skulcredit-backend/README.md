# SkulCredit Backend

> Full documentation — including API reference, DevOps setup, architecture, and all endpoint payloads — lives in the **[root README](../README.md)**.

## Quick start (standalone)

```bash
cp .env.example .env   # fill in secrets
npm install
npm run dev            # tsx watch, hot reload on :8080
```

## Scripts

| Command                   | Description                          |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Development server with hot reload   |
| `npm run build`           | Compile TypeScript to `dist/`        |
| `npm start`               | Run compiled production build        |
| `npx tsx scripts/seed.ts` | Seed the database with test accounts |
