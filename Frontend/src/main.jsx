import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { WalletConnectProvider } from './context/WalletConnectContext.jsx'

// Initialize Telegram WebApp if available
if (window.Telegram?.WebApp) {
  console.log('Telegram WebApp detected, initializing...');
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  
  // Set viewport height for mobile
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setVH();
  window.addEventListener('resize', setVH);
}

// Error boundary wrapper
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">The app encountered an error and couldn't continue.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Reload App
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletConnectProvider>
      <App />
    </WalletConnectProvider>
  </React.StrictMode>,
)
