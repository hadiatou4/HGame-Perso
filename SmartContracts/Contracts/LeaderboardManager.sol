// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LeaderboardManager
 * @notice Gère le leaderboard on-chain pour le jeu Space War
 * @dev Stocke le top 10 des joueurs et leurs statistiques
 */
contract LeaderboardManager {
    
    // ============================================
    // STRUCTURES
    // ============================================
    
    struct PlayerStats {
        address playerAddress;      // Adresse du joueur
        uint256 highestScore;       // Meilleur score
        uint256 totalKills;         // Total de kills
        uint256 totalSessions;      // Nombre de sessions jouées
        uint256 lastUpdated;        // Timestamp de la dernière mise à jour
        bool exists;                // Flag pour savoir si le joueur existe
    }
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    // Mapping: adresse joueur => stats
    mapping(address => PlayerStats) public players;
    
    // Array des top 10 joueurs (trié par score décroissant)
    address[10] public topPlayers;
    
    // Compteur total de joueurs uniques
    uint256 public totalPlayers;
    
    // Adresse du serveur de jeu autorisé à mettre à jour
    address public gameServer;
    
    // Owner du contrat (pour administration)
    address public owner;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event ScoreUpdated(
        address indexed player,
        uint256 newHighScore,
        uint256 sessionScore,
        string hcsMessageId
    );
    
    event NewTopPlayer(
        address indexed player,
        uint256 rank,
        uint256 score
    );
    
    event GameServerUpdated(
        address indexed oldServer,
        address indexed newServer
    );
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyGameServer() {
        require(msg.sender == gameServer, "Not authorized: only game server");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: only owner");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(address _gameServer) {
        require(_gameServer != address(0), "Invalid game server address");
        owner = msg.sender;
        gameServer = _gameServer;
    }
    
    // ============================================
    // MAIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Met à jour le score d'un joueur après validation HCS
     * @param player Adresse du joueur
     * @param sessionScore Score de cette session
     * @param kills Nombre de kills de cette session
     * @param hcsMessageId ID du message HCS (pour traçabilité)
     */
    function updatePlayerScore(
        address player,
        uint256 sessionScore,
        uint256 kills,
        string calldata hcsMessageId
    ) external onlyGameServer {
        require(player != address(0), "Invalid player address");
        // Score peut être 0 (le joueur a perdu immédiatement)
        
        PlayerStats storage stats = players[player];
        
        // Si c'est un nouveau joueur
        if (!stats.exists) {
            stats.playerAddress = player;
            stats.exists = true;
            totalPlayers++;
        }
        
        // Mettre à jour les stats
        bool isNewHighScore = sessionScore > stats.highestScore;
        if (isNewHighScore) {
            stats.highestScore = sessionScore;
        }
        
        stats.totalKills += kills;
        stats.totalSessions++;
        stats.lastUpdated = block.timestamp;
        
        emit ScoreUpdated(player, stats.highestScore, sessionScore, hcsMessageId);
        
        // Mettre à jour le top 10 si nécessaire
        if (isNewHighScore) {
            _updateTopPlayers(player);
        }
    }
    
    /**
     * @notice Met à jour le classement des top 10 joueurs
     * @dev Appelé automatiquement après chaque nouveau high score
     */
    function _updateTopPlayers(address player) private {
        uint256 playerScore = players[player].highestScore;
        
        // Vérifier si le joueur est déjà dans le top 10
        int256 currentPosition = -1;
        for (uint256 i = 0; i < 10; i++) {
            if (topPlayers[i] == player) {
                currentPosition = int256(i);
                break;
            }
        }
        
        // Trouver la nouvelle position du joueur
        uint256 newPosition = 10; // Par défaut, hors top 10
        for (uint256 i = 0; i < 10; i++) {
            if (topPlayers[i] == address(0) || 
                playerScore > players[topPlayers[i]].highestScore) {
                newPosition = i;
                break;
            }
        }
        
        // Si le joueur mérite d'être dans le top 10
        if (newPosition < 10) {
            // Si le joueur était déjà dans le top 10, le retirer de son ancienne position
            if (currentPosition >= 0) {
                _removeFromPosition(uint256(currentPosition));
            }
            
            // Insérer le joueur à sa nouvelle position
            _insertAtPosition(newPosition, player);
            
            emit NewTopPlayer(player, newPosition + 1, playerScore);
        }
    }
    
    /**
     * @notice Retire un joueur d'une position donnée
     */
    function _removeFromPosition(uint256 position) private {
        require(position < 10, "Invalid position");
        
        // Décaler tous les joueurs après cette position
        for (uint256 i = position; i < 9; i++) {
            topPlayers[i] = topPlayers[i + 1];
        }
        topPlayers[9] = address(0);
    }
    
    /**
     * @notice Insère un joueur à une position donnée
     */
    function _insertAtPosition(uint256 position, address player) private {
        require(position < 10, "Invalid position");
        
        // Décaler tous les joueurs après cette position
        for (uint256 i = 9; i > position; i--) {
            topPlayers[i] = topPlayers[i - 1];
        }
        
        // Insérer le nouveau joueur
        topPlayers[position] = player;
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Récupère le top 10 des joueurs avec leurs stats complètes
     * @return Array de PlayerStats (top 10)
     */
    function getTop10() external view returns (PlayerStats[10] memory) {
        PlayerStats[10] memory result;
        
        for (uint256 i = 0; i < 10; i++) {
            if (topPlayers[i] != address(0)) {
                result[i] = players[topPlayers[i]];
            } else {
                // Joueur vide (slot non rempli)
                result[i] = PlayerStats({
                    playerAddress: address(0),
                    highestScore: 0,
                    totalKills: 0,
                    totalSessions: 0,
                    lastUpdated: 0,
                    exists: false
                });
            }
        }
        
        return result;
    }
    
    /**
     * @notice Récupère le rang d'un joueur dans le top 10
     * @param player Adresse du joueur
     * @return Rang du joueur (1-10), ou 0 si hors top 10
     */
    function getPlayerRank(address player) external view returns (uint256) {
        for (uint256 i = 0; i < 10; i++) {
            if (topPlayers[i] == player) {
                return i + 1; // Rang commence à 1
            }
        }
        return 0; // Pas dans le top 10
    }
    
    /**
     * @notice Récupère les stats complètes d'un joueur
     * @param player Adresse du joueur
     * @return PlayerStats du joueur
     */
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return players[player];
    }
    
    /**
     * @notice Récupère les adresses des top 10 joueurs
     * @return Array des adresses
     */
    function getTopPlayersAddresses() external view returns (address[10] memory) {
        return topPlayers;
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Change l'adresse du serveur de jeu autorisé
     * @param newGameServer Nouvelle adresse du serveur
     */
    function setGameServer(address newGameServer) external onlyOwner {
        require(newGameServer != address(0), "Invalid address");
        address oldServer = gameServer;
        gameServer = newGameServer;
        emit GameServerUpdated(oldServer, newGameServer);
    }
    
    /**
     * @notice Transfère la propriété du contrat
     * @param newOwner Nouvelle adresse du propriétaire
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}