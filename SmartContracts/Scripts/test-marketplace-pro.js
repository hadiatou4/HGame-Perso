const marketplace = await ethers.getContractAt('Marketplace', '0x7777e9978CDc0A8e52DEf826E219aa4A97484F8a');
const nft = await ethers.getContractAt('SimpleNFT', '0x2Ad4Ea9E243e9544Eea109C9C5b71fB6Ce095A57');

// Récupérer le listing
const listing = await marketplace.getListing(2);
console.log('Price (Wei):', listing.price.toString());
console.log('Price (HBAR):', ethers.formatEther(listing.price));

// Créer un buyer
const buyer = ethers.Wallet.createRandom().connect(ethers.provider);
console.log('Buyer:', buyer.address);

// Envoyer des HBAR
const [seller] = await ethers.getSigners();
await seller.sendTransaction({ to: buyer.address, value: ethers.parseEther('10') });
console.log('✅ Funded');

// ACHETER avec le prix EXACT du contrat
console.log('Buying with EXACT price from contract...');
await marketplace.connect(buyer).buyNFT(2, { value: listing.price, gasLimit: 300000 });
console.log('✅ SUCCESS!');