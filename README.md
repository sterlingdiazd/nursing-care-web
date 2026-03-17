# Nursing Care Web

Frontend web client for creating nursing care requests and inspecting client-side request logs.

## Overview

This app provides a simple UI to submit a care request with:

- `residentId` (string, expected GUID)
- `description` (string)

On submit, it sends a `POST` request to the backend API endpoint configured through Vite environment variables.

## Tech Stack

- React 19
- TypeScript
- Axios
- Vite

## Project Structure

```text
src/
  api/
    careRequests.ts      # API contract + createCareRequest call
    httpClient.ts        # Axios instance (base URL + headers + timeout)
    interceptors.ts      # Axios request/response interceptors
  config/
    env.ts               # Reads VITE_API_BASE_URL from environment
  App.tsx                # Main form UI + submit logic
  index.tsx              # App bootstrap + interceptor initialization
```

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm start
```

3. Open:

- `http://localhost:3000`

## Available Scripts

- `npm start` - run Vite development server
- `npm run build` - build the production bundle
- `npm run preview` - preview the built app
- `npm test` - run Vitest

## Environment Configuration

Copy `.env.example` to a local env file and adjust values as needed.

Key settings:

- `VITE_API_BASE_URL=https://10.0.0.33:5050/api`
- `VITE_API_PROXY_TARGET=https://10.0.0.33:5050`

## API Contract

Defined in `src/api/careRequests.ts`:

### Request type

```ts
interface CreateCareRequestRequest {
  residentId: string;
  description: string;
}
```

### Endpoint call

- Method: `POST`
- URL: `${VITE_API_BASE_URL}/care-requests`
- Headers:
  - `Content-Type: application/json`
  - `X-Correlation-ID`
  - `X-Client-App: nursing-care-web`
  - `X-Client-Platform: web`
- Body: JSON payload matching `CreateCareRequestRequest`

### Success behavior

- Expects JSON response
- UI displays: `Created CareRequest with ID: <id>`

### Error behavior

- Normalizes backend error payloads into a user-facing message
- UI displays error text in red

## Request Flow

1. User fills `Resident ID` and `Description` in `App.tsx`.
2. `handleSubmit()` calls `createCareRequest()`.
3. Axios request interceptors add correlation and client headers.
4. API returns success JSON or an error payload.
5. UI renders success or failure message.
6. Client logs are shown in the page.

## Logging

The web client logs:

- UI lifecycle events
- request started/completed/failed events
- correlation IDs from the backend

Logs are stored in `localStorage` and displayed in the UI for debugging.

## Troubleshooting

- If submit fails with network errors, confirm the backend is running on `https://<lan-ip>:5050`.
- If CORS errors appear, enable CORS on the backend for `http://localhost:3000`.
- If HTTPS errors appear, trust the local backend certificate on the machine.

## Suggested Next Improvements

- Add input validation for `residentId` and `description`.
- Replace the default CRA-era tests with Vitest coverage for the form and API errors.
- Move more inline styles into shared components or CSS modules if the UI grows.
