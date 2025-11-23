# 🎮 HCS Game Session Service

Service backend pour enregistrer les sessions de jeu Space War sur Hedera Consensus Service (HCS).

## 📋 Prérequis

- Node.js >= 20
- Compte Hedera Testnet (gratuit sur [portal.hedera.com](https://portal.hedera.com/register))
- NPM ou pnpm

## 🚀 Installation

```bash
cd HGame/hcs-service
npm install
```

## ⚙️ Configuration

1. **Créer le fichier `.env`:**

```bash
cp .env.example .env
```

2. **Obtenir vos credentials Hedera:**
   - Allez sur [portal.hedera.com/register](https://portal.hedera.com/register)
   - Créez un compte testnet
   - Copiez votre `Account ID` et `Private Key`

3. **Remplir le fichier `.env`:**

```env
OPERATOR_ID=0.0.VOTRE_COMPTE_ID
OPERATOR_KEY=VOTRE_CLE_PRIVEE
NETWORK=testnet
GAME_SESSION_TOPIC_ID=
PORT=3001
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
LOG_LEVEL=info
```

## 📝 Étapes de Setup

### 1. Créer le Topic HCS (une seule fois)

```bash
npm run create-topic
```

**Résultat attendu:**
```
✅ Topic Created Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Topic ID: 0.0.1234567
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Add this to your .env file:
GAME_SESSION_TOPIC_ID=0.0.1234567
```

**Action:** Copiez le `GAME_SESSION_TOPIC_ID` dans votre fichier `.env`

### 2. Tester la soumission d'une session

```bash
npm run test-submit
```

**Résultat attendu:**
```
✅ Session submitted successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Message ID: 0.0.1234567:1
⏱️  Consensus Timestamp: 2024-11-20T10:30:45.123Z
🔢 Sequence Number: 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Lire l'historique des sessions

```bash
npm run read-history
```

**Options:**
```bash
# Filtrer par joueur
npm run read-history -- --player=0.0.123456

# Limiter le nombre de résultats
npm run read-history -- --limit=5
```

### 4. Démarrer le serveur API (en mode développement)

```bash
npm run dev
```

**Résultat attendu:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 HCS Game Session API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://localhost:3001
🌐 Network: testnet
📋 Topic ID: 0.0.1234567
👤 Operator: 0.0.XXXXXX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5. Écouter les nouvelles sessions en temps réel (optionnel)

Dans un autre terminal:

```bash
npm run subscribe
```

## 🔗 Endpoints API

### Health Check
```bash
GET http://localhost:3001/health
```

### Soumettre une session
```bash
POST http://localhost:3001/api/sessions
Content-Type: application/json

{
  "player": "0.0.123456",
  "score": 15750,
  "kills": 23,
  "accuracy": 78.5,
  "timeSurvived": 342,
  "timestamp": 1700000000000
}
```

### Récupérer toutes les sessions
```bash
GET http://localhost:3001/api/sessions?limit=20
```

### Récupérer les sessions d'un joueur
```bash
GET http://localhost:3001/api/sessions/player/0.0.123456?limit=10
```

### Récupérer les dernières sessions
```bash
GET http://localhost:3001/api/sessions/latest?limit=10
```

### Récupérer le leaderboard
```bash
GET http://localhost:3001/api/leaderboard?limit=10
```

## 🧪 Test End-to-End

### Test avec curl:

```bash
# Test de soumission
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "player": "0.0.123456",
    "sessionId": "test-session-1",
    "nonce": "test-nonce-1",
    "score": 1000,
    "kills": 5,
    "accuracy": 75,
    "timeSurvived": 120,
    "gameMode": "singleplayer",
    "timestamp": 1700000000000
  }'

# Lire les sessions
curl http://localhost:3001/api/sessions

# Leaderboard
curl http://localhost:3001/api/leaderboard
```

## 🎮 Intégration avec le Jeu

### Dans Angular (FrontEnd):

1. **Importer le service HCS:**
```typescript
import { HcsApiService } from './services/hcs-api.service';
```

2. **Soumettre une session après le jeu:**
```typescript
private hcsApi = inject(HcsApiService);

async onGameOver(stats: GameStats) {
  const result = await this.hcsApi.submitGameSession({
    score: stats.score,
    kills: stats.kills,
    accuracy: stats.accuracy,
    time: stats.timeSurvived
  });
  
  if (result.success) {
    console.log('Session enregistrée sur Hedera!');
  }
}
```

## 📊 Visualiser les Sessions

### Sur HashScan:
```
https://hashscan.io/testnet/topic/VOTRE_TOPIC_ID
```

### Avec le script de lecture:
```bash
npm run read-history
```

## 🐛 Dépannage

### Erreur: "OPERATOR_ID not set"
→ Vérifiez que votre fichier `.env` existe et contient les credentials

### Erreur: "GAME_SESSION_TOPIC_ID not set"
→ Exécutez `npm run create-topic` d'abord

### Erreur: "insufficient tx fee"
→ Votre compte Hedera testnet n'a pas assez de HBAR
→ Réclamez des HBAR gratuits sur [portal.hedera.com](https://portal.hedera.com)

### Le serveur ne démarre pas
→ Vérifiez que le port 3001 n'est pas déjà utilisé
→ Changez `PORT=3002` dans `.env`

### CORS errors
→ Ajoutez l'URL de votre frontend à `ALLOWED_ORIGINS` dans `.env`

## 📚 Structure des Fichiers

```
hcs-service/
├── src/
│   ├── hedera-client.ts       # Client Hedera réutilisable
│   ├── create-topic.ts        # Script de création du topic
│   ├── submit-session.ts      # Soumission de sessions
│   ├── read-sessions.ts       # Lecture depuis Mirror Node
│   ├── subscribe-sessions.ts  # Écoute en temps réel
│   ├── test-submit.ts         # Script de test
│   └── index.ts               # Serveur Express API
├── .env                       # Configuration (NE PAS COMMIT)
├── .env.example               # Template de configuration
├── package.json               # Dependencies
├── tsconfig.json              # Config TypeScript
└── README.md                  # Ce fichier
```

## 🔐 Sécurité

- ⚠️ **Ne commitez JAMAIS votre fichier `.env`**
- ⚠️ Les clés privées doivent rester secrètes
- ⚠️ Utilisez un compte dédié pour le testnet
- ⚠️ Pour la production, utilisez des variables d'environnement sécurisées

## 📖 Ressources

- [Hedera Documentation](https://docs.hedera.com)
- [HCS Documentation](https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service)
- [Hedera SDK](https://github.com/hashgraph/hedera-sdk-js)
- [Mirror Node API](https://docs.hedera.com/hedera/sdks-and-apis/rest-api)

## 🆘 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs du serveur
2. Testez avec `npm run test-submit`
3. Vérifiez votre solde HBAR sur [HashScan](https://hashscan.io)
4. Consultez la documentation Hedera