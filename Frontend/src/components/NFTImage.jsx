import React, { useState } from 'react';

const NFTImage = ({ nft, className = "", hasEnoughTokens = true, isAvailable = true }) => {
  const [imageError, setImageError] = useState(false);
  
  // Generate image path based on NFT properties
  const getImagePath = () => {
    const type = nft.type; // 'user' or 'investor'
    const tier = nft.tier.toLowerCase().replace(/\s+/g, '-'); // Convert to kebab-case
    return `/images/nfts/${type}/${tier}.png`;
  };

  // Fallback icon based on tier and type
  const getFallbackIcon = () => {
    switch (nft.powerLevel) {
      case 5: return nft.type === 'investor' ? '👑' : '⚡';
      case 4: return nft.type === 'investor' ? '💎' : '🔥';
      case 3: return nft.type === 'investor' ? '⭐' : '✨';
      case 2: return nft.type === 'investor' ? '🔮' : '💫';
      default: return nft.type === 'investor' ? '🎯' : '🌟';
    }
  };

  const getNFTGradient = () => {
    if (nft.type === 'investor') {
      switch (nft.powerLevel) {
        case 5: return 'from-yellow-400 via-orange-500 to-red-600';
        case 4: return 'from-purple-500 via-pink-500 to-red-500';
        case 3: return 'from-blue-500 via-purple-500 to-pink-500';
        case 2: return 'from-green-500 via-blue-500 to-purple-500';
        default: return 'from-gray-400 via-gray-500 to-gray-600';
      }
    } else {
      switch (nft.powerLevel) {
        case 5: return 'from-yellow-400 via-yellow-500 to-orange-500';
        case 4: return 'from-purple-400 via-purple-500 to-pink-500';
        case 3: return 'from-blue-400 via-blue-500 to-cyan-500';
        case 2: return 'from-green-400 via-green-500 to-emerald-500';
        default: return 'from-gray-400 via-gray-500 to-slate-500';
      }
    }
  };

  const handleImageError = () => {
    console.log(`Failed to load NFT image: ${getImagePath()}`);
    setImageError(true);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-full h-full rounded-xl bg-gradient-to-br ${getNFTGradient()} flex items-center justify-center shadow-lg relative overflow-hidden ${
          !hasEnoughTokens || !isAvailable ? 'opacity-50' : ''
        }`}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 animate-pulse"></div>
        
        {/* NFT Image or Fallback Icon */}
        {!imageError ? (
          <img
            src={getImagePath()}
            alt={`${nft.tier} ${nft.type} NFT`}
            className="w-4/5 h-4/5 object-cover rounded-lg relative z-10"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="relative z-10 text-3xl">
            {getFallbackIcon()}
          </div>
        )}
        
        {/* Sparkle effect for higher tiers */}
        {nft.powerLevel >= 4 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping absolute top-2 right-2"></div>
            <div className="w-1 h-1 bg-yellow-300 rounded-full animate-pulse absolute bottom-3 left-3"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce absolute top-3 left-2"></div>
          </div>
        )}
        
        {/* Tier indicator overlay */}
        <div className="absolute bottom-1 left-1 right-1 bg-black/30 rounded text-white text-xs text-center font-bold">
          {nft.type === 'investor' ? 'INV' : 'USR'}
        </div>
      </div>
      
      {/* Lock overlay for insufficient tokens */}
      {!hasEnoughTokens && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-xl lock-overlay">
          <div className="text-center text-white">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-xs font-medium">
              Insufficient Funds
            </div>
          </div>
        </div>
      )}
      
      {/* Sold out overlay */}
      {!isAvailable && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-70 flex items-center justify-center rounded-xl">
          <div className="text-center text-white">
            <div className="text-xs font-bold">SOLD OUT</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTImage;
