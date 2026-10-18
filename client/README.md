# PDF Companion

PDF Companion is a React frontend for the PDF question-answering API in `server/`.
Upload a text-readable PDF, wait for indexing to finish, and ask questions about
the document. Responses support Markdown and show the retrieved document
sections used to answer.

## Run locally

1. Start the backend on port `3000` with its required service credentials and
   database configured.
2. In `client/`, run `npm install` and `npm run dev`.
3. Open the Vite URL shown in the terminal.

The API defaults to `http://localhost:3000`. Set `VITE_API_URL` in a client
`.env` file to use a different backend origin.

## API contract

- `POST /api/chat/send` — multipart form data with a `file` field containing a
  PDF. The frontend uses the returned `data.documentId` to identify the
  processed document.
- `POST /api/chat/ask` — JSON body `{ "documentId": "...", "question": "..." }`.
  Successful responses include `data.answer` and `data.sources`.

The upload endpoint processes and indexes the PDF before it responds, so larger
files may take a little while to become ready for questions.
