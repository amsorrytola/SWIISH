const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('swiish_token');
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('swiish_token', token);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Add Telegram WebApp headers if available
    if (window.Telegram?.WebApp?.initData) {
      headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making API request to:', url);
    
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    console.log('Request config:', config);

    try {
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Request URL:', url);
        console.error('Request config:', config);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      console.error('Request URL:', url);
      throw error;
    }
  }

  // Auth methods
  async authenticateTelegram(telegramData) {
    return this.request('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(telegramData),
    });
  }

  // User methods
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async getUserActivity() {
    return this.request('/user/activity');
  }

  // Swap methods
  async getSwapQuote(fromToken, toToken, amount) {
    return this.request(`/swap/quote?fromToken=${fromToken}&toToken=${toToken}&amount=${amount}`);
  }

  async executeSwap(swapData) {
    return this.request('/swap/execute', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  }

  // Liquidity methods
  async getLiquidityPools() {
    return this.request('/liquidity/pools');
  }

  async addLiquidity(liquidityData) {
    return this.request('/liquidity/add', {
      method: 'POST',
      body: JSON.stringify(liquidityData),
    });
  }

  async removeLiquidity(removeData) {
    return this.request('/liquidity/remove', {
      method: 'POST',
      body: JSON.stringify(removeData),
    });
  }

  // DAO methods
  async getDAOProposals() {
    return this.request('/dao/proposals');
  }

  async vote(voteData) {
    return this.request('/dao/vote', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  }

  async createProposal(proposalData) {
    return this.request('/dao/proposal', {
      method: 'POST',
      body: JSON.stringify(proposalData),
    });
  }

  // NFT methods
  async getNFTMarketplace() {
    return this.request('/nft/marketplace');
  }

  async redeemNFT(nftData) {
    return this.request('/nft/redeem', {
      method: 'POST',
      body: JSON.stringify(nftData),
    });
  }

  async getUserNFTs(telegramId) {
    return this.request(`/nft/user/${telegramId}`);
  }
}

export default new ApiService();
