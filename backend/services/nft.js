export class NFTService {
  constructor(databaseService, tokenService) {
    this.db = databaseService;
    this.tokens = tokenService;
    this.nftTiers = [
      // User DAO NFTs
      { 
        id: 1, 
        tier: 'Enter DAO', 
        type: 'user',
        utility: '5% fee reduction + Basic voting rights', 
        cost: 50,
        supply: 2000,
        remaining: 1247,
        benefits: ['5% trading fee reduction', 'Basic DAO voting rights', 'Community access', 'Weekly reports'],
        description: 'Your entry into the SWIISH User DAO community',
        rarity: 'Common',
        powerLevel: 1
      },
      { 
        id: 2, 
        tier: 'Experienced Member', 
        type: 'user',
        utility: '10% fee reduction + Enhanced voting + Priority support', 
        cost: 150,
        supply: 1000,
        remaining: 687,
        benefits: ['10% trading fee reduction', 'Enhanced voting power', 'Priority customer support', 'Advanced analytics dashboard'],
        description: 'For seasoned SWIISH community members',
        rarity: 'Uncommon',
        powerLevel: 2
      },
      { 
        id: 3, 
        tier: 'Super Member', 
        type: 'user',
        utility: '15% fee reduction + Premium features + Exclusive pools', 
        cost: 300,
        supply: 500,
        remaining: 289,
        benefits: ['15% trading fee reduction', 'Access to exclusive pools', 'Premium trading features', 'Monthly strategy calls'],
        description: 'Elite status in the SWIISH ecosystem',
        rarity: 'Rare',
        powerLevel: 3
      },
      { 
        id: 4, 
        tier: 'Legendary Member', 
        type: 'user',
        utility: '20% fee reduction + All benefits + Governance boost', 
        cost: 500,
        supply: 200,
        remaining: 89,
        benefits: ['20% trading fee reduction', 'All premium benefits', '2x governance voting power', 'Direct team access'],
        description: 'Legendary status with maximum user benefits',
        rarity: 'Epic',
        powerLevel: 4
      },
      { 
        id: 5, 
        tier: 'Ultimate Member', 
        type: 'user',
        utility: '25% fee reduction + Ultimate power + Alpha access', 
        cost: 1000,
        supply: 100,
        remaining: 34,
        benefits: ['25% trading fee reduction', 'Ultimate governance power', 'Alpha feature access', 'Personal account manager'],
        description: 'The pinnacle of SWIISH User DAO membership',
        rarity: 'Legendary',
        powerLevel: 5
      },
      // Investor DAO NFTs
      { 
        id: 6, 
        tier: 'Enter DAO', 
        type: 'investor',
        utility: 'Basic liquidity mining + 10% reward boost', 
        cost: 100,
        supply: 1000,
        remaining: 567,
        benefits: ['10% liquidity mining boost', 'Investor DAO voting rights', 'Exclusive investor channels', 'Market insights'],
        description: 'Your entry into the SWIISH Investor DAO',
        rarity: 'Common',
        powerLevel: 1
      },
      { 
        id: 7, 
        tier: 'Experienced Member', 
        type: 'investor',
        utility: 'Enhanced mining + 20% boost + Priority allocations', 
        cost: 300,
        supply: 500,
        remaining: 234,
        benefits: ['20% liquidity mining boost', 'Priority in new pools', 'Advanced market analytics', 'Private investor calls'],
        description: 'For experienced DeFi investors',
        rarity: 'Uncommon',
        powerLevel: 2
      },
      { 
        id: 8, 
        tier: 'Super Member', 
        type: 'investor',
        utility: 'Premium mining + 30% boost + Exclusive opportunities', 
        cost: 750,
        supply: 250,
        remaining: 89,
        benefits: ['30% liquidity mining boost', 'Exclusive investment opportunities', 'Yield farming optimization', 'Personal DeFi advisor'],
        description: 'Super investor status with premium benefits',
        rarity: 'Rare',
        powerLevel: 3
      },
      { 
        id: 9, 
        tier: 'Legendary Member', 
        type: 'investor',
        utility: 'Elite mining + 40% boost + Governance power', 
        cost: 1500,
        supply: 100,
        remaining: 23,
        benefits: ['40% liquidity mining boost', 'Major governance influence', 'Early access to new protocols', 'Revenue sharing participation'],
        description: 'Legendary investor with significant influence',
        rarity: 'Epic',
        powerLevel: 4
      },
      { 
        id: 10, 
        tier: 'Ultimate Member', 
        type: 'investor',
        utility: 'Ultimate mining + 50% boost + Maximum power', 
        cost: 3000,
        supply: 50,
        remaining: 7,
        benefits: ['50% liquidity mining boost', 'Maximum governance power', 'Protocol co-ownership benefits', 'Executive advisory board access'],
        description: 'The ultimate SWIISH Investor DAO membership',
        rarity: 'Legendary',
        powerLevel: 5
      }
    ];
  }

  async getMarketplaceNFTs() {
    return this.nftTiers;
  }

  async redeemNFT({ userTelegramId, nftId, cost, tier, type }) {
    try {
      const nftTier = this.nftTiers.find(nft => nft.id === nftId);
      if (!nftTier) {
        throw new Error('NFT not found');
      }

      // Record NFT ownership with enhanced data
      await this.db.run(`
        INSERT INTO user_nfts (telegram_id, nft_tier, nft_utility, nft_type, rarity, power_level)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userTelegramId, nftTier.tier, nftTier.utility, nftTier.type, nftTier.rarity, nftTier.powerLevel]);

      // Decrease remaining supply
      nftTier.remaining = Math.max(0, nftTier.remaining - 1);

      return {
        nftId,
        tier: nftTier.tier,
        utility: nftTier.utility,
        type: nftTier.type,
        rarity: nftTier.rarity,
        powerLevel: nftTier.powerLevel,
        cost
      };
    } catch (error) {
      console.error('Failed to redeem NFT:', error);
      throw error;
    }
  }

  async getUserNFTs(telegramId) {
    try {
      return await this.db.all(`
        SELECT * FROM user_nfts 
        WHERE telegram_id = ?
        ORDER BY mint_date DESC
      `, [telegramId]);
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      return [];
    }
  }
}
