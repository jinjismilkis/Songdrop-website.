# songdrop — SendTheSong-inspired starter

A responsive, front-end-only song dedication website built with plain HTML, CSS and JavaScript.

## Project structure

```text
sendthesong-inspired/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Run locally

1. Extract the project folder.
2. Open `index.html` in a modern browser, or serve the folder with a local development server:
   - VS Code: install/use Live Server, then choose **Open with Live Server**.
   - Python: run `python -m http.server 8000` in this folder, then visit `http://localhost:8000`.
3. Create a dedication and test the song wall, reactions, replies, QR card, mood selector and voice recorder.

## Implemented in this starter

- Responsive hybrid visual design inspired by song dedication sites.
- Live dedication card preview and four card themes.
- Create dedications with recipient, message, mood, song title, artist and optional song URL.
- Play supported songs directly inside a dedication card using YouTube, Spotify, SoundCloud, or direct audio-file links (MP3, WAV, OGG, M4A, AAC, FLAC).
- Anonymous sender and mystery-mode options.
- Song wall with mood filters.
- Heart and sparkle reactions.
- Replies on cards when enabled.
- Shareable hash links (`#card=...`).
- QR code generation (uses QRCode.js CDN, so QR rendering needs an internet connection).
- Browser voice recording (requires microphone permission and a secure context such as `localhost` or HTTPS).

## Important limitations

This is a working **local prototype**, not a deployed multi-user service:
- Data is stored in the browser's `localStorage`. It does not sync between devices or users.
- Share links and QR codes open the card only in the same browser profile where the card was created. For real public sharing, connect a backend/database and deploy the app.
- Voice recordings are stored in the local browser data with the dedication. Large recordings can exceed browser storage limits. Keep recordings short.
- Song playback uses official third-party embeds or a user-provided direct audio URL. The site does not download or host copyrighted music. Some songs or regions may not allow embedding, and visitors need an internet connection. Playback starts only when the visitor presses play.
- The anonymous and mystery settings are presentation features, not guaranteed anonymity. Do not use them for sensitive messages.
- No accounts, server-side moderation, spam protection, or production-grade privacy controls are included.

## Suggested next development step

Add a backend (for example, Supabase) with authenticated administration, public card IDs, access rules, content reporting, rate limiting, and durable audio storage before opening it to real users.


## Album artwork and song clips
- Add an optional public album-cover image URL when creating a dedication. The image appears in the vinyl record label and song thumbnail.
- Set both **Clip starts at** and **Clip ends at** in seconds to select a song portion (for example, 35 and 65).
- Clip timing is applied to YouTube embeds and direct audio file links. Spotify and SoundCloud embeds use their own playback controls and do not accept this custom clip range in this prototype.
- Only use artwork and audio links you have permission to share.
