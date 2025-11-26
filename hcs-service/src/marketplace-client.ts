import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface MarketplaceListing {
  listingId: number;
  nftContract: string;
  tokenId: number;
  seller: string;
  price: string;
  active: boolean;
  listedAt: number;
}

export class MarketplaceClient {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private marketplaceContract: ethers.Contract;
  private nftContract: ethers.Contract;

  constructor() {
    const marketplaceAddress = process.env.MARKETPLACE_CONTRACT_ADDRESS;
    const nftAddress = process.env.NFT_CONTRACT_ADDRESS;
    const privateKey = process.env.GAME_SERVER_PRIVATE_KEY;
    const rpcUrl = process.env.HEDERA_RPC_URL || 'https://testnet.hashio.io/api';

    if (!marketplaceAddress) {
      throw new Error('MARKETPLACE_CONTRACT_ADDRESS not set in .env file');
    }

    if (!nftAddress) {
      throw new Error('NFT_CONTRACT_ADDRESS not set in .env file');
    }

    if (!privateKey) {
      throw new Error('GAME_SERVER_PRIVATE_KEY not set in .env file');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    const marketplaceAbiPath = path.join(__dirname, '../abis/Marketplace.json');
    const nftAbiPath = path.join(__dirname, '../abis/SimpleNFT.json');

    if (!fs.existsSync(marketplaceAbiPath)) {
      throw new Error(`Marketplace ABI not found at ${marketplaceAbiPath}`);
    }

    if (!fs.existsSync(nftAbiPath)) {
      throw new Error(`NFT ABI not found at ${nftAbiPath}`);
    }

    const marketplaceJson = JSON.parse(fs.readFileSync(marketplaceAbiPath, 'utf8'));
    const nftJson = JSON.parse(fs.readFileSync(nftAbiPath, 'utf8'));
    
    const marketplaceAbi = marketplaceJson.abi || marketplaceJson;
    const nftAbi = nftJson.abi || nftJson;

    this.marketplaceContract = new ethers.Contract(
      marketplaceAddress,
      marketplaceAbi,
      this.wallet
    );

    this.nftContract = new ethers.Contract(nftAddress, nftAbi, this.wallet);

    console.log('MarketplaceClient initialized');
    console.log(`   Marketplace: ${marketplaceAddress}`);
    console.log(`   NFT Contract: ${nftAddress}`);
    console.log(`   Wallet: ${this.wallet.address}`);
  }

  async getActiveListings(): Promise<MarketplaceListing[]> {
    try {
      console.log('Fetching active listings...');
      const listings = await this.marketplaceContract.getActiveListings();

      return listings.map((listing: any) => ({
        listingId: Number(listing.listingId),
        nftContract: listing.nftContract,
        tokenId: Number(listing.tokenId),
        seller: listing.seller,
        price: listing.price.toString(), // Retourne Wei (BigInt as string)
        priceFormatted: ethers.formatEther(listing.price), // HBAR formaté pour affichage
        active: listing.active,
        listedAt: Number(listing.listedAt),
      }));
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  async listNFT(
    tokenId: number,
    priceInHbar: string | number
  ): Promise<{ success: boolean; listingId?: number; txHash?: string; error?: string }> {
    try {
      console.log(`Listing NFT ${tokenId} for ${priceInHbar} HBAR`);

      const nftAddress = process.env.NFT_CONTRACT_ADDRESS;
      // Convertir en string si c'est un number
      const priceStr = typeof priceInHbar === 'number' ? priceInHbar.toString() : priceInHbar;
      const priceInWei = ethers.parseEther(priceStr);

      const owner = await this.nftContract.ownerOf(tokenId);
      if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
        return {
          success: false,
          error: 'Wallet does not own this NFT',
        };
      }

      console.log('Approving marketplace...');
      const approveTx = await this.nftContract['approve'](
        this.marketplaceContract.target,
        tokenId,
        { gasLimit: 200000 }
      );
      await approveTx.wait();
      console.log('Marketplace approved');

      console.log('Creating listing...');
      const listTx = await this.marketplaceContract['listNFT'](
        nftAddress,
        tokenId,
        priceInWei,
        { gasLimit: 300000 }
      );

      const receipt = await listTx.wait();

      const event = receipt.logs.find(
        (log: any) => log.fragment && log.fragment.name === 'NFTListed'
      );
      const listingId = event ? Number(event.args[0]) : undefined;

      console.log(`NFT listed successfully. Listing ID: ${listingId}`);

      return {
        success: true,
        listingId,
        txHash: listTx.hash,
      };
    } catch (error) {
      console.error('Error listing NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async cancelListing(listingId: number): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      console.log(`Cancelling listing ${listingId}...`);

      const tx = await this.marketplaceContract['cancelListing'](listingId, {
        gasLimit: 200000,
      });
      await tx.wait();

      console.log(`Listing ${listingId} cancelled`);

      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error) {
      console.error('Error cancelling listing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getNFTMetadata(tokenId: number): Promise<string> {
    try {
      return await this.nftContract.tokenURI(tokenId);
    } catch (error) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      return '';
    }
  }

  async getMarketplaceAddress(): Promise<string> {
    return this.marketplaceContract.target as string;
  }

  async getNFTContractAddress(): Promise<string> {
    return this.nftContract.target as string;
  }
}

export default MarketplaceClient;