const CONTRACT_ID ="00001ffdfe046cfb5f7e325244810f3f6678e6f97034a6fd448996c3a26fc7b4"
const TOKEN_ID = "00"

// update sendTx to accept a config object
const sendTx = async ({ method, args = [] }) => {
  if (!client || !session) return;

  console.log(client)
  console.log(session)
  console.log(CONTRACT_ID)
  console.log(TOKEN_ID)

  try {
    const result = await client.request({
      topic: session.topic,
      chainId: "hathor:testnet",
      request: {
        method: "htr_sendNanoContractTx",
        id: Date.now(),
        jsonrpc: "2.0",
        params: {
          method,
          nc_id: CONTRACT_ID,
          actions: [
            {
              type: "deposit",
              token: TOKEN_ID,
              amount: 10,
            }
          ],
          args,
          push_tx: true,
        },
      },
    });
    console.log(`✅ ${method} called successfully:`, result);
  } catch (error) {
    console.error(`❌ Error calling ${method}:`, error);
  }
};
