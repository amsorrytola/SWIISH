export class DAOService {
  constructor(databaseService, tokenService) {
    this.db = databaseService;
    this.tokens = tokenService;
  }

  async getActiveProposals() {
    try {
      const proposals = await this.db.all(`
        SELECT 
          id,
          title,
          description,
          dao_type as dao,
          votes_yes + votes_no as votes,
          status,
          created_at,
          ends_at
        FROM dao_proposals 
        WHERE status = 'active'
        ORDER BY created_at DESC
      `);

      return proposals.map(proposal => ({
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        dao: proposal.dao,
        votes: proposal.votes,
        status: proposal.status,
        createdAt: proposal.created_at,
        endsAt: proposal.ends_at
      }));
    } catch (error) {
      console.error('Failed to get active proposals:', error);
      return [];
    }
  }

  async createProposal({ creatorTelegramId, title, description, daoType }) {
    try {
      const result = await this.db.run(`
        INSERT INTO dao_proposals (title, description, dao_type, creator_telegram_id, ends_at)
        VALUES (?, ?, ?, ?, datetime('now', '+7 days'))
      `, [title, description, daoType, creatorTelegramId]);

      return {
        id: result.lastID,
        title,
        description,
        daoType,
        status: 'active'
      };
    } catch (error) {
      console.error('Failed to create proposal:', error);
      throw error;
    }
  }

  async vote({ userTelegramId, proposalId, vote, daoType }) {
    try {
      // Check if user already voted
      const existingVote = await this.db.get(`
        SELECT id FROM dao_votes 
        WHERE proposal_id = ? AND telegram_id = ?
      `, [proposalId, userTelegramId]);

      if (existingVote) {
        throw new Error('User has already voted on this proposal');
      }

      // Get user's voting power
      const user = await this.db.get('SELECT * FROM users WHERE telegram_id = ?', [userTelegramId]);
      const votingPower = daoType === 'investor' ? user.swiish_tokens : user.loyalty_points;

      // Record the vote
      await this.db.run(`
        INSERT INTO dao_votes (proposal_id, telegram_id, vote, voting_power)
        VALUES (?, ?, ?, ?)
      `, [proposalId, userTelegramId, vote, votingPower]);

      // Update proposal vote counts
      const voteColumn = vote === 'yes' ? 'votes_yes' : 'votes_no';
      await this.db.run(`
        UPDATE dao_proposals 
        SET ${voteColumn} = ${voteColumn} + ?
        WHERE id = ?
      `, [votingPower, proposalId]);

      return {
        proposalId,
        vote,
        votingPower
      };
    } catch (error) {
      console.error('Failed to record vote:', error);
      throw error;
    }
  }
}
