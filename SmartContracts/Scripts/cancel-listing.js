const marketplace = await ethers.getContractAt('Marketplace', '0x7777e9978CDc0A8e52DEf826E219aa4A97484F8a');

// Cancel listing #1
await marketplace.cancelListing(1);
console.log('✅ Cancelled #1');

// Cancel listing #2  
await marketplace.cancelListing(2);
console.log('✅ Cancelled #2');

// Garde juste le #0