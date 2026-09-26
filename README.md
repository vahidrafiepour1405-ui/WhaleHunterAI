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
