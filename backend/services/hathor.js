import axios from 'axios';

export class HathorService {
  constructor() {
    this.nodeUrl = process.env.HATHOR_NODE_URL || 'http://localhost:8080';
    this.walletUrl = process.env.HATHOR_WALLET_URL || 'http://localhost:8000';
  }

  async initialize() {
    try {
      // Test connection to Hathor node
      const nodeStatus = await axios.get(`${this.nodeUrl}/v1a/status`);
      console.log('Connected to Hathor node:', nodeStatus.data.network);

      // Test wallet connection
      const walletStatus = await axios.get(`${this.walletUrl}/wallet/status`);
      console.log('Wallet status:', walletStatus.data.statusCode === 3 ? 'Ready' : 'Not Ready');

    } catch (error) {
      console.error('Failed to connect to Hathor network:', error.message);
    }
  }

  async createTransaction(inputs, outputs) {
    try {
      const response = await axios.post(`${this.walletUrl}/wallet/send-transaction`, {
        inputs,
        outputs
      });
      return response.data;
    } catch (error) {
      console.error('Transaction creation failed:', error);
      throw error;
    }
  }

  async getBalance(tokenId = '00') {
    try {
      const response = await axios.get(`${this.walletUrl}/wallet/balance`);
      return response.data.available[tokenId] || 0;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  async createToken(name, symbol, amount) {
    try {
      const response = await axios.post(`${this.walletUrl}/wallet/create-token`, {
        name,
        symbol,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Token creation failed:', error);
      throw error;
    }
  }

  async deployNanoContract(blueprint, args) {
    try {
      // Deploy nano contract using Hathor's nano contract system
      const response = await axios.post(`${this.walletUrl}/wallet/nano-contract/deploy`, {
        blueprint,
        args
      });
      return response.data;
    } catch (error) {
      console.error('Nano contract deployment failed:', error);
      throw error;
    }
  }

  async callNanoContract(contractId, method, args) {
    try {
      const response = await axios.post(`${this.walletUrl}/wallet/nano-contract/call`, {
        contract_id: contractId,
        method,
        args
      });
      return response.data;
    } catch (error) {
      console.error('Nano contract call failed:', error);
      throw error;
    }
  }
}
