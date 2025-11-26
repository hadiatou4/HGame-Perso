const hre = require("hardhat");

async function main() {
  console.log("📝 Listing NFT #3...\n");

  const nft = await hre.ethers.getContractAt(
    'SimpleNFT',
    '0x2Ad4Ea9E243e9544Eea109C9C5b71fB6Ce095A57'
  );

  const marketplace = await hre.ethers.getContractAt(
    'Marketplace',
    '0x7777e9978CDc0A8e52DEf826E219aa4A97484F8a'
  );

  console.log("Approving...");
  const approveTx = await nft.approve(marketplace.target, 3, { gasLimit: 50000 });
  await approveTx.wait();
  console.log("✅ Approved");

  console.log("Listing...");
  const listTx = await marketplace.listNFT(
    nft.target,
    3,
    hre.ethers.parseEther('5'),
    { gasLimit: 250000 }
  );
  await listTx.wait();
  console.log("✅ Listed NFT #3 for 5 HBAR!");
}

main().catch(console.error);