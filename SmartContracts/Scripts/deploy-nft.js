const hre = require('hardhat');

async function main() {
  console.log('Deploying SimpleNFT contract to Hedera Testnet...');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'HBAR');

  const SimpleNFT = await hre.ethers.getContractFactory('SimpleNFT');
  const nft = await SimpleNFT.deploy();

  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();

  console.log('SimpleNFT deployed to:', nftAddress);
  console.log('');
  console.log('Add this to your .env file:');
  console.log(`NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log('');
  console.log('View on HashScan:');
  console.log(`https://hashscan.io/testnet/contract/${nftAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
