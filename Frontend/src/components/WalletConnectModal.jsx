import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Wifi, Copy, Check, ChevronRight } from 'lucide-react';

const WalletConnectModal = ({ isOpen, onClose, uri, onConnect, onMetaMaskConnect }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('waiting');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (uri && isOpen) {
      console.log('Modal received URI:', uri);
      setShowQR(true);
      generateQRCode(uri);
      setConnectionStatus('waiting');
    }
  }, [uri, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setShowQR(false);
      setQrCodeDataUrl('');
      setConnectionStatus('waiting');
      setCopied(false);
    }
  }, [isOpen]);

  const generateQRCode = async (uri) => {
    try {
      // Use a more reliable QR code service with better formatting
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&ecc=M&margin=10&data=${encodeURIComponent(uri)}`;
      setQrCodeDataUrl(qrUrl);
      console.log('QR code generated for URI:', uri);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to embedded SVG QR
      setQrCodeDataUrl(generateSVGQR(uri));
    }
  };

  const generateSVGQR = (data) => {
    // Simple fallback QR code as SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="white"/>
        <rect x="50" y="50" width="200" height="200" fill="black" opacity="0.1"/>
        <text x="150" y="130" text-anchor="middle" font-family="Arial" font-size="12" fill="black">
          WalletConnect QR
        </text>
        <text x="150" y="150" text-anchor="middle" font-family="Arial" font-size="10" fill="gray">
          Scan with your wallet
        </text>
        <text x="150" y="170" text-anchor="middle" font-family="Arial" font-size="8" fill="gray">
          ${data.substring(0, 30)}...
        </text>
      </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(svg);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = uri;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openInWallet = (walletName) => {
    if (!uri) return;
    
    console.log('Opening in wallet:', walletName, 'URI:', uri);
    
    const encodedUri = encodeURIComponent(uri);
    let deepLink = '';

    switch (walletName) {
      case 'metamask':
        // MetaMask mobile app deep link
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          deepLink = `metamask://wc?uri=${encodedUri}`;
        } else {
          deepLink = `https://metamask.app.link/wc?uri=${encodedUri}`;
        }
        break;
      case 'trust':
        // Trust Wallet deep link
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          deepLink = `trust://wc?uri=${encodedUri}`;
        } else {
          deepLink = `https://link.trustwallet.com/wc?uri=${encodedUri}`;
        }
        break;
      case 'rainbow':
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          deepLink = `rainbow://wc?uri=${encodedUri}`;
        } else {
          deepLink = `https://rnbwapp.com/wc?uri=${encodedUri}`;
        }
        break;
      case 'coinbase':
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          deepLink = `cbwallet://wc?uri=${encodedUri}`;
        } else {
          deepLink = `https://go.cb-w.com/wc?uri=${encodedUri}`;
        }
        break;
      default:
        // Generic WalletConnect deep link
        deepLink = `wc://wc?uri=${encodedUri}`;
    }

    console.log('Generated deep link:', deepLink);
    setConnectionStatus('connecting');
    
    try {
      // Try to open the deep link
      window.open(deepLink, '_blank');
      
      // Show instructions after opening
      setTimeout(() => {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert(`Opening ${walletName}... Please approve the connection in your wallet app.`);
        } else {
          console.log(`${walletName} app should open now. Please approve the connection.`);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to open wallet:', error);
      setConnectionStatus('error');
    }
  };

  const handleMetaMaskConnect = async () => {
    try {
      setConnectionStatus('connecting');
      if (onMetaMaskConnect) {
        await onMetaMaskConnect();
        setConnectionStatus('connected');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('MetaMask connection failed:', error);
      
      // Show error to user
      setTimeout(() => {
        setConnectionStatus('waiting');
      }, 3000);
    }
  };

  const handleWalletConnectStart = () => {
    console.log('Starting WalletConnect flow...');
    setShowQR(true);
    setConnectionStatus('connecting');
    
    // Add connection progress tracking
    setTimeout(() => {
      if (connectionStatus === 'connecting') {
        setConnectionStatus('waiting');
        console.log('Connection status changed to waiting for user action');
      }
    }, 3000);
    
    // For demo purposes, add a button to simulate connection
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: You can simulate connection');
    }
  };

  // Enhanced simulation with better feedback
  const simulateConnection = () => {
    console.log('User requested connection simulation');
    setConnectionStatus('connecting');
    
    if (window.swiishWalletService) {
      setTimeout(() => {
        window.swiishWalletService.simulateWalletConnection();
        setConnectionStatus('connected');
        setTimeout(() => {
          onClose();
        }, 1500);
      }, 1000);
    }
  };

  // Auto-refresh QR code if connection is stuck
  useEffect(() => {
    if (showQR && connectionStatus === 'waiting') {
      const refreshInterval = setInterval(() => {
        console.log('Refreshing QR code due to long wait time');
        if (uri) {
          generateQRCode(uri);
        }
      }, 60000); // Refresh every minute
      
      return () => clearInterval(refreshInterval);
    }
  }, [showQR, connectionStatus, uri]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect Wallet</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred connection method</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Connection Method Selection */}
          {!showQR && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Connection Method</h3>
              
              {/* MetaMask Option */}
              {typeof window.ethereum !== 'undefined' && (
                <button
                  onClick={handleMetaMaskConnect}
                  disabled={connectionStatus === 'connecting'}
                  className="w-full flex items-center justify-between p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🦊</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">MetaMask</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect using MetaMask extension'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
              )}
              
              {/* WalletConnect Option */}
              <button
                onClick={handleWalletConnectStart}
                disabled={connectionStatus === 'connecting'}
                className="w-full flex items-center justify-between p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">WalletConnect</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Scan QR with mobile wallet</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
              
              {/* Development Demo Button */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                    Development Mode: Test the wallet connection flow
                  </p>
                  <button
                    onClick={simulateConnection}
                    className="w-full px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                  >
                    Simulate Wallet Connection (Demo)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* QR Code Section */}
          {showQR && qrCodeDataUrl && (
            <div className="text-center">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowQR(false)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ← Back to options
                </button>
                <span className="text-sm text-gray-500">WalletConnect</span>
              </div>
              
              <div className="inline-block p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                <img 
                  src={qrCodeDataUrl} 
                  alt="WalletConnect QR Code" 
                  className="w-56 h-56 mx-auto"
                  onError={() => {
                    console.error('QR code image failed to load, using fallback');
                    setQrCodeDataUrl(generateSVGQR(uri));
                  }}
                />
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scan this QR code with your mobile wallet app
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Compatible with MetaMask, Trust Wallet, Rainbow, and other WalletConnect wallets
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy URI'}
                  </button>
                </div>
              </div>
              
              {/* Enhanced wallet connection instructions */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  How to connect your wallet:
                </h4>
                <ol className="text-xs text-blue-600 dark:text-blue-300 text-left space-y-1">
                  <li>1. Open your mobile wallet app (MetaMask, Trust Wallet, etc.)</li>
                  <li>2. Look for "WalletConnect", "Scan QR", or "Connect to DApp"</li>
                  <li>3. Scan the QR code above with your wallet camera</li>
                  <li>4. Approve the connection request in your wallet</li>
                  <li>5. You should see a "Connected" status once successful</li>
                </ol>
                <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-800/20 rounded text-xs">
                  <strong>Tip:</strong> Make sure your wallet app supports WalletConnect v2 (most modern wallets do)
                </div>
              </div>
              
              {/* Development Demo Button for QR view */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4">
                  <button
                    onClick={simulateConnection}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    Simulate Connection (Demo)
                  </button>
                </div>
              )}
              
              {/* Mobile Wallet Quick Links */}
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Quick connect with your wallet:
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'MetaMask', key: 'metamask', icon: '🦊', color: 'orange' },
                    { name: 'Trust Wallet', key: 'trust', icon: '🛡️', color: 'blue' },
                    { name: 'Rainbow', key: 'rainbow', icon: '🌈', color: 'purple' },
                    { name: 'Coinbase', key: 'coinbase', icon: '🔵', color: 'blue' }
                  ].map((wallet) => (
                    <button
                      key={wallet.key}
                      onClick={() => openInWallet(wallet.key)}
                      className={`flex items-center gap-2 p-3 border-2 border-${wallet.color}-200 dark:border-${wallet.color}-800 rounded-lg hover:bg-${wallet.color}-50 dark:hover:bg-${wallet.color}-900/20 transition-colors`}
                    >
                      <span className="text-lg">{wallet.icon}</span>
                      <div className="text-left">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          {wallet.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Tap to open
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    Don't have a wallet? <button 
                      onClick={() => window.open('https://metamask.io/download/', '_blank')}
                      className="text-blue-500 hover:underline"
                    >
                      Download MetaMask
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 py-2">
            <Wifi size={16} className={`${
              connectionStatus === 'connected' ? 'text-green-500' :
              connectionStatus === 'connecting' ? 'text-yellow-500' :
              connectionStatus === 'error' ? 'text-red-500' :
              'text-gray-400'
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {connectionStatus === 'connected' ? 'Connected!' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Connection failed' :
               'Choose a connection method above'}
            </span>
          </div>

          {/* Enhanced connection status indicators */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Connection Status:
            </h4>
            <div className="space-y-2">
              {connectionStatus === 'connecting' && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  Establishing connection...
                </div>
              )}
              {connectionStatus === 'waiting' && (
                <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-300">
                  <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                  Waiting for wallet to respond...
                </div>
              )}
              {connectionStatus === 'connected' && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-300">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  Successfully connected!
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  Connection failed - please try again
                </div>
              )}
            </div>
            
            {connectionStatus === 'waiting' && (
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Stuck?</strong> Make sure your wallet app is open and try scanning again. 
                Some wallets may take up to 30 seconds to respond.
              </div>
            )}
          </div>
          
          {/* Enhanced Development Demo Button for QR view */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 space-y-2">
              <button
                onClick={simulateConnection}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                🔧 Simulate Connection (Demo)
              </button>
              <p className="text-xs text-gray-500 text-center">
                Development mode: This button simulates a successful wallet connection
              </p>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              New to crypto wallets?
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">
              A crypto wallet securely stores your digital assets and lets you interact with DeFi applications.
            </p>
            <button
              onClick={() => window.open('https://ethereum.org/en/wallets/', '_blank')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Learn more about wallets →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;
