class TelegramApiService {
  constructor() {
    this.token = localStorage.getItem('swiish_token');
    this.baseUrl = this.getBaseUrl();
    this.maxRetries = 3;
    this.retryDelay = 1500;
  }

  getBaseUrl() {
    // For Telegram Mini App, use the current domain
    if (window.Telegram?.WebApp) {
      const currentUrl = window.location.origin;
      console.log('Telegram Mini App detected, using base URL:', currentUrl);
      console.log('Current hostname:', window.location.hostname);
      
      // Handle ngrok URLs specifically
      if (window.location.hostname.includes('ngrok')) {
        console.log('ngrok URL detected');
        return currentUrl + '/api';
      }
      
      return currentUrl + '/api';
    }
    return import.meta.env.VITE_API_URL || '/api';
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('swiish_token', token);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
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
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Telegram API request to:', url);
    
    return this.requestWithRetry(url, options);
  }

  async requestWithRetry(url, options, attempt = 1) {
    try {
      console.log(`Telegram API attempt ${attempt}/${this.maxRetries} for ${url}`);
      
      const config = {
        method: 'GET',
        headers: this.getHeaders(),
        ...options,
      };

      // Use XMLHttpRequest for better Telegram compatibility
      const response = await this.makeXHRRequest(url, config);
      
      console.log('Telegram API response:', response);
      return response;
    } catch (error) {
      console.error(`Telegram API request failed (attempt ${attempt}):`, error);
      
      if (attempt < this.maxRetries && this.shouldRetry(error)) {
        console.log(`Retrying Telegram API request (attempt ${attempt + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay * attempt);
        return this.requestWithRetry(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  makeXHRRequest(url, config) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open(config.method || 'GET', url, true);
      
      // Set headers
      Object.entries(config.headers || {}).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      // Add ngrok bypass header if needed
      if (url.includes('ngrok')) {
        xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
      }
      
      xhr.timeout = 15000; // 15 second timeout
      
      xhr.onload = function() {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const contentType = xhr.getResponseHeader('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
              data = JSON.parse(xhr.responseText);
            } else {
              data = xhr.responseText;
            }
            
            resolve(data);
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status} - ${xhr.responseText}`));
          }
        } catch (error) {
          reject(new Error('Failed to parse response: ' + error.message));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error occurred'));
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Request timeout'));
      };
      
      if (config.body) {
        xhr.send(config.body);
      } else {
        xhr.send();
      }
    });
  }

  shouldRetry(error) {
    return (
      error.message.includes('Network error') ||
      error.message.includes('timeout') ||
      error.message.includes('HTTP error! status: 5') ||
      error.message.includes('Failed to fetch')
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

  // DAO methods
  async getDAOProposals() {
    return this.request('/dao/proposals');
  }

  // NFT methods
  async getNFTMarketplace() {
    return this.request('/nft/marketplace');
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

  async vote(voteData) {
    return this.request('/dao/vote', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  }

  async redeemNFT(nftData) {
    return this.request('/nft/redeem', {
      method: 'POST',
      body: JSON.stringify(nftData),
    });
  }

  async stakeLiquidity(stakingData) {
    return this.request('/liquidity/stake', {
      method: 'POST',
      body: JSON.stringify(stakingData),
    });
  }

  // Hierarchical DAO methods
  async getHierarchicalVotingPower(telegramId, daoType) {
    return this.request(`/dao/hierarchical/voting-power/${daoType}/${telegramId}`);
  }

  async submitHierarchicalVote(voteData) {
    return this.request('/dao/hierarchical/vote', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  }

  async delegateVotingPower(delegationData) {
    return this.request('/dao/hierarchical/delegate', {
      method: 'POST',
      body: JSON.stringify(delegationData),
    });
  }

  async getGovernanceStats(telegramId) {
    return this.request(`/dao/hierarchical/stats/${telegramId}`);
  }
}

export default new TelegramApiService();
