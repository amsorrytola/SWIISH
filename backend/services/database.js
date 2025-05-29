import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export class DatabaseService {
  constructor() {
    this.db = new sqlite3.Database('./swiish.db');
    this.db.run = promisify(this.db.run.bind(this.db));
    this.db.get = promisify(this.db.get.bind(this.db));
    this.db.all = promisify(this.db.all.bind(this.db));
  }

  async initialize() {
    // Create tables
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id TEXT PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        swiish_tokens REAL DEFAULT 0,
        loyalty_points INTEGER DEFAULT 0,
        nft_count INTEGER DEFAULT 0,
        total_liquidity REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT,
        activity_type TEXT,
        description TEXT,
        reward_amount REAL,
        reward_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS dao_proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        dao_type TEXT NOT NULL,
        creator_telegram_id TEXT,
        votes_yes INTEGER DEFAULT 0,
        votes_no INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ends_at DATETIME,
        FOREIGN KEY (creator_telegram_id) REFERENCES users (telegram_id)
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS dao_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proposal_id INTEGER,
        telegram_id TEXT,
        vote TEXT,
        voting_power REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES dao_proposals (id),
        FOREIGN KEY (telegram_id) REFERENCES users (telegram_id),
        UNIQUE(proposal_id, telegram_id)
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS user_nfts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT,
        nft_tier TEXT,
        nft_utility TEXT,
        mint_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS liquidity_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT,
        pool_pair TEXT,
        lp_tokens REAL,
        token_a_amount REAL,
        token_b_amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
      )
    `);

    // Insert sample data
    await this.insertSampleData();

    console.log('Database initialized successfully');
  }

  async insertSampleData() {
    try {
      // Insert sample DAO proposals
      const proposals = [
        {
          title: 'Increase Liquidity Rewards',
          description: 'Proposal to increase liquidity provider rewards by 50%',
          dao_type: 'investor'
        },
        {
          title: 'New Token Listing',
          description: 'Add support for new DeFi tokens on the platform',
          dao_type: 'user'
        }
      ];

      for (const proposal of proposals) {
        await this.db.run(`
          INSERT OR IGNORE INTO dao_proposals (title, description, dao_type, creator_telegram_id, ends_at)
          VALUES (?, ?, ?, ?, datetime('now', '+7 days'))
        `, [proposal.title, proposal.description, proposal.dao_type, '123456789']);
      }
    } catch (error) {
      console.error('Failed to insert sample data:', error);
    }
  }

  async createUser(userData) {
    const { telegramId, username, firstName, swiishTokens, loyaltyPoints, nftCount, totalLiquidity } = userData;
    
    await this.db.run(`
      INSERT INTO users (telegram_id, username, first_name, swiish_tokens, loyalty_points, nft_count, total_liquidity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [telegramId, username, firstName, swiishTokens, loyaltyPoints, nftCount, totalLiquidity]);

    return this.getUser(telegramId);
  }

  async getUser(telegramId) {
    const user = await this.db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
    if (user) {
      // Map database fields to frontend-expected format
      return {
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        swiishTokens: user.swiish_tokens || 0,
        loyaltyPoints: user.loyalty_points || 0,
        nftCount: user.nft_count || 0,
        totalLiquidity: user.total_liquidity || 0,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    }
    return null;
  }

  async updateUser(telegramId, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await this.db.run(`
      UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE telegram_id = ?
    `, [...values, telegramId]);

    return this.getUser(telegramId);
  }

  async addSwiishTokens(telegramId, amount) {
    await this.db.run(`
      UPDATE users SET swiish_tokens = swiish_tokens + ?, updated_at = CURRENT_TIMESTAMP 
      WHERE telegram_id = ?
    `, [amount, telegramId]);

    await this.addActivity(telegramId, 'token_reward', `Earned ${amount} SWIISH tokens`, amount, 'SWIISH');
  }

  async addLoyaltyPoints(telegramId, points) {
    await this.db.run(`
      UPDATE users SET loyalty_points = loyalty_points + ?, updated_at = CURRENT_TIMESTAMP 
      WHERE telegram_id = ?
    `, [points, telegramId]);

    if (points > 0) {
      await this.addActivity(telegramId, 'points_reward', `Earned ${points} loyalty points`, points, 'Points');
    } else {
      await this.addActivity(telegramId, 'points_spent', `Spent ${Math.abs(points)} loyalty points`, Math.abs(points), 'Points');
    }
  }

  async incrementNFTCount(telegramId) {
    await this.db.run(`
      UPDATE users SET nft_count = nft_count + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE telegram_id = ?
    `, [telegramId]);
  }

  async addActivity(telegramId, activityType, description, rewardAmount, rewardType) {
    await this.db.run(`
      INSERT INTO activities (telegram_id, activity_type, description, reward_amount, reward_type)
      VALUES (?, ?, ?, ?, ?)
    `, [telegramId, activityType, description, rewardAmount, rewardType]);
  }

  async getUserActivities(telegramId, limit = 10) {
    return await this.db.all(`
      SELECT * FROM activities 
      WHERE telegram_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [telegramId, limit]);
  }

  // ...existing code for DAO and NFT methods...
}
