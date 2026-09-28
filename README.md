# HGame: Web3 Spaceship Shooter on Hedera

A multiplayer 2D spaceship shooter. Players connect an EVM wallet, their game sessions are recorded on the Hedera Consensus Service (HCS), a Solidity contract keeps an on-chain leaderboard, and an NFT marketplace lets them trade items.

Team project built in November 2025 during a 6-month Blockchain & AI training program with The Hashgraph Association, by **Hadiatou Keita** ([@hadiatou4](https://github.com/hadiatou4)) and **Modibo** ([@modibo-ucd](https://github.com/modibo-ucd)). Everything runs on the **Hedera testnet**.

## What I built

Modibo set up the monorepo, the Angular front end and the game client/server. The game itself is adapted from the MIT-licensed [Hedera-Gaming/SpaceWar](https://github.com/Hedera-Gaming/SpaceWar). On top of that, I built the blockchain layer:

- **`hcs-service/`: Node.js + Express API** (TypeScript, `@hashgraph/sdk`, ethers v6)
  - Creates HCS topics and writes each finished game session to a *GameSession* topic.
  - Forwards each session to the `LeaderboardManager` contract (`submitSession`).
  - Reads session history and leaderboards back from the Hedera Mirror Node.
  - An event listener subscribes to the contract's `LeaderboardUpdated` event and republishes the top 10 to a *Leaderboard* HCS topic.
  - Marketplace endpoints list and cancel NFT listings.
- **`SmartContracts/`: Solidity 0.8.20 contracts** (Hardhat)
  - `LeaderboardManager`: on-chain player stats and top-10 ranking. Only the game server can submit sessions. Scores, kills, accuracy and timestamps are bounds-checked, and rejected sessions emit an event.
  - `Marketplace`: fixed-price ERC-721 listings with a 2% fee. Sellers withdraw their proceeds themselves (pull payments), with checks-effects-interactions ordering and a reentrancy guard.
  - Deployment, minting and test-purchase scripts.
- **Front-end features** (Angular): leaderboard page, contract activity feed, marketplace page, and resolving a wallet's Hedera account ID.

## Architecture

```
┌──────────────────────────┐   iframe    ┌────────────────────────────┐
│ FrontEnd (Angular 20)    │────────────▶│ GamePlay (Phaser 3)        │
│ wallet: Reown AppKit +   │             │ client :4500  server :8081 │
│ wagmi · profiles:Supabase│             │ (Socket.IO multiplayer)    │
└───────────┬──────────────┘             └────────────────────────────┘
            │ REST (:3001)
┌───────────▼──────────────┐  submit msg  ┌──────────────────────────┐
│ hcs-service (Express)    │─────────────▶│ HCS topics               │
│                          │              │ GameSession, Leaderboard │
│                          │  JSON-RPC    ├──────────────────────────┤
│                          │─────────────▶│ LeaderboardManager.sol   │
│                          │◀── events ───│ Marketplace.sol          │
└──────────────────────────┘              └──────────────────────────┘
                      Hedera testnet (Hashio RPC, Mirror Node)
```

## Tech stack

Angular 20, TypeScript, Phaser 3, Socket.IO, Node.js, Express, Hedera SDK (`@hashgraph/sdk`), Hedera Consensus Service, Solidity, Hardhat, ethers v6, viem/wagmi, Reown AppKit, Supabase.

## Running locally

You need Node.js 22, a Hedera testnet account ([portal.hedera.com](https://portal.hedera.com)) with an ECDSA key, and MetaMask. On Windows, the game's native dependencies need extra setup: see [docs/windows-setup.md](docs/windows-setup.md).

```bash
# 1. Smart contracts
cd SmartContracts && npm install
cp .env.example .env                     # add your testnet ECDSA private key
npx hardhat run Scripts/deploy-leaderboard.js --network hederaTestnet
npx hardhat run Scripts/deploy-marketplace.js --network hederaTestnet

# 2. HCS service (API on :3001)
cd ../hcs-service && npm install
cp .env.example .env                     # operator account + contract addresses
npm run create-topic                     # then put the topic IDs in .env
npm run dev                              # API
npm run event-listener                   # in another terminal

# 3. Front end + game
cd .. && npm install
(cd FrontEnd && npm install) && (cd GamePlay && npm install)
npm run dev:all
```

## Known issues and next steps

- **Leaderboard ranking bug.** In `LeaderboardManager._updateLeaderboard`, a player already in the top 10 who beats their own high score can be placed too low. For example, A=100 and B=50; when A scores 200, the new order is B then A. The player's stored score is updated before the new position is computed. The fix is to remove the player from the ranking before searching for the insertion point.
- **`Marketplace.buyNFT` does not re-check that the seller still owns and has approved the NFT** at purchase time. The call reverts in that case, but only after the user has paid gas.
- **`deploy-nft.js` references `SimpleNFT`,** whose source was removed from `SmartContracts/Contracts/`.
- **No automated tests yet.** `SmartContracts/test/` and `hcs-service/tests/` contain empty scaffolds.
- **URLs are hard-coded** (`localhost:3001`, `localhost:4500`) in the front end.

## Security note

An earlier version of this repository committed `.env` files containing testnet private keys. Those keys are testnet-only, are treated as compromised, and have been removed from the current tree. Secrets now live only in local `.env` files; see the `.env.example` templates.

## Credits

- Game client and server: adapted from [Hedera-Gaming/SpaceWar](https://github.com/Hedera-Gaming/SpaceWar) (MIT).
- Monorepo, front end and game integration: [@modibo-ucd](https://github.com/modibo-ucd).
- HCS service, smart contracts and blockchain integration: [@hadiatou4](https://github.com/hadiatou4).
