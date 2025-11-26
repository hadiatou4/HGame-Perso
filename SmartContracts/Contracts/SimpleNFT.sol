// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Simple NFT Contract pour tester le Marketplace
 * TON AMI REMPLACERA CE CONTRAT PAR LE VRAI
 */
contract SimpleNFT {
    
    string public name = "Space War Test NFT";
    string public symbol = "SWTNFT";
    
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => address) private _owners;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    /**
     * Mint un nouveau NFT
     */
    function mint(address to, string memory tokenURI) external returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _owners[tokenId] = to;
        _tokenURIs[tokenId] = tokenURI;
        
        emit Transfer(address(0), to, tokenId);
        
        return tokenId;
    }
    
    /**
     * Retourne le propriétaire d'un NFT
     */
    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }
    
    /**
     * Approuve une adresse à transférer un NFT
     */
    function approve(address to, uint256 tokenId) external {
        address owner = _owners[tokenId];
        require(msg.sender == owner, "Not token owner");
        
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }
    
    /**
     * Retourne l'adresse approuvée pour un NFT
     */
    function getApproved(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }
    
    /**
     * Transfère un NFT
     */
    function transferFrom(address from, address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        require(_owners[tokenId] == from, "From is not owner");
        require(to != address(0), "Invalid recipient");
        
        delete _tokenApprovals[tokenId];
        
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    /**
     * Retourne l'URI d'un NFT
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }
    
    /**
     * Vérifie si une adresse est autorisée pour un NFT
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) private view returns (bool) {
        address owner = _owners[tokenId];
        return (spender == owner || _tokenApprovals[tokenId] == spender || _operatorApprovals[owner][spender]);
    }
    
    /**
     * Retourne le nombre total de NFTs mintés
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
