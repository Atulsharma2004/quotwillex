# Content moderation (Node only)

Abusive / sexual / offensive word checks run **inside the Express backend**.
There is no Python service.

## Generate / refresh wordlist (~60–70k)

```bash
cd backend
npm run moderation:generate
```

Writes `data/abusive_words.json`.

## How it stays fast

- Wordlist loads **once** at server boot into memory `Set`s
- Each check is **O(number of tokens)** (not 70k regexes)
- Frontend only calls `POST /api/moderation/check` — the big list never ships to the browser
- Text is capped at 4,000 characters per check

## API

```http
POST /api/moderation/check
Authorization: Bearer <jwt>
Content-Type: application/json

{ "text": "...", "language": "english" }
```
