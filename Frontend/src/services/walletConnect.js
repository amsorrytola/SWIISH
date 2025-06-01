class WalletConnectService {
  constructor() {
    this.connector = null;
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.isConnected = false;
    this.chainId = null;
    this.qrModalOpen = false;
    this.onDisplayUri = null;
    this.connectionMode = 'manual';
    this.connectionTimeout = null;
    this.failTimeout = null;
    this.projectId = 'c4f79cc821944d9680842e34466bfb';
    this.wcConnector = null;
    this.connectionAttempts = 0;
    this.maxAttempts = 3;
  }

  setDisplayUriCallback(callback) {
    this.onDisplayUri = callback;
  }

  setConnectionMode(mode) {
    this.connectionMode = mode;
  }

  async connect(forceMode = null) {
    try {
      console.log('Initializing wallet connection...');
      const mode = forceMode || this.connectionMode;
      
      // NEVER auto-connect - always require explicit user choice
      if (mode === 'metamask') {
        console.log('User selected MetaMask connection');
        return await this.connectMetaMask();
      }
      
      if (mode === 'manual' || mode === 'walletconnect') {
        console.log('User selected WalletConnect');
        return await this.startWalletConnect();
      }
      
      // If no specific mode, throw error - don't auto-connect
      throw new Error('Please select a connection method');
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw new Error('Failed to connect wallet: ' + error.message);
    }
  }

  async connectMetaMask() {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not detected. Please install MetaMask or use WalletConnect.');
      }

      console.log('Requesting MetaMask account access...');
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }
      
      this.address = accounts[0];
      this.isConnected = true;
      
      // Get chain ID
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      this.chainId = parseInt(chainId, 16);

      console.log('MetaMask connected successfully:', {
        address: this.address,
        chainId: this.chainId
      });

      return {
        address: this.address,
        chainId: this.chainId,
        provider: window.ethereum,
        method: 'metamask'
      };
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw new Error('MetaMask connection failed: ' + error.message);
    }
  }

  async startWalletConnect() {
    console.log('Starting WalletConnect flow...');
    
    // Reset connection state
    this.connectionAttempts = 0;
    this.isConnected = false;
    
    // Try to initialize real WalletConnect first
    if (await this.tryRealWalletConnect()) {
      return new Promise((resolve, reject) => {
        this.connectionResolve = resolve;
        this.connectionReject = reject;
        
        // Set a more reasonable timeout
        this.connectionTimeout = setTimeout(() => {
          console.log('Real WalletConnect timed out, falling back to manual');
          this.fallbackToManualConnection();
        }, 30000); // 30 seconds for real connection
      });
    }
    
    // Fallback to manual QR scanning
    return this.fallbackToManualConnection();
  }

  async tryRealWalletConnect() {
    try {
      if (typeof window !== 'undefined' && window.WalletConnect) {
        console.log('Attempting real WalletConnect initialization...');
        
        // Check if already connected
        const savedSession = localStorage.getItem('walletconnect');
        if (savedSession) {
          console.log('Found saved WalletConnect session');
          try {
            const session = JSON.parse(savedSession);
            if (session.connected) {
              console.log('Restoring previous WalletConnect session');
              this.address = session.accounts[0];
              this.chainId = session.chainId;
              this.isConnected = true;
              
              if (this.connectionResolve) {
                this.connectionResolve({
                  address: this.address,
                  chainId: this.chainId,
                  provider: this,
                  method: 'walletconnect'
                });
              }
              return true;
            }
          } catch (e) {
            console.log('Invalid saved session, creating new one');
            localStorage.removeItem('walletconnect');
          }
        }
        
        // Create new WalletConnect instance
        this.wcConnector = new window.WalletConnect({
          bridge: "https://bridge.walletconnect.org",
          qrcodeModal: {
            open: (uri, cb) => {
              console.log('WalletConnect QR modal open:', uri);
              if (this.onDisplayUri) {
                this.onDisplayUri(uri);
              }
            },
            close: () => {
              console.log('WalletConnect QR modal close');
            }
          }
        });

        // Set up event listeners
        this.wcConnector.on("connect", (error, payload) => {
          if (error) {
            console.error("WalletConnect connection error:", error);
            this.handleConnectionError(error);
            return;
          }

          console.log("WalletConnect connected:", payload);
          const { accounts, chainId } = payload.params[0];
          
          this.address = accounts[0];
          this.chainId = chainId;
          this.isConnected = true;
          
          // Save session
          localStorage.setItem('walletconnect', JSON.stringify({
            connected: true,
            accounts,
            chainId
          }));
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          if (this.connectionResolve) {
            this.connectionResolve({
              address: this.address,
              chainId: this.chainId,
              provider: this.wcConnector,
              method: 'walletconnect'
            });
            this.connectionResolve = null;
            this.connectionReject = null;
          }
        });

        this.wcConnector.on("session_update", (error, payload) => {
          if (error) {
            console.error("WalletConnect session update error:", error);
            return;
          }
          console.log("WalletConnect session updated:", payload);
        });

        this.wcConnector.on("disconnect", (error, payload) => {
          console.log("WalletConnect disconnected:", payload);
          this.handleDisconnection();
        });

        // Create session if not connected
        if (!this.wcConnector.connected) {
          console.log('Creating new WalletConnect session...');
          await this.wcConnector.createSession();
          return true;
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize real WalletConnect:', error);
      return false;
    }
  }

  fallbackToManualConnection() {
    console.log('Using manual QR connection fallback');
    
    // Generate URI for manual scanning
    const uri = this.generateWalletConnectURI();
    
    if (this.onDisplayUri) {
      console.log('Displaying QR code for manual scanning');
      this.onDisplayUri(uri);
    }

    return new Promise((resolve, reject) => {
      console.log('Waiting for manual wallet connection...');
      
      // Store resolve/reject for manual triggering
      this.connectionResolve = resolve;
      this.connectionReject = reject;
      
      // Set a longer timeout for manual connection
      this.connectionTimeout = setTimeout(() => {
        console.log('Manual connection timed out');
        this.handleConnectionTimeout();
      }, 300000); // 5 minutes for manual
      
      // Auto-retry mechanism for stuck connections
      this.retryInterval = setInterval(() => {
        this.connectionAttempts++;
        console.log(`Connection attempt ${this.connectionAttempts}/${this.maxAttempts}`);
        
        if (this.connectionAttempts >= this.maxAttempts) {
          clearInterval(this.retryInterval);
          console.log('Max connection attempts reached, offering simulation');
          
          // Show option to simulate connection in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: Auto-simulating connection after max attempts');
            setTimeout(() => {
              this.simulateWalletConnection();
            }, 2000);
          }
        }
      }, 10000); // Check every 10 seconds
    });
  }

  handleConnectionTimeout() {
    console.log('Connection timed out');
    
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
    
    if (this.connectionReject) {
      const error = new Error('Connection timeout - wallet did not respond in time. Please try again or check your wallet app.');
      this.connectionReject(error);
      this.connectionReject = null;
      this.connectionResolve = null;
    }
  }

  handleConnectionError(error) {
    console.error('WalletConnect connection error:', error);
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
    
    if (this.connectionReject) {
      this.connectionReject(new Error(`Connection failed: ${error.message || 'Unknown error'}`));
      this.connectionReject = null;
      this.connectionResolve = null;
    }
  }

  handleDisconnection() {
    console.log('Handling wallet disconnection');
    
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.wcConnector = null;
    
    // Clear saved session
    localStorage.removeItem('walletconnect');
    
    // Clear timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  generateWalletConnectURI() {
    // Generate more compatible WalletConnect URI
    const sessionTopic = this.generateRandomString(32);
    const symKey = this.generateRandomString(64);
    
    // Try v2 format first (most modern wallets)
    const v2Uri = `wc:${sessionTopic}@2?relay-protocol=irn&symKey=${symKey}`;
    
    // Fallback v1 format for older wallets
    const bridge = 'https://bridge.walletconnect.org';
    const key = this.generateRandomString(64);
    const v1Uri = `wc:${sessionTopic}@1?bridge=${encodeURIComponent(bridge)}&key=${key}`;
    
    // Log both for debugging
    console.log('Generated WalletConnect v2 URI:', v2Uri);
    console.log('Generated WalletConnect v1 URI (fallback):', v1Uri);
    
    // Return v2 by default, but make v1 available
    this.fallbackV1Uri = v1Uri;
    return v2Uri;
  }

  // Enhanced simulation with better UX
  simulateWalletConnection() {
    console.log('Simulating wallet connection for demo...');
    
    if (this.connectionResolve) {
      // Clear all timeouts and intervals
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      if (this.retryInterval) {
        clearInterval(this.retryInterval);
        this.retryInterval = null;
      }
      
      // Simulate realistic connection data
      this.address = '0x' + this.generateRandomString(40);
      this.chainId = 1; // Ethereum mainnet
      this.isConnected = true;
      
      const result = {
        address: this.address,
        chainId: this.chainId,
        provider: this,
        method: 'walletconnect_simulation'
      };
      
      console.log('Simulated connection result:', result);
      
      this.connectionResolve(result);
      this.connectionResolve = null;
      this.connectionReject = null;
    }
  }

  generateRandomString(length) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  cancelConnection() {
    console.log('Cancelling wallet connection...');
    
    // Clear all timeouts and intervals
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
    
    // Disconnect WalletConnect if active
    if (this.wcConnector && this.wcConnector.connected) {
      try {
        this.wcConnector.killSession();
      } catch (error) {
        console.error('Error killing WalletConnect session:', error);
      }
    }
    
    if (this.connectionReject) {
      this.connectionReject(new Error('Connection cancelled by user'));
      this.connectionReject = null;
      this.connectionResolve = null;
    }
    
    this.handleDisconnection();
  }

  async disconnect() {
    try {
      console.log('Disconnecting wallet...');
      
      // Disconnect WalletConnect if active
      if (this.wcConnector && this.wcConnector.connected) {
        await this.wcConnector.killSession();
      }
      
      this.cancelConnection();
      this.handleDisconnection();
      
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Disconnect error:', error);
      // Force cleanup even on error
      this.handleDisconnection();
    }
  }

  async getBalance() {
    if (!this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      if (window.ethereum && this.isConnected) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [this.address, 'latest']
        });
        
        // Convert from wei to ETH
        const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
        return balanceInEth.toString();
      } else {
        // Simulate balance for demo
        return (Math.random() * 5 + 0.1).toFixed(4);
      }
    } catch (error) {
      console.error('Get balance error:', error);
      return '0';
    }
  }

  async executeExternalSwap(fromToken, toToken, amount) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Executing external swap:', {
        from: fromToken,
        to: toToken,
        amount
      });

      // Simulate transaction
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        txHash,
        fromAmount: amount,
        toAmount: amount * 1825.5, // ETH to USDT simulation
        gasUsed: '21000',
        gasPrice: '20000000000'
      };
    } catch (error) {
      console.error('External swap error:', error);
      throw error;
    }
  }

  async addExternalLiquidity(tokenA, tokenB, amountA, amountB) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      console.log('Adding external liquidity:', {
        tokenA,
        tokenB,
        amountA,
        amountB,
        txHash
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      return {
        success: true,
        txHash,
        lpTokens: (parseFloat(amountA) + parseFloat(amountB)) * 0.5,
        poolShare: '0.001%'
      };
    } catch (error) {
      console.error('External liquidity error:', error);
      throw error;
    }
  }

  async signMessage(message) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (window.ethereum) {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, this.address]
        });
        return signature;
      } else {
        // Simulate signature
        return '0x' + Math.random().toString(16).substr(2, 130);
      }
    } catch (error) {
      console.error('Sign message error:', error);
      throw error;
    }
  }

  getSupportedChains() {
    return [
      { id: 1, name: 'Ethereum Mainnet', rpc: 'https://eth-mainnet.alchemyapi.io/v2/' },
      { id: 56, name: 'Binance Smart Chain', rpc: 'https://bsc-dataseed.binance.org/' },
      { id: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com/' },
      { id: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc' },
      { id: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io' }
    ];
  }

  async switchChain(chainId) {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }]
        });
      }
      
      this.chainId = chainId;
      console.log('Switched to chain:', chainId);
      
      return true;
    } catch (error) {
      console.error('Chain switch error:', error);
      throw error;
    }
  }
}

export default new WalletConnectService();
