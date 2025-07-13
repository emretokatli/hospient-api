const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class NotificationWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/notifications'
    });
    
    // Store active connections by guest ID
    this.connections = new Map(); // guestId -> Set of WebSocket connections
    
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('WebSocket notification server started');
  }

  async handleConnection(ws, req) {
    try {
      // Parse query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const guestId = url.searchParams.get('guestId');

      console.log('🔍 WebSocket connection attempt:');
      console.log('  - Guest ID:', guestId);
      console.log('  - Token length:', token ? token.length : 0);
      console.log('  - Token preview:', token ? token.substring(0, 20) + '...' : 'null');

      if (!token || !guestId) {
        console.log('❌ Missing token or guestId');
        ws.close(1008, 'Missing token or guestId');
        return;
      }

      // Validate token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔑 Token decoded successfully:', {
          id: decoded.id,
          expectedGuestId: parseInt(guestId),
          match: decoded.id === parseInt(guestId)
        });
        
        if (!decoded || decoded.id !== parseInt(guestId)) {
          console.log('❌ Token validation failed - guestId mismatch');
          ws.close(1008, 'Invalid token');
          return;
        }
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', jwtError.message);
        ws.close(1008, 'Invalid token');
        return;
      }

      // Store connection
      this.addConnection(parseInt(guestId), ws);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        data: { 
          status: 'connected',
          guestId: parseInt(guestId),
          timestamp: new Date().toISOString()
        }
      }));

      console.log(`✅ Guest ${guestId} connected to WebSocket`);

      // Handle disconnection
      ws.on('close', (code, reason) => {
        this.removeConnection(parseInt(guestId), ws);
        console.log(`🔌 Guest ${guestId} disconnected: ${code} - ${reason}`);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for guest ${guestId}:`, error);
        this.removeConnection(parseInt(guestId), ws);
      });

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  addConnection(guestId, ws) {
    if (!this.connections.has(guestId)) {
      this.connections.set(guestId, new Set());
    }
    this.connections.get(guestId).add(ws);
  }

  removeConnection(guestId, ws) {
    const guestConnections = this.connections.get(guestId);
    if (guestConnections) {
      guestConnections.delete(ws);
      if (guestConnections.size === 0) {
        this.connections.delete(guestId);
      }
    }
  }

  // Send notification to specific guest
  sendToGuest(guestId, notification) {
    const guestConnections = this.connections.get(guestId);
    if (guestConnections) {
      const message = JSON.stringify({
        type: 'notification',
        data: notification
      });

      guestConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
          } catch (error) {
            console.error(`Error sending notification to guest ${guestId}:`, error);
            this.removeConnection(guestId, ws);
          }
        } else {
          // Remove closed connections
          this.removeConnection(guestId, ws);
        }
      });

      console.log(`Notification sent to guest ${guestId}`);
    }
  }

  // Send notification to all guests
  sendToAllGuests(notification) {
    this.connections.forEach((connections, guestId) => {
      this.sendToGuest(guestId, notification);
    });
  }

  // Send notification to multiple specific guests
  sendToGuests(guestIds, notification) {
    guestIds.forEach(guestId => {
      this.sendToGuest(guestId, notification);
    });
  }

  // Get connection statistics
  getStats() {
    const stats = {
      totalConnections: 0,
      uniqueGuests: this.connections.size,
      guests: []
    };

    this.connections.forEach((connections, guestId) => {
      stats.totalConnections += connections.size;
      stats.guests.push({
        guestId,
        connections: connections.size
      });
    });

    return stats;
  }

  // Broadcast system message to all connected guests
  broadcastSystemMessage(message) {
    const systemMessage = JSON.stringify({
      type: 'system',
      data: {
        message,
        timestamp: new Date().toISOString()
      }
    });

    this.connections.forEach((connections, guestId) => {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(systemMessage);
          } catch (error) {
            console.error(`Error sending system message to guest ${guestId}:`, error);
            this.removeConnection(guestId, ws);
          }
        }
      });
    });
  }
}

module.exports = NotificationWebSocketServer; 