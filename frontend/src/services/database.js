class DatabaseService {
  constructor() {
    this.storage = localStorage;
  }

  // User management
  async getUser(telegramId) {
    try {
      const userData = this.storage.getItem(`user_${telegramId}`);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async createUser(userData) {
    try {
      const user = {
        telegram_id: userData.telegramId,
        username: userData.username,
        first_name: userData.firstName,
        swiish_tokens: userData.swiishTokens || 0,
        loyalty_points: userData.loyaltyPoints || 100,
        nft_count: userData.nftCount || 0,
        total_liquidity: userData.totalLiquidity || 0,
        investor_dao_power: userData.investorDAOPower || 0,
        user_dao_power: userData.userDAOPower || 0,
        staking_rewards: userData.stakingRewards || 0,
        nft_tier: userData.nftTier || 'None',
        created_at: new Date().toISOString()
      };
      
      this.storage.setItem(`user_${userData.telegramId}`, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(telegramId, updates) {
    try {
      const user = await this.getUser(telegramId);
      if (!user) throw new Error('User not found');
      
      const updatedUser = { ...user, ...updates };
      this.storage.setItem(`user_${telegramId}`, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Token management
  async addSwiishTokens(telegramId, amount) {
    const user = await this.getUser(telegramId);
    if (user) {
      user.swiish_tokens = (user.swiish_tokens || 0) + amount;
      return this.updateUser(telegramId, { swiish_tokens: user.swiish_tokens });
    }
  }

  async addLoyaltyPoints(telegramId, amount) {
    const user = await this.getUser(telegramId);
    if (user) {
      user.loyalty_points = (user.loyalty_points || 0) + amount;
      return this.updateUser(telegramId, { loyalty_points: user.loyalty_points });
    }
  }

  async updateLiquidity(telegramId, amount) {
    const user = await this.getUser(telegramId);
    if (user) {
      user.total_liquidity = (user.total_liquidity || 0) + amount;
      return this.updateUser(telegramId, { total_liquidity: user.total_liquidity });
    }
  }

  async updateDAOPower(telegramId, daoType, amount) {
    const user = await this.getUser(telegramId);
    if (user) {
      const field = daoType === 'investor' ? 'investor_dao_power' : 'user_dao_power';
      user[field] = (user[field] || 0) + amount;
      return this.updateUser(telegramId, { [field]: user[field] });
    }
  }

  // Hierarchical DAO methods
  async calculateVotingPower(telegramId, daoType) {
    const user = await this.getUser(telegramId);
    if (!user) return { tier: 'none', power: 0, multiplier: 1 };

    if (daoType === 'investor') {
      return this.calculateInvestorVotingPower(user);
    } else {
      return this.calculateUserVotingPower(user);
    }
  }

  async calculateInvestorVotingPower(user) {
    const swiishTokens = user.swiish_tokens || 0;
    const totalLiquidity = user.total_liquidity || 0;
    const nftPowerLevel = this.getNFTPowerLevel(user.nft_tier, 'investor');

    // Base voting power from SWIISH tokens
    let basePower = swiishTokens;
    
    // Liquidity bonus (up to 50% bonus)
    const liquidityBonus = Math.min(totalLiquidity * 0.1, swiishTokens * 0.5);
    
    // NFT multiplier based on tier
    const nftMultiplier = 1 + (nftPowerLevel * 0.1); // 10% per power level

    // Determine hierarchy tier
    const totalPower = (basePower + liquidityBonus) * nftMultiplier;
    const tier = this.getInvestorTier(totalPower, totalLiquidity);

    return {
      tier,
      power: Math.floor(totalPower),
      basePower: Math.floor(basePower),
      liquidityBonus: Math.floor(liquidityBonus),
      nftMultiplier,
      requirements: this.getInvestorTierRequirements()
    };
  }

  async calculateUserVotingPower(user) {
    const loyaltyPoints = user.loyalty_points || 0;
    const swapCount = user.swap_count || 0;
    const daoParticipation = user.dao_participation || 0;
    const nftPowerLevel = this.getNFTPowerLevel(user.nft_tier, 'user');

    // Base voting power from loyalty points
    let basePower = loyaltyPoints;
    
    // Activity bonus
    const activityBonus = Math.min(swapCount * 2 + daoParticipation * 5, loyaltyPoints * 0.3);
    
    // NFT multiplier
    const nftMultiplier = 1 + (nftPowerLevel * 0.05); // 5% per power level

    // Determine hierarchy tier
    const totalPower = (basePower + activityBonus) * nftMultiplier;
    const tier = this.getUserTier(totalPower, swapCount, daoParticipation);

    return {
      tier,
      power: Math.floor(totalPower),
      basePower: Math.floor(basePower),
      activityBonus: Math.floor(activityBonus),
      nftMultiplier,
      requirements: this.getUserTierRequirements()
    };
  }

  getInvestorTier(votingPower, totalLiquidity) {
    if (votingPower >= 10000 && totalLiquidity >= 100000) return 'whale';
    if (votingPower >= 5000 && totalLiquidity >= 50000) return 'major';
    if (votingPower >= 1000 && totalLiquidity >= 10000) return 'senior';
    if (votingPower >= 500 && totalLiquidity >= 5000) return 'standard';
    if (votingPower >= 100) return 'junior';
    return 'observer';
  }

  getUserTier(votingPower, swapCount, daoParticipation) {
    if (votingPower >= 5000 && swapCount >= 100 && daoParticipation >= 20) return 'champion';
    if (votingPower >= 2000 && swapCount >= 50 && daoParticipation >= 10) return 'advocate';
    if (votingPower >= 1000 && swapCount >= 25 && daoParticipation >= 5) return 'active';
    if (votingPower >= 500 && swapCount >= 10) return 'engaged';
    if (votingPower >= 100) return 'member';
    return 'observer';
  }

  getNFTPowerLevel(nftTier, daoType) {
    const tierMap = {
      'Ultimate Member NFT': 5,
      'Legendary Member NFT': 4,
      'Super Member NFT': 3,
      'Experienced Member NFT': 2,
      'Enter DAO NFT': 1
    };
    return tierMap[nftTier] || 0;
  }

  getInvestorTierRequirements() {
    return {
      whale: { votingPower: 10000, liquidity: 100000, benefits: ['Veto power', 'Proposal priority', 'Direct protocol influence'] },
      major: { votingPower: 5000, liquidity: 50000, benefits: ['Executive voting', 'Fee setting influence', 'Pool parameter control'] },
      senior: { votingPower: 1000, liquidity: 10000, benefits: ['Enhanced proposals', 'Parameter voting', 'Reward distribution'] },
      standard: { votingPower: 500, liquidity: 5000, benefits: ['Standard voting', 'Pool governance'] },
      junior: { votingPower: 100, liquidity: 0, benefits: ['Basic voting rights'] },
      observer: { votingPower: 0, liquidity: 0, benefits: ['View proposals only'] }
    };
  }

  getUserTierRequirements() {
    return {
      champion: { votingPower: 5000, swaps: 100, participation: 20, benefits: ['Feature veto', 'UI/UX decisions', 'Community leadership'] },
      advocate: { votingPower: 2000, swaps: 50, participation: 10, benefits: ['Feature proposals', 'Community governance'] },
      active: { votingPower: 1000, swaps: 25, participation: 5, benefits: ['Enhanced voting', 'Beta access'] },
      engaged: { votingPower: 500, swaps: 10, participation: 0, benefits: ['Standard voting', 'Feedback priority'] },
      member: { votingPower: 100, swaps: 0, participation: 0, benefits: ['Basic voting rights'] },
      observer: { votingPower: 0, swaps: 0, participation: 0, benefits: ['View proposals only'] }
    };
  }

  async updateEngagementMetrics(telegramId, action) {
    const user = await this.getUser(telegramId);
    if (!user) return;

    const updates = {};
    
    switch (action) {
      case 'swap':
        updates.swap_count = (user.swap_count || 0) + 1;
        break;
      case 'vote':
        updates.dao_participation = (user.dao_participation || 0) + 1;
        break;
      case 'proposal':
        updates.dao_participation = (user.dao_participation || 0) + 3;
        break;
    }

    return this.updateUser(telegramId, updates);
  }
}

export default new DatabaseService();
