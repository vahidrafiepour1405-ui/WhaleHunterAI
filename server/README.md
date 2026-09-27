# Whale Hunter AI Online API

This service is the server-side layer for the mobile app.

## Endpoints
GET /health
GET /api/v1/status
GET /api/v1/token/:chain/:address
GET /api/v1/scan?chain=ethereum&address=0x...

## Security
API credentials belong only on the server. Never put provider keys in the React Native app.

## Evidence rule
A transfer is not treated as a buy. Confirmed DEX spot-buy activity is kept separate from CEX/unknown transfers.

## Production requirements
Configure ALCHEMY_API_KEY for EVM transfer history and add a holder/indexing provider before enabling independent-whale claims. The server is intentionally explicit about missing data rather than fabricating whale signals.
