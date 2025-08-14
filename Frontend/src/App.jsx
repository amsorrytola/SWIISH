import { useState, useEffect, useContext } from 'react';
import { Wallet, Coins, Users, Zap, Trophy, Vote, TrendingUp, ArrowUpDown, Gift, Settings, ChevronRight, Plus, Minus, ExternalLink } from 'lucide-react';
import {WalletConnectContext} from "./context/WalletConnectContext"

// Create fallback services
const createFallbackServices = () => {
  const fallbackApiService = {
    authenticateTelegram: async (data) => ({ 
      token: 'fallback_token_' + Date.now(), 
      user: {
        telegram_id: data.telegramId,
        username: data.username,
        first_name: data.firstName,
        swiish_tokens: 0,
        loyalty_points: 100,
        nft_count: 0,
        total_liquidity: 0
      }
    }),
    setAuthToken: () => {},
    getLiquidityPools: async () => [],
    getDAOProposals: async () => [],
    getNFTMarketplace: async () => [],
    getSwapQuote: async () => ({ outputAmount: 0, priceImpact: 0.15, fee: 0 }),
    executeSwap: async () => ({ success: true }),
    stakeLiquidity: async () => ({ swiishReward: 0, loyaltyReward: 0, stakeAmount: 0 }),
    addLiquidity: async () => ({ rewards: { swiishTokens: 0, loyaltyPoints: 0 } }),
    removeLiquidity: async () => ({ success: true })
  };

  const fallbackWalletService = {
    connect: async () => ({ address: '0x123...abc', chainId: 1 }),
    disconnect: async () => {},
    getBalance: async () => '2.5',
    executeExternalSwap: async () => ({ success: true, txHash: '0x123...' })
  };

  return {
    apiService: fallbackApiService,
    telegramApiService: fallbackApiService,
    walletConnectService: fallbackWalletService
  };
};

const SwiishApp = () => {
  const [activeTab, setActiveTab] = useState('swap');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [error, setError] = useState(null);
  const [services, setServices] = useState(null);
  const {connectHathorWallet , client , account , session} = useContext(WalletConnectContext)

  const addLiquidityFunc = async () => {
    console.log("Adding liquidity")
    await sendTxForLiquidity({ method: "add_liquidity" , args:[tola1]});
  }

  const claimNftFunc = async () => {
    console.log("Claiming NFT") 
    await sendTxForNFT({ method: "claim_nft"});
  }

  const addSwiishFunc = async () => {
    console.log("Adding SWiish")
    await sendTxForAddSWiish({ method: "add_swiish_liquidity", args: [iswiish] });
  }


  const swap = async () => {
    console.log("Swapping tokens")
    await sendTxForSwap({ method: "swap" });
  }

  const CONTRACT_ID ="00000a490aa2b56d9d6a323e73fe34e977f17febb24985e84b5e5421d8b12dee"
  const TOKEN_ID = "00"
  const tola1 = "000002c7bd06e6b874ffcdf7c0a34782039496cc147a7dfbd46cb6ef56adf8ce"
  const tola2 = "000001e4bd2c641e51e2612fed31ecf5bf1e1c13bfc2a460832b8d820898c78f"
  const iswiish = "00000247f7cce90558b59450016d629dd0b008fc19a8f3663728e8a47d4f9ee2"
  const uswiish = "0000025d3ece6918f49b561ff36631d84a96bc9516f9f069f397b7e659585655"

  const sendTxForAddSWiish = async ({ method, args = [] }) => {

  if (!client || !session) {
    console.log("kuch gayab hai")
    return
  };

  try {
    const result = await client.request({
      topic: session.topic,
      chainId: "hathor:testnet",
      request: {
        method: "htr_sendNanoContractTx",
        id: Date.now(),
        jsonrpc: "2.0",
        params: {
          method,
          nc_id: CONTRACT_ID,
          actions: [
            // {
            //   type: "withdrawal",
            //   token: tola2,
            //   amount: 1000.
            // },
            {
              type: "deposit",
              token: iswiish,
              amount: 1000,
            },
            // {
            //   type : "deposit",
            //   token : TOKEN_ID,
            //   amount : 3
            // },
            // {
            //   type : "withdrawal",
            //   token : iswiish,
            //   amount : 1000
            // }
          ],
          args,
          push_tx: true,
        },
      },
    });
    console.log(`✅ ${method} called successfully:`, result);
  } catch (error) {
    console.error(`❌ Error calling ${method}:`, error);
  }
};

  const sendTxForLiquidity = async ({ method, args = [] }) => {

  if (!client || !session) {
    console.log("kuch gayab hai")
    return
  };

  try {
    const result = await client.request({
      topic: session.topic,
      chainId: "hathor:testnet",
      request: {
        method: "htr_sendNanoContractTx",
        id: Date.now(),
        jsonrpc: "2.0",
        params: {
          method,
          nc_id: CONTRACT_ID,
          actions: [
            {
              type: "deposit",
              token: tola2,
              amount: 1000.
            },
            {
              type: "deposit",
              token: tola1,
              amount: 1000,
            },
            // {
            //   type : "deposit",
            //   token : TOKEN_ID,
            //   amount : 3
            // },
            // {
            //   type : "withdrawal",
            //   token : iswiish,
            //   amount : 10000
            // }
          ],
          args,
          push_tx: true,
        },
      },
    });
    console.log(`✅ ${method} called successfully:`, result);
  } catch (error) {
    console.error(`❌ Error calling ${method}:`, error);
  }
};

const sendTxForSwap = async ({ method, args = [] }) => {

  if (!client || !session) {
    console.log("kuch gayab hai")
    return
  };

  try {
    const result = await client.request({
      topic: session.topic,
      chainId: "hathor:testnet",
      request: {
        method: "htr_sendNanoContractTx",
        id: Date.now(),
        jsonrpc: "2.0",
        params: {
          method,
          nc_id: CONTRACT_ID,
          actions: [
            // {
            //   type: "withdrawal",
            //   token: tola2,
            //   amount: 1000.
            // },
            {
              type: "deposit",
              token: tola1,
              amount: 1000,
            },
            {
              type : "deposit",
              token : TOKEN_ID,
              amount : 3
            },
            // {
            //   type : "withdrawal",
            //   token : uswiish,
            //   amount : 1000
            // }
          ],
          args,
          push_tx: true,
        },
      },
    });
    console.log(`✅ ${method} called successfully:`, result);
  } catch (error) {
    console.error(`❌ Error calling ${method}:`, error);
  }
};

const sendTxForNFT = async ({ method, args = [] }) => {

  if (!client || !session) {
    console.log("kuch gayab hai")
    return
  };

  try {
    const result = await client.request({
      topic: session.topic,
      chainId: "hathor:testnet",
      request: {
        method: "htr_sendNanoContractTx",
        id: Date.now(),
        jsonrpc: "2.0",
        params: {
          method,
          nc_id: CONTRACT_ID,
          actions: [
            // {
            //   type: "withdrawal",
            //   token: "0000009485b421a85fb5fb8215ed81ec34834055090e28c3d12207b6305669e5",
            //   amount: 100.
            // }
            // {
            //   type: "deposit",
            //   token: tola1,
            //   amount: 1000,
            // },
            // {
            //   type : "deposit",
            //   token : TOKEN_ID,
            //   amount : 3
            // },
            // {
            //   type : "withdrawal",
            //   token : uswiish,
            //   amount : 100
            // }
            {
              type: "deposit",
              token: TOKEN_ID,
              amount: 1
            }
          ],
          args,
          push_tx: true,
        },
      },
    });
    console.log(`✅ ${method} called successfully:`, result);
  } catch (error) {
    console.error(`❌ Error calling ${method}:`, error);
  }
};


  
  const [swapData, setSwapData] = useState({
    fromToken: 'Tola1',
    toToken: 'Tola2',
    fromAmount: '',
    toAmount: '',
    slippage: 0.5
  });
  const [pools, setPools] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [swapQuote, setSwapQuote] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState('0');
  const [swapLoading, setSwapLoading] = useState(false);
  const [stakingLoading, setStakingLoading] = useState(false); // Add separate loading state for staking
  const [stakingData, setStakingData] = useState({
    amount: '',
    selectedPool: 'ETH/USDT'
  });
  const [liquidityData, setLiquidityData] = useState({
    selectedPool: null,
    tokenA: '',
    tokenB: '',
    amountA: '',
    amountB: '',
    slippage: 0.5
  });
  const [liquidityQuote, setLiquidityQuote] = useState(null);
  const [addLiquidityLoading, setAddLiquidityLoading] = useState(false);
  const [removeLiquidityLoading, setRemoveLiquidityLoading] = useState(false);
  const [governanceTokens, setGovernanceTokens] = useState({
    swiishTokens: 0,
    loyaltyPoints: 0,
    votingPower: 0
  });

  // Add hierarchical governance state
  const [hierarchicalGovernance, setHierarchicalGovernance] = useState({
    investorTier: 'observer',
    userTier: 'observer',
    investorVotingPower: 0,
    userVotingPower: 0,
    delegatedPower: 0,
    canCreateProposals: false,
    tierBenefits: []
  });

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('Initializing services...');
        
        // Use dynamic imports with proper error handling
        const [apiModule, telegramApiModule, walletConnectModule] = await Promise.allSettled([
          import('./services/api.js').catch(() => null),
          import('./services/telegramApi.js').catch(() => null),
          import('./services/walletConnect.js').catch(() => null)
        ]);

        const fallbacks = createFallbackServices();
        
        const loadedServices = {
          apiService: apiModule.status === 'fulfilled' && apiModule.value?.default ? apiModule.value.default : fallbacks.apiService,
          telegramApiService: telegramApiModule.status === 'fulfilled' && telegramApiModule.value?.default ? telegramApiModule.value.default : fallbacks.telegramApiService,
          walletConnectService: walletConnectModule.status === 'fulfilled' && walletConnectModule.value?.default ? walletConnectModule.value.default : fallbacks.walletConnectService
        };

        setServices(loadedServices);
        console.log('Services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setServices(createFallbackServices());
      }
    };

    initializeServices();
  }, []);

  const getApiService = () => {
    if (!services) return createFallbackServices().apiService;
    return isTelegramWebApp ? services.telegramApiService : services.apiService;
  };

  const connectWallet = async () => {
    if (!services) return;
    
    try {
      const address = await connectHathorWallet()
      if (address){
        setWalletConnected(true);
        setWalletAddress(address);
      }
      else {
        throw new Error('Failed to connect wallet');
      }
      // const connection = await services.walletConnectService.connect();
      // setWalletConnected(true);
      // setWalletAddress(connection.address);
      
      // const balance = await services.walletConnectService.getBalance();
      // setWalletBalance(balance);
      
      // console.log('Wallet connected:', connection);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  const disconnectWallet = async () => {
    if (!services) return;
    
    try {
      await services.walletConnectService.disconnect();
      setWalletConnected(false);
      setWalletAddress(null);
      setWalletBalance('0');
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
    }
  };

  useEffect(() => {
    if (!services) return;
    
    const initializeWithDelay = () => {
      try {
        setConnectionStatus('connecting');
        initializeApp();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError('Failed to initialize app: ' + error.message);
        setLoading(false);
      }
    };

    setTimeout(initializeWithDelay, 100);
  }, [services]);

  const initializeApp = async () => {
    if (!services) return;
    
    try {
      setError(null);
      setConnectionStatus('connecting');
      
      const tg = window.Telegram?.WebApp;
      const isInTelegram = tg && tg.initData;
      
      setIsTelegramWebApp(isInTelegram);
      console.log('Telegram WebApp detected:', isInTelegram);

      if (isInTelegram) {
        try {
          tg.ready();
          tg.expand();
          tg.enableClosingConfirmation();
          
          const telegramUser = tg.initDataUnsafe?.user;
          if (telegramUser) {
            await authenticateUser(telegramUser);
          } else {
            const fallbackUser = {
              id: Date.now().toString(),
              username: 'telegram_user',
              first_name: 'Telegram User'
            };
            await authenticateUser(fallbackUser);
          }
        } catch (telegramError) {
          console.error('Telegram WebApp initialization error:', telegramError);
          const fallbackUser = {
            id: Date.now().toString(),
            username: 'telegram_user',
            first_name: 'Telegram User'
          };
          await authenticateUser(fallbackUser);
        }
      } else {
        console.log('Running in browser mode (development)');
        const devUser = {
          id: '123456789',
          username: 'testuser',
          first_name: 'Test User'
        };
        await authenticateUser(devUser);
      }

      await loadAppData();
      setConnectionStatus('connected');
      setRetryCount(0);
    } catch (error) {
      console.error('App initialization failed:', error);
      setError(`Initialization failed: ${error.message}`);
      setConnectionStatus('error');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const authenticateUser = async (telegramUser) => {
    if (!services) return;
    
    try {
      console.log('Starting authentication for:', telegramUser);

      const authData = {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username || 'user',
        firstName: telegramUser.first_name || 'User'
      };

      const currentApiService = getApiService();
      let authResponse;

      try {
        authResponse = await currentApiService.authenticateTelegram(authData);
      } catch (authError) {
        console.warn('API authentication failed, using fallback:', authError);
        authResponse = {
          token: 'fallback_token_' + Date.now(),
          user: {
            telegram_id: authData.telegramId,
            username: authData.username,
            first_name: authData.firstName,
            swiish_tokens: 0,
            loyalty_points: 100,
            nft_count: 0,
            total_liquidity: 0
          }
        };
      }

      currentApiService.setAuthToken(authResponse.token);
      
      const enhancedUser = {
        ...authResponse.user,
        swiishTokens: authResponse.user.swiish_tokens || 0,
        loyaltyPoints: authResponse.user.loyalty_points || 100,
        nftCount: authResponse.user.nft_count || 0,
        totalLiquidity: authResponse.user.total_liquidity || 0,
        investorDAOPower: 0,
        userDAOPower: 0,
        stakingRewards: 0,
        nftTier: authResponse.user.nft_tier || 'None'
      };
      
      setUser(enhancedUser);
      setGovernanceTokens({
        swiishTokens: enhancedUser.swiishTokens,
        loyaltyPoints: enhancedUser.loyaltyPoints,
        votingPower: enhancedUser.swiishTokens + (enhancedUser.loyaltyPoints * 0.1)
      });
      
      // Initialize hierarchical governance
      await updateHierarchicalGovernance(enhancedUser);
      
      console.log('User authenticated successfully:', enhancedUser);
    } catch (error) {
      console.error('Authentication failed:', error);
      setError('Authentication failed: ' + error.message);
      throw error;
    }
  };

  const loadAppData = async () => {
    if (!services) return;
    
    try {
      console.log('Loading app data...');
      const currentApiService = getApiService();
      
      const fallbackPools = [
        { 
          id: 6,
          pair: 'ETH/USD',
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
          id: 1,
          pair: 'Tola1/Tola2',
          tokenA: 'Tola1',
          tokenB: 'Tola2',
          reserveA: 10,
          reserveB: 10,
          apy: 12.5, 
          tvl: 5750865,
          myLiquidity: 0,
          myLPTokens: 0,
          totalLPTokens: 50000,
          swiishRewards: 100,
          participants: 1247,
          volume24h: 156000,
          fee: 0.3,
          priceA: 1.00,
          priceB: 1.00
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

      const fallbackProposals = [
        { 
          id: 1, 
          title: 'Increase SWIISH rewards for ETH/USDT pool', 
          dao: 'investor', 
          status: 'active', 
          votes: 247,
          description: 'Proposal to increase daily SWIISH token rewards by 20% for ETH/USDT liquidity providers',
          requiredTokens: 100,
          endsAt: Date.now() + 86400000 * 5
        },
        { 
          id: 2, 
          title: 'Add Polygon network support', 
          dao: 'user', 
          status: 'active', 
          votes: 156,
          description: 'Enable cross-chain functionality with Polygon for lower fees',
          requiredTokens: 50,
          endsAt: Date.now() + 86400000 * 3
        },
        {
          id: 3,
          title: 'Launch Premium NFT Collection',
          dao: 'investor',
          status: 'active',
          votes: 89,
          description: 'Create exclusive Diamond tier NFTs with 50% fee reduction',
          requiredTokens: 500,
          endsAt: Date.now() + 86400000 * 7
        }
      ];

      const fallbackNfts = [
        // User DAO NFTs
        { 
          id: 1, 
          tier: 'Enter DAO NFT', 
          type: 'user',
          utility: '5% fee reduction + Basic voting rights', 
          cost: 50,
          supply: 2000,
          remaining: 1247,
          benefits: ['5% trading fee reduction', 'Basic DAO voting rights', 'Community access', 'Weekly reports'],
          description: 'Your entry into the SWIISH User DAO community',
          rarity: 'Common',
          powerLevel: 1,
          image: '/images/nfts/user-enter-dao.png'
        },
        { 
          id: 2, 
          tier: 'Experienced Member NFT', 
          type: 'user',
          utility: '10% fee reduction + Enhanced voting + Priority support', 
          cost: 150,
          supply: 1000,
          remaining: 687,
          benefits: ['10% trading fee reduction', 'Enhanced voting power', 'Priority customer support', 'Advanced analytics dashboard'],
          description: 'For seasoned SWIISH community members',
          rarity: 'Uncommon',
          powerLevel: 2,
          image: '/images/nfts/user-experienced-member.png'
        },
        { 
          id: 3, 
          tier: 'Super Member NFT', 
          type: 'user',
          utility: '15% fee reduction + Premium features + Exclusive pools', 
          cost: 300,
          supply: 500,
          remaining: 289,
          benefits: ['15% trading fee reduction', 'Access to exclusive pools', 'Premium trading features', 'Monthly strategy calls'],
          description: 'Elite status in the SWIISH ecosystem',
          rarity: 'Rare',
          powerLevel: 3,
          image: '/images/nfts/user-super-member.png'
        },
        { 
          id: 4, 
          tier: 'Legendary Member NFT', 
          type: 'user',
          utility: '20% fee reduction + All benefits + Governance boost', 
          cost: 500,
          supply: 200,
          remaining: 89,
          benefits: ['20% trading fee reduction', 'All premium benefits', '2x governance voting power', 'Direct team access'],
          description: 'Legendary status with maximum user benefits',
          rarity: 'Epic',
          powerLevel: 4,
          image: '/images/nfts/user-legendary-member.png'
        },
        { 
          id: 5, 
          tier: 'Ultimate Member NFT', 
          type: 'user',
          utility: '25% fee reduction + Ultimate power + Alpha access', 
          cost: 1000,
          supply: 100,
          remaining: 34,
          benefits: ['25% trading fee reduction', 'Ultimate governance power', 'Alpha feature access', 'Personal account manager'],
          description: 'The pinnacle of SWIISH User DAO membership',
          rarity: 'Legendary',
          powerLevel: 5,
          image: '/images/nfts/user-ultimate-member.png'
        },
        // Investor DAO NFTs
        { 
          id: 6, 
          tier: 'Enter DAO NFT', 
          type: 'investor',
          utility: 'Basic liquidity mining + 10% reward boost', 
          cost: 100,
          supply: 1000,
          remaining: 567,
          benefits: ['10% liquidity mining boost', 'Investor DAO voting rights', 'Exclusive investor channels', 'Market insights'],
          description: 'Your entry into the SWIISH Investor DAO',
          rarity: 'Common',
          powerLevel: 1,
          image: '/images/nfts/investor-enter-dao.png'
        },
        { 
          id: 7, 
          tier: 'Experienced Member NFT', 
          type: 'investor',
          utility: 'Enhanced mining + 20% boost + Priority allocations', 
          cost: 300,
          supply: 500,
          remaining: 234,
          benefits: ['20% liquidity mining boost', 'Priority in new pools', 'Advanced market analytics', 'Private investor calls'],
          description: 'For experienced DeFi investors',
          rarity: 'Uncommon',
          powerLevel: 2,
          image: '/images/nfts/investor-experienced-member.png'
        },
        { 
          id: 8, 
          tier: 'Super Member NFT', 
          type: 'investor',
          utility: 'Premium mining + 30% boost + Exclusive opportunities', 
          cost: 750,
          supply: 250,
          remaining: 89,
          benefits: ['30% liquidity mining boost', 'Exclusive investment opportunities', 'Yield farming optimization', 'Personal DeFi advisor'],
          description: 'Super investor status with premium benefits',
          rarity: 'Rare',
          powerLevel: 3,
          image: '/images/nfts/investor-super-member.png'
        },
        { 
          id: 9, 
          tier: 'Legendary Member NFT', 
          type: 'investor',
          utility: 'Elite mining + 40% boost + Governance power', 
          cost: 1500,
          supply: 100,
          remaining: 23,
          benefits: ['40% liquidity mining boost', 'Major governance influence', 'Early access to new protocols', 'Revenue sharing participation'],
          description: 'Legendary investor with significant influence',
          rarity: 'Epic',
          powerLevel: 4,
          image: '/images/nfts/investor-legendary-member.png'
        },
        { 
          id: 10, 
          tier: 'Ultimate Member NFT', 
          type: 'investor',
          utility: 'Ultimate mining + 50% boost + Maximum power', 
          cost: 3000,
          supply: 50,
          remaining: 7,
          benefits: ['50% liquidity mining boost', 'Maximum governance power', 'Protocol co-ownership benefits', 'Executive advisory board access'],
          description: 'The ultimate SWIISH Investor DAO membership',
          rarity: 'Legendary',
          powerLevel: 5,
          image: '/images/nfts/investor-ultimate-member.png'
        }
      ];

      try {
        const [poolsData, proposalsData, nftsData] = await Promise.all([
          currentApiService.getLiquidityPools().catch(() => fallbackPools),
          currentApiService.getDAOProposals().catch(() => fallbackProposals),
          currentApiService.getNFTMarketplace().catch(() => fallbackNfts)
        ]);

        // Enhanced pools data processing with complete validation
        const processedPools = (poolsData || fallbackPools).map(pool => {
          // Ensure all required properties exist with proper defaults
          return {
            id: pool.id || Math.random(),
            pair: pool.pair || 'Unknown/Unknown',
            tokenA: pool.tokenA || 'TOKEN',
            tokenB: pool.tokenB || 'TOKEN',
            reserveA: Number(pool.reserveA) || 0,
            reserveB: Number(pool.reserveB) || 0,
            apy: Number(pool.apy) || 0,
            tvl: Number(pool.tvl) || 0,
            myLiquidity: Number(pool.myLiquidity) || 0,
            myLPTokens: Number(pool.myLPTokens) || 0,
            totalLPTokens: Number(pool.totalLPTokens) || 1,
            swiishRewards: Number(pool.swiishRewards) || Math.floor((pool.tvl || 0) * 0.0001),
            participants: Number(pool.participants) || 0,
            volume24h: Number(pool.volume24h) || 0,
            fee: Number(pool.fee) || 0.3,
            priceA: Number(pool.priceA) || 1,
            priceB: Number(pool.priceB) || 1
          };
        });

        console.log('Processed pools:', processedPools);
        setPools(processedPools);
        setProposals(proposalsData || fallbackProposals);
        setNfts(nftsData || fallbackNfts);
      } catch (error) {
        console.warn('API failed, using fallback data:', error);
        setPools(fallbackPools);
        setProposals(fallbackProposals);
        setNfts(fallbackNfts);
      }

      console.log('App data loaded successfully');
    } catch (error) {
      console.error('Failed to load app data:', error);
      // Set fallback data even on complete failure
      setPools(fallbackPools);
      setProposals(fallbackProposals);
      setNfts(fallbackNfts);
    }
  };

  const calculateLiquidityQuote = (pool, amountA) => {
    if (!pool || !amountA || amountA <= 0) return null;
    
    try {
      const amount = parseFloat(amountA);
      if (isNaN(amount) || amount <= 0) return null;
      
      const ratio = pool.reserveB / pool.reserveA;
      const amountB = amount * ratio;
      
      // Prevent division by zero
      if (pool.reserveA === 0 || pool.reserveB === 0 || pool.totalLPTokens === 0) {
        return null;
      }
      
      // Calculate LP tokens to receive (geometric mean)
      const lpTokensToMint = Math.sqrt(amount * amountB) / Math.sqrt(pool.reserveA * pool.reserveB) * pool.totalLPTokens;
      
      // Calculate pool share
      const newTotalLP = pool.totalLPTokens + lpTokensToMint;
      const poolShare = (lpTokensToMint / newTotalLP) * 100;
      
      // Price impact calculation
      const newReserveA = pool.reserveA + amount;
      const newReserveB = pool.reserveB + amountB;
      const newPriceRatio = newReserveB / newReserveA;
      const priceImpact = Math.abs((newPriceRatio - ratio) / ratio) * 100;
      
      return {
        amountB: amountB.toFixed(6),
        lpTokens: lpTokensToMint.toFixed(6),
        poolShare: poolShare.toFixed(4),
        priceImpact: priceImpact.toFixed(2),
        currentPrice: ratio.toFixed(6),
        newPrice: newPriceRatio.toFixed(6)
      };
    } catch (error) {
      console.error('Error calculating liquidity quote:', error);
      return null;
    }
  };

  const handleAddLiquidity = async () => {
    if (!liquidityData.selectedPool || !liquidityData.amountA || !user) return;
    
    try {
      setAddLiquidityLoading(true);
      
      const pool = pools.find(p => p.id === liquidityData.selectedPool.id);
      if (!pool) {
        throw new Error('Pool not found');
      }
      
      const amountA = parseFloat(liquidityData.amountA);
      if (isNaN(amountA) || amountA <= 0) {
        throw new Error('Invalid amount');
      }
      
      const quote = calculateLiquidityQuote(pool, amountA);
      if (!quote) {
        throw new Error('Unable to calculate liquidity quote');
      }
      
      const currentApiService = getApiService();
      
      try {
        // Try to call the backend API first
        const result = await currentApiService.addLiquidity({
          poolId: pool.id,
          tokenA: pool.tokenA,
          tokenB: pool.tokenB,
          amountA: amountA,
          amountB: parseFloat(quote.amountB),
          slippage: liquidityData.slippage
        });
        
        // Update with backend response
        const liquidityValue = (amountA * pool.priceA) + (parseFloat(quote.amountB) * pool.priceB);
        const swiishReward = result.rewards?.swiishTokens || liquidityValue * 0.05;
        const loyaltyReward = result.rewards?.loyaltyPoints || Math.floor(liquidityValue * 0.02);
        
        const updatedUser = {
          ...user,
          swiishTokens: (user.swiishTokens || 0) + swiishReward,
          loyaltyPoints: (user.loyaltyPoints || 0) + loyaltyReward,
          totalLiquidity: (user.totalLiquidity || 0) + liquidityValue,
          investorDAOPower: (user.investorDAOPower || 0) + swiishReward
        };
        
        setUser(updatedUser);
        setGovernanceTokens({
          swiishTokens: updatedUser.swiishTokens,
          loyaltyPoints: updatedUser.loyaltyPoints,
          votingPower: updatedUser.swiishTokens + (updatedUser.loyaltyPoints * 0.1)
        });
        
        alert(`Liquidity added successfully!\n\nAdded: ${amountA} ${pool.tokenA} + ${quote.amountB} ${pool.tokenB}\nReceived: ${quote.lpTokens} LP tokens (${quote.poolShare}% pool share)\nRewards: +${swiishReward.toFixed(2)} SWIISH tokens, +${loyaltyReward} loyalty points`);
        
      } catch (apiError) {
        console.warn('Backend API failed, using fallback calculation:', apiError);
        
        // Fallback calculation if API fails
        const liquidityValue = (amountA * pool.priceA) + (parseFloat(quote.amountB) * pool.priceB);
        const swiishReward = liquidityValue * 0.05;
        const loyaltyReward = Math.floor(liquidityValue * 0.02);
        
        const updatedUser = {
          ...user,
          swiishTokens: (user.swiishTokens || 0) + swiishReward,
          loyaltyPoints: (user.loyaltyPoints || 0) + loyaltyReward,
          totalLiquidity: (user.totalLiquidity || 0) + liquidityValue,
          investorDAOPower: (user.investorDAOPower || 0) + swiishReward
        };
        
        setUser(updatedUser);
        setGovernanceTokens({
          swiishTokens: updatedUser.swiishTokens,
          loyaltyPoints: updatedUser.loyaltyPoints,
          votingPower: updatedUser.swiishTokens + (updatedUser.loyaltyPoints * 0.1)
        });
        
        alert(`Liquidity added successfully!\n\nAdded: ${amountA} ${pool.tokenA} + ${quote.amountB} ${pool.tokenB}\nReceived: ${quote.lpTokens} LP tokens (${quote.poolShare}% pool share)\nRewards: +${swiishReward.toFixed(2)} SWIISH tokens, +${loyaltyReward} loyalty points`);
      }
      
      // Update pool reserves locally
      const updatedPool = {
        ...pool,
        reserveA: pool.reserveA + amountA,
        reserveB: pool.reserveB + parseFloat(quote.amountB),
        myLiquidity: pool.myLiquidity + (amountA * pool.priceA) + (parseFloat(quote.amountB) * pool.priceB),
        myLPTokens: pool.myLPTokens + parseFloat(quote.lpTokens),
        totalLPTokens: pool.totalLPTokens + parseFloat(quote.lpTokens),
        participants: pool.myLPTokens === 0 ? pool.participants + 1 : pool.participants,
        tvl: pool.tvl + (amountA * pool.priceA) + (parseFloat(quote.amountB) * pool.priceB)
      };
      
      const updatedPools = pools.map(p => p.id === pool.id ? updatedPool : p);
      setPools(updatedPools);
      
      setLiquidityData({
        selectedPool: null,
        tokenA: '',
        tokenB: '',
        amountA: '',
        amountB: '',
        slippage: 0.5
      });
      setLiquidityQuote(null);
      
    } catch (error) {
      console.error('Add liquidity failed:', error);
      alert('Failed to add liquidity: ' + error.message);
    } finally {
      setAddLiquidityLoading(false);
    }
  };

  const handleRemoveLiquidity = async (pool, percentage) => {
    if (!pool || !pool.myLPTokens || percentage <= 0) {
      alert('No liquidity to remove or invalid percentage');
      return;
    }
    
    try {
      setRemoveLiquidityLoading(true);
      
      const lpTokensToRemove = (pool.myLPTokens * percentage) / 100;
      const shareOfPool = lpTokensToRemove / pool.totalLPTokens;
      
      const amountA = pool.reserveA * shareOfPool;
      const amountB = pool.reserveB * shareOfPool;
      const liquidityValue = (amountA * pool.priceA) + (amountB * pool.priceB);
      
      const currentApiService = getApiService();
      
      try {
        // Try to call the backend API
        await currentApiService.removeLiquidity({
          poolId: pool.id,
          lpTokens: lpTokensToRemove,
          percentage: percentage
        });
      } catch (apiError) {
        console.warn('Backend API failed for remove liquidity:', apiError);
        // Continue with local update
      }
      
      // Update pool locally
      const updatedPool = {
        ...pool,
        reserveA: Math.max(0, pool.reserveA - amountA),
        reserveB: Math.max(0, pool.reserveB - amountB),
        myLiquidity: Math.max(0, pool.myLiquidity - liquidityValue),
        myLPTokens: Math.max(0, pool.myLPTokens - lpTokensToRemove),
        totalLPTokens: Math.max(0, pool.totalLPTokens - lpTokensToRemove),
        participants: pool.myLPTokens - lpTokensToRemove <= 0 ? Math.max(0, pool.participants - 1) : pool.participants,
        tvl: Math.max(0, pool.tvl - liquidityValue)
      };
      
      const updatedPools = pools.map(p => p.id === pool.id ? updatedPool : p);
      setPools(updatedPools);
      
      // Update user liquidity
      const updatedUser = {
        ...user,
        totalLiquidity: Math.max(0, (user.totalLiquidity || 0) - liquidityValue)
      };
      setUser(updatedUser);
      
      alert(`Liquidity removed successfully!\n\nRemoved: ${amountA.toFixed(6)} ${pool.tokenA} + ${amountB.toFixed(6)} ${pool.tokenB}\nBurned: ${lpTokensToRemove.toFixed(6)} LP tokens`);
      
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      alert('Failed to remove liquidity: ' + error.message);
    } finally {
      setRemoveLiquidityLoading(false);
    }
  };

  const handleStakeLiquidity = async () => {
    if (!stakingData.amount || !user || !services) return;

    try {
      setStakingLoading(true);
      
      const stakeAmount = parseFloat(stakingData.amount);
      const currentApiService = getApiService();
      
      try {
        // Try to call the backend API first
        const result = await currentApiService.stakeLiquidity({
          selectedPool: stakingData.selectedPool,
          amount: stakeAmount
        });
        
        // Update user with backend response
        const updatedUser = {
          ...user,
          swiishTokens: (user.swiishTokens || 0) + result.swiishReward,
          loyaltyPoints: (user.loyaltyPoints || 0) + result.loyaltyReward,
          totalLiquidity: (user.totalLiquidity || 0) + result.stakeAmount,
          investorDAOPower: (user.investorDAOPower || 0) + result.swiishReward
        };
        
        setUser(updatedUser);
        setGovernanceTokens({
          swiishTokens: updatedUser.swiishTokens,
          loyaltyPoints: updatedUser.loyaltyPoints,
          votingPower: updatedUser.swiishTokens + (updatedUser.loyaltyPoints * 0.1)
        });

        const updatedPools = pools.map(pool => 
          pool.pair === stakingData.selectedPool 
            ? { ...pool, myLiquidity: pool.myLiquidity + stakeAmount, participants: pool.participants + 1 }
            : pool
        );
        setPools(updatedPools);

        alert(`Liquidity staked successfully!\n+${result.swiishReward.toFixed(2)} SWIISH tokens\n+${result.loyaltyReward} loyalty points\nYou're now an Investor DAO member!`);
        
      } catch (apiError) {
        console.warn('Backend API failed, using fallback calculation:', apiError);
        
        // Fallback calculation if API fails
        const swiishReward = stakeAmount * 0.1;
        const loyaltyReward = Math.floor(stakeAmount * 0.05);
        
        const updatedUser = {
          ...user,
          swiishTokens: (user.swiishTokens || 0) + swiishReward,
          loyaltyPoints: (user.loyaltyPoints || 0) + loyaltyReward,
          totalLiquidity: (user.totalLiquidity || 0) + stakeAmount,
          investorDAOPower: (user.investorDAOPower || 0) + swiishReward
        };
        
        setUser(updatedUser);
        setGovernanceTokens({
          swiishTokens: updatedUser.swiishTokens,
          loyaltyPoints: updatedUser.loyaltyPoints,
          votingPower: updatedUser.swiishTokens + (updatedUser.loyaltyPoints * 0.1)
        });

        const updatedPools = pools.map(pool => 
          pool.pair === stakingData.selectedPool 
            ? { ...pool, myLiquidity: pool.myLiquidity + stakeAmount, participants: pool.participants + 1 }
            : pool
        );
        setPools(updatedPools);

        alert(`Liquidity staked successfully!\n+${swiishReward.toFixed(2)} SWIISH tokens\n+${loyaltyReward} loyalty points\nYou're now an Investor DAO member!`);
      }
      
      setStakingData({ amount: '', selectedPool: 'ETH/USDT' });
    } catch (error) {
      console.error('Staking failed:', error);
      alert('Staking failed: ' + error.message);
    } finally {
      setStakingLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!swapData.fromAmount || !user || !services) return;

    try {
      setSwapLoading(true);
      
      let result;
      
      if (walletConnected) {
        result = await services.walletConnectService.executeExternalSwap(
          swapData.fromToken,
          swapData.toToken,
          swapData.fromAmount
        );
      } else {
        result = {
          transactionId: 'tx_' + Math.random().toString(36).substr(2, 9),
          fromAmount: swapData.fromAmount,
          toAmount: swapData.toAmount,
          success: true,
          isSimulated: true
        };
      }

      let swiishReward = 10;
      let loyaltyReward = 5;
      let feeReduction = 0;
      
      if (user.nftCount > 0) {
        if (user.nftTier === 'Platinum') {
          feeReduction = 20;
          swiishReward = 15;
          loyaltyReward = 10;
        } else if (user.nftTier === 'Gold') {
          feeReduction = 15;
          swiishReward = 12;
          loyaltyReward = 8;
        } else if (user.nftTier === 'Silver') {
          feeReduction = 10;
          swiishReward = 11;
          loyaltyReward = 6;
        } else {
          feeReduction = 5;
          loyaltyReward = 6;
        }
      }
      
      const updatedUser = { 
        ...user, 
        swiishTokens: (user.swiishTokens || 0) + swiishReward,
        loyaltyPoints: (user.loyaltyPoints || 0) + loyaltyReward,
        userDAOPower: (user.userDAOPower || 0) + loyaltyReward
      };
      setUser(updatedUser);
      
      setGovernanceTokens({
        swiishTokens: updatedUser.swiishTokens,
        loyaltyPoints: updatedUser.loyaltyPoints,
        votingPower: updatedUser.swiishTokens + (updatedUser.loyaltyPoints * 0.1)
      });

      const benefitMessage = feeReduction > 0 ? `\n${feeReduction}% fee reduction applied (NFT benefit)` : '';
      alert(`Swap successful! ${walletConnected ? 'External' : 'Internal'} transaction completed.\n+${swiishReward} SWIISH tokens\n+${loyaltyReward} loyalty points${benefitMessage}`);

      setSwapData({ ...swapData, fromAmount: '', toAmount: '' });
      setSwapQuote(null);
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed: ' + error.message);
    } finally {
      setSwapLoading(false);
    }
  };

  const handleVote = async (proposalId, vote, daoType) => {
    if (!services) return;
    
    try {
      const proposal = proposals.find(p => p.id === proposalId);
      
      // Calculate hierarchical voting power
      const votingPowerData = await calculateHierarchicalVotingPower(user, daoType);
      
      if (!votingPowerData.canVote) {
        alert(`Your ${daoType === 'investor' ? 'Investor' : 'User'} DAO tier (${votingPowerData.tier}) doesn't have voting rights. ${votingPowerData.requirements}`);
        return;
      }

      if (daoType === 'investor' && votingPowerData.power < proposal.requiredTokens) {
        alert(`You need at least ${proposal.requiredTokens} voting power to vote on this proposal. You have ${votingPowerData.power}.`);
        return;
      }
      
      if (daoType === 'user' && votingPowerData.power < proposal.requiredTokens) {
        alert(`You need at least ${proposal.requiredTokens} voting power to vote on this proposal. You have ${votingPowerData.power}.`);
        return;
      }

      // Submit hierarchical vote
      const currentApiService = getApiService();
      const voteResult = await currentApiService.vote({
        proposalId,
        vote,
        daoType,
        votingPower: votingPowerData.power,
        tier: votingPowerData.tier,
        multiplier: votingPowerData.multiplier
      });

      // Update proposals with weighted vote
      const updatedProposals = proposals.map(p => 
        p.id === proposalId 
          ? { 
              ...p, 
              votes: p.votes + votingPowerData.power,
              voteBreakdown: {
                ...p.voteBreakdown,
                [votingPowerData.tier]: (p.voteBreakdown?.[votingPowerData.tier] || 0) + votingPowerData.power
              }
            }
          : p
      );
      setProposals(updatedProposals);

      // Update engagement metrics and rewards
      await updateEngagementMetrics('vote');
      
      const loyaltyReward = calculateVoteReward(votingPowerData.tier, daoType);
      const updatedUser = { 
        ...user, 
        loyaltyPoints: (user.loyaltyPoints || 0) + loyaltyReward 
      };
      setUser(updatedUser);

      alert(`Hierarchical vote submitted successfully!\nVoting Power Used: ${votingPowerData.power}\nTier: ${votingPowerData.tier}\nReward: +${loyaltyReward} loyalty points\nThank you for participating in ${daoType === 'investor' ? 'Investor' : 'User'} DAO governance.`);
    } catch (error) {
      console.error('Hierarchical vote failed:', error);
      alert('Vote failed: ' + error.message);
    }
  };

  const calculateHierarchicalVotingPower = async (user, daoType) => {
    if (daoType === 'investor') {
      const swiishTokens = user.swiishTokens || 0;
      const totalLiquidity = user.totalLiquidity || 0;
      const nftPowerLevel = getNFTPowerLevel(user.nftTier, 'investor');

      const basePower = swiishTokens;
      const liquidityBonus = Math.min(totalLiquidity * 0.1, swiishTokens * 0.5);
      const nftMultiplier = 1 + (nftPowerLevel * 0.1);
      const totalPower = Math.floor((basePower + liquidityBonus) * nftMultiplier);
      
      const tier = getInvestorTier(totalPower, totalLiquidity);
      const canVote = ['junior', 'standard', 'senior', 'major', 'whale'].includes(tier);
      
      return {
        power: totalPower,
        tier,
        canVote,
        multiplier: nftMultiplier,
        breakdown: { basePower, liquidityBonus, nftMultiplier },
        requirements: canVote ? '' : 'Minimum 100 voting power required'
      };
    } else {
      const loyaltyPoints = user.loyaltyPoints || 0;
      const swapCount = user.swapCount || 0;
      const daoParticipation = user.daoParticipation || 0;
      const nftPowerLevel = getNFTPowerLevel(user.nftTier, 'user');

      const basePower = loyaltyPoints;
      const activityBonus = Math.min(swapCount * 2 + daoParticipation * 5, loyaltyPoints * 0.3);
      const nftMultiplier = 1 + (nftPowerLevel * 0.05);
      const totalPower = Math.floor((basePower + activityBonus) * nftMultiplier);
      
      const tier = getUserTier(totalPower, swapCount, daoParticipation);
      const canVote = ['member', 'engaged', 'active', 'advocate', 'champion'].includes(tier);
      
      return {
        power: totalPower,
        tier,
        canVote,
        multiplier: nftMultiplier,
        breakdown: { basePower, activityBonus, nftMultiplier },
        requirements: canVote ? '' : 'Minimum 100 voting power required'
      };
    }
  };

  const getInvestorTier = (votingPower, totalLiquidity) => {
    if (votingPower >= 10000 && totalLiquidity >= 100000) return 'whale';
    if (votingPower >= 5000 && totalLiquidity >= 50000) return 'major';
    if (votingPower >= 1000 && totalLiquidity >= 10000) return 'senior';
    if (votingPower >= 500 && totalLiquidity >= 5000) return 'standard';
    if (votingPower >= 100) return 'junior';
    return 'observer';
  };

  const getUserTier = (votingPower, swapCount, daoParticipation) => {
    if (votingPower >= 5000 && swapCount >= 100 && daoParticipation >= 20) return 'champion';
    if (votingPower >= 2000 && swapCount >= 50 && daoParticipation >= 10) return 'advocate';
    if (votingPower >= 1000 && swapCount >= 25 && daoParticipation >= 5) return 'active';
    if (votingPower >= 500 && swapCount >= 10) return 'engaged';
    if (votingPower >= 100) return 'member';
    return 'observer';
  };

  const getNFTPowerLevel = (nftTier, daoType) => {
    const tierMap = {
      'Ultimate Member NFT': 5,
      'Legendary Member NFT': 4,
      'Super Member NFT': 3,
      'Experienced Member NFT': 2,
      'Enter DAO NFT': 1
    };
    return tierMap[nftTier] || 0;
  };

  const calculateVoteReward = (tier, daoType) => {
    const baseReward = daoType === 'investor' ? 15 : 10;
    const tierMultipliers = {
      whale: 3, major: 2.5, senior: 2, standard: 1.5, junior: 1,
      champion: 3, advocate: 2.5, active: 2, engaged: 1.5, member: 1,
      observer: 0.5
    };
    return Math.floor(baseReward * (tierMultipliers[tier] || 1));
  };

  const updateEngagementMetrics = async (action) => {
    // Update local user state with engagement tracking
    const updates = {};
    
    switch (action) {
      case 'swap':
        updates.swapCount = (user.swapCount || 0) + 1;
        break;
      case 'vote':
        updates.daoParticipation = (user.daoParticipation || 0) + 1;
        break;
      case 'proposal':
        updates.daoParticipation = (user.daoParticipation || 0) + 3;
        break;
    }

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    // Recalculate hierarchical governance
    await updateHierarchicalGovernance(updatedUser);
  };

  const updateHierarchicalGovernance = async (userData) => {
    const investorPower = await calculateHierarchicalVotingPower(userData, 'investor');
    const userPower = await calculateHierarchicalVotingPower(userData, 'user');

    setHierarchicalGovernance({
      investorTier: investorPower.tier,
      userTier: userPower.tier,
      investorVotingPower: investorPower.power,
      userVotingPower: userPower.power,
      delegatedPower: 0, // For future delegation feature
      canCreateProposals: ['senior', 'major', 'whale', 'active', 'advocate', 'champion'].includes(investorPower.tier) || 
                         ['active', 'advocate', 'champion'].includes(userPower.tier),
      tierBenefits: getTierBenefits(investorPower.tier, userPower.tier)
    });
  };

  const getTierBenefits = (investorTier, userTier) => {
    const benefits = [];
    
    // Investor tier benefits
    if (['whale', 'major'].includes(investorTier)) {
      benefits.push('Protocol parameter control', 'Veto power on critical decisions');
    }
    if (['senior', 'major', 'whale'].includes(investorTier)) {
      benefits.push('Enhanced proposal creation', 'Reward distribution influence');
    }
    
    // User tier benefits  
    if (['champion', 'advocate'].includes(userTier)) {
      benefits.push('Feature development input', 'Community leadership role');
    }
    if (['active', 'advocate', 'champion'].includes(userTier)) {
      benefits.push('Beta feature access', 'Enhanced feedback priority');
    }
    
    return [...new Set(benefits)]; // Remove duplicates
  };

  const renderSwapTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 shadow-sm border border-black">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-black">External Wallet</h3>
            <p className="text-sm text-black">
              {walletConnected ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : 'Not connected'}
            </p>
            {walletConnected && (
              <p className="text-xs text-black">
                Balance: {parseFloat(walletBalance).toFixed(4)} ETH
              </p>
            )}
          </div>
          <button
            onClick={walletConnected ? disconnectWallet : connectWallet}
            className="px-4 py-2 font-medium bg-black text-white border border-black"
          >
            {walletConnected ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 shadow-sm border border-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-black">Token Swap</h2>
          {walletConnected && (
            <span className="flex items-center gap-1 text-sm text-black">
              <ExternalLink size={14} />
              External
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-black p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-black">From</span>
              <span className="text-xs sm:text-sm text-black">
                Balance: {walletConnected ? walletBalance : '2.45'} {swapData.fromToken}
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <select
                value={swapData.fromToken}
                onChange={(e) => setSwapData({ ...swapData, fromToken: e.target.value })}
                className="bg-white border border-black rounded-lg px-2 sm:px-3 py-2 font-medium text-sm sm:text-base text-black"
              >
                <option>Tola1</option>
                <option>Tola2</option>
                <option>ETH</option>
                <option>USDT</option>
                <option>HTR</option>
                <option>SWIISH</option>
              </select>
              <input
                type="number"
                placeholder="0.00"
                value={swapData.fromAmount}
                onChange={(e) => setSwapData({ ...swapData, fromAmount: e.target.value })}
                className="flex-1 bg-transparent text-lg sm:text-xl font-semibold outline-none text-black placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() =>
                setSwapData({
                  ...swapData,
                  fromToken: swapData.toToken,
                  toToken: swapData.fromToken,
                  fromAmount: swapData.toAmount,
                  toAmount: swapData.fromAmount
                })
              }
              className="p-2 bg-black text-white border border-black"
            >
              <ArrowUpDown size={20} />
            </button>
          </div>

          <div className="bg-white border border-black p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-black">To</span>
              <span className="text-xs sm:text-sm text-black">
                Balance: 1,250 {swapData.toToken}
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <select
                value={swapData.toToken}
                onChange={(e) => setSwapData({ ...swapData, toToken: e.target.value })}
                className="bg-white border border-black rounded-lg px-2 sm:px-3 py-2 font-medium text-sm sm:text-base text-black"
              >
                <option>Tola1</option>
                <option>Tola2</option>
                <option>USDT</option>
                <option>ETH</option>
                <option>HTR</option>
                <option>SWIISH</option>
              </select>
              <input
                type="number"
                placeholder="0.00"
                value={swapData.toAmount}
                readOnly
                className="flex-1 bg-transparent text-lg sm:text-xl font-semibold outline-none text-black placeholder-gray-400"
              />
            </div>
          </div>

          {swapQuote && (
            <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-black">Price Impact:</span>
                <span
                  className={`font-medium ${
                    swapQuote.priceImpact > 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {swapQuote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black">Fee:</span>
                <span className="text-black">{swapQuote.fee.toFixed(6)} HTR</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black">SWIISH Reward:</span>
                <span className="text-purple-600 dark:text-purple-400 font-medium">+10 SWIISH</span>
              </div>
            </div>
          )}

          <button
            onClick={swap}
            disabled={!swapData.fromAmount || swapLoading}
            className="w-full bg-black text-white py-3 sm:py-4 font-semibold border border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {swapLoading ? 'Swapping...' : walletConnected ? 'Swap (External)' : 'Swap (Internal)'}
          </button>
          <button onClick={addLiquidityFunc}>
            transact
          </button>
        </div>
      </div>
    </div>
  );

  const renderLiquidityTab = () => {
    // Add safety check at the beginning
    if (!pools || pools.length === 0) {
      return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading liquidity pools...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Governance Power Display - White background */}
        <div className="bg-white p-6 text-black border border-black">
          <h3 className="text-lg font-bold mb-2 text-black">Your Liquidity Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black">Total Liquidity</p>
              <p className="text-xl font-bold text-black">${(user?.totalLiquidity || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-black">SWIISH Earned</p>
              <p className="text-xl font-bold text-black">{(user?.swiishTokens || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-black">
            <p className="text-sm text-black">Investor DAO Power</p>
            <p className="text-2xl font-bold text-black">{(user?.investorDAOPower || 0).toFixed(1)}</p>
          </div>
        </div>

        {/* Add Liquidity Section */}
        <div className="bg-white p-6 shadow-sm border border-black">
          <h3 className="text-lg font-bold mb-4 text-black">Add Liquidity</h3>
          <p className="text-sm text-black mb-4">
            Provide liquidity to earn trading fees and SWIISH rewards. Based on Uniswap V2 AMM model.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Select Pool
              </label>
              <select
                value={liquidityData.selectedPool?.id || ''}
                onChange={(e) => {
                  const pool = pools.find(p => p.id === parseInt(e.target.value));
                  setLiquidityData({ 
                    ...liquidityData, 
                    selectedPool: pool,
                    tokenA: pool?.tokenA || '',
                    tokenB: pool?.tokenB || '',
                    amountA: '',
                    amountB: ''
                  });
                  setLiquidityQuote(null);
                }}
                className="w-full bg-white dark:bg-gray-600 rounded-lg px-3 py-2 border border-black text-black"
                disabled={addLiquidityLoading}
              >
                <option value="">Choose a pool...</option>
                {pools.map(pool => (
                  <option key={pool.id} value={pool.id}>
                    {pool.pair} - {pool.apy}% APY - TVL: ${(pool.tvl || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            
            {liquidityData.selectedPool && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      {liquidityData.tokenA} Amount
                    </label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={liquidityData.amountA}
                      onChange={(e) => {
                        setLiquidityData({ ...liquidityData, amountA: e.target.value });
                        if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                          const quote = calculateLiquidityQuote(liquidityData.selectedPool, e.target.value);
                          setLiquidityQuote(quote);
                          setLiquidityData(prev => ({ ...prev, amountB: quote?.amountB || '' }));
                        } else {
                          setLiquidityQuote(null);
                          setLiquidityData(prev => ({ ...prev, amountB: '' }));
                        }
                      }}
                      className="w-full bg-white dark:bg-gray-600 rounded-lg px-3 py-2 border border-black text-black"
                      disabled={addLiquidityLoading}
                    />
                    <p className="text-xs text-black mt-1">
                      Price: ${(liquidityData.selectedPool.priceA || 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      {liquidityData.tokenB} Amount
                    </label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={liquidityData.amountB}
                      readOnly
                      className="w-full bg-white rounded-lg px-3 py-2 border border-black text-black"
                    />
                    <p className="text-xs text-black mt-1">
                      Price: ${(liquidityData.selectedPool.priceB || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {liquidityQuote && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-black">Liquidity Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-black">LP Tokens:</p>
                        <p className="font-medium">{liquidityQuote.lpTokens}</p>
                      </div>
                      <div>
                        <p className="text-black">Pool Share:</p>
                        <p className="font-medium">{liquidityQuote.poolShare}%</p>
                      </div>
                      <div>
                        <p className="text-black">Price Impact:</p>
                        <p className={`font-medium ${parseFloat(liquidityQuote.priceImpact) > 1 ? 'text-orange-600' : 'text-green-600'}`}>
                          {liquidityQuote.priceImpact}%
                        </p>
                      </div>
                      <div>
                        <p className="text-black">Current Ratio:</p>
                        <p className="font-medium">1:{liquidityQuote.currentPrice}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        You'll earn {liquidityData.selectedPool.fee}% fees on all trades + SWIISH rewards
                      </p>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={addLiquidityFunc}
                  disabled={!liquidityData.amountA || addLiquidityLoading || !liquidityQuote}
                  className="w-full bg-black text-white py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLiquidityLoading ? 'Adding Liquidity...' : 'Add Liquidity'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Liquidity Pools */}
        <div className="bg-white shadow-sm border border-black">
          <div className="p-6 border-b border-black">
            <h2 className="text-xl font-bold text-black">Liquidity Pools</h2>
            <p className="text-black text-sm mt-1">AMM pools powered by Hathor Nano Contracts</p>
          </div>

          <div className="divide-y divide-black">
            {pools.map((pool) => {
              // Add safety checks for each pool
              const safePool = {
                id: pool.id || Math.random(),
                pair: pool.pair || 'Unknown/Unknown',
                tokenA: pool.tokenA || 'TOKEN',
                tokenB: pool.tokenB || 'TOKEN',
                apy: Number(pool.apy) || 0,
                tvl: Number(pool.tvl) || 0,
                volume24h: Number(pool.volume24h) || 0,
                participants: Number(pool.participants) || 0,
                totalLPTokens: Number(pool.totalLPTokens) || 1,
                reserveA: Number(pool.reserveA) || 0,
                reserveB: Number(pool.reserveB) || 0,
                myLiquidity: Number(pool.myLiquidity) || 0,
                myLPTokens: Number(pool.myLPTokens) || 0,
                fee: Number(pool.fee) || 0.3,
                swiishRewards: Number(pool.swiishRewards) || 0
              };

              return (
                <div key={safePool.id} className="p-6 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-black text-lg">{safePool.pair}</h3>
                        <span className="bg-white text-black px-2 py-1 text-xs font-medium border border-black">
                          {safePool.fee}% Fee
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-black">
                        <div>
                          <p>APY: <span className="text-black font-medium">{safePool.apy}%</span></p>
                          <p>TVL: <span className="font-medium">${safePool.tvl.toLocaleString()}</span></p>
                          <p>24h Volume: <span className="font-medium">${safePool.volume24h.toLocaleString()}</span></p>
                        </div>
                        <div>
                          <p>Participants: <span className="font-medium">{safePool.participants}</span></p>
                          <p>Total LP: <span className="font-medium">{safePool.totalLPTokens.toLocaleString()}</span></p>
                          <p>Reserves: <span className="font-medium">{safePool.reserveA.toFixed(2)} / {safePool.reserveB.toFixed(2)}</span></p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="font-semibold text-black">${safePool.myLiquidity.toLocaleString()}</p>
                      <p className="text-sm text-black">My Liquidity</p>
                      {safePool.myLPTokens > 0 && (
                        <>
                          <p className="text-xs text-black mt-1">
                            {safePool.myLPTokens.toFixed(4)} LP tokens
                          </p>
                          <p className="text-xs text-black">
                            {((safePool.myLPTokens / safePool.totalLPTokens) * 100).toFixed(4)}% of pool
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => {
                        setLiquidityData({
                          selectedPool: safePool,
                          tokenA: safePool.tokenA,
                          tokenB: safePool.tokenB,
                          amountA: '',
                          amountB: '',
                          slippage: 0.5
                        });
                        setLiquidityQuote(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 min-w-0 bg-black text-white py-2 px-3"
                      disabled={addLiquidityLoading}
                    >
                      Add Liquidity
                    </button>
                    
                    {safePool.myLPTokens > 0 && (
                      <>
                        <button 
                          onClick={() => handleRemoveLiquidity(safePool, 25)}
                          className="bg-black text-white py-2 px-3 text-sm"
                          disabled={removeLiquidityLoading}
                        >
                          Remove 25%
                        </button>
                        <button 
                          onClick={() => handleRemoveLiquidity(safePool, 50)}
                          className="bg-black text-white py-2 px-3 text-sm"
                          disabled={removeLiquidityLoading}
                        >
                          Remove 50%
                        </button>
                        <button 
                          onClick={() => handleRemoveLiquidity(safePool, 100)}
                          className="bg-black text-white py-2 px-3 text-sm"
                          disabled={removeLiquidityLoading}
                        >
                          Remove All
                        </button>
                      </>
                    )}
                    
                    {safePool.myLiquidity > 0 && (
                      <button 
                        onClick={() => {
                          const updatedUser = { ...user, swiishTokens: (user.swiishTokens || 0) + safePool.swiishRewards };
                          setUser(updatedUser);
                          alert(`Harvested ${safePool.swiishRewards} SWIISH tokens!`);
                        }}
                        className="bg-black text-white py-2 px-3 text-sm"
                      >
                        Harvest ({safePool.swiishRewards})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderNFTTab = () => {
    const getRarityColor = (rarity) => {
      switch (rarity) {
        case 'Common': return 'from-gray-400 to-gray-600';
        case 'Uncommon': return 'from-green-400 to-green-600';
        case 'Rare': return 'from-blue-400 to-blue-600';
        case 'Epic': return 'from-purple-400 to-purple-600';
        case 'Legendary': return 'from-yellow-400 to-yellow-600';
        default: return 'from-gray-400 to-gray-600';
      }
    };

    const getPowerStars = (powerLevel) => {
      return '★'.repeat(powerLevel) + '☆'.repeat(5 - powerLevel);
    };

    const userNfts = nfts?.filter(nft => nft.type === 'user') || [];
    const investorNfts = nfts?.filter(nft => nft.type === 'investor') || [];

    return (
      <div className="space-y-6">
        {/* NFT Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Trophy} label="NFTs Owned" value={user?.nftCount || 0} color="orange" />
          <StatCard icon={Gift} label="Current Tier" value={user?.nftTier || 'None'} color="purple" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Zap} label="Available Points" value={user?.loyaltyPoints || 0} color="blue" />
          <StatCard icon={Settings} label="Fee Reduction" value={
            user?.nftTier === 'Ultimate Member NFT' ? '25%' :
            user?.nftTier === 'Legendary Member NFT' ? '20%' :
            user?.nftTier === 'Super Member NFT' ? '15%' :
            user?.nftTier === 'Experienced Member NFT' ? '10%' :
            user?.nftTier === 'Enter DAO NFT' ? '5%' : '0%'
          } color="green" />
        </div>

        {/* User DAO NFTs - White background */}
        <div className="bg-white shadow-sm border border-black">
          <div className="p-6 border-b border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">User DAO NFTs</h2>
                <p className="text-black text-sm">Community governance and trading benefits</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6">
            {userNfts.length > 0 ? userNfts.map((nft) => (
              <div key={nft.id} className="border border-black p-4 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 flex-1">
                    {/* NFT Image */}
                    <div className="flex-shrink-0 relative">
                      <img
                        src={`/images/nfts/user-${nft.tier.toLowerCase().replace(/\s+/g, '-').replace('nft', '').trim()}.png`}
                        alt={nft.tier}
                        className="w-20 h-20 rounded-lg object-cover border-2 border-black"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div 
                        className={`w-20 h-20 rounded-lg bg-gradient-to-br ${getRarityColor(nft.rarity)} items-center justify-center hidden absolute top-0 left-0`}
                      >
                        <Trophy className="text-white" size={24} />
                      </div>
                    </div>

                    {/* NFT Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-black">{nft.tier}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              nft.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                              nft.rarity === 'Epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                              nft.rarity === 'Rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                              nft.rarity === 'Uncommon' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
                            }`}>
                              {nft.rarity}
                            </span>
                            <span className="text-sm text-yellow-500 font-mono">
                              {getPowerStars(nft.powerLevel)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-black mb-3">{nft.description}</p>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-black mb-2">Benefits:</p>
                        <ul className="text-xs text-black space-y-1">
                          {nft.benefits && nft.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-black">
                        <span>Supply: {nft.supply}</span>
                        <span>Remaining: {nft.remaining}</span>
                        <span>Power Level: {nft.powerLevel}/5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-blue-600">{nft.cost}</p>
                    <p className="text-sm text-black">points</p>
                    <p className="text-xs text-black mt-1">
                      You have: {user?.loyaltyPoints || 0}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => claimNftFunc()}
                  disabled={(user?.loyaltyPoints || 0) < nft.cost || nft.remaining === 0}
                  className={`w-full py-3 font-medium ${
                    (user?.loyaltyPoints || 0) >= nft.cost && nft.remaining > 0
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {nft.remaining === 0 ? 'Sold Out' : 
                   (user?.loyaltyPoints || 0) >= nft.cost ? 'Redeem NFT' : 'Insufficient Points'}
                </button>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-black">Loading User DAO NFTs...</p>
              </div>
            )}
          </div>
        </div>

        {/* Investor DAO NFTs - White background */}
        <div className="bg-white shadow-sm border border-black">
          <div className="p-6 border-b border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black flex items-center justify-center">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">Investor DAO NFTs</h2>
                <p className="text-black text-sm">Liquidity mining boosts and governance power</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6">
            {investorNfts.length > 0 ? investorNfts.map((nft) => (
              <div key={nft.id} className="border border-black p-4 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 flex-1">
                    {/* NFT Image */}
                    <div className="flex-shrink-0 relative">
                      <img
                        src={`/images/nfts/investor-${nft.tier.toLowerCase().replace(/\s+/g, '-').replace('nft', '').trim()}.png`}
                        alt={nft.tier}
                        className="w-20 h-20 rounded-lg object-cover border-2 border-black"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div 
                        className={`w-20 h-20 rounded-lg bg-gradient-to-br ${getRarityColor(nft.rarity)} items-center justify-center hidden absolute top-0 left-0`}
                      >
                        <Trophy className="text-white" size={24} />
                      </div>
                    </div>

                    {/* NFT Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-black">{nft.tier}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              nft.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                              nft.rarity === 'Epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' :
                              nft.rarity === 'Rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                              nft.rarity === 'Uncommon' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
                            }`}>
                              {nft.rarity}
                            </span>
                            <span className="text-sm text-yellow-500 font-mono">
                              {getPowerStars(nft.powerLevel)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-black mb-3">{nft.description}</p>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-black mb-2">Benefits:</p>
                        <ul className="text-xs text-black space-y-1">
                          {nft.benefits && nft.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-black">
                        <span>Supply: {nft.supply}</span>
                        <span>Remaining: {nft.remaining}</span>
                        <span>Power Level: {nft.powerLevel}/5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-green-600">{nft.cost}</p>
                    <p className="text-sm text-black">points</p>
                    <p className="text-xs text-black mt-1">
                      You have: {user?.loyaltyPoints || 0}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => claimNftFunc()}
                  disabled={(user?.loyaltyPoints || 0) < nft.cost || nft.remaining === 0}
                  className={`w-full py-3 font-medium ${
                    (user?.loyaltyPoints || 0) >= nft.cost && nft.remaining > 0
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {nft.remaining === 0 ? 'Sold Out' : 
                   (user?.loyaltyPoints || 0) >= nft.cost ? 'Redeem NFT' : 'Insufficient Points'}
                </button>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-black">Loading Investor DAO NFTs...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-black p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 flex items-center justify-center">
            <span className="text-2xl font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">@{user?.username}</h2>
            <p className="opacity-90">SWIISH Member</p>
            {walletConnected && (
              <p className="text-sm opacity-80">
                Wallet: {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={Coins} 
          label="SWIISH Tokens" 
          value={(user?.swiishTokens || 0).toLocaleString()} 
          color="purple" 
        />
        <StatCard 
          icon={Zap} 
          label="Loyalty Points" 
          value={(user?.loyaltyPoints || 0).toLocaleString()} 
          color="blue" 
        />
        <StatCard 
          icon={Trophy} 
          label="NFTs Owned" 
          value={user?.nftCount || 0} 
          color="orange" 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Total Liquidity" 
          value={`$${(user?.totalLiquidity || 0).toLocaleString()}`} 
          color="green" 
        />
      </div>

      <div className="bg-white p-6 shadow-sm border border-black">
        <h3 className="text-lg font-bold mb-4 text-black">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-black">Token swap completed</span>
            <span className="text-green-600 dark:text-green-400 font-medium">+10 SWIISH</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-black">Voted on proposal #001</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">+10 Points</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-black">Liquidity staked</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">+25 SWIISH</span>
          </div>
          {user?.nftCount > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-black">Redeemed {user.nftTier} NFT</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">-{
                user.nftTier === 'Bronze' ? '100' :
                user.nftTier === 'Silver' ? '250' :
                user.nftTier === 'Gold' ? '500' : '1000'
              } Points</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 shadow-sm border border-black">
        <h3 className="text-lg font-bold mb-4 text-black">Wallet & Settings</h3>
        <div className="space-y-3">
          <button 
            onClick={walletConnected ? disconnectWallet : connectWallet}
            className="w-full flex justify-between items-center py-3 text-left px-3 border border-black bg-white text-black"
          >
            <span>{walletConnected ? 'Disconnect External Wallet' : 'Connect External Wallet'}</span>
            <ChevronRight size={20} className="text-black" />
          </button>
          <button 
            onClick={() => alert('Notifications preferences coming soon!')}
            className="w-full flex justify-between items-center py-3 text-left px-3 border border-black bg-white text-black"
          >
            <span>Notification Preferences</span>
            <ChevronRight size={20} className="text-black" />
          </button>
          <button 
            onClick={() => alert('Security settings coming soon!')}
            className="w-full flex justify-between items-center py-3 text-left px-3 border border-black bg-white text-black"
          >
            <span>Security Settings</span>
            <ChevronRight size={20} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDAOTab = () => (
    <div className="space-y-6">
      {/* Hierarchical DAO Overview */}
      <div className="bg-white shadow-sm border border-black p-6">
        <h2 className="text-xl font-bold text-black mb-4">Your DAO Hierarchy Status</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} />
              <h3 className="font-bold">Investor DAO</h3>
            </div>
            <p className="text-2xl font-bold">{hierarchicalGovernance.investorVotingPower}</p>
            <p className="text-sm opacity-90">Voting Power</p>
            <div className="mt-2 p-2 bg-white/10 rounded">
              <p className="text-sm font-medium">Tier: {hierarchicalGovernance.investorTier.toUpperCase()}</p>
              <p className="text-xs opacity-75 mt-1">SWIISH: {user?.swiishTokens || 0} | Liquidity: ${(user?.totalLiquidity || 0).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="bg-black p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Vote size={20} />
              <h3 className="font-bold">User DAO</h3>
            </div>
            <p className="text-2xl font-bold">{hierarchicalGovernance.userVotingPower}</p>
            <p className="text-sm opacity-90">Voting Power</p>
            <div className="mt-2 p-2 bg-white/10 rounded">
              <p className="text-sm font-medium">Tier: {hierarchicalGovernance.userTier.toUpperCase()}</p>
              <p className="text-xs opacity-75 mt-1">Points: {user?.loyaltyPoints || 0} | Swaps: {user?.swapCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Tier Benefits */}
        {hierarchicalGovernance.tierBenefits.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-black mb-2">Your Tier Benefits:</h4>
            <ul className="text-sm text-black space-y-1">
              {hierarchicalGovernance.tierBenefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Active Proposals with Hierarchical Voting */}
      <div className="bg-white shadow-sm border border-black">
        <div className="p-6 border-b border-black">
          <h2 className="text-xl font-bold text-black">Hierarchical Governance Proposals</h2>
          <p className="text-black text-sm mt-1">Your voting power is based on your tier and stake</p>
        </div>

        <div className="divide-y divide-black">
          {proposals && proposals.length > 0 ? proposals.map((proposal) => {
            // Use stored hierarchical governance data instead of calculating async
            const investorPower = {
              power: hierarchicalGovernance.investorVotingPower || 0,
              tier: hierarchicalGovernance.investorTier || 'observer',
              canVote: ['junior', 'standard', 'senior', 'major', 'whale'].includes(hierarchicalGovernance.investorTier || 'observer'),
              requirements: (['junior', 'standard', 'senior', 'major', 'whale'].includes(hierarchicalGovernance.investorTier || 'observer')) ? '' : 'Minimum 100 voting power required'
            };
            
            const userPower = {
              power: hierarchicalGovernance.userVotingPower || 0,
              tier: hierarchicalGovernance.userTier || 'observer',
              canVote: ['member', 'engaged', 'active', 'advocate', 'champion'].includes(hierarchicalGovernance.userTier || 'observer'),
              requirements: (['member', 'engaged', 'active', 'advocate', 'champion'].includes(hierarchicalGovernance.userTier || 'observer')) ? '' : 'Minimum 100 voting power required'
            };
            
            const relevantPower = proposal.dao === 'investor' ? investorPower : userPower;
            
            return (
              <div key={proposal.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-black mb-2">{proposal.title}</h3>
                    <p className="text-sm text-black mb-3">{proposal.description}</p>
                    
                    <div className="flex gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        proposal.dao === 'investor'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {proposal.dao === 'investor' ? 'Investor DAO' : 'User DAO'}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {proposal.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Min Power: {proposal.requiredTokens}
                      </span>
                    </div>
                    
                    {/* Voting Power Breakdown */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-xs font-medium text-black mb-1">Your Voting Status:</p>
                      <p className="text-sm text-black">
                        Tier: <span className="font-bold">{relevantPower.tier.toUpperCase()}</span> | 
                        Power: <span className="font-bold">{relevantPower.power}</span>
                        {relevantPower.canVote ? 
                          <span className="text-green-600 ml-2">✓ Can Vote</span> : 
                          <span className="text-red-600 ml-2">✗ Cannot Vote</span>
                        }
                      </p>
                    </div>
                    
                    <div className="text-xs text-black">
                      Ends: {new Date(proposal.endsAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="font-semibold text-black">{proposal.votes}</p>
                    <p className="text-sm text-black">total power</p>
                  </div>
                </div>

                {proposal.status === 'active' && (
                  <>
                    {!relevantPower.canVote && (
                      <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-yellow-700">
                          {relevantPower.requirements}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(proposal.id, 'yes', proposal.dao)}
                        disabled={!relevantPower.canVote}
                        className="flex-1 bg-black text-white py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Vote Yes (Power: {relevantPower.power})
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 'no', proposal.dao)}
                        disabled={!relevantPower.canVote}
                        className="flex-1 bg-black text-white py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Vote No (Power: {relevantPower.power})
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <p className="text-black">Loading DAO proposals...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!services || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black">
            {!services ? 'Loading services...' : isTelegramWebApp ? 'Initializing your SWIISH experience...' : 'Loading SWIISH...'}
          </p>
          <p className="text-sm text-black mt-2">
            Connection: {connectionStatus}
            {retryCount > 0 && ` (Retry ${retryCount})`}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-white border border-black max-w-md mx-auto">
              <p className="text-black text-sm">{error}</p>
              <button 
                onClick={handleRetry}
                className="mt-2 bg-black text-white px-4 py-2 text-sm border border-black"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-black mb-4">Welcome to SWIISH</h1>
          <div className="bg-white border border-black p-4 mb-4">
            <p className="text-sm text-black">
              <strong>Development Mode:</strong> Running in browser for testing
            </p>
          </div>
          <button 
            onClick={handleRetry}
            className="bg-black text-white px-6 py-2 border border-black"
          >
            Initialize App
          </button>
        </div>
      </div>
    );
  }

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex flex-col items-center p-2 sm:p-3 swiish-tab-button ${
        isActive
          ? 'bg-black text-white shadow-lg active'
          : 'bg-white text-black inactive'
      }`}
      style={{
        backgroundColor: isActive ? '#000000 !important' : '#ffffff !important',
        color: isActive ? '#ffffff !important' : '#000000 !important',
        border: 'none'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = isActive ? '#000000' : '#ffffff';
        e.target.style.color = isActive ? '#ffffff' : '#000000';
        e.target.style.border = 'none';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = isActive ? '#000000' : '#ffffff';
        e.target.style.color = isActive ? '#ffffff' : '#000000';
        e.target.style.border = 'none';
      }}
    >
      <Icon 
        size={18} 
        className="sm:w-5 sm:h-5"
        style={{ color: isActive ? '#ffffff !important' : '#000000 !important' }}
      />
      <span 
        className="text-xs mt-1 font-medium"
        style={{ color: isActive ? '#ffffff !important' : '#000000 !important' }}
      >
        {label}
      </span>
    </button>
  );

  const StatCard = ({ icon: Icon, label, value, color = 'black' }) => (
    <div className="bg-white p-3 sm:p-4 shadow-sm border border-black">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-black">
          <Icon size={16} className="sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-black text-xs sm:text-sm truncate">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-black truncate">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div 
        className="bg-black text-white p-4 sticky top-0 z-10 swiish-header"
        style={{
          backgroundColor: '#000000 !important',
          color: '#ffffff !important'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#000000';
          e.target.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#000000';
          e.target.style.color = '#ffffff';
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 
              className="text-xl sm:text-2xl font-bold text-white"
              style={{ color: '#ffffff !important' }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = '#ffffff'}
            >
              SWIISH
            </h1>
            <p 
              className="text-white text-xs sm:text-sm"
              style={{ color: '#ffffff !important' }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = '#ffffff'}
            >
              DeFi in Telegram
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Wallet 
                size={16} 
                className="sm:w-5 sm:h-5 text-white"
                style={{ color: '#ffffff !important' }}
              />
              <span 
                className="font-medium text-sm sm:text-base text-white"
                style={{ color: '#ffffff !important' }}
                onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                @{user?.username}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 pb-20 sm:pb-24 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
        {activeTab === 'swap' && renderSwapTab()}
        {activeTab === 'liquidity' && renderLiquidityTab()}
        {activeTab === 'dao' && renderDAOTab()}
        {activeTab === 'nft' && renderNFTTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black p-2 sm:p-4 swiish-tab-nav">
        <div className="grid grid-cols-5 gap-1 sm:gap-2 max-w-md mx-auto">
          <TabButton
            id="swap"
            icon={ArrowUpDown}
            label="Swap"
            isActive={activeTab === 'swap'}
            onClick={setActiveTab}
          />
          <TabButton
            id="liquidity"
            icon={TrendingUp}
            label="Liquidity"
            isActive={activeTab === 'liquidity'}
            onClick={setActiveTab}
          />
          <TabButton
            id="dao"
            icon={Vote}
            label="DAO"
            isActive={activeTab === 'dao'}
            onClick={setActiveTab}
          />
          <TabButton
            id="nft"
            icon={Trophy}
            label="NFTs"
            isActive={activeTab === 'nft'}
            onClick={setActiveTab}
          />
          <TabButton
            id="profile"
            icon={Users}
            label="Profile"
            isActive={activeTab === 'profile'}
            onClick={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
};

export default SwiishApp;