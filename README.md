# Whale Hunter AI

Mobile crypto intelligence app with a modular multi-agent architecture.

## Architecture
- Market Scanner
- Whale Hunter
- Independent Whale Filter
- DEX Buy Detector
- CEX Flow
- Accumulation Detector
- Whale Network
- Technical
- Smart Money / Liquidity
- Volume
- Tokenomics
- Contract / Security
- New Token
- Early Accumulation
- Pump Pattern
- Distribution
- Sentiment
- Futures
- Market Regime
- False Signal
- Master

Agents are registered through a central registry so new agents can be added without rewriting the core UI.

## Important
The current mobile build is a UI/architecture foundation. Live blockchain results require configured data providers and API credentials. The app must distinguish confirmed DEX swaps from CEX transfers and unknown flows and must never treat transfer activity alone as proof of buying.


## Android build
The repository includes a GitHub Actions workflow at .github/workflows/eas-build.yml for an APK build. It requires an Expo EAS token stored as the GitHub Actions secret EXPO_TOKEN; secrets are never committed to source control.

## Live data
Alchemy Transfers API supports historical ERC-20 transfers across Ethereum and supported L2s. The provider uses pagination so large transfer histories are not silently truncated. Live whale-holder discovery still requires a holder/indexing provider; transfer-only data is never presented as proof of a fresh buy.
\n\nWhale Hunter AI v22 trading analysis build.\n