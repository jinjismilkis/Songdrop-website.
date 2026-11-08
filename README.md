# songdrop. — Spotify song dedication website

A responsive song-dedication website built with HTML, CSS and JavaScript.

## Pages

- `index.html`: Discover page and Song Wall.
- `create.html`: Separate dedication creation studio with Spotify search and live card preview.
- `styles.css`: Desktop and mobile-first responsive design.
- `app.js`: Spotify connection, catalog search, cards, reactions and replies.

## Run locally

Use VS Code Live Server or another local web server. Open `create.html` to create a dedication. Spotify OAuth requires HTTPS or localhost.

## Set up Spotify catalog search

Spotify requires a developer app and a Client ID. The Client ID is public and is stored in this browser only. Do not put a Spotify client secret in this front-end project.

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) and sign in.
2. Create a Spotify app and copy its **Client ID**.
3. In the app settings, add the exact Redirect URI for your creation page. Examples:
   - Local Live Server: `http://127.0.0.1:5500/create.html` (use the exact host and port shown by Live Server).
   - Deployed website: `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/create.html`
4. Save the Spotify app settings.
5. Open songdrop's `create.html`, expand the Spotify Client ID setup if needed, paste the Client ID, save it, then choose **Connect**.
6. Approve Spotify access. Search by track, artist or album and select a result.

The website uses Spotify's Authorization Code with PKCE flow. It does not need a client secret. If the redirect URI does not exactly match the value registered in the Spotify Dashboard, sign-in will fail.

## Spotify playback

Selected songs use Spotify's official embedded player. Playback and availability depend on Spotify, the track, region, browser and the listener's Spotify account. Some tracks require a Spotify Premium account for full playback. This website does not download or host music.

## Current prototype limitations

- Dedications are saved in browser localStorage. They do not sync between devices or users.
- Song Wall cards are visible only in the browser where they were created.
- Spotify access tokens are kept in local browser storage for this prototype. If a session expires, reconnect Spotify.
- This is a front-end prototype. Add a backend/database, account system, server-side token handling, moderation and privacy controls before launching it as a public multi-user service.
- The website is not affiliated with Spotify. Spotify names and marks belong to Spotify.

## Publish with GitHub Pages

In the repository, open **Settings → Pages**, select **Deploy from a branch**, choose the `main` branch and `/(root)`, then save. Once published, register the exact `create.html` URL as a Spotify Redirect URI.
