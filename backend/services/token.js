export class TokenService {
  constructor(hathorService, databaseService) {
    this.hathor = hathorService;
    this.db = databaseService;
    this.tokens = new Map();
    this.initializeDefaultTokens();
  }

  initializeDefaultTokens() {
    // Initialize with default token data
    this.tokens.set('HTR', {
      id: '00',
      name: 'Hathor',
      symbol: 'HTR',
      decimals: 2
    });
    
    this.tokens.set('SWIISH', {
      id: 'swiish_token_id',
      name: 'SWIISH',
      symbol: 'SWIISH',
      decimals: 2
    });

    this.tokens.set('USDT', {
      id: 'usdt_token_id',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6
    });

    this.tokens.set('ETH', {
      id: 'eth_token_id',
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    });
  }

  getToken(symbol) {
    return this.tokens.get(symbol);
  }

  getAllTokens() {
    return Array.from(this.tokens.values());
  }

  async getTokenBalance(address, tokenId) {
    try {
      return await this.hathor.getBalance(tokenId);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return 0;
    }
  }
}
