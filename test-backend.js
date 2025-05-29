import fetch from 'node-fetch';

const API_BASE_URL = 'https://e76d-45-251-49-135.ngrok-free.app';

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    console.log('Health check status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health check response:', healthData);
    }
    
    // Test auth endpoint
    const authResponse = await fetch(`${API_BASE_URL}/api/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telegramId: '123456789',
        username: 'testuser',
        firstName: 'Test'
      })
    });
    
    console.log('Auth test status:', authResponse.status);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth test response:', authData);
    } else {
      const errorText = await authResponse.text();
      console.error('Auth test error:', errorText);
    }
    
  } catch (error) {
    console.error('Backend test failed:', error);
  }
}

testBackend();
