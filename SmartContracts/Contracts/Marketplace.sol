// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC721.sol";

/**
 * Marketplace pour trader des NFTs Space War
 * Compatible avec n'importe quel contrat ERC721
 */
contract Marketplace {
    
    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }
    
    uint256 private _listingIdCounter;
    mapping(uint256 => Listing) public listings;
    
    uint256 public feePercent = 2;
    address public feeRecipient;
    address public owner;
    
    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        uint256 timestamp
    );
    
    event NFTPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 price,
        uint256 fee,
        uint256 timestamp
    );
    
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller,
        uint256 timestamp
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }
    
    /**
     * Lister un NFT à vendre
     * Le NFT doit être approuvé au marketplace avant
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external returns (uint256) {
        require(price > 0, "Price must be > 0");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );
        
        _listingIdCounter++;
        uint256 listingId = _listingIdCounter;
        
        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: block.timestamp
        });
        
        emit NFTListed(
            listingId,
            nftContract,
            tokenId,
            msg.sender,
            price,
            block.timestamp
        );
        
        return listingId;
    }
    
    /**
     * Acheter un NFT listé
     */
    function buyNFT(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own NFT");
        
        listing.active = false;
        
        uint256 fee = (listing.price * feePercent) / 100;
        uint256 sellerAmount = listing.price - fee;
        
        IERC721(listing.nftContract).transferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );
        
        payable(listing.seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(fee);
        
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit NFTPurchased(
            listingId,
            msg.sender,
            listing.seller,
            listing.price,
            fee,
            block.timestamp
        );
    }
    
    /**
     * Annuler un listing
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");
        
        listing.active = false;
        
        emit ListingCancelled(listingId, msg.sender, block.timestamp);
    }
    
    /**
     * Obtenir les détails d'un listing
     */
    function getListing(uint256 listingId) external view returns (
        address nftContract,
        uint256 tokenId,
        address seller,
        uint256 price,
        bool active,
        uint256 listedAt
    ) {
        Listing memory listing = listings[listingId];
        return (
            listing.nftContract,
            listing.tokenId,
            listing.seller,
            listing.price,
            listing.active,
            listing.listedAt
        );
    }
    
    /**
     * Retourne tous les listings actifs
     */
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= _listingIdCounter; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }
        
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _listingIdCounter; i++) {
            if (listings[i].active) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        
        return activeListings;
    }
    
    /**
     * Mettre à jour les frais (seulement owner)
     */
    function setFeePercent(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 10, "Fee too high");
        uint256 oldFee = feePercent;
        feePercent = newFeePercent;
        emit FeeUpdated(oldFee, newFeePercent);
    }
    
    /**
     * Mettre à jour le destinataire des frais
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
    
    /**
     * Retourne le nombre total de listings créés
     */
    function totalListings() external view returns (uint256) {
        return _listingIdCounter;
    }
}
