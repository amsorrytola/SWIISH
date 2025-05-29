const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('swiish_token');
    this.maxRetries = 5;
    this.retryDelay = 2000;
    this.baseTimeout = 15000;
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('swiish_token', token);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'close'
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Add Telegram WebApp headers if available
    if (window.Telegram?.WebApp?.initData) {
      headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
    }

    // Add ngrok header to bypass warning
    headers['ngrok-skip-browser-warning'] = 'true';
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making API request to:', url);
    
    const config = {
      headers: this.getHeaders(),
      mode: 'cors',
      credentials: 'omit',
      ...options,
    };

    console.log('Request config:', config);

    return this.requestWithRetry(url, config);
  }

  async requestWithRetry(url, config, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeout = this.baseTimeout * attempt;
      const timeoutId = setTimeout(() => {
        console.log(`Request timeout after ${timeout}ms`);
        controller.abort();
      }, timeout);

      console.log(`Attempt ${attempt}/${this.maxRetries} for ${url}`);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Retry on certain error conditions
        if (attempt < this.maxRetries && this.shouldRetry(response.status, errorText)) {
          console.log(`Retrying request (attempt ${attempt + 1}/${this.maxRetries})`);
          await this.delay(this.retryDelay * attempt);
          return this.requestWithRetry(url, config, attempt + 1);
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error(`API request failed (attempt ${attempt}):`, error);
      
      // Retry on network errors
      if (attempt < this.maxRetries && this.shouldRetryOnError(error)) {
        console.log(`Retrying request due to error (attempt ${attempt + 1}/${this.maxRetries}):`, error.message);
        await this.delay(this.retryDelay * attempt);
        return this.requestWithRetry(url, config, attempt + 1);
      }
      
      throw new Error(`Network error after ${attempt} attempts: ${error.message}`);
    }
  }

  shouldRetry(status, errorText) {
    return (
      status >= 500 || 
      status === 0 ||
      status === 408 ||
      status === 429 ||
      errorText.includes('NO_ERROR') ||
      errorText.includes('timeout') ||
      errorText.includes('connection')
    );
  }

  shouldRetryOnError(error) {
    return (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      error.name === 'NetworkError' ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NO_ERROR') ||
      error.message.includes('timeout') ||
      error.message.includes('connection') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ENOTFOUND')
    );
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  async getLiquidityQuote(poolId, amountA) {
    return this.request('/liquidity/quote', {
      method: 'POST',
      body: JSON.stringify({ poolId, amountA }),
    });
  }

  async stakeLiquidity(stakingData) {
    return this.request('/liquidity/stake', {
      method: 'POST',
      body: JSON.stringify(stakingData),
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
