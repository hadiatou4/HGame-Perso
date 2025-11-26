// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LeaderboardManager - 100% On-Chain avec HCS Integration
 * @notice Calcule le leaderboard et émet un event pour publication sur HCS Topic
 */
contract LeaderboardManager {
    
    // ============================================
    // STRUCTURES
    // ============================================
    
    struct PlayerStats {
        address playerAddress;
        uint256 highestScore;
        uint256 totalKills;
        uint256 totalSessions;
        uint256 totalAccuracy;      // Somme pour calculer moyenne
        uint256 lastUpdated;
        bool exists;
    }
    
    struct LeaderboardEntry {
        uint256 rank;               // 1-10
        address player;
        uint256 highestScore;
        uint256 totalKills;
        uint256 totalSessions;
        uint256 averageAccuracy;    // Calculé
        uint256 lastUpdated;
    }
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    mapping(address => PlayerStats) public players;
    address[10] public topPlayers;
    
    uint256 public totalPlayers;
    uint256 public totalSessions;
    
    address public gameServer;
    address public owner;
    
    uint256 public constant MAX_SCORE = 1000000;
    uint256 public constant MAX_KILLS = 10000;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event SessionSubmitted(
        address indexed player,
        uint256 score,
        uint256 kills,
        uint256 accuracy,
        uint256 timeSurvived,
        string hcsMessageId
    );
    
    event NewHighScore(
        address indexed player,
        uint256 oldScore,
        uint256 newScore
    );
    
    /**
     * @notice Event émis quand le leaderboard est mis à jour
     * @dev Le backend écoute cet event pour publier sur HCS Topic Leaderboard
     */
    event LeaderboardUpdated(
        uint256 indexed blockNumber,
        uint256 timestamp,
        LeaderboardEntry[10] leaderboard
    );
    
    event InvalidSessionRejected(
        address indexed player,
        string reason
    );
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyGameServer() {
        require(msg.sender == gameServer, "Not authorized");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(address _gameServer) {
        require(_gameServer != address(0), "Invalid address");
        owner = msg.sender;
        gameServer = _gameServer;
    }
    
    // ============================================
    // MAIN FUNCTION
    // ============================================
    
    /**
     * @notice Soumet une session complète
     */
    function submitSession(
        address player,
        uint256 score,
        uint256 kills,
        uint256 accuracy,
        uint256 timeSurvived,
        uint256 timestamp,
        string calldata hcsMessageId
    ) external onlyGameServer {
        
        // Validation
        require(player != address(0), "Invalid player");
        
        if (score > MAX_SCORE) {
            emit InvalidSessionRejected(player, "Score too high");
            return;
        }
        
        if (kills > MAX_KILLS) {
            emit InvalidSessionRejected(player, "Kills too high");
            return;
        }
        
        if (accuracy > 100) {
            emit InvalidSessionRejected(player, "Invalid accuracy");
            return;
        }
        
        if (timestamp > block.timestamp) {
            emit InvalidSessionRejected(player, "Future timestamp");
            return;
        }
        
        // Mise à jour stats
        PlayerStats storage stats = players[player];
        
        bool isNewPlayer = !stats.exists;
        if (isNewPlayer) {
            stats.playerAddress = player;
            stats.exists = true;
            totalPlayers++;
        }
        
        uint256 oldHighScore = stats.highestScore;
        bool isNewHighScore = score > stats.highestScore;
        
        if (isNewHighScore) {
            stats.highestScore = score;
            emit NewHighScore(player, oldHighScore, score);
        }
        
        stats.totalKills += kills;
        stats.totalSessions++;
        stats.totalAccuracy += accuracy;
        stats.lastUpdated = block.timestamp;
        
        totalSessions++;
        
        emit SessionSubmitted(player, score, kills, accuracy, timeSurvived, hcsMessageId);
        
        // Mise à jour du classement si nouveau high score
        if (isNewHighScore) {
            bool leaderboardChanged = _updateLeaderboard(player, score);
            
            // Émettre l'event si le leaderboard a changé
            if (leaderboardChanged) {
                _emitLeaderboardUpdate();
            }
        }
    }
    
    // ============================================
    // LEADERBOARD LOGIC
    // ============================================
    
    /**
     * @notice Met à jour le classement
     * @return true si le leaderboard a changé
     */
    function _updateLeaderboard(address player, uint256 score) private returns (bool) {
        
        // Position actuelle du joueur
        int256 currentPos = -1;
        for (uint256 i = 0; i < 10; i++) {
            if (topPlayers[i] == player) {
                currentPos = int256(i);
                break;
            }
        }
        
        // Nouvelle position
        uint256 newPos = 10;
        for (uint256 i = 0; i < 10; i++) {
            if (topPlayers[i] == address(0) || score > players[topPlayers[i]].highestScore) {
                newPos = i;
                break;
            }
        }
        
        // Si pas de changement dans le top 10
        if (newPos >= 10 && currentPos < 0) {
            return false;
        }
        
        // Si le joueur était déjà dans le top, le retirer
        if (currentPos >= 0) {
            _removeFromTop(uint256(currentPos));
        }
        
        // Insérer à la nouvelle position
        if (newPos < 10) {
            _insertAtPosition(newPos, player);
        }
        
        return true; // Le leaderboard a changé
    }
    
    function _removeFromTop(uint256 pos) private {
        for (uint256 i = pos; i < 9; i++) {
            topPlayers[i] = topPlayers[i + 1];
        }
        topPlayers[9] = address(0);
    }
    
    function _insertAtPosition(uint256 pos, address player) private {
        for (uint256 i = 9; i > pos; i--) {
            topPlayers[i] = topPlayers[i - 1];
        }
        topPlayers[pos] = player;
    }
    
    /**
     * @notice Émet l'event LeaderboardUpdated avec le top 10 complet
     */
    function _emitLeaderboardUpdate() private {
        LeaderboardEntry[10] memory leaderboard;
        
        for (uint256 i = 0; i < 10; i++) {
            if (topPlayers[i] != address(0)) {
                PlayerStats memory stats = players[topPlayers[i]];
                
                leaderboard[i] = LeaderboardEntry({
                    rank: i + 1,
                    player: stats.playerAddress,
                    highestScore: stats.highestScore,
                    totalKills: stats.totalKills,
                    totalSessions: stats.totalSessions,
                    averageAccuracy: stats.totalSessions > 0 
                        ? stats.totalAccuracy / stats.totalSessions 
                        : 0,
                    lastUpdated: stats.lastUpdated
                });
            } else {
                // Slot vide
                leaderboard[i] = LeaderboardEntry({
                    rank: i + 1,
                    player: address(0),
                    highestScore: 0,
                    totalKills: 0,
                    totalSessions: 0,
                    averageAccuracy: 0,
                    lastUpdated: 0
                });
            }
        }
        
        emit LeaderboardUpdated(block.number, block.timestamp, leaderboard);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    function getTop10() external view returns (LeaderboardEntry[10] memory) {
        LeaderboardEntry[10] memory result;
        
        for (uint256 i = 0; i < 10; i++) {
            if (topPlayers[i] != address(0)) {
                PlayerStats memory stats = players[topPlayers[i]];
                
                result[i] = LeaderboardEntry({
                    rank: i + 1,
                    player: stats.playerAddress,
                    highestScore: stats.highestScore,
                    totalKills: stats.totalKills,
                    totalSessions: stats.totalSessions,
                    averageAccuracy: stats.totalSessions > 0 
                        ? stats.totalAccuracy / stats.totalSessions 
                        : 0,
                    lastUpdated: stats.lastUpdated
                });
            }
        }
        
        return result;
    }
    
    function getPlayerRank(address player) external view returns (uint256) {
        for (uint256 i = 0; i < 10; i++) {
            if (topPlayers[i] == player) {
                return i + 1;
            }
        }
        return 0;
    }
    
    function getPlayerStats(address player) external view returns (
        uint256 highestScore,
        uint256 totalKills,
        uint256 totalSessions,
        uint256 averageAccuracy,
        uint256 lastUpdated,
        bool exists
    ) {
        PlayerStats memory stats = players[player];
        uint256 avgAccuracy = stats.totalSessions > 0 
            ? stats.totalAccuracy / stats.totalSessions 
            : 0;
        
        return (
            stats.highestScore,
            stats.totalKills,
            stats.totalSessions,
            avgAccuracy,
            stats.lastUpdated,
            stats.exists
        );
    }
    
    function getGlobalStats() external view returns (
        uint256 _totalPlayers,
        uint256 _totalSessions,
        uint256 highestScoreEver,
        address topPlayer
    ) {
        uint256 maxScore = 0;
        address top = address(0);
        
        if (topPlayers[0] != address(0)) {
            top = topPlayers[0];
            maxScore = players[top].highestScore;
        }
        
        return (totalPlayers, totalSessions, maxScore, top);
    }
    
    // ============================================
    // ADMIN
    // ============================================
    
    function setGameServer(address newServer) external onlyOwner {
        require(newServer != address(0), "Invalid address");
        gameServer = newServer;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}