const hre = require('hardhat');
require('dotenv').config();

const ACHIEVEMENTS = [
  { name: 'Galactic Commander', rarity: 'Legendary' },
  { name: 'Stellar Destroyer', rarity: 'Legendary' },
  { name: 'Photonic Blade', rarity: 'Epic' },
  { name: 'Orbital Sniper', rarity: 'Epic' },
  { name: 'Solar Flame', rarity: 'Rare' },
  { name: 'Void Survivor', rarity: 'Rare' },
];

async function main() {
  const nftAddress = process.env.NFT_CONTRACT_ADDRESS;

  if (!nftAddress) {
    console.error('NFT_CONTRACT_ADDRESS not set in .env');
    process.exit(1);
  }

  console.log('Minting test NFTs...');
  console.log('NFT Contract:', nftAddress);

  const [minter] = await hre.ethers.getSigners();
  console.log('Minting to:', minter.address);

  const nft = await hre.ethers.getContractAt('SimpleNFT', nftAddress);

  console.log('');
  console.log('Minting NFTs...');

  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const achievement = ACHIEVEMENTS[i];
    const tokenURI = `ipfs://QmTest${i + 1}/${achievement.name.replace(/\s/g, '')}`;

    console.log(`Minting ${i + 1}/${ACHIEVEMENTS.length}: ${achievement.name} (${achievement.rarity})`);

    const tx = await nft.mint(minter.address, tokenURI);
    await tx.wait();

    console.log(`  Token ID: ${i + 1}`);
    console.log(`  URI: ${tokenURI}`);
    console.log('');
  }

  const totalSupply = await nft.totalSupply();
  console.log(`Total NFTs minted: ${totalSupply}`);
  console.log('');
  console.log('You can now list these NFTs on the marketplace!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
