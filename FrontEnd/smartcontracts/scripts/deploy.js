const hre = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('Déploiement des Smart Contracts sur Hedera Testnet...\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Déploiement avec le compte:', deployer.address);

  // 1. Deploy NFTCollection
  console.log('\nDéploiement du NFTCollection...');
  const NFTCollection = await hre.ethers.getContractFactory('NFTCollection');
  const nftCollection = await NFTCollection.deploy();
  await nftCollection.waitForDeployment();
  const nftAddress = await nftCollection.getAddress();
  console.log('NFTCollection déployé à:', nftAddress);

  // 2. Deploy Marketplace
  console.log('\nDéploiement du Marketplace...');
  const Marketplace = await hre.ethers.getContractFactory('Marketplace');
  const marketplace = await Marketplace.deploy(nftAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log('Marketplace déployé à:', marketplaceAddress);

  // 3. Deploy Leaderboard
  console.log('\nDéploiement du Leaderboard...');
  const Leaderboard = await hre.ethers.getContractFactory('Leaderboard');
  const leaderboard = await Leaderboard.deploy();
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();
  console.log('Leaderboard déployé à:', leaderboardAddress);

  // 4. Deploy AchievementVerifier
  console.log('\nDéploiement du AchievementVerifier...');
  const AchievementVerifier = await hre.ethers.getContractFactory(
    'AchievementVerifier'
  );
  const verifier = await AchievementVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log('AchievementVerifier déployé à:', verifierAddress);

  // Save addresses to file
  const addresses = {
    NFTCollection: nftAddress,
    Marketplace: marketplaceAddress,
    Leaderboard: leaderboardAddress,
    AchievementVerifier: verifierAddress,
    deployer: deployer.address,
    network: 'hedera_testnet',
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    './deployed-contracts.json',
    JSON.stringify(addresses, null, 2)
  );

  console.log(
    '\nToutes les adresses sauvegardées dans deployed-contracts.json'
  );
  console.log('\nRésumé des déploiements:');
  console.log('════════════════════════════════════════');
  console.log('NFTCollection    :', nftAddress);
  console.log('Marketplace      :', marketplaceAddress);
  console.log('Leaderboard      :', leaderboardAddress);
  console.log('Verifier         :', verifierAddress);
  console.log('════════════════════════════════════════');

  console.log('\nAjoutez ces adresses à votre .env.local:');
  console.log(`VITE_NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log(`VITE_MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`);
  console.log(`VITE_LEADERBOARD_CONTRACT_ADDRESS=${leaderboardAddress}`);
  console.log(`VITE_VERIFIER_CONTRACT_ADDRESS=${verifierAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
