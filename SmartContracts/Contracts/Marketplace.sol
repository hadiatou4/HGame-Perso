// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC721.sol";

/**
 * Marketplace PRO pour Space War
 * 
 * SOLUTIONS APPLIQUÉES:
 * 1. Pattern "Checks-Effects-Interactions" (CEI)
 * 2. Pull Payment Pattern (plus sûr que push)
 * 3. ReentrancyGuard
 * 4. Ordre optimisé des opérations
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
    
    // Balances à retirer (Pull Payment Pattern)
    mapping(address => uint256) public pendingWithdrawals;
    
    uint256 public feePercent = 2;
    address public feeRecipient;
    address public owner;
    
    // Protection contre reentrancy
    bool private locked;
    
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
    
    event WithdrawalReady(address indexed recipient, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier noReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }
    
    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
        _listingIdCounter = 0;
        locked = false;
    }
    
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
        
        uint256 listingId = _listingIdCounter;
        _listingIdCounter++;
        
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
     * Acheter un NFT avec Pull Payment Pattern
     * Plus sûr et résout les problèmes de gas
     */
    function buyNFT(uint256 listingId) external payable noReentrant {
        Listing storage listing = listings[listingId];
        
        // CHECKS
        require(listing.active, "Listing not active");
        require(msg.value == listing.price, "Incorrect payment"); // EXACT price
        require(msg.sender != listing.seller, "Cannot buy own NFT");
        
        // EFFECTS (modifier le state AVANT les external calls)
        listing.active = false;
        
        uint256 fee = (listing.price * feePercent) / 100;
        uint256 sellerAmount = listing.price - fee;
        
        // Ajouter aux balances à retirer
        pendingWithdrawals[listing.seller] += sellerAmount;
        pendingWithdrawals[feeRecipient] += fee;
        
        emit WithdrawalReady(listing.seller, sellerAmount);
        emit WithdrawalReady(feeRecipient, fee);
        
        // INTERACTIONS (external calls en dernier)
        IERC721(listing.nftContract).transferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );
        
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
     * Retirer ses gains (Pull Payment)
     */
    function withdraw() external noReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        // EFFECTS avant INTERACTION
        pendingWithdrawals[msg.sender] = 0;
        
        // INTERACTION
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * Voir combien on peut retirer
     */
    function getPendingWithdrawal(address account) external view returns (uint256) {
        return pendingWithdrawals[account];
    }
    
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not seller");
        
        listing.active = false;
        
        emit ListingCancelled(listingId, msg.sender, block.timestamp);
    }
    
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < _listingIdCounter; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }
        
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _listingIdCounter; i++) {
            if (listings[i].active) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        
        return activeListings;
    }
    
    function setFeePercent(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 10, "Fee too high");
        uint256 oldFee = feePercent;
        feePercent = newFeePercent;
        emit FeeUpdated(oldFee, newFeePercent);
    }
    
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
    
    function totalListings() external view returns (uint256) {
        return _listingIdCounter;
    }
}
