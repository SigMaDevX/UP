# jawad-db-api

**Permanent Cloud DB for WhatsApp Bot**  
**Deploy ONCE. Never redeploy. Survives 24h restart.**

---

## Features

- No disks needed
- Data survives 24h auto-restart
- Auto-backup every 30 mins
- Auto-restore on startup
- Hardcoded API key: `jawadxBot804`
- Works on Render Free Tier

---

## Deploy (ONE TIME ONLY)

1. Zip all files
2. Upload to [Render.com](https://render.com) → Web Service
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Deploy**

> **Never redeploy.** Let it run.

---

## API Endpoints

| Method | Endpoint       | Body / Params                    | Description |
|--------|----------------|----------------------------------|-----------|
| GET    | `/status`      | -                                | Health |
| POST   | `/set`         | `{ key, value }`                 | Save |
| GET    | `/get/:key`    | -                                | Get |
| DELETE | `/delete/:key` | -                                | Delete |
| GET    | `/export`      | -                                | Full JSON |
| POST   | `/import`      | `{ data: {}, replace: true }`    | Import |
| GET    | `/dbfile`      | -                                | Download DB |

**Auth Header**:
```http
Authorization: jawadxBot804
