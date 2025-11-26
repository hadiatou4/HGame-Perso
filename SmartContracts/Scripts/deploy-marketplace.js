const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying Marketplace to Hedera Testnet...\n");

  // Récupérer le déployeur
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Vérifier le solde
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "HBAR\n");

  // Le feeRecipient sera le déployeur (tu recevras les 2% de frais)
  const feeRecipient = deployer.address;
  console.log("💵 Fee recipient (2%):", feeRecipient, "\n");

  // Déployer le contrat
  console.log("⏳ Deploying Marketplace contract...");
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(feeRecipient);

  await marketplace.waitForDeployment();
  const contractAddress = await marketplace.getAddress();

  console.log("✅ Marketplace deployed!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Contract Address:", contractAddress);
  console.log("💵 Fee Recipient:", feeRecipient);
  console.log("📊 Fee Percent:", "2%");
  console.log("👤 Owner:", deployer.address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Vérifier que le contrat est bien déployé
  console.log("🔍 Verifying contract deployment...");
  const owner = await marketplace.owner();
  const feePercent = await marketplace.feePercent();
  const totalListings = await marketplace.totalListings();
  
  console.log("✅ Owner:", owner);
  console.log("✅ Fee Percent:", feePercent.toString(), "%");
  console.log("✅ Total Listings:", totalListings.toString());
  console.log("✅ Contract is operational!\n");

  // Sauvegarder l'adresse du contrat dans un fichier
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    feeRecipient: feeRecipient,
    feePercent: 2,
    owner: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, 'Marketplace.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile, "\n");

  // Copier l'ABI vers hcs-service
  console.log("📦 Copying ABI to hcs-service...");
  
  const artifactPath = path.join(__dirname, '../artifacts/contracts/Marketplace.sol/Marketplace.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Copier vers hcs-service
  const hcsAbisDir = path.join(__dirname, '../../hcs-service/abis');
  if (!fs.existsSync(hcsAbisDir)) {
    fs.mkdirSync(hcsAbisDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(hcsAbisDir, 'Marketplace.json'),
    JSON.stringify(artifact, null, 2)
  );
  console.log("✅ Full artifact copied to hcs-service/abis/Marketplace.json\n");

  // Instructions pour la suite
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 NEXT STEPS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Update hcs-service/.env:");
  console.log(`   MARKETPLACE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("");
  console.log("2. Restart backend:");
  console.log("   cd hcs-service");
  console.log("   npm run dev");
  console.log("");
  console.log("3. View contract on HashScan:");
  console.log(`   https://hashscan.io/testnet/contract/${contractAddress}`);
  console.log("");
  console.log("4. To verify contract on HashScan:");
  console.log("   - Go to the contract page");
  console.log("   - Click 'Contract' tab");
  console.log("   - Click 'Verify Contract'");
  console.log("   - Compiler: v0.8.20");
  console.log("   - Optimization: Yes (200 runs)");
  console.log("   - Constructor args:", feeRecipient);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("🎉 Deployment complete!");
  console.log("Contract is ready to use. You can now:");
  console.log("  • List NFTs with listNFT()");
  console.log("  • Buy NFTs with buyNFT()");
  console.log("  • Cancel listings with cancelListing()");
  console.log("  • View active listings with getActiveListings()\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });