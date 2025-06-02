// NFT Image registry
export const NFT_IMAGES = {
  user: {
    'enter-dao': '/images/nfts/user/enter-dao.png',
    'experienced-member': '/images/nfts/user/experienced-member.png',
    'super-member': '/images/nfts/user/super-member.png',
    'legendary-member': '/images/nfts/user/legendary-member.png',
    'ultimate-member': '/images/nfts/user/ultimate-member.png'
  },
  investor: {
    'enter-dao': '/images/nfts/investor/enter-dao.png',
    'experienced-member': '/images/nfts/investor/experienced-member.png',
    'super-member': '/images/nfts/investor/super-member.png',
    'legendary-member': '/images/nfts/investor/legendary-member.png',
    'ultimate-member': '/images/nfts/investor/ultimate-member.png'
  }
};

// Helper function to get NFT image path
export const getNFTImagePath = (type, tier) => {
  const tierKey = tier.toLowerCase().replace(/\s+/g, '-');
  return NFT_IMAGES[type]?.[tierKey] || null;
};

// Helper function to check if image exists
export const hasNFTImage = (type, tier) => {
  const tierKey = tier.toLowerCase().replace(/\s+/g, '-');
  return !!(NFT_IMAGES[type]?.[tierKey]);
};
