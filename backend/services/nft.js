export class NFTService {
  constructor(databaseService, tokenService) {
    this.db = databaseService;
    this.tokens = tokenService;
    this.nftTiers = [
      {
        id: 'bronze',
        tier: 'Bronze',
        cost: 100,
        utility: 'Fee reduction: 10%'
      },
      {
        id: 'silver',
        tier: 'Silver',
        cost: 250,
        utility: 'Fee reduction: 25% + Early access'
      },
      {
        id: 'gold',
        tier: 'Gold',
        cost: 500,
        utility: 'Fee reduction: 50% + Governance boost'
      },
      {
        id: 'platinum',
        tier: 'Platinum',
        cost: 1000,
        utility: 'No fees + Maximum benefits'
      }
    ];
  }

  async getMarketplaceNFTs() {
    return this.nftTiers;
  }

  async redeemNFT({ userTelegramId, nftId, cost }) {
    try {
      const nftTier = this.nftTiers.find(nft => nft.id === nftId);
      if (!nftTier) {
        throw new Error('NFT not found');
      }

      // Record NFT ownership
      await this.db.run(`
        INSERT INTO user_nfts (telegram_id, nft_tier, nft_utility)
        VALUES (?, ?, ?)
      `, [userTelegramId, nftTier.tier, nftTier.utility]);

      return {
        nftId,
        tier: nftTier.tier,
        utility: nftTier.utility,
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
