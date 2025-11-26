const hre = require('hardhat');

async function main() {
  console.log('Deploying Marketplace contract to Hedera Testnet...');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'HBAR');

  const feeRecipient = deployer.address;
  console.log('Fee recipient:', feeRecipient);

  const Marketplace = await hre.ethers.getContractFactory('Marketplace');
  const marketplace = await Marketplace.deploy(feeRecipient);

  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log('Marketplace deployed to:', marketplaceAddress);
  console.log('Fee percent:', await marketplace.feePercent(), '%');
  console.log('');
  console.log('Add this to your .env file:');
  console.log(`MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`);
  console.log('');
  console.log('View on HashScan:');
  console.log(`https://hashscan.io/testnet/contract/${marketplaceAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
