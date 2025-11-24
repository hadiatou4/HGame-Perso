const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying LeaderboardManager to Hedera Testnet...\n");

  // Récupérer le déployeur
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Vérifier le solde
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "HBAR\n");

  // Adresse du game server (pour l'instant, c'est la même que le déployeur)
  // Tu pourras la changer plus tard avec setGameServer()
  const gameServerAddress = deployer.address;
  console.log("🎮 Game Server address:", gameServerAddress, "\n");

  // Déployer le contrat
  console.log("⏳ Deploying contract...");
  const LeaderboardManager = await hre.ethers.getContractFactory("LeaderboardManager");
  const leaderboard = await LeaderboardManager.deploy(gameServerAddress);

  await leaderboard.waitForDeployment();
  const contractAddress = await leaderboard.getAddress();

  console.log("✅ LeaderboardManager deployed!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Contract Address:", contractAddress);
  console.log("🎮 Game Server:", gameServerAddress);
  console.log("👤 Owner:", deployer.address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Sauvegarder l'adresse du contrat dans un fichier
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    gameServer: gameServerAddress,
    owner: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, 'LeaderboardManager.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile, "\n");

  // Copier l'ABI vers hcs-service et FrontEnd
  console.log("📦 Copying ABI files...");
  
  const artifactPath = path.join(__dirname, '../artifacts/contracts/LeaderboardManager.sol/LeaderboardManager.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Copier vers hcs-service
  const hcsAbisDir = path.join(__dirname, '../../hcs-service/abis');
  if (!fs.existsSync(hcsAbisDir)) {
    fs.mkdirSync(hcsAbisDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(hcsAbisDir, 'LeaderboardManager.json'),
    JSON.stringify(artifact.abi, null, 2)
  );
  console.log("✅ ABI copied to hcs-service/abis/");

  // Copier vers FrontEnd
  const frontendAbisDir = path.join(__dirname, '../../FrontEnd/src/abis');
  if (!fs.existsSync(frontendAbisDir)) {
    fs.mkdirSync(frontendAbisDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendAbisDir, 'LeaderboardManager.json'),
    JSON.stringify(artifact.abi, null, 2)
  );
  console.log("✅ ABI copied to FrontEnd/src/abis/\n");

  // Instructions pour la suite
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 NEXT STEPS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Add to hcs-service/.env:");
  console.log(`   LEADERBOARD_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`   GAME_SERVER_PRIVATE_KEY=<your_private_key>`);
  console.log("");
  console.log("2. Add to FrontEnd/.env (or environment.ts):");
  console.log(`   LEADERBOARD_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("");
  console.log("3. Start the leaderboard aggregator:");
  console.log("   cd hcs-service");
  console.log("   npm run aggregator");
  console.log("");
  console.log("4. View contract on HashScan:");
  console.log(`   https://hashscan.io/testnet/contract/${contractAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Vérifier le contrat
  console.log("🔍 Verifying contract deployment...");
  const owner = await leaderboard.owner();
  const gameServer = await leaderboard.gameServer();
  console.log("✅ Owner:", owner);
  console.log("✅ Game Server:", gameServer);
  console.log("✅ Contract is operational!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });