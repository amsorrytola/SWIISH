// src/context/WalletConnectContext.js
import React, { createContext, useState, useRef, useEffect } from 'react';
import WalletConnectClient from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';

export const WalletConnectContext = createContext();

export const WalletConnectProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);

  const walletConnectModal = useRef(
    new WalletConnectModal({
      projectId: 'b9bcc25c3b233a8edf2d7d346f688a59',
      standaloneChains: ['hathor:testnet'],
    })
  );

  const onSessionUpdate = (updatedSession) => {
    console.log("🔄 Session updated", updatedSession);
    setSession(updatedSession);
    const updatedAccount = updatedSession.namespaces.hathor.accounts[0];
    setAccount(updatedAccount);
  };

  const resetAppState = () => {
    console.log("🧹 Resetting app state...");
    setAccount(null);
    setSession(null);
    setClient(null);
  };

  useEffect(() => {
    const initClient = async () => {
      try {
        const wcClient = await WalletConnectClient.init({
          projectId: 'b9bcc25c3b233a8edf2d7d346f688a59',
          relayUrl: 'wss://relay.walletconnect.com',
          metadata: {
            name: "Swisshy",
            description: "Hathor Network Connection",
            url: "http://localhost:5173",
            icons: [],
          },
        });

        wcClient.on("session_event", ({ event }) => {
          console.log("⚡ Session event:", event);
        });

        wcClient.on("session_update", ({ topic, params }) => {
          const { namespaces } = params;
          const _session = wcClient.session.get(topic);
          const updatedSession = { ..._session, namespaces };
          onSessionUpdate(updatedSession);
        });

        wcClient.on("session_delete", () => {
          console.warn("❌ Session deleted");
          resetAppState();
          alert("Session has been closed. Please reconnect your wallet.");
        });

        setClient(wcClient);
      } catch (err) {
        console.error("WalletConnect init error:", err);
      }
    };

    initClient();

    return () => {
      if (client) {
        client.removeAllListeners();
      }
    };
  }, []);

  const connectHathorWallet = async () => {
    if (!client) {
      console.error("❗ WalletConnect client not initialized.");
      return;
    }

    try {
      const { uri, approval } = await client.connect({
        requiredNamespaces: {
          hathor: {
            chains: ["hathor:testnet"],
            methods: ["htr_signWithAddress", "htr_sendNanoContractTx"],
            events: [],
          },
        },
      });

      if (uri) {
        walletConnectModal.current.openModal({ uri });
        console.log("🔗 WalletConnect URI:", uri);
      }

      const approvedSession = await approval();
      walletConnectModal.current.closeModal();

      setSession(approvedSession);
      const address = approvedSession.namespaces.hathor.accounts[0];
      setAccount(address);
      return address;
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  return (
    <WalletConnectContext.Provider
      value={{
        account,
        client,
        session,
        connectHathorWallet,
        resetAppState,
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
};
