// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
 
/**
 * @title HederaGameRewardNFT
 * @notice Unified contract for game session verification + NFT reward minting
 * @dev Combines:
 * - Session verification (GameSessionVerifierFinal structure & functions)
 * - NFT minting via HederaTokenService (GameRewardNFTFull approach)
 * - NO leaderboard (handled via HCS externally)
 *
 * Architecture:
 * 1. Game server signs sessions with EIP-712
 * 2. Sessions published to HCS topic (Hedera Consensus Service)
 * 3. Backend reads HCS -> anti-cheat -> calls verifySessionAndMintReward()
 * 4. Contract verifies signature + mints NFT reward
 * 5. Events emitted for Mirror Node indexing
 *
 * Leaderboard: Read from HCS messages externally (not stored on-chain)
 */
 
import "./HederaResponseCodes.sol";
import "./IHederaTokenService.sol";
import "./HederaTokenService.sol";
import "./ExpiryHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
 
contract HederaGameRewardNFT is
    HederaTokenService,
    ExpiryHelper,
    AccessControl,
    Ownable, // Le constructeur de Ownable doit être appelé
    EIP712
{
    using ECDSA for bytes32;
 
    // ========== CONSTANTS ==========
 
    /// Operator role for backend worker
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
 
    /**
     * @dev EIP-712 TypeHash - matches GameSessionVerifierFinal
     * Structure: GameSession(address player,uint256 score,uint256 kills,uint256 accuracy,uint256 timeSurvived,uint256 timestamp,bytes32 nonce)
     */
    bytes32 private constant GAME_SESSION_TYPEHASH = keccak256(
        "GameSession(address player,uint256 score,uint256 kills,uint256 accuracy,uint256 timeSurvived,uint256 timestamp,bytes32 nonce)"
    );
 
    // ========== STATE VARIABLES ==========
 
    /// Authorized game server address for EIP-712 signatures
    address public gameServer;
 
    /// Last created NFT collection address
    address public lastCreatedCollection;
 
    /// Track valid NFT collections created by this contract
    mapping(address => bool) public isCollection;
 
    /// Prevent double-claim: sessionHash => used status
    mapping(bytes32 => bool) public sessionUsed;
 
    /// Flag suspicious sessions: sessionHash => flagged status
    mapping(bytes32 => bool) public sessionFlagged;
 
    /// Track NFTs minted per player: player => count
    mapping(address => uint256) public playerNFTCount;
 
    // ========== EVENTS ==========
 
    // NFT Collection events
    event NFTCollectionCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed treasury
    );
 
    // Session verification events (matches GameSessionVerifierFinal)
    event SessionVerified(
        bytes32 indexed sessionHash,
        address indexed player,
        uint256 timestamp
    );
 
    event SessionFlagged(
        bytes32 indexed sessionHash,
        address indexed player,
        string reason,
        uint256 timestamp
    );
 
    event RewardRequested(
        bytes32 indexed sessionHash,
        address indexed player,
        string rewardType,
        uint256 timestamp
    );
 
    // NFT minting events
    event NFTMinted(
        address indexed tokenAddress,
        int64 serial,
        address indexed mintedTo,
        string metadataURI
    );
 
    event NFTRewardMinted(
        bytes32 indexed sessionHash,
        address indexed player,
        address indexed tokenAddress,
        int64 serial,
        uint256 score
    );
 
    // Admin events (matches GameSessionVerifierFinal)
    event GameServerUpdated(
        address indexed previousServer,
        address indexed newServer
    );
 
    event OperatorUpdated(
        address indexed previousOperator,
        address indexed newOperator
    );
 
    // ========== CONSTRUCTOR ==========
 
    /**
     * @notice Initialize contract with game server and operator
     * @param initialGameServer Address that signs game sessions (EIP-712)
     * @param initialOperator Backend worker address for session verification
     */
    constructor(address initialGameServer, address initialOperator)
        Ownable(msg.sender) // CORRECTION #1: Appelle le constructeur de Ownable avec le déployeur.
        EIP712("HederaGameSessionVerifier", "1.0")
    {
        require(initialGameServer != address(0), "initialGameServer required");
 
        gameServer = initialGameServer;
 
        // Setup access control
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        if (initialOperator != address(0)) {
            _grantRole(OPERATOR_ROLE, initialOperator);
        }
    }
 
    // ========== MODIFIERS ==========
 
    /// Restricts access to operator or admin
    modifier onlyOperatorOrAdmin() {
        require(
            hasRole(OPERATOR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "only operator or admin"
        );
        _;
    }
 
    // ========== NFT COLLECTION MANAGEMENT ==========
 
    /**
     * @notice Create NFT collection for game rewards
     * @dev Uses HederaTokenService to create non-fungible token
     * @param name Collection name (e.g., "Game Achievements")
     * @param symbol Collection symbol (e.g., "GACH")
     * @param autoRenewPeriod Auto-renew period in seconds
     * @return tokenAddr Address of created NFT collection
     */
    function createNFTCollection(
        string calldata name,
        string calldata symbol,
        uint32 autoRenewPeriod
    ) external onlyRole(OPERATOR_ROLE) returns (address tokenAddr) {
 
        IHederaTokenService.HederaToken memory token;
        token.name = name;
        token.symbol = symbol;
        token.treasury = address(this); // Contract is treasury
        token.expiry = createAutoRenewExpiry(address(this), autoRenewPeriod);
 
        (int responseCode, address created) = HederaTokenService.createNonFungibleToken(token);
        require(responseCode == HederaResponseCodes.SUCCESS, "create token failed");
 
        tokenAddr = created;
        lastCreatedCollection = tokenAddr;
        isCollection[tokenAddr] = true;
 
        emit NFTCollectionCreated(tokenAddr, name, symbol, address(this));
    }
 
    // ========== CORE SESSION VERIFICATION ==========
 
    /**
     * @notice Verify game session and mint NFT reward (main function)
     * @dev Called by operator after:
     * 1. Reading session from HCS
     * 2. Running anti-cheat checks
     * 3. Confirming session is legitimate
     *
     * @param tokenAddr NFT collection address to mint from
     * @param player Player's wallet address
     * @param score Final score achieved
     * @param kills Number of kills
     * @param accuracy Accuracy * 100 (max 10000 = 100%)
     * @param timeSurvived Seconds survived
     * @param timestamp Server timestamp (unix seconds)
     * @param nonce Unique session identifier (prevents replay)
     * @param signature EIP-712 signature from game server
     * @param metadataURI NFT metadata URI (IPFS, etc.)
     *
     * @return sessionHash Unique identifier for this session
     * @return verified Whether signature was valid
     * @return serial Serial number of minted NFT
     */
    function verifySessionAndMintReward(
        address tokenAddr,
        address player,
        uint256 score,
        uint256 kills,
        uint256 accuracy,
        uint256 timeSurvived,
        uint256 timestamp,
        bytes32 nonce,
        bytes calldata signature,
        string calldata metadataURI
    )
        external
        onlyOperatorOrAdmin
        returns (bytes32 sessionHash, bool verified, int64 serial)
    {
        require(tokenAddr != address(0), "invalid token");
        require(isCollection[tokenAddr], "not a valid collection");
        require(player != address(0), "invalid player");
        require(accuracy <= 10000, "invalid accuracy"); // Max 100.00%
        require(timestamp <= block.timestamp + 300, "timestamp too far in future"); // 5min tolerance
 
        // Step 1: Build EIP-712 struct hash (matches GameSessionVerifierFinal)
        bytes32 structHash = keccak256(
            abi.encode(
                GAME_SESSION_TYPEHASH,
                player,
                score,
                kills,
                accuracy,
                timeSurvived,
                timestamp,
                nonce
            )
        );
 
        // Step 2: Build digest and recover signer
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
 
        // Step 3: Verify signer matches game server
        verified = (signer == gameServer);
        require(verified, "Invalid signature - not from game server");
 
        // Step 4: Compute session hash (same formula as GameSessionVerifierFinal)
        sessionHash = keccak256(abi.encodePacked(player, score, timestamp, nonce));
 
        // Step 5: Check session not already used (double-claim protection)
        require(!sessionUsed[sessionHash], "session already used");
 
        // Step 6: Check session not flagged as suspicious
        require(!sessionFlagged[sessionHash], "Session is flagged - cannot mint reward");
 
        // Step 7: Mark session as used
        sessionUsed[sessionHash] = true;
 
        // Step 8: Mint NFT to treasury first
        bytes[] memory metadataList = new bytes[](1);
        metadataList[0] = bytes(metadataURI);
 
        (int mintResp, uint64 newTotalSupply, int64[] memory serials) = // CORRECTION #2: newTotalSupply doit être uint64
            HederaTokenService.mintToken(tokenAddr, 0, metadataList);
        require(mintResp == HederaResponseCodes.SUCCESS, "mint failed");
        require(serials.length > 0, "no serial");
 
        serial = serials[0];
 
        // Step 9: Transfer NFT from treasury to player
        int tfResp = HederaTokenService.transferNFT(
            tokenAddr,
            address(this), // from treasury
            player,        // to player
            serial
        );
        require(tfResp == HederaResponseCodes.SUCCESS, "transfer failed - ensure recipient associated");
 
        // Step 10: Update player NFT count
        playerNFTCount[player]++;
 
        // Step 11: Emit events for audit trail (Mirror Node indexing)
        emit SessionVerified(sessionHash, player, timestamp);
        emit NFTRewardMinted(sessionHash, player, tokenAddr, serial, score);
 
        return (sessionHash, verified, serial);
    }
 
    /**
     * @notice Verify session WITHOUT minting (matches GameSessionVerifierFinal)
     * @dev Use this if you want to separate verification from minting
     * Original function from GameSessionVerifierFinal
     */
    function verifySession(
        address player,
        uint256 score,
        uint256 kills,
        uint256 accuracy,
        uint256 timeSurvived,
        uint256 timestamp,
        bytes32 nonce,
        bytes calldata signature
    ) external onlyOperatorOrAdmin returns (bytes32 sessionHash, bool verified) {
        require(player != address(0), "invalid player");
        require(accuracy <= 10000, "invalid accuracy");
        require(timestamp <= block.timestamp + 300, "timestamp too far in future");
 
        // Build struct hash
        bytes32 structHash = keccak256(
            abi.encode(
                GAME_SESSION_TYPEHASH,
                player,
                score,
                kills,
                accuracy,
                timeSurvived,
                timestamp,
                nonce
            )
        );
 
        // Build digest and recover signer
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
 
        // Verify signer
        verified = (signer == gameServer);
 
        if (verified) {
            sessionHash = keccak256(abi.encodePacked(player, score, timestamp, nonce));
            require(!sessionUsed[sessionHash], "session already used");
            sessionUsed[sessionHash] = true;
            emit SessionVerified(sessionHash, player, timestamp);
        } else {
            sessionHash = bytes32(0);
        }
 
        return (sessionHash, verified);
    }
 
    /**
     * @notice Check signature validity (view function - matches GameSessionVerifierFinal)
     * @dev Useful for frontend/backend to pre-validate signatures without gas cost
     */
    function checkSignature(
        address player,
        uint256 score,
        uint256 kills,
        uint256 accuracy,
        uint256 timeSurvived,
        uint256 timestamp,
        bytes32 nonce,
        bytes calldata signature
    ) external view returns (address recoveredSigner, bool matchesGameServer) {
        bytes32 structHash = keccak256(
            abi.encode(
                GAME_SESSION_TYPEHASH,
                player,
                score,
                kills,
                accuracy,
                timeSurvived,
                timestamp,
                nonce
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        recoveredSigner = digest.recover(signature);
        matchesGameServer = (recoveredSigner == gameServer);
        return (recoveredSigner, matchesGameServer);
    }
 
    // ========== ANTI-CHEAT FUNCTIONS ==========
 
    /**
     * @notice Request reward event (matches GameSessionVerifierFinal)
     * @dev Emit auditable event after minting or off-chain HTS mint
     */
    function requestReward(
        bytes32 sessionHash,
        address player,
        string calldata rewardType
    ) external onlyOperatorOrAdmin {
        require(sessionHash != bytes32(0), "invalid sessionHash");
        require(sessionUsed[sessionHash], "session not verified/used");
        emit RewardRequested(sessionHash, player, rewardType, block.timestamp);
    }
 
    /**
     * @notice Flag session as suspicious (matches GameSessionVerifierFinal)
     * @dev Called by operator when anti-cheat detects fraud
     */
    function flagSession(
        bytes32 sessionHash,
        address player,
        string calldata reason
    ) external onlyOperatorOrAdmin {
        require(sessionHash != bytes32(0), "invalid sessionHash");
        sessionFlagged[sessionHash] = true;
        emit SessionFlagged(sessionHash, player, reason, block.timestamp);
    }
 
    // ========== MANUAL NFT MINTING (optional helpers) ==========
 
    /**
     * @notice Mint NFT to treasury (for pre-minting or manual rewards)
     * @dev From GameRewardNFTFull - useful for batch operations
     */
    function mintNFTToTreasury(address tokenAddr, string calldata metadataURI)
        external
        onlyRole(OPERATOR_ROLE)
        returns (int64 serial)
    {
        require(tokenAddr != address(0), "invalid token");
        require(isCollection[tokenAddr], "not a valid collection");
 
        bytes[] memory metadataList = new bytes[](1);
        metadataList[0] = bytes(metadataURI);
 
        (int resp, uint64 newTotalSupply, int64[] memory serials) = // CORRECTION #2: newTotalSupply doit être uint64
            HederaTokenService.mintToken(tokenAddr, 0, metadataList);
        require(resp == HederaResponseCodes.SUCCESS, "mint failed");
        require(serials.length > 0, "no serial");
 
        serial = serials[0];
        emit NFTMinted(tokenAddr, serial, address(this), metadataURI);
        return serial;
    }
 
    /**
     * @notice Mint batch of NFTs to treasury
     * @dev From GameRewardNFTFull - useful for pre-minting multiple NFTs
     */
    function mintBatchToTreasury(address tokenAddr, string[] calldata metadataURIs)
        external
        onlyRole(OPERATOR_ROLE)
        returns (int64[] memory serials)
    {
        require(tokenAddr != address(0), "invalid token");
        require(isCollection[tokenAddr], "not a valid collection");
        require(metadataURIs.length > 0, "empty");
 
        bytes[] memory metadataList = new bytes[](metadataURIs.length);
        for (uint i = 0; i < metadataURIs.length; i++) {
            metadataList[i] = bytes(metadataURIs[i]);
        }
 
        (int resp, uint64 newTotalSupply, int64[] memory resultSerials) = // CORRECTION #2: newTotalSupply doit être uint64
            HederaTokenService.mintToken(tokenAddr, 0, metadataList);
        require(resp == HederaResponseCodes.SUCCESS, "batch mint failed");
 
        serials = resultSerials;
    }
 
    /**
     * @notice Mint and transfer NFT in one transaction (bypass verification)
     * @dev From GameRewardNFTFull - use for admin rewards or special cases
     */
    function mintAndTransfer(address tokenAddr, address recipient, string calldata metadataURI)
        external
        onlyRole(OPERATOR_ROLE)
        returns (int64 serial)
    {
        require(tokenAddr != address(0), "invalid token");
        require(isCollection[tokenAddr], "not a valid collection");
        require(recipient != address(0), "invalid recipient");
 
        bytes[] memory metadataList = new bytes[](1);
        metadataList[0] = bytes(metadataURI);
 
        (int mintResp, uint64 newTotalSupply, int64[] memory serials) = // CORRECTION #2: newTotalSupply doit être uint64
            HederaTokenService.mintToken(tokenAddr, 0, metadataList);
        require(mintResp == HederaResponseCodes.SUCCESS, "mint failed");
        require(serials.length > 0, "no serial");
 
        serial = serials[0];
 
        int tfResp = HederaTokenService.transferNFT(tokenAddr, address(this), recipient, serial);
        require(tfResp == HederaResponseCodes.SUCCESS, "transfer failed - ensure recipient associated");
 
        playerNFTCount[recipient]++;
    }
 
    // ========== ADMIN FUNCTIONS ==========
 
    /**
     * @notice Update game server address (matches GameSessionVerifierFinal)
     * @dev Admin-only, for key rotation
     */
    function setGameServer(address newServer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newServer != address(0), "invalid address");
        address prev = gameServer;
        gameServer = newServer;
        emit GameServerUpdated(prev, newServer);
    }
 
    /**
     * @notice Update operator address (matches GameSessionVerifierFinal)
     * @dev Admin-only
     */
    function setOperator(address newOperator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address prev = address(0); // Can't easily get previous operator from AccessControl
        _grantRole(OPERATOR_ROLE, newOperator);
        emit OperatorUpdated(prev, newOperator);
    }
 
    // ========== VIEW HELPERS ==========
 
    /**
     * @notice Check if session has been used (matches GameSessionVerifierFinal)
     */
    function isSessionUsed(bytes32 sessionHash) external view returns (bool) {
        return sessionUsed[sessionHash];
    }
 
    /**
     * @notice Check if session has been flagged (matches GameSessionVerifierFinal)
     */
    function isSessionFlagged(bytes32 sessionHash) external view returns (bool) {
        return sessionFlagged[sessionHash];
    }
 
    /**
     * @notice Get EIP-712 domain separator (matches GameSessionVerifierFinal)
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
 
    /**
     * @notice Get EIP-712 typehash (matches GameSessionVerifierFinal)
     */
    function getTypehash() external pure returns (bytes32) {
        return GAME_SESSION_TYPEHASH;
    }
 
    /**
     * @notice Check if address is a valid collection created by this contract
     */
    function checkIsCollection(address tokenAddr) external view returns (bool) {
        return isCollection[tokenAddr];
    }
 
    /**
     * @notice Get player's total NFT count
     */
    function getPlayerNFTCount(address player) external view returns (uint256) {
        return playerNFTCount[player];
    }
}
 