Frontend/smartcontracts/contracts/AchievementVerifier.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AchievementVerifier {
    struct GameSession {
        address player;
        uint256 score;
        uint256 kills;
        uint256 accuracy; // Percentage * 100
        uint256 timeSurvived; // Seconds
        uint256 timestamp;
        bool verified;
        bytes32 sessionHash;
    }

    address public admin;
    address public gameServer; // Trusted game server :localhost:3000

    mapping(bytes32 => GameSession) public sessions; // sessionHash => GameSession
    mapping(address => bytes32[]) public playerSessions; // player => array of sessionHash
    mapping(address => mapping(uint256 => bool)) public achievementClaimed;

    event SessionVerified(bytes32 indexed sessionHash, address indexed player);
    event AchievementClaimed(address indexed player, uint256 achievementId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyGameServer() {
        require(msg.sender == gameServer || msg.sender == admin, "Only game server");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function setGameServer(address _gameServer) external onlyAdmin {
        gameServer = _gameServer;
    }

    function verifySession(
        address player,
        uint256 score,
        uint256 kills,
        uint256 accuracy,
        uint256 timeSurvived,
        bytes memory signature
    ) external onlyGameServer returns (bytes32) {
        require(player != address(0), "Invalid player");
        require(accuracy <= 100, "Invalid accuracy");
        require(signature.length > 0, "Invalid signature");

        // Create unique session hash
        bytes32 sessionHash = keccak256(abi.encodePacked(
            player,
            score,
            kills,
            accuracy,
            timeSurvived,
            block.timestamp,
            block.number
        ));

        sessions[sessionHash] = GameSession({
            player: player,
            score: score,
            kills: kills,
            accuracy: accuracy,
            timeSurvived: timeSurvived,
            timestamp: block.timestamp,
            verified: true,
            sessionHash: sessionHash
        });

        playerSessions[player].push(sessionHash);

        emit SessionVerified(sessionHash, player);

        return sessionHash;
    }

    // changed to public so it can be called internally
    function checkAchievement(address player, uint256 achievementId) public view returns (bool) {
        require(achievementId >= 1 && achievementId <= 10, "Invalid achievement ID");

        bytes32[] memory playerSessionList = playerSessions[player];
        if (playerSessionList.length == 0) return false;

        // Check against achievement requirements
        for (uint256 i = 0; i < playerSessionList.length; i++) {
            bytes32 sessionHash = playerSessionList[i];
            GameSession memory session = sessions[sessionHash];

            if (achievementId == 1) {
                // Galactic Commander: Score >= 100,000
                if (session.score >= 100000) return true;
            } else if (achievementId == 2) {
                // Stellar Destroyer: Kills >= 50
                if (session.kills >= 50) return true;
            } else if (achievementId == 3) {
                // Photonic Blade: Accuracy >= 85%
                if (session.accuracy >= 8500) return true;
            } else if (achievementId == 4) {
                // Time Master: Survival >= 900s (15 min)
                if (session.timeSurvived >= 900) return true;
            } else if (achievementId == 5) {
                // Star Champion: Score >= 50,000
                if (session.score >= 50000) return true;
            } else if (achievementId == 6) {
                // Solar Flame: Kills/min >= 10
                if (session.timeSurvived > 0) {
                    uint256 killsPerMinute = (session.kills * 60) / session.timeSurvived;
                    if (killsPerMinute >= 10) return true;
                }
            } else if (achievementId == 7) {
                // Orbital Sniper: Accuracy >= 95%
                if (session.accuracy >= 9500) return true;
            } else if (achievementId == 8) {
                // Void Survivor: Survival >= 600s (10 min)
                if (session.timeSurvived >= 600) return true;
            } else if (achievementId == 9) {
                // Stellar Prodigy: Score >= 30,000 AND Accuracy >= 80%
                if (session.score >= 30000 && session.accuracy >= 8000) return true;
            } else if (achievementId == 10) {
                // Ring Legend: All stats high
                if (session.score >= 100000 && 
                    session.kills >= 50 && 
                    session.accuracy >= 9000 &&
                    session.timeSurvived >= 600) return true;
            }
        }

        return false;
    }

    function claimAchievement(uint256 achievementId) external returns (bool) {
        require(!achievementClaimed[msg.sender][achievementId], "Already claimed");
        require(checkAchievement(msg.sender, achievementId), "Achievement not earned");

        achievementClaimed[msg.sender][achievementId] = true;
        emit AchievementClaimed(msg.sender, achievementId);

        return true;
    }

    function getPlayerSessions(address player) external view returns (bytes32[] memory) {
        return playerSessions[player];
    }

    function getSession(bytes32 sessionHash) external view returns (GameSession memory) {
        return sessions[sessionHash];
    }
}



// On veut  automatiser le claimAchievement
if (achievementId == 1) {
                // Galactic Commander: Score >= 10000
                if (session.score >= 100000) return true;
            } else if (achievementId == 2) {
                // Stellar Destroyer: Kills >= 15
                if (session.kills >= 15) return true;
            } else if (achievementId == 3) {
                // Photonic Blade: Accuracy >= 55%
                if (session.accuracy >= 5500) return true;
            } else if (achievementId == 4) {
                // Time Master: Survival >= 900s (15 min)
                if (session.timeSurvived >= 900) return true;
            } else if (achievementId == 5) {
                // Star Champion: Score >= 5,000
                if (session.score >= 50000) return true;
            } else if (achievementId == 6) {
                // Solar Flame: Kills/min >= 3
                if (session.timeSurvived > 0) {
                    uint256 killsPerMinute = (session.kills * 60) / session.timeSurvived;
                    if (killsPerMinute >= 3) return true;
                }
            } else if (achievementId == 7) {
                // Orbital Sniper: Accuracy >= 75%
                if (session.accuracy >= 7500) return true;
            } else if (achievementId == 8) {
                // Void Survivor: Survival >= 600s (10 min)
                if (session.timeSurvived >= 600) return true;
            } else if (achievementId == 9) {
                // Stellar Prodigy: Score >= 3,000 AND Accuracy >= 60%
                if (session.score >= 30000 && session.accuracy >= 6000) return true;
            } else if (achievementId == 10) {
                // Ring Legend: All stats high
                if (session.score >= 100000 && 
                    session.kills >= 15 && 
                    session.accuracy >= 6000 &&
                    session.timeSurvived >= 600) return true;
            }

je veux que tu réecrives cheickAchivement avec ces nouvelles conditions. 
propose moi une manière optimale pour ce contrat AchievementVerifier : 
je veux que tu me donnes comment définir l'adresse admin et adress gameserver et si possible de choisir la 
même adresse . utiliser les bonnes pratiques de smart contract comme utiliser les méthodes getters et
setters et de rendre accessible les données de sortie dans le but de les utiliser dans les données du 
frontend . 

n'oublie pas de documenter toutes les fonctions et variables en anglais 


FrontEnd/smartcontracts/contracts/NFTCollection.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NFTCollection {
    struct Achievement {
        uint256 id;
        string name;
        string description;
        string rarity; // Common, Rare, Epic, Legendary, Mythic
        uint256 requirement;
        string achievementType; // score, kills, accuracy, time, combo
    }

    struct NFT {
        uint256 tokenId;
        uint256 achievementId;
        address owner;
        string metadataURI;
        uint256 mintedAt;
        bool exists;
    }

    address public admin;
    uint256 public nextTokenId;
    uint256 public royaltyPercentage = 2; // 2% royalty

    mapping(uint256 => NFT) public nfts;
    mapping(address => uint256[]) public ownerTokens;
    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(uint256 => bool)) public hasEarnedAchievement;

    event NFTMinted(uint256 indexed tokenId, address indexed owner, uint256 achievementId);
    event NFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event AchievementCreated(uint256 indexed achievementId, string name);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyOwner(uint256 tokenId) {
        require(nfts[tokenId].owner == msg.sender, "Not the owner");
        _;
    }

    constructor() {
        admin = msg.sender;
        nextTokenId = 1;
        _initializeAchievements();
    }

    function _initializeAchievements() internal {
        achievements[1] = Achievement({ id: 1, name: "Galactic Commander", description: "Highest global score of the match", rarity: "Legendary", requirement: 100000, achievementType: "score" });
        achievements[2] = Achievement({ id: 2, name: "Stellar Destroyer", description: "Highest total number of kills", rarity: "Legendary", requirement: 50, achievementType: "kills" });
        achievements[3] = Achievement({ id: 3, name: "Photonic Blade", description: "Best accuracy >= 85%", rarity: "Epic", requirement: 85, achievementType: "accuracy" });
        achievements[4] = Achievement({ id: 4, name: "Time Master", description: "Longest survival duration", rarity: "Epic", requirement: 900, achievementType: "time" });
        achievements[5] = Achievement({ id: 5, name: "Star Champion", description: "Score above 90% of best player", rarity: "Epic", requirement: 50000, achievementType: "score" });
        achievements[6] = Achievement({ id: 6, name: "Solar Flame", description: "Highest kills/minute ratio", rarity: "Rare", requirement: 10, achievementType: "kills" });
        achievements[7] = Achievement({ id: 7, name: "Orbital Sniper", description: "Precision > 95% over 50 shots", rarity: "Epic", requirement: 95, achievementType: "accuracy" });
        achievements[8] = Achievement({ id: 8, name: "Void Survivor", description: "Survival > 10 min without death", rarity: "Rare", requirement: 600, achievementType: "time" });
        achievements[9] = Achievement({ id: 9, name: "Stellar Prodigy", description: "High score + precision > 80%", rarity: "Epic", requirement: 30000, achievementType: "combo" });
        achievements[10] = Achievement({ id: 10, name: "Ring Legend", description: "Master all stats", rarity: "Mythic", requirement: 1, achievementType: "combo" });
    }

    function mintNFT(
        address player,
        uint256 achievementId,
        string memory metadataURI,
        bytes memory signature
    ) external onlyAdmin returns (uint256) {
        require(achievementId >= 1 && achievementId <= 10, "Invalid achievement");
        require(!hasEarnedAchievement[player][achievementId], "Already earned");
        require(signature.length > 0, "Invalid signature");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        nfts[tokenId] = NFT({
            tokenId: tokenId,
            achievementId: achievementId,
            owner: player,
            metadataURI: metadataURI,
            mintedAt: block.timestamp,
            exists: true
        });

        ownerTokens[player].push(tokenId);
        hasEarnedAchievement[player][achievementId] = true;

        emit NFTMinted(tokenId, player, achievementId);

        return tokenId;
    }

    function transferNFT(uint256 tokenId, address to) external onlyOwner(tokenId) {
        require(nfts[tokenId].exists, "NFT does not exist");
        require(to != address(0), "Invalid address");

        address from = nfts[tokenId].owner;
        nfts[tokenId].owner = to;

        _removeTokenFromOwner(from, tokenId);
        ownerTokens[to].push(tokenId);

        emit NFTTransferred(tokenId, from, to);
    }

    function _removeTokenFromOwner(address ownerAddr, uint256 tokenId) internal {
        uint256[] storage tokens = ownerTokens[ownerAddr];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    function getOwnerTokens(address ownerAddr) external view returns (uint256[] memory) {
        return ownerTokens[ownerAddr];
    }

    // changed to return tuple to match INFTCollection interface
    function getNFT(uint256 tokenId) external view returns (
        uint256 id,
        uint256 achievementId,
        address ownerAddr,
        string memory metadataURI,
        uint256 mintedAt,
        bool exists
    ) {
        require(nfts[tokenId].exists, "NFT does not exist");
        NFT memory nft = nfts[tokenId];
        return (nft.tokenId, nft.achievementId, nft.owner, nft.metadataURI, nft.mintedAt, nft.exists);
    }

    function getAchievement(uint256 achievementId) external view returns (Achievement memory) {
        return achievements[achievementId];
    }

    function setRoyaltyPercentage(uint256 percentage) external onlyAdmin {
        require(percentage <= 10, "Royalty too high");
        royaltyPercentage = percentage;
    }
}


Je veux rendre accessible les données pour une integration dans le frontend et aussi qu'elles soient
visibles sur hashscan je suis également ouverte à toute proposition d'idée de la meilleure manière 
sans dénaturer le code . 
Adopte le plus possible les bonnes pratiques de codding de smartcontract (nom des variables explicites avec des
commentaires,style cohérent)
 Ajoute également un nft de recompense hebdomadaire si la personne joue tous les jours pendant 7 jours
 par exemple 





FrontEnd/smartcontracts/contracts/Leaderboard.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Leaderboard {
    struct PlayerScore {
        address player;
        uint256 highScore;
        uint256 totalKills;
        uint256 bestAccuracy; // Stored as percentage * 100 (e.g., 8500 = 85%)
        uint256 longestSurvival; // In seconds
        uint256 lastUpdated;
        bool exists;
    }

    address public admin;
    address public gameContract; // Only game contract can update scores

    mapping(address => PlayerScore) public playerScores;
    address[] public players;

    event ScoreUpdated(address indexed player, uint256 score, uint256 kills, uint256 accuracy, uint256 survival);
    event GameContractUpdated(address indexed newGameContract);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyGameContract() {
        require(msg.sender == gameContract || msg.sender == admin, "Only game contract");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function setGameContract(address _gameContract) external onlyAdmin {
        gameContract = _gameContract;
        emit GameContractUpdated(_gameContract);
    }

    function updateScore(
        address player,
        uint256 score,
        uint256 kills,
        uint256 accuracy,
        uint256 survival
    ) external onlyGameContract {
        require(player != address(0), "Invalid player address");
        require(accuracy <= 10000, "Invalid accuracy"); // Max 100%

        if (!playerScores[player].exists) {
            players.push(player);
            playerScores[player] = PlayerScore({
                player: player,
                highScore: score,
                totalKills: kills,
                bestAccuracy: accuracy,
                longestSurvival: survival,
                lastUpdated: block.timestamp,
                exists: true
            });
        } else {
            PlayerScore storage ps = playerScores[player];

            // Update only if new records
            if (score > ps.highScore) ps.highScore = score;
            if (kills > ps.totalKills) ps.totalKills = kills;
            if (accuracy > ps.bestAccuracy) ps.bestAccuracy = accuracy;
            if (survival > ps.longestSurvival) ps.longestSurvival = survival;

            ps.lastUpdated = block.timestamp;
        }

        emit ScoreUpdated(player, score, kills, accuracy, survival);
    }

    function getPlayerScore(address player) external view returns (PlayerScore memory) {
        require(playerScores[player].exists, "Player not found");
        return playerScores[player];
    }

    function getTopPlayers(uint256 count) external view returns (address[] memory, uint256[] memory) {
        uint256 playerCount = players.length;
        if (count > playerCount) count = playerCount;

        address[] memory sortedPlayers = new address[](playerCount);
        uint256[] memory scores = new uint256[](playerCount);

        for (uint256 i = 0; i < playerCount; i++) {
            sortedPlayers[i] = players[i];
            scores[i] = playerScores[players[i]].highScore;
        }

        // Simple bubble sort (in production, use off-chain sorting)
        for (uint256 i = 0; i < playerCount - 1; i++) {
            for (uint256 j = 0; j < playerCount - i - 1; j++) {
                if (scores[j] < scores[j + 1]) {
                    uint256 tempScore = scores[j];
                    scores[j] = scores[j + 1];
                    scores[j + 1] = tempScore;

                    address tempPlayer = sortedPlayers[j];
                    sortedPlayers[j] = sortedPlayers[j + 1];
                    sortedPlayers[j + 1] = tempPlayer;
                }
            }
        }

        address[] memory topPlayers = new address[](count);
        uint256[] memory topScores = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            topPlayers[i] = sortedPlayers[i];
            topScores[i] = scores[i];
        }

        return (topPlayers, topScores);
    }

    function getTotalPlayers() external view returns (uint256) {
        return players.length;
    }
}

rendre accessible les données pour une integration dans le frontend et aussi qu'elles soient
visibles sur hashscan je suis également ouverte à toute proposition d'idée de la meilleure manière 
sans dénaturer le code . ajoute également un classement hebdomadaire( en fonction des stats du jeu)
cependant je suis ouverte à toute proposition d'idée si possible de creer des fonctions ou des contrats supplementaires 
pour repondre éfficacement à notre problème 




FrontEnd/smartcontracts/contracts/Marketplace.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface INFTCollection {
    function transferNFT(uint256 tokenId, address to) external;
    function getNFT(uint256 _tokenId) external view returns (
        uint256 id,
        uint256 achievementId,
        address owner,
        string memory metadataURI,
        uint256 mintedAt,
        bool exists
    );
    function royaltyPercentage() external view returns (uint256);
}

contract Marketplace {
    struct Listing {
        uint256 listingId;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }

    address public nftContract;
    address public admin;
    uint256 public nextListingId;
    uint256 public platformFee = 2; // 2% platform fee

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public tokenToListing; // tokenId => listingId

    event Listed(uint256 indexed listingId, uint256 indexed tokenId, address seller, uint256 price);
    event Sold(uint256 indexed listingId, uint256 indexed tokenId, address buyer, uint256 price);
    event Cancelled(uint256 indexed listingId, uint256 indexed tokenId);

    constructor(address _nftContract) {
        nftContract = _nftContract;
        admin = msg.sender;
        nextListingId = 1;
    }

    function createListing(uint256 tokenId, uint256 price) external returns (uint256) {
        require(price > 0, "Price must be > 0");

        // Verify ownership using the interface return tuple
        (uint256 id, uint256 achievementId, address owner, string memory metadataURI, uint256 mintedAt, bool exists) = INFTCollection(nftContract).getNFT(tokenId);
        require(exists, "NFT does not exist");
        require(owner == msg.sender, "Not the owner");
        require(tokenToListing[tokenId] == 0, "Already listed");

        uint256 listingId = nextListingId;
        nextListingId++;

        listings[listingId] = Listing({
            listingId: listingId,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: block.timestamp
        });

        tokenToListing[tokenId] = listingId;

        emit Listed(listingId, tokenId, msg.sender, price);

        return listingId;
    }

    function buyNFT(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");

        listing.active = false;
        tokenToListing[listing.tokenId] = 0;

        // Calculate fees
        uint256 royalty = INFTCollection(nftContract).royaltyPercentage();
        uint256 royaltyAmount = (listing.price * royalty) / 100;
        uint256 platformFeeAmount = (listing.price * platformFee) / 100;
        uint256 sellerAmount = listing.price - royaltyAmount - platformFeeAmount;

        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        payable(admin).transfer(royaltyAmount + platformFeeAmount);

        // Transfer NFT (note: This requires approval mechanism in production)
        // For simplicity, we assume the seller has approved the marketplace
        INFTCollection(nftContract).transferNFT(listing.tokenId, msg.sender);

        emit Sold(listingId, listing.tokenId, msg.sender, listing.price);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");

        listing.active = false;
        tokenToListing[listing.tokenId] = 0;

        emit Cancelled(listingId, listing.tokenId);
    }

    function getActiveListing(uint256 tokenId) external view returns (Listing memory) {
        uint256 listingId = tokenToListing[tokenId];
        require(listingId != 0, "No active listing");
        return listings[listingId];
    }
}

si c'est possible je veux tous les contrats dans le même fichier et reutiluser les fonctions 
tout en respectant les bonnes pratiques de codding de solidity



//smart contract pour community 
je veux un smart contract bien structuré dédié à la page community permettant à 2 personnes ou plusieurs de s'envoyer 
des messages dans un topic public ou privé .
Si bob veut envoyer un message à Alice ou à plusieurrs personne alors il suffit de à Bob d'ecrire l'adresse
de Alice ou de ses personnes et ils seront ajoutés automitiquement si le topic est public ou non
 et généré la clé du submit et admin topic pour bob

 




 lis très bien et comprendre tout le code qui prcède et repondre de façon structurée cohérente et logique entre chaque 
 contrat que tu creeras dans le fichier et les fonctions réeutilisées  documenter le code chaque contrat fonction et variables
 si necessaires 


 je veux deployer le contrat dans ce dossier HGame/FrontEnd/SmartContracts
 avec sa propre config propre au dossier et on utilise hardhat pour deployer le contrat 

 le code du contrat est rédigé en anglais 


