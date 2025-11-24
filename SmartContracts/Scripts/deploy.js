const hre = require("hardhat");
 
async function main() {
    console.log("🚀 Starting deployment of HederaGameRewardNFT...");
 
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer address:", deployer.address);
 
    // --- PARAMÈTRES D'INITIALISATION ---
    // Note: Le déployeur (msg.sender) devient automatiquement l'Owner (Admin)
   
    // Adresse du serveur de jeu qui signe les sessions EIP-712
    const gameServer = deployer.address;
    // Adresse du worker backend qui appellera verifySessionAndMintReward
    const operator = deployer.address;  
 
    console.log("📌 Using GameServer (Signer):", gameServer);
    console.log("📌 Using Operator (Backend Worker):", operator);
 
    // Load contract (CHANGEMENT #1: Nouveau nom de contrat)
    const RewardNFT = await hre.ethers.getContractFactory("HederaGameRewardNFT");
 
    // Deploy contract (CHANGEMENT #2: Appel des arguments du constructeur)
    // Constructeur: constructor(address initialGameServer, address initialOperator)
    const contract = await RewardNFT.deploy(gameServer, operator);
    await contract.waitForDeployment();
 
    const address = await contract.getAddress();
 
    console.log("🎉 Contract HederaGameRewardNFT successfully deployed!");
    console.log("📍 ADDRESS:", address);
    console.log("-------------------------------------------------------------------");
    console.log("🚨 ATTENTION: Les adresses GameServer et Operator sont actuellement le DEPLOYER.");
    console.log("Pensez à les mettre à jour via setGameServer() et setOperator() en production.");
   
    return address;
}
 
// Run script
main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Deployment error:", err);
        process.exit(1);
    });
