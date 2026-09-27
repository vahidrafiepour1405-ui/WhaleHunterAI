# Connect the mobile app to the online API

Set the Expo public environment variable:

EXPO_PUBLIC_API_BASE_URL=https://YOUR-API-DOMAIN

Never put ALCHEMY_API_KEY or COINGECKO_API_KEY in the mobile app.

The backend keeps provider credentials server-side and exposes:
- GET /health
- GET /api/v1/status
- GET /api/v1/scan-market?limit=20
- GET /api/v1/token/:chain/:address

The app automatically uses the online API when EXPO_PUBLIC_API_BASE_URL is present. Otherwise it keeps the local provider-abstraction path.
