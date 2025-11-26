// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Interface ERC721 standard minimale
 * Compatible avec tous les NFTs Hedera
 */
interface IERC721 {
    /**
     * Transfère un NFT d'une adresse à une autre
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    /**
     * Retourne le propriétaire d'un NFT
     */
    function ownerOf(uint256 tokenId) external view returns (address);

    /**
     * Approuve une adresse à transférer un NFT
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * Retourne l'adresse approuvée pour un NFT
     */
    function getApproved(uint256 tokenId) external view returns (address);

    /**
     * Event émis lors d'un transfert
     */
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    /**
     * Event émis lors d'une approbation
     */
    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );
}
