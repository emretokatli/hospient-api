const WebSocket = require('ws');

// Test configuration
const TEST_CONFIG = {
  serverUrl: 'ws://localhost:3000/ws/notifications',
  guestId: 123,
  token: 'your-test-token-here', // Replace with actual JWT token
  testMessage: 'This is a test notification from WebSocket'
};

// Test WebSocket connection
function testWebSocketConnection() {
  console.log('🧪 Testing WebSocket Connection...');
  
  const wsUrl = `${TEST_CONFIG.serverUrl}?token=${TEST_CONFIG.token}&guestId=${TEST_CONFIG.guestId}`;
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    console.log('📡 Listening for notifications...');
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 Received message:', message);
      
      if (message.type === 'connection') {
        console.log('✅ Connection confirmed by server');
      } else if (message.type === 'notification') {
        console.log('🔔 Notification received:', message.data.title);
        console.log('   Message:', message.data.message);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });

  return ws;
}

// Test HTTP endpoints
async function testHttpEndpoints() {
  console.log('\n🌐 Testing HTTP Endpoints...');
  
  const baseUrl = 'http://localhost:3000/api/communications';
  
  try {
    // Test WebSocket stats
    console.log('📊 Getting WebSocket statistics...');
    const statsResponse = await fetch(`${baseUrl}/websocket/stats`);
    const stats = await statsResponse.json();
    console.log('✅ WebSocket stats:', stats);
    
    // Test sending notification via HTTP
    console.log('📤 Sending test notification via HTTP...');
    const notificationData = {
      hotel_id: 1,
      type: 'notification',
      title: 'Test Notification from HTTP',
      message: 'This notification was sent via HTTP API',
      category: 'general',
      recipient_type: 'guest',
      recipient_id: TEST_CONFIG.guestId,
      priority: 'normal',
      sender_type: 'hotel'
    };
    
    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.token}`
      },
      body: JSON.stringify(notificationData)
    });
    
    const createResult = await createResponse.json();
    console.log('✅ Notification created:', createResult);
    
    // Test WebSocket test endpoint
    console.log('🧪 Testing WebSocket test endpoint...');
    const testResponse = await fetch(`${baseUrl}/websocket/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        guestId: TEST_CONFIG.guestId,
        message: TEST_CONFIG.testMessage
      })
    });
    
    const testResult = await testResponse.json();
    console.log('✅ Test notification sent:', testResult);
    
  } catch (error) {
    console.error('❌ HTTP test error:', error);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting WebSocket and HTTP Tests...\n');
  
  // Start WebSocket connection
  const ws = testWebSocketConnection();
  
  // Wait a bit for connection to establish
  setTimeout(async () => {
    // Test HTTP endpoints
    await testHttpEndpoints();
    
    // Keep WebSocket open for a while to receive notifications
    console.log('\n⏳ Waiting 10 seconds for notifications...');
    setTimeout(() => {
      console.log('🏁 Tests completed');
      ws.close();
      process.exit(0);
    }, 10000);
  }, 2000);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Tests interrupted');
  process.exit(0);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testWebSocketConnection,
  testHttpEndpoints,
  runTests
}; 