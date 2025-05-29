import React, { useState, useEffect } from 'react';
import { Wallet, Coins, Users, Zap, Trophy, Vote, TrendingUp, ArrowUpDown, Gift, Settings, ChevronRight, Plus, Minus } from 'lucide-react';
import apiService from './services/api';

const SwiishApp = () => {
  const [activeTab, setActiveTab] = useState('swap');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [error, setError] = useState(null);
  const [swapData, setSwapData] = useState({
    fromToken: 'ETH',
    toToken: 'USDT',
    fromAmount: '',
    toAmount: '',
    slippage: 0.5
  });
  const [pools, setPools] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [swapQuote, setSwapQuote] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setError(null);
      const isInTelegram = window.Telegram?.WebApp && window.Telegram.WebApp.initData;
      setIsTelegramWebApp(isInTelegram);

      console.log('Telegram WebApp detected:', isInTelegram);
      console.log('Telegram WebApp object:', window.Telegram?.WebApp);

      if (isInTelegram) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        console.log('Telegram init data:', tg.initData);
        console.log('Telegram user data:', tg.initDataUnsafe?.user);

        if (tg.themeParams) {
          document.documentElement.style.setProperty('--tg-color-scheme', tg.colorScheme);
        }

        const telegramUser = tg.initDataUnsafe?.user;
        if (telegramUser) {
          console.log('Authenticating Telegram user:', telegramUser);
          await authenticateUser(telegramUser);
        } else {
          console.warn('No Telegram user data found, using fallback');
          const fallbackUser = {
            id: tg.initDataUnsafe?.hash || '123456789',
            username: 'telegram_user',
            first_name: 'Telegram User'
          };
          await authenticateUser(fallbackUser);
        }
      } else {
        console.log('Running in browser mode (development)');
        await authenticateUser({
          id: '123456789',
          username: 'testuser',
          first_name: 'Test'
        });
      }

      await loadAppData();
    } catch (error) {
      console.error('App initialization failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const authenticateUser = async (telegramUser) => {
    try {
      console.log('Starting authentication for:', telegramUser);

      const authData = {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username || 'user',
        firstName: telegramUser.first_name || 'User'
      };

      console.log('Sending auth request with:', authData);

      const response = await apiService.authenticateTelegram(authData);
      console.log('Authentication response:', response);

      apiService.setAuthToken(response.token);
      setUser(response.user);
      console.log('User authenticated successfully:', response.user);
    } catch (error) {
      console.error('Authentication failed:', error);
      setError('Authentication failed: ' + error.message);
      throw error;
    }
  };

  const loadAppData = async () => {
    try {
      console.log('Loading app data...');
      const [poolsData, proposalsData, nftsData] = await Promise.all([
        apiService.getLiquidityPools().catch(err => {
          console.warn('Failed to load pools:', err);
          return [];
        }),
        apiService.getDAOProposals().catch(err => {
          console.warn('Failed to load proposals:', err);
          return [];
        }),
        apiService.getNFTMarketplace().catch(err => {
          console.warn('Failed to load NFTs:', err);
          return [];
        })
      ]);

      setPools(poolsData);
      setProposals(proposalsData);
      setNfts(nftsData);
      console.log('App data loaded successfully');
    } catch (error) {
      console.error('Failed to load app data:', error);
    }
  };

  const handleSwap = async () => {
    if (!swapData.fromAmount || !user) return;

    try {
      setLoading(true);

      const swapRequest = {
        fromToken: swapData.fromToken,
        toToken: swapData.toToken,
        fromAmount: swapData.fromAmount,
        minToAmount: swapQuote?.minimumReceived || 0,
        slippage: swapData.slippage
      };

      const result = await apiService.executeSwap(swapRequest);

      alert(`Swap successful! Transaction ID: ${result.transactionId}`);

      const updatedUser = await apiService.getUserProfile();
      setUser(updatedUser);

      setSwapData({ ...swapData, fromAmount: '', toAmount: '' });
      setSwapQuote(null);
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSwapQuote = async () => {
    if (!swapData.fromAmount) return;

    try {
      const quote = await apiService.getSwapQuote(
        swapData.fromToken,
        swapData.toToken,
        parseFloat(swapData.fromAmount)
      );

      setSwapQuote(quote);
      setSwapData({ ...swapData, toAmount: quote.outputAmount.toFixed(6) });
    } catch (error) {
      console.error('Failed to get quote:', error);
    }
  };

  const handleVote = async (proposalId, vote, daoType) => {
    try {
      await apiService.vote({ proposalId, vote, daoType });

      const updatedProposals = await apiService.getDAOProposals();
      setProposals(updatedProposals);

      const updatedUser = await apiService.getUserProfile();
      setUser(updatedUser);

      alert(`Vote submitted successfully!`);
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Vote failed: ' + error.message);
    }
  };

  const handleNFTRedeem = async (nftId, cost) => {
    try {
      await apiService.redeemNFT({ nftId, cost });

      const updatedUser = await apiService.getUserProfile();
      setUser(updatedUser);

      alert('NFT redeemed successfully!');
    } catch (error) {
      console.error('NFT redemption failed:', error);
      alert('NFT redemption failed: ' + error.message);
    }
  };

  useEffect(() => {
    if (swapData.fromAmount && swapData.fromToken && swapData.toToken) {
      const debounceTimer = setTimeout(getSwapQuote, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [swapData.fromAmount, swapData.fromToken, swapData.toToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isTelegramWebApp ? 'Initializing your SWIISH experience...' : 'Loading SWIISH...'}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SWIISH</h1>
          {!isTelegramWebApp ? (
            <div>
              <p className="text-gray-600 mb-4">For the full experience, please open this app through the Telegram bot</p>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Development Mode:</strong> Running in browser for testing
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Authentication failed. Please try again.</p>
              {error && (
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex flex-col items-center p-3 rounded-xl transition-all ${
        isActive
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon size={20} />
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );

  const StatCard = ({ icon: Icon, label, value, color = 'purple' }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg bg-gradient-to-r ${
            color === 'purple'
              ? 'from-purple-500 to-pink-500'
              : color === 'blue'
              ? 'from-blue-500 to-cyan-500'
              : color === 'green'
              ? 'from-green-500 to-emerald-500'
              : 'from-orange-500 to-red-500'
          }`}
        >
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const renderSwapTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Token Swap</h2>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">From</span>
              <span className="text-sm text-gray-500">Balance: 2.45 {swapData.fromToken}</span>
            </div>
            <div className="flex gap-3">
              <select
                value={swapData.fromToken}
                onChange={(e) => setSwapData({ ...swapData, fromToken: e.target.value })}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200 font-medium"
              >
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
                className="flex-1 bg-transparent text-xl font-semibold outline-none"
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
              className="p-2 bg-purple-500 rounded-full text-white hover:bg-purple-600"
            >
              <ArrowUpDown size={20} />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">To</span>
              <span className="text-sm text-gray-500">Balance: 1,250 {swapData.toToken}</span>
            </div>
            <div className="flex gap-3">
              <select
                value={swapData.toToken}
                onChange={(e) => setSwapData({ ...swapData, toToken: e.target.value })}
                className="bg-white rounded-lg px-3 py-2 border border-gray-200 font-medium"
              >
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
                className="flex-1 bg-transparent text-xl font-semibold outline-none text-gray-500"
              />
            </div>
          </div>

          {swapQuote && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price Impact:</span>
                <span
                  className={`font-medium ${
                    swapQuote.priceImpact > 5 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {swapQuote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fee:</span>
                <span className="text-gray-900">{swapQuote.fee.toFixed(6)} {swapData.fromToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Minimum Received:</span>
                <span className="text-gray-900">{swapQuote.minimumReceived.toFixed(6)} {swapData.toToken}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSwap}
            disabled={!swapData.fromAmount || !swapQuote || loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Swapping...' : 'Swap Tokens'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderLiquidityTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={TrendingUp} label="Total Liquidity" value="$5,420" color="blue" />
        <StatCard icon={Coins} label="Total Rewards" value="156.7 SWIISH" color="green" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Liquidity Pools</h2>
          <p className="text-gray-600 text-sm mt-1">Provide liquidity and earn SWIISH tokens</p>
        </div>

        <div className="divide-y divide-gray-100">
          {pools.map((pool, idx) => (
            <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{pool.pair}</h3>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    <span>
                      APY: <span className="text-green-600 font-medium">{pool.apy}%</span>
                    </span>
                    <span>TVL: ${pool.tvl.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${pool.myLiquidity}</p>
                  <p className="text-sm text-gray-600">My Liquidity</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors">
                  Add Liquidity
                </button>
                {pool.myLiquidity > 0 && (
                  <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDAOTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Investor DAO" value="1,250 SWIISH" color="purple" />
        <StatCard icon={Vote} label="User DAO" value="850 Points" color="blue" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Active Proposals</h2>
          <p className="text-gray-600 text-sm mt-1">Vote on governance proposals</p>
        </div>

        <div className="divide-y divide-gray-100">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{proposal.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        proposal.dao === 'investor'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {proposal.dao === 'investor' ? 'Investor DAO' : 'User DAO'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        proposal.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{proposal.votes}</p>
                  <p className="text-sm text-gray-600">votes</p>
                </div>
              </div>

              {proposal.status === 'active' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote(proposal.id, 'yes', proposal.dao)}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Vote Yes
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, 'no', proposal.dao)}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Vote No
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNFTTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Trophy} label="My NFTs" value="3" color="orange" />
        <StatCard icon={Gift} label="Available Points" value="850" color="green" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">NFT Marketplace</h2>
          <p className="text-gray-600 text-sm mt-1">Redeem loyalty points for utility NFTs</p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6">
          {nfts.map((nft) => (
            <div key={nft.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{nft.tier} NFT</h3>
                  <p className="text-gray-600 text-sm">{nft.utility}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-purple-600">{nft.cost} points</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div
                  className={`w-16 h-16 rounded-lg bg-gradient-to-br ${
                    nft.tier === 'Bronze'
                      ? 'from-orange-400 to-orange-600'
                      : nft.tier === 'Silver'
                      ? 'from-gray-400 to-gray-600'
                      : nft.tier === 'Gold'
                      ? 'from-yellow-400 to-yellow-600'
                      : 'from-purple-400 to-pink-600'
                  } flex items-center justify-center`}
                >
                  <Trophy className="text-white" size={24} />
                </div>

                <button
                  onClick={() => handleNFTRedeem(nft.id, nft.cost)}
                  disabled={user.loyaltyPoints < nft.cost}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    user.loyaltyPoints >= nft.cost
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {user.loyaltyPoints >= nft.cost ? 'Redeem' : 'Insufficient Points'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">@{user.username}</h2>
            <p className="opacity-90">SWIISH Member</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Coins} label="SWIISH Tokens" value={user.swiishTokens.toLocaleString()} color="purple" />
        <StatCard icon={Zap} label="Loyalty Points" value={user.loyaltyPoints.toLocaleString()} color="blue" />
        <StatCard icon={Trophy} label="NFTs Owned" value={user.nftCount} color="orange" />
        <StatCard icon={TrendingUp} label="Total Liquidity" value={`$${user.totalLiquidity.toLocaleString()}`} color="green" />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-gray-900">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Added liquidity to ETH/USDT</span>
            <span className="text-green-600 font-medium">+125 SWIISH</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Voted on proposal #001</span>
            <span className="text-blue-600 font-medium">+10 Points</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Redeemed Bronze NFT</span>
            <span className="text-orange-600 font-medium">-100 Points</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-gray-900">Settings</h3>
        <div className="space-y-3">
          <button className="w-full flex justify-between items-center py-3 text-left hover:bg-gray-50 rounded-lg px-3">
            <span>Wallet Settings</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          <button className="w-full flex justify-between items-center py-3 text-left hover:bg-gray-50 rounded-lg px-3">
            <span>Notification Preferences</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          <button className="w-full flex justify-between items-center py-3 text-left hover:bg-gray-50 rounded-lg px-3">
            <span>Security</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">SWIISH</h1>
            <p className="text-purple-100 text-sm">DeFi in Telegram</p>
          </div>
          <div className="flex items-center gap-2">
            <Wallet size={20} />
            <span className="font-medium">@{user?.username}</span>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {activeTab === 'swap' && renderSwapTab()}
        {activeTab === 'liquidity' && renderLiquidityTab()}
        {activeTab === 'dao' && renderDAOTab()}
        {activeTab === 'nft' && renderNFTTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-5 gap-2">
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