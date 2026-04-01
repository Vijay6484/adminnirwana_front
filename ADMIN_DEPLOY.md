# Admin panel deployment (login)

Login uses **only** `POST https://<api>/api/auth/login` (JWT). Password checks run on the **server**, never in the browser.

## If you see `Illegal arguments: string, undefined` (bcrypt)

That comes from an **old cached build** that still called `bcrypt.compare` in the browser after fetching users (the API no longer returns `password`, so the hash was `undefined`).

**Fix:**

1. From this repo, run `npm ci` (or `npm install`) and `npm run build`.
2. Upload the new `dist/` to your host (replace all files).
3. On `admin.oraastay.com`, do a **hard refresh** (Ctrl+Shift+R / Cmd+Shift+R) or **clear site data** for that origin so the browser drops `index-DK7Heieb.js` and loads the new hashed bundle.

## Nginx (optional, avoids stale `index.html`)

Serve `index.html` with short cache so users pick up new JS filenames after each deploy:

```nginx
location = /index.html {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

Long-cache hashed assets (`/assets/*.js`) as usual.
