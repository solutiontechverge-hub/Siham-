# Frontend

## Setup
1. Install dependencies: `npm install`
2. Configure API URL in `.env` / `.env.development` (see `.env.example`)
3. Run dev server: `npm run dev`

App URL: `http://localhost:3000`

## Backend / IDs

The API returns **string UUIDs** for user, shop, booking, and service ids (not numbers). Run backend migrations and use the dev seed users documented in the [root README](../README.md#dev-seed-users) before testing login or client listing flows.

Ryan Harris Salon shop id comes from the API after seeding (not a fixed value in repo).
