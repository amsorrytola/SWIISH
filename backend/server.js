import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { HathorService } from './services/hathor.js';
import { DatabaseService } from './services/database.js';
import { TokenService } from './services/token.js';
import { SwapService } from './services/swap.js';
import { DAOService } from './services/dao.js';
import { NFTService } from './services/nft.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Force HTTP/1.1 for better Telegram compatibility
app.use((req, res, next) => {
  res.setHeader('Connection', 'close');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  next();
});

// Add express.json middleware first
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add specific middleware for Telegram WebApp first
app.use((req, res, next) => {
  // Set headers for Telegram WebApp
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-Init-Data, ngrok-skip-browser-warning');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  
  // Add Telegram Mini App specific headers
  if (req.headers['user-agent'] && req.headers['user-agent'].includes('TelegramBot')) {
    res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:;");
    res.header('X-Robots-Tag', 'noindex, nofollow');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Add Telegram Mini App detection middleware
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isTelegramBot = userAgent.includes('TelegramBot') || req.headers['x-telegram-init-data'];
  
  if (isTelegramBot) {
    console.log('Telegram Mini App request detected');
    req.isTelegramMiniApp = true;
  }
  
  next();
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://6573-45-251-49-31.ngrok-free.app',
    'https://*.ngrok-free.app',
    'https://*.ngrok.io',
    'https://web.telegram.org',
    'https://telegram.org',
    'https://t.me',
    '*' // Allow all origins for Telegram WebApp
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data', 'ngrok-skip-browser-warning']
}));

// Add request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000);
  next();
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../Frontend/dist')));

// Initialize services
const hathorService = new HathorService();
const dbService = new DatabaseService();
const tokenService = new TokenService(hathorService, dbService);
const swapService = new SwapService(hathorService, tokenService);
const daoService = new DAOService(dbService, tokenService);
const nftService = new NFTService(dbService, tokenService);

// Telegram Bot Token validation middleware
const validateTelegramAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Enhanced auth endpoint with DeFi features
app.post('/api/auth/telegram', async (req, res) => {
  try {
    console.log('Authentication request received:', req.body);
    
    const { telegramId, username, firstName } = req.body;
    
    if (!telegramId) {
      console.error('Missing telegramId in request');
      return res.status(400).json({ error: 'Telegram ID required' });
    }

    console.log(`Authenticating user: ${telegramId} (@${username})`);

    let user = await dbService.getUser(telegramId);
    console.log('Existing user found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('Creating new user with DeFi features...');
      user = await dbService.createUser({
        telegramId,
        username: username || 'user',
        firstName: firstName || 'User',
        swiishTokens: 0,
        loyaltyPoints: 100, // Welcome bonus for immediate participation
        nftCount: 0,
        totalLiquidity: 0,
        investorDAOPower: 0,
        userDAOPower: 0,
        stakingRewards: 0,
        nftTier: 'None',
        joinedAt: new Date().toISOString()
      });
      console.log('New user created with DeFi features:', user);
    }

    // Generate JWT token
    const token = jwt.sign(
      { telegramId, username: username || 'user' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' } // Extended for better UX
    );

    console.log('Authentication successful for:', telegramId);
    res.json({ 
      token, 
      user: {
        ...user,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        swiish_tokens: user.swiish_tokens || 0,
        loyalty_points: user.loyalty_points || 100,
        nft_count: user.nft_count || 0,
        total_liquidity: user.total_liquidity || 0,
        investor_dao_power: user.investor_dao_power || 0,
        user_dao_power: user.user_dao_power || 0,
        staking_rewards: user.staking_rewards || 0,
        nft_tier: user.nft_tier || 'None'
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});

// User endpoints
app.get('/api/user/profile', validateTelegramAuth, async (req, res) => {
  try {
    const user = await dbService.getUser(req.user.telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

app.get('/api/user/activity', validateTelegramAuth, async (req, res) => {
  try {
    const activities = await dbService.getUserActivities(req.user.telegramId);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user activities' });
  }
});

// Swap endpoints
app.get('/api/swap/quote', async (req, res) => {
  try {
    const { fromToken, toToken, amount } = req.query;
    const quote = await swapService.getQuote(fromToken, toToken, parseFloat(amount));
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get swap quote' });
  }
});

// Enhanced swap endpoint with NFT benefits
app.post('/api/swap/execute', validateTelegramAuth, async (req, res) => {
  try {
    const { fromToken, toToken, fromAmount, minToAmount, slippage } = req.body;
    
    // Get user to check NFT benefits
    const user = await dbService.getUser(req.user.telegramId);
    
    // Calculate rewards based on NFT tier
    let swiishReward = 10;
    let loyaltyReward = 5;
    let feeReduction = 0;
    
    if (user.nft_tier) {
      switch (user.nft_tier) {
        case 'Platinum':
          feeReduction = 20;
          swiishReward = 15;
          loyaltyReward = 10;
          break;
        case 'Gold':
          feeReduction = 15;
          swiishReward = 12;
          loyaltyReward = 8;
          break;
        case 'Silver':
          feeReduction = 10;
          swiishReward = 11;
          loyaltyReward = 6;
          break;
        case 'Bronze':
          feeReduction = 5;
          loyaltyReward = 6;
          break;
      }
    }
    
    const result = await swapService.executeSwap({
      userTelegramId: req.user.telegramId,
      fromToken,
      toToken,
      fromAmount: parseFloat(fromAmount),
      minToAmount: parseFloat(minToAmount),
      slippage: parseFloat(slippage),
      feeReduction
    });

    // Award enhanced rewards
    await dbService.addSwiishTokens(req.user.telegramId, swiishReward);
    await dbService.addLoyaltyPoints(req.user.telegramId, loyaltyReward);
    await dbService.updateDAOPower(req.user.telegramId, 'user', loyaltyReward);
    
    res.json({
      ...result,
      rewards: {
        swiishTokens: swiishReward,
        loyaltyPoints: loyaltyReward,
        feeReduction
      }
    });
  } catch (error) {
    console.error('Enhanced swap failed:', error);
    res.status(500).json({ error: 'Swap execution failed' });
  }
});

// Enhanced liquidity endpoints
app.get('/api/liquidity/pools', async (req, res) => {
  try {
    const pools = [
      { 
        id: 1,
        pair: 'ETH/USDT',
        tokenA: 'ETH',
        tokenB: 'USDT',
        reserveA: 1250.75,
        reserveB: 2875432.50,
        apy: 12.5, 
        tvl: 5750865,
        myLiquidity: 0,
        myLPTokens: 0,
        totalLPTokens: 50000,
        swiishRewards: 150,
        participants: 1247,
        volume24h: 156000,
        fee: 0.3,
        priceA: 2300.34,
        priceB: 1.00
      },
      { 
        id: 2,
        pair: 'HTR/USDT',
        tokenA: 'HTR',
        tokenB: 'USDT',
        reserveA: 125000,
        reserveB: 8750,
        apy: 18.2, 
        tvl: 850000,
        myLiquidity: 1200,
        myLPTokens: 15.5,
        totalLPTokens: 12000,
        swiishRewards: 89,
        participants: 432,
        volume24h: 67000,
        fee: 0.3,
        priceA: 0.07,
        priceB: 1.00
      },
      { 
        id: 3,
        pair: 'SWIISH/HTR',
        tokenA: 'SWIISH',
        tokenB: 'HTR',
        reserveA: 50000,
        reserveB: 25000,
        apy: 25.7, 
        tvl: 420000,
        myLiquidity: 0,
        myLPTokens: 0,
        totalLPTokens: 8000,
        swiishRewards: 234,
        participants: 156,
        volume24h: 23000,
        fee: 0.3,
        priceA: 0.35,
        priceB: 0.07
      },
      {
        id: 4,
        pair: 'BTC/ETH',
        tokenA: 'BTC',
        tokenB: 'ETH',
        reserveA: 25.5,
        reserveB: 450.75,
        apy: 8.9,
        tvl: 1850000,
        myLiquidity: 0,
        myLPTokens: 0,
        totalLPTokens: 2500,
        swiishRewards: 320,
        participants: 890,
        volume24h: 245000,
        fee: 0.3,
        priceA: 67500,
        priceB: 2300.34
      },
      {
        id: 5,
        pair: 'USDC/USDT',
        tokenA: 'USDC',
        tokenB: 'USDT',
        reserveA: 500000,
        reserveB: 498750,
        apy: 4.2,
        tvl: 998750,
        myLiquidity: 0,
        myLPTokens: 0,
        totalLPTokens: 25000,
        swiishRewards: 45,
        participants: 2156,
        volume24h: 89000,
        fee: 0.3,
        priceA: 0.9975,
        priceB: 1.00
      }
    ];

    console.log('Returning liquidity pools:', pools.length);
    res.json(pools);
  } catch (error) {
    console.error('Error getting liquidity pools:', error);
    res.status(500).json({ error: 'Failed to get liquidity pools' });
  }
});

app.post('/api/liquidity/add', validateTelegramAuth, async (req, res) => {
  try {
    const { poolId, tokenA, tokenB, amountA, amountB, slippage } = req.body;
    
    const liquidityValue = parseFloat(amountA) + parseFloat(amountB);
    const swiishReward = liquidityValue * 0.05;
    const loyaltyReward = Math.floor(liquidityValue * 0.02);
    
    const result = await swapService.addLiquidity({
      userTelegramId: req.user.telegramId,
      poolId,
      tokenA,
      tokenB,
      amountA: parseFloat(amountA),
      amountB: parseFloat(amountB),
      slippage: parseFloat(slippage)
    });

    // Award rewards
    await dbService.addSwiishTokens(req.user.telegramId, swiishReward);
    await dbService.addLoyaltyPoints(req.user.telegramId, loyaltyReward);
    await dbService.updateLiquidity(req.user.telegramId, liquidityValue);
    await dbService.updateDAOPower(req.user.telegramId, 'investor', swiishReward);

    res.json({
      ...result,
      rewards: {
        swiishTokens: swiishReward,
        loyaltyPoints: loyaltyReward,
        liquidityValue
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add liquidity' });
  }
});

app.post('/api/liquidity/remove', validateTelegramAuth, async (req, res) => {
  try {
    const { poolId, lpTokens, percentage } = req.body;
    
    const result = await swapService.removeLiquidity({
      userTelegramId: req.user.telegramId,
      poolId,
      lpTokens: parseFloat(lpTokens),
      percentage: parseFloat(percentage)
    });

    // Update user liquidity
    await dbService.updateLiquidity(req.user.telegramId, -result.liquidityRemoved);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove liquidity' });
  }
});

app.post('/api/liquidity/quote', async (req, res) => {
  try {
    const { poolId, amountA } = req.body;
    
    const quote = await swapService.getLiquidityQuote(poolId, parseFloat(amountA));
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get liquidity quote' });
  }
});

// Liquidity endpoints
app.get('/api/liquidity/pools', async (req, res) => {
  try {
    const pools = await swapService.getLiquidityPools();
    res.json(pools);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get liquidity pools' });
  }
});

app.post('/api/liquidity/add', validateTelegramAuth, async (req, res) => {
  try {
    const { tokenA, tokenB, amountA, amountB } = req.body;
    
    const result = await swapService.addLiquidity({
      userTelegramId: req.user.telegramId,
      tokenA,
      tokenB,
      amountA: parseFloat(amountA),
      amountB: parseFloat(amountB)
    });

    // Award SWIISH tokens for liquidity provision
    const swiishReward = (parseFloat(amountA) + parseFloat(amountB)) * 0.1;
    await dbService.addSwiishTokens(req.user.telegramId, swiishReward);
    await dbService.addLoyaltyPoints(req.user.telegramId, 25);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add liquidity' });
  }
});

app.post('/api/liquidity/remove', validateTelegramAuth, async (req, res) => {
  try {
    const { poolId, lpTokens } = req.body;
    
    const result = await swapService.removeLiquidity({
      userTelegramId: req.user.telegramId,
      poolId,
      lpTokens: parseFloat(lpTokens)
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove liquidity' });
  }
});

// Enhanced liquidity staking endpoint
app.post('/api/liquidity/stake', validateTelegramAuth, async (req, res) => {
  try {
    const { selectedPool, amount } = req.body;
    
    const stakeAmount = parseFloat(amount);
    const swiishReward = stakeAmount * 0.1; // 10% SWIISH token reward
    const loyaltyReward = Math.floor(stakeAmount * 0.05); // 5% loyalty points
    
    // Update user rewards and DAO membership
    await dbService.addSwiishTokens(req.user.telegramId, swiishReward);
    await dbService.addLoyaltyPoints(req.user.telegramId, loyaltyReward);
    await dbService.updateLiquidity(req.user.telegramId, stakeAmount);
    await dbService.updateDAOPower(req.user.telegramId, 'investor', swiishReward);

    const result = {
      success: true,
      stakeAmount,
      swiishReward,
      loyaltyReward,
      pool: selectedPool,
      transactionId: 'stake_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };

    res.json(result);
  } catch (error) {
    console.error('Staking failed:', error);
    res.status(500).json({ error: 'Failed to stake liquidity' });
  }
});

// DAO endpoints
app.get('/api/dao/proposals', async (req, res) => {
  try {
    const proposals = await daoService.getActiveProposals();
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get DAO proposals' });
  }
});

// Enhanced DAO voting with requirements
app.post('/api/dao/vote', validateTelegramAuth, async (req, res) => {
  try {
    const { proposalId, vote, daoType, requiredTokens } = req.body;
    
    const user = await dbService.getUser(req.user.telegramId);
    
    // Check voting requirements
    if (daoType === 'investor' && user.swiish_tokens < requiredTokens) {
      return res.status(400).json({ 
        error: `Insufficient SWIISH tokens. Need ${requiredTokens}, have ${user.swiish_tokens}` 
      });
    }
    
    if (daoType === 'user' && user.loyalty_points < requiredTokens) {
      return res.status(400).json({ 
        error: `Insufficient loyalty points. Need ${requiredTokens}, have ${user.loyalty_points}` 
      });
    }

    const result = await daoService.vote({
      userTelegramId: req.user.telegramId,
      proposalId,
      vote,
      daoType
    });

    // Reward voting participation
    const loyaltyReward = daoType === 'investor' ? 15 : 10;
    await dbService.addLoyaltyPoints(req.user.telegramId, loyaltyReward);

    res.json({
      ...result,
      reward: loyaltyReward
    });
  } catch (error) {
    console.error('Enhanced voting failed:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

app.post('/api/dao/proposal', validateTelegramAuth, async (req, res) => {
  try {
    const { title, description, daoType } = req.body;
    
    const result = await daoService.createProposal({
      creatorTelegramId: req.user.telegramId,
      title,
      description,
      daoType
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

// NFT endpoints
app.get('/api/nft/marketplace', async (req, res) => {
  try {
    const nfts = await nftService.getMarketplaceNFTs();
    res.json(nfts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get NFT marketplace' });
  }
});

// Enhanced NFT redemption with tier tracking
app.post('/api/nft/redeem', validateTelegramAuth, async (req, res) => {
  try {
    const { nftId, cost, tier } = req.body;
    
    const user = await dbService.getUser(req.user.telegramId);
    if (user.loyalty_points < cost) {
      return res.status(400).json({ error: 'Insufficient loyalty points' });
    }

    const result = await nftService.redeemNFT({
      userTelegramId: req.user.telegramId,
      nftId,
      cost,
      tier
    });

    // Deduct loyalty points and update NFT status
    await dbService.addLoyaltyPoints(req.user.telegramId, -cost);
    await dbService.incrementNFTCount(req.user.telegramId);
    await dbService.updateNFTTier(req.user.telegramId, tier);

    res.json(result);
  } catch (error) {
    console.error('Enhanced NFT redemption failed:', error);
    res.status(500).json({ error: 'Failed to redeem NFT' });
  }
});

app.get('/api/nft/user/:telegramId', validateTelegramAuth, async (req, res) => {
  try {
    const nfts = await nftService.getUserNFTs(req.params.telegramId);
    res.json(nfts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user NFTs' });
  }
});

// Health check with Telegram Mini App support
app.get('/health', (req, res) => {
  const response = { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    telegram: req.isTelegramMiniApp || false
  };
  res.json(response);
});

// Serve the React app for any non-API routes
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Start server with better error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`SWIISH Backend running on port ${PORT}`);
  
  // Initialize database
  dbService.initialize().catch(console.error);
  
  // Connect to Hathor network
  hathorService.initialize().catch(console.error);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

server.on('clientError', (err, socket) => {
  console.error('Client error:', err);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
