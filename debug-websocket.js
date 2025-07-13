const WebSocket = require('ws');

// Debug configuration
const DEBUG_CONFIG = {
  serverUrl: 'ws://localhost:3000/ws/notifications',
  guestId: 1,
  token: 'your-test-token-here', // This needs to be a valid JWT token
  testMessage: 'Debug test notification'
};

console.log('🔍 WebSocket Debug Script');
console.log('========================');

// Test 1: Check if WebSocket server is accessible
async function testWebSocketServer() {
  console.log('\n1️⃣ Testing WebSocket server accessibility...');
  
  try {
    const response = await fetch('http://localhost:3000/api/communications/websocket/stats');
    const stats = await response.json();
    console.log('✅ WebSocket server is running');
    console.log('📊 Current stats:', stats);
  } catch (error) {
    console.error('❌ WebSocket server not accessible:', error.message);
    return false;
  }
  return true;
}

// Test 2: Test WebSocket connection with invalid token
async function testWebSocketConnection() {
  console.log('\n2️⃣ Testing WebSocket connection...');
  
  const wsUrl = `${DEBUG_CONFIG.serverUrl}?token=${DEBUG_CONFIG.token}&guestId=${DEBUG_CONFIG.guestId}`;
  console.log('🔗 Connecting to:', wsUrl);
  
  const ws = new WebSocket(wsUrl);

  return new Promise((resolve) => {
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully');
      ws.close();
      resolve(true);
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
      if (code === 1008) {
        console.log('❌ Authentication failed - Invalid token or guestId');
        console.log('💡 This is expected with a placeholder token');
      }
      resolve(false);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      resolve(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('⏰ Connection timeout');
      ws.close();
      resolve(false);
    }, 5000);
  });
}

// Test 3: Test HTTP endpoints
async function testHttpEndpoints() {
  console.log('\n3️⃣ Testing HTTP endpoints...');
  
  try {
    // Test WebSocket test endpoint
    console.log('📤 Testing WebSocket test endpoint...');
    const testResponse = await fetch('http://localhost:3000/api/communications/websocket/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        guestId: DEBUG_CONFIG.guestId,
        message: DEBUG_CONFIG.testMessage
      })
    });
    
    const testResult = await testResponse.json();
    console.log('✅ Test endpoint response:', testResult);
    
    // Test creating a notification via main API
    console.log('📤 Testing main notification API...');
    const notificationData = {
      hotel_id: 1,
      type: 'notification',
      title: 'Debug Test Notification',
      message: 'This is a debug test notification',
      category: 'general',
      recipient_type: 'guest',
      recipient_id: DEBUG_CONFIG.guestId,
      priority: 'normal',
      sender_type: 'hotel'
    };
    
    const createResponse = await fetch('http://localhost:3000/api/communications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    });
    
    const createResult = await createResponse.json();
    console.log('✅ Main API response:', createResult);
    
  } catch (error) {
    console.error('❌ HTTP test error:', error.message);
  }
}

// Main debug function
async function runDebug() {
  console.log('🚀 Starting WebSocket Debug...\n');
  
  // Test 1: Check server
  const serverOk = await testWebSocketServer();
  if (!serverOk) {
    console.log('\n❌ Server not accessible. Please check if the API server is running.');
    return;
  }
  
  // Test 2: Test WebSocket connection
  const wsOk = await testWebSocketConnection();
  
  // Test 3: Test HTTP endpoints
  await testHttpEndpoints();
  
  console.log('\n📋 Debug Summary:');
  console.log('================');
  console.log(`Server Running: ${serverOk ? '✅' : '❌'}`);
  console.log(`WebSocket Connection: ${wsOk ? '✅' : '❌ (Expected with invalid token)'}`);
  console.log('\n💡 Next Steps:');
  console.log('1. Get a valid JWT token from a logged-in guest');
  console.log('2. Update the token in this script');
  console.log('3. Run the test again');
  console.log('4. Check browser console for WebSocket connection errors');
}

// Run debug if this file is executed directly
if (require.main === module) {
  runDebug().catch(console.error);
}

module.exports = {
  testWebSocketServer,
  testWebSocketConnection,
  testHttpEndpoints,
  runDebug
}; 