import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { HathorService } from './services/hathor.js';
import { DatabaseService } from './services/database.js';
import { TokenService } from './services/token.js';
import { SwapService } from './services/swap.js';
import { DAOService } from './services/dao.js';
import { NFTService } from './services/nft.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://e76d-45-251-49-135.ngrok-free.app',
    'https://telegram.org'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data']
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

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

// Auth endpoints
app.post('/api/auth/telegram', async (req, res) => {
  try {
    console.log('Authentication request received:', req.body);
    
    const { telegramId, username, firstName } = req.body;
    
    // Validate required fields
    if (!telegramId) {
      console.error('Missing telegramId in request');
      return res.status(400).json({ error: 'Telegram ID required' });
    }

    console.log(`Authenticating user: ${telegramId} (@${username})`);

    // Create or get user
    let user = await dbService.getUser(telegramId);
    console.log('Existing user found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('Creating new user...');
      user = await dbService.createUser({
        telegramId,
        username: username || 'user',
        firstName: firstName || 'User',
        swiishTokens: 0,
        loyaltyPoints: 100, // Welcome bonus
        nftCount: 0,
        totalLiquidity: 0
      });
      console.log('New user created:', user);
    }

    // Generate JWT token
    const token = jwt.sign(
      { telegramId, username: username || 'user' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
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
        total_liquidity: user.total_liquidity || 0
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

app.post('/api/swap/execute', validateTelegramAuth, async (req, res) => {
  try {
    const { fromToken, toToken, fromAmount, minToAmount, slippage } = req.body;
    
    const result = await swapService.executeSwap({
      userTelegramId: req.user.telegramId,
      fromToken,
      toToken,
      fromAmount: parseFloat(fromAmount),
      minToAmount: parseFloat(minToAmount),
      slippage: parseFloat(slippage)
    });

    // Award loyalty points for swap
    await dbService.addLoyaltyPoints(req.user.telegramId, 5);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Swap execution failed' });
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

// DAO endpoints
app.get('/api/dao/proposals', async (req, res) => {
  try {
    const proposals = await daoService.getActiveProposals();
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get DAO proposals' });
  }
});

app.post('/api/dao/vote', validateTelegramAuth, async (req, res) => {
  try {
    const { proposalId, vote, daoType } = req.body;
    
    const result = await daoService.vote({
      userTelegramId: req.user.telegramId,
      proposalId,
      vote, // 'yes' or 'no'
      daoType // 'investor' or 'user'
    });

    // Award loyalty points for voting
    await dbService.addLoyaltyPoints(req.user.telegramId, 10);

    res.json(result);
  } catch (error) {
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

app.post('/api/nft/redeem', validateTelegramAuth, async (req, res) => {
  try {
    const { nftId, cost } = req.body;
    
    const user = await dbService.getUser(req.user.telegramId);
    if (user.loyaltyPoints < cost) {
      return res.status(400).json({ error: 'Insufficient loyalty points' });
    }

    const result = await nftService.redeemNFT({
      userTelegramId: req.user.telegramId,
      nftId,
      cost
    });

    // Deduct loyalty points and increment NFT count
    await dbService.addLoyaltyPoints(req.user.telegramId, -cost);
    await dbService.incrementNFTCount(req.user.telegramId);

    res.json(result);
  } catch (error) {
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`SWIISH Backend running on port ${PORT}`);
  
  // Initialize database
  dbService.initialize();
  
  // Connect to Hathor network
  hathorService.initialize();
});
