export class SwapService {
  constructor(hathorService, tokenService) {
    this.hathor = hathorService;
    this.tokens = tokenService;
    this.pools = new Map();
    this.feeRate = 0.003; // 0.3%
    this.initializeSamplePools();
  }

  initializeSamplePools() {
    // Initialize with sample pools for demo
    const samplePools = [
      {
        tokenA: 'ETH',
        tokenB: 'USDT',
        reserveA: 1000,
        reserveB: 2500000,
        totalLPTokens: 50000,
        lpHolders: new Map()
      },
      {
        tokenA: 'HTR',
        tokenB: 'SWIISH',
        reserveA: 500000,
        reserveB: 100000,
        totalLPTokens: 25000,
        lpHolders: new Map()
      }
    ];

    samplePools.forEach(pool => {
      const poolKey = this.getPoolKey(pool.tokenA, pool.tokenB);
      this.pools.set(poolKey, pool);
    });
  }

  async getQuote(fromToken, toToken, amount) {
    const poolKey = this.getPoolKey(fromToken, toToken);
    const pool = this.pools.get(poolKey);
    
    if (!pool) {
      throw new Error('Pool not found');
    }

    const isFromTokenA = fromToken === pool.tokenA;
    const reserveIn = isFromTokenA ? pool.reserveA : pool.reserveB;
    const reserveOut = isFromTokenA ? pool.reserveB : pool.reserveA;

    // Calculate output using constant product formula with fee
    const amountInWithFee = amount * (1 - this.feeRate);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    const outputAmount = numerator / denominator;

    const priceImpact = this.calculatePriceImpact(amount, outputAmount, reserveIn, reserveOut);

    return {
      inputAmount: amount,
      outputAmount,
      priceImpact,
      fee: amount * this.feeRate,
      minimumReceived: outputAmount * 0.99, // 1% slippage tolerance
      route: [fromToken, toToken]
    };
  }

  async executeSwap({ userTelegramId, fromToken, toToken, fromAmount, minToAmount, slippage }) {
    const quote = await this.getQuote(fromToken, toToken, fromAmount);
    
    if (quote.outputAmount < minToAmount) {
      throw new Error('Slippage tolerance exceeded');
    }

    // Execute swap through nano contract
    const swapTx = await this.hathor.callNanoContract(
      this.getPoolContractId(fromToken, toToken),
      'swap',
      {
        input_token: fromToken,
        input_amount: fromAmount,
        min_output: minToAmount
      }
    );

    // Update pool reserves
    const poolKey = this.getPoolKey(fromToken, toToken);
    const pool = this.pools.get(poolKey);
    if (pool) {
      const isFromTokenA = fromToken === pool.tokenA;
      if (isFromTokenA) {
        pool.reserveA += fromAmount;
        pool.reserveB -= quote.outputAmount;
      } else {
        pool.reserveB += fromAmount;
        pool.reserveA -= quote.outputAmount;
      }
      this.pools.set(poolKey, pool);
    }

    return {
      transactionId: swapTx.hash,
      inputAmount: fromAmount,
      outputAmount: quote.outputAmount,
      fee: quote.fee,
      priceImpact: quote.priceImpact
    };
  }

  async addLiquidity({ userTelegramId, tokenA, tokenB, amountA, amountB }) {
    const poolKey = this.getPoolKey(tokenA, tokenB);
    let pool = this.pools.get(poolKey);

    if (!pool) {
      // Create new pool
      pool = {
        tokenA,
        tokenB,
        reserveA: 0,
        reserveB: 0,
        totalLPTokens: 0,
        lpHolders: new Map()
      };
    }

    // Calculate LP tokens to mint
    let lpTokens;
    if (pool.totalLPTokens === 0) {
      lpTokens = Math.sqrt(amountA * amountB);
    } else {
      const lpFromA = (amountA * pool.totalLPTokens) / pool.reserveA;
      const lpFromB = (amountB * pool.totalLPTokens) / pool.reserveB;
      lpTokens = Math.min(lpFromA, lpFromB);
    }

    // Update pool state
    pool.reserveA += amountA;
    pool.reserveB += amountB;
    pool.totalLPTokens += lpTokens;
    
    const currentLP = pool.lpHolders.get(userTelegramId) || 0;
    pool.lpHolders.set(userTelegramId, currentLP + lpTokens);
    
    this.pools.set(poolKey, pool);

    // Execute through nano contract
    const liquidityTx = await this.hathor.callNanoContract(
      this.getPoolContractId(tokenA, tokenB),
      'add_liquidity',
      {
        amount_a: amountA,
        amount_b: amountB
      }
    );

    return {
      transactionId: liquidityTx.hash,
      lpTokens,
      amountA,
      amountB,
      poolShare: (lpTokens / pool.totalLPTokens) * 100
    };
  }

  async getLiquidityPools() {
    const pools = [];
    for (const [key, pool] of this.pools) {
      const tvl = pool.reserveA + pool.reserveB; // Simplified TVL calculation
      const apy = this.calculateAPY(pool);
      
      pools.push({
        pair: `${pool.tokenA}/${pool.tokenB}`,
        tokenA: pool.tokenA,
        tokenB: pool.tokenB,
        reserveA: pool.reserveA,
        reserveB: pool.reserveB,
        tvl: Math.round(tvl),
        apy: Math.round(apy * 100) / 100,
        totalLPTokens: pool.totalLPTokens,
        myLiquidity: 0 // Default for demo
      });
    }
    return pools;
  }

  calculatePriceImpact(inputAmount, outputAmount, reserveIn, reserveOut) {
    const expectedOutput = (inputAmount * reserveOut) / reserveIn;
    return ((expectedOutput - outputAmount) / expectedOutput) * 100;
  }

  calculateAPY(pool) {
    // Simplified APY calculation based on trading volume and fees
    // In a real implementation, this would use historical data
    return Math.random() * 30 + 5; // 5-35% APY range
  }

  getPoolKey(tokenA, tokenB) {
    return [tokenA, tokenB].sort().join('-');
  }

  getPoolContractId(tokenA, tokenB) {
    // Return the nano contract ID for this trading pair
    return `pool_${this.getPoolKey(tokenA, tokenB)}`;
  }
}
