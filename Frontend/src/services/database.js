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

  async incrementNFTCount(telegramId) {
    const user = await this.getUser(telegramId);
    if (user) {
      user.nft_count = (user.nft_count || 0) + 1;
      return this.updateUser(telegramId, { nft_count: user.nft_count });
    }
  }

  async updateNFTTier(telegramId, tier) {
    return this.updateUser(telegramId, { nft_tier: tier });
  }
}

export default new DatabaseService();
