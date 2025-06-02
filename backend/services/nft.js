export class NFTService {
  constructor(dbService, tokenService) {
    this.dbService = dbService;
    this.tokenService = tokenService;
    // In-memory storage for demo (use real database in production)
    this.userNFTs = new Map(); // Map<telegramId, NFT[]>
  }

  getMarketplaceNFTs() {
    return [
      // User DAO NFTs - Loyalty Points based (ascending cost hierarchy)
      { 
        id: 1, 
        tier: 'Enter DAO', 
        type: 'user',
        utility: '5% fee reduction + Basic voting rights', 
        cost: 100,    // Entry level - 100 loyalty points
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
        cost: 300,    // 3x entry cost
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
        cost: 750,    // 7.5x entry cost
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
        cost: 1500,   // 15x entry cost
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
        cost: 3000,   // 30x entry cost
        supply: 100,
        remaining: 34,
        benefits: ['25% trading fee reduction', 'Ultimate governance power', 'Alpha feature access', 'Personal account manager'],
        description: 'The pinnacle of SWIISH User DAO membership',
        rarity: 'Legendary',
        powerLevel: 5
      },
      // Investor DAO NFTs - SWIISH tokens based (ascending cost hierarchy)
      { 
        id: 6, 
        tier: 'Enter DAO', 
        type: 'investor',
        utility: 'Basic liquidity mining + 10% reward boost', 
        cost: 50,     // Entry level - 50 SWIISH tokens
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
        cost: 150,    // 3x entry cost
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
        cost: 400,    // 8x entry cost
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
        cost: 1000,   // 20x entry cost
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
        cost: 2500,   // 50x entry cost
        supply: 50,
        remaining: 7,
        benefits: ['50% liquidity mining boost', 'Maximum governance power', 'Protocol co-ownership benefits', 'Executive advisory board access'],
        description: 'The ultimate SWIISH Investor DAO membership',
        rarity: 'Legendary',
        powerLevel: 5
      }
    ];
  }

  async redeemNFT(nftData) {
    const { userTelegramId, nftId, cost, tier, type } = nftData;
    
    console.log('Redeeming NFT:', { userTelegramId, nftId, cost, tier, type });
    
    // Find the NFT in marketplace
    const marketplaceNFTs = this.getMarketplaceNFTs();
    const nft = marketplaceNFTs.find(n => n.id === nftId);
    
    if (!nft) {
      throw new Error('NFT not found');
    }
    
    // Create owned NFT record
    const ownedNFT = {
      ...nft,
      ownedAt: new Date().toISOString(),
      transactionId: 'nft_' + Math.random().toString(36).substr(2, 9),
      mintedBy: userTelegramId
    };
    
    // Add to user's collection
    if (!this.userNFTs.has(userTelegramId)) {
      this.userNFTs.set(userTelegramId, []);
    }
    this.userNFTs.get(userTelegramId).push(ownedNFT);
    
    // Decrease remaining count (this should be persisted in real database)
    nft.remaining = Math.max(0, nft.remaining - 1);
    
    return {
      success: true,
      nftId,
      tier,
      type,
      cost,
      transactionId: ownedNFT.transactionId,
      timestamp: ownedNFT.ownedAt,
      message: `${tier} NFT successfully minted!`,
      benefits: nft.benefits
    };
  }

  async getUserNFTs(telegramId) {
    console.log('Getting NFTs for user:', telegramId);
    return this.userNFTs.get(telegramId) || [];
  }
}
