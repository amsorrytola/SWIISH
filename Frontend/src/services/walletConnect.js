class WalletConnectService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.isConnected = false;
    this.chainId = null;
  }

  async connect() {
    try {
      console.log('Connecting to wallet...');
      
      // Check if MetaMask is available
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        this.address = accounts[0];
        this.isConnected = true;
        
        // Get chain ID
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });
        this.chainId = parseInt(chainId, 16);

        console.log('Wallet connected:', {
          address: this.address,
          chainId: this.chainId
        });

        return {
          address: this.address,
          chainId: this.chainId,
          provider: window.ethereum
        };
      } else {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw new Error('Failed to connect wallet: ' + error.message);
    }
  }

  async disconnect() {
    try {
      this.provider = null;
      this.signer = null;
      this.address = null;
      this.isConnected = false;
      this.chainId = null;
      
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  async getBalance() {
    if (!this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [this.address, 'latest']
      });
      
      // Convert from wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      return balanceInEth.toString();
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
      // Simulate transaction for demo
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      console.log('Executing external swap:', {
        from: fromToken,
        to: toToken,
        amount,
        txHash
      });

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
}

export default new WalletConnectService();
