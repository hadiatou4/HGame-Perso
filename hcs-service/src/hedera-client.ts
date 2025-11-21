import { Client, PrivateKey, AccountId } from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates and configures a Hedera client for testnet or mainnet
 */
export class HederaClient {
  private static instance: Client | null = null;

  /**
   * Get a singleton Hedera client instance
   * @returns Configured Hedera client
   */
  static getClient(): Client {
    if (!this.instance) {
      this.instance = this.createClient();
    }
    return this.instance;
  }

  /**
   * Create a new Hedera client with operator credentials
   */
  private static createClient(): Client {
    // Validate environment variables
    const operatorId = process.env.OPERATOR_ID;
    const operatorKey = process.env.OPERATOR_KEY;
    const network = process.env.NETWORK || 'testnet';

    if (!operatorId || !operatorKey) {
      throw new Error(
        '❌ Missing OPERATOR_ID or OPERATOR_KEY in .env file.\n' +
        'Please create a .env file based on .env.example and add your Hedera credentials.\n' +
        'Get credentials at: https://portal.hedera.com/register'
      );
    }

    // Create client for the specified network
    let client: Client;
    if (network === 'mainnet') {
      client = Client.forMainnet();
    } else {
      client = Client.forTestnet();
    }

    // Set operator with account ID and private key
    try {
      const accountId = AccountId.fromString(operatorId);
      const privateKey = PrivateKey.fromString(operatorKey);
      
      client.setOperator(accountId, privateKey);
      
      // Optional: Set default max transaction fee (in Hbar)
      // client.setDefaultMaxTransactionFee(new Hbar(100));
      
      console.log(`✅ Hedera client initialized`);
      console.log(`   Network: ${network}`);
      console.log(`   Operator: ${operatorId}`);
      
      return client;
    } catch (error) {
      throw new Error(
        `❌ Failed to initialize Hedera client: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
        'Check your OPERATOR_ID and OPERATOR_KEY format in .env file.'
      );
    }
  }

  /**
   * Close the client connection
   */
  static close(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
      console.log('🔌 Hedera client connection closed');
    }
  }

  /**
   * Get operator account ID
   */
  static getOperatorId(): string {
    const operatorId = process.env.OPERATOR_ID;
    if (!operatorId) {
      throw new Error('OPERATOR_ID not set in .env file');
    }
    return operatorId;
  }

  /**
   * Get operator private key
   */
  static getOperatorKey(): PrivateKey {
    const operatorKey = process.env.OPERATOR_KEY;
    if (!operatorKey) {
      throw new Error('OPERATOR_KEY not set in .env file');
    }
    return PrivateKey.fromString(operatorKey);
  }

  /**
   * Get the network being used
   */
  static getNetwork(): string {
    return process.env.NETWORK || 'testnet';
  }

  /**
   * Validate that required environment variables are set
   */
  static validateEnv(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.OPERATOR_ID) {
      errors.push('OPERATOR_ID is not set');
    }

    if (!process.env.OPERATOR_KEY) {
      errors.push('OPERATOR_KEY is not set');
    }

    if (!process.env.GAME_SESSION_TOPIC_ID) {
      errors.push('GAME_SESSION_TOPIC_ID is not set (run: npm run create-topic)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  HederaClient.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  HederaClient.close();
  process.exit(0);
});