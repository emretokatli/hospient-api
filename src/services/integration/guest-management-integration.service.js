const axios = require('axios');
const BaseIntegrationService = require('./base-integration.service');
const { Communication, Guest } = require('../../models');

class GuestManagementIntegrationService extends BaseIntegrationService {
  constructor(integrationId) {
    super(integrationId);
  }

  /**
   * Execute HTTP request using axios
   */
  async executeRequest(requestData) {
    const { method, url, headers, data } = requestData;
    
    const response = await axios({
      method,
      url,
      headers,
      data,
      timeout: 30000
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  }

  /**
   * Post feedback to guest management system
   */
  async postFeedback(feedbackData) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.feedback || '/api/feedback';
      const transformedFeedback = this.transformFeedbackData(feedbackData);
      
      const response = await this.makeRequest('POST', endpoint, transformedFeedback);
      
      await this.logActivity('api_call', 'post_feedback', 'outbound', 'success', {
        request: transformedFeedback,
        response: response.data
      });

      return {
        success: true,
        externalFeedbackId: response.data.id,
        response: response.data
      };
    } catch (error) {
      await this.logError('post_feedback', error.message, null, feedbackData);
      throw error;
    }
  }

  /**
   * Transform feedback data to external system format
   */
  transformFeedbackData(feedbackData) {
    return {
      guest_id: feedbackData.guestId,
      hotel_id: feedbackData.hotelId,
      room_number: feedbackData.roomNumber,
      rating: feedbackData.rating,
      category: feedbackData.category,
      title: feedbackData.title,
      message: feedbackData.message,
      is_anonymous: feedbackData.isAnonymous || false,
      tags: feedbackData.tags || [],
      metadata: feedbackData.metadata || {},
      submitted_at: feedbackData.submittedAt || new Date().toISOString(),
      source: 'hospient_app'
    };
  }

  /**
   * Get feedback from guest management system
   */
  async getFeedback(filters = {}) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.feedback || '/api/feedback';
      const params = this.buildFeedbackFilters(filters);
      
      const response = await this.makeRequest('GET', endpoint, null, { params });
      
      return {
        success: true,
        feedback: response.data,
        total: response.data.length
      };
    } catch (error) {
      await this.logError('get_feedback', error.message);
      throw error;
    }
  }

  /**
   * Build feedback filters for API request
   */
  buildFeedbackFilters(filters) {
    const params = {};
    
    if (filters.guestId) params.guest_id = filters.guestId;
    if (filters.hotelId) params.hotel_id = filters.hotelId;
    if (filters.rating) params.rating = filters.rating;
    if (filters.category) params.category = filters.category;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset) params.offset = filters.offset;
    
    return params;
  }

  /**
   * Post chat message to guest management system
   */
  async postChatMessage(chatData) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.chat || '/api/chat';
      const transformedChat = this.transformChatData(chatData);
      
      const response = await this.makeRequest('POST', endpoint, transformedChat);
      
      return {
        success: true,
        externalChatId: response.data.id,
        response: response.data
      };
    } catch (error) {
      await this.logError('post_chat', error.message, null, chatData);
      throw error;
    }
  }

  /**
   * Transform chat data to external system format
   */
  transformChatData(chatData) {
    return {
      guest_id: chatData.guestId,
      hotel_id: chatData.hotelId,
      room_number: chatData.roomNumber,
      message: chatData.message,
      message_type: chatData.messageType || 'text',
      sender_type: chatData.senderType || 'guest',
      sender_id: chatData.senderId,
      sender_name: chatData.senderName,
      timestamp: chatData.timestamp || new Date().toISOString(),
      metadata: chatData.metadata || {},
      source: 'hospient_app'
    };
  }

  /**
   * Get chat messages from guest management system
   */
  async getChatMessages(filters = {}) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.chat || '/api/chat';
      const params = this.buildChatFilters(filters);
      
      const response = await this.makeRequest('GET', endpoint, null, { params });
      
      return {
        success: true,
        messages: response.data,
        total: response.data.length
      };
    } catch (error) {
      await this.logError('get_chat', error.message);
      throw error;
    }
  }

  /**
   * Build chat filters for API request
   */
  buildChatFilters(filters) {
    const params = {};
    
    if (filters.guestId) params.guest_id = filters.guestId;
    if (filters.hotelId) params.hotel_id = filters.hotelId;
    if (filters.roomNumber) params.room_number = filters.roomNumber;
    if (filters.senderType) params.sender_type = filters.senderType;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset) params.offset = filters.offset;
    
    return params;
  }

  /**
   * Post notification to guest management system
   */
  async postNotification(notificationData) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.notifications || '/api/notifications';
      const transformedNotification = this.transformNotificationData(notificationData);
      
      const response = await this.makeRequest('POST', endpoint, transformedNotification);
      
      return {
        success: true,
        externalNotificationId: response.data.id,
        response: response.data
      };
    } catch (error) {
      await this.logError('post_notification', error.message, null, notificationData);
      throw error;
    }
  }

  /**
   * Transform notification data to external system format
   */
  transformNotificationData(notificationData) {
    return {
      guest_id: notificationData.guestId,
      hotel_id: notificationData.hotelId,
      room_number: notificationData.roomNumber,
      title: notificationData.title,
      message: notificationData.message,
      category: notificationData.category,
      priority: notificationData.priority || 'normal',
      notification_type: notificationData.notificationType || 'push',
      scheduled_at: notificationData.scheduledAt,
      expires_at: notificationData.expiresAt,
      metadata: notificationData.metadata || {},
      source: 'hospient_app'
    };
  }

  /**
   * Get notifications from guest management system
   */
  async getNotifications(filters = {}) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.notifications || '/api/notifications';
      const params = this.buildNotificationFilters(filters);
      
      const response = await this.makeRequest('GET', endpoint, null, { params });
      
      return {
        success: true,
        notifications: response.data,
        total: response.data.length
      };
    } catch (error) {
      await this.logError('get_notifications', error.message);
      throw error;
    }
  }

  /**
   * Build notification filters for API request
   */
  buildNotificationFilters(filters) {
    const params = {};
    
    if (filters.guestId) params.guest_id = filters.guestId;
    if (filters.hotelId) params.hotel_id = filters.hotelId;
    if (filters.category) params.category = filters.category;
    if (filters.priority) params.priority = filters.priority;
    if (filters.notificationType) params.notification_type = filters.notificationType;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset) params.offset = filters.offset;
    
    return params;
  }

  /**
   * Sync guest data from external system
   */
  async syncGuestData(guestId = null) {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsSuccess = 0;
    let recordsFailed = 0;

    try {
      await this.initialize();
      
      const endpoint = guestId 
        ? `${this.config.endpoints.guests || '/api/guests'}/${guestId}`
        : this.config.endpoints.guests || '/api/guests';
      
      const response = await this.makeRequest('GET', endpoint);
      const guests = Array.isArray(response.data) ? response.data : [response.data];
      
      recordsProcessed = guests.length;

      for (const externalGuest of guests) {
        try {
          await this.processGuestData(externalGuest);
          recordsSuccess++;
        } catch (error) {
          console.error(`Failed to process guest ${externalGuest.id}:`, error);
          recordsFailed++;
        }
      }

      await this.updateSyncInfo('success', recordsProcessed, recordsSuccess, recordsFailed);
      
      const processingTime = Date.now() - startTime;
      await this.logActivity('sync', 'sync_guest_data', 'inbound', 'success', {
        processingTime,
        recordsProcessed,
        recordsSuccess,
        recordsFailed
      });

      return {
        success: true,
        processed: recordsProcessed,
        success: recordsSuccess,
        failed: recordsFailed
      };
    } catch (error) {
      await this.updateSyncInfo('failed');
      await this.logError('sync_guest_data', error.message);
      throw error;
    }
  }

  /**
   * Process guest data from external system
   */
  async processGuestData(externalGuest) {
    const guestData = this.transformGuestData(externalGuest);
    
    // Check if guest already exists
    let guest = await Guest.findOne({
      where: {
        external_id: externalGuest.id,
        external_source: this.integration.provider_name
      }
    });

    if (!guest) {
      // Create new guest
      guest = await Guest.create({
        ...guestData,
        external_id: externalGuest.id,
        external_source: this.integration.provider_name
      });
    } else {
      // Update existing guest
      await guest.update(guestData);
    }

    return guest;
  }

  /**
   * Transform guest data from external system
   */
  transformGuestData(externalGuest) {
    return {
      first_name: externalGuest.first_name,
      last_name: externalGuest.last_name,
      email: externalGuest.email,
      phone: externalGuest.phone,
      address: externalGuest.address,
      city: externalGuest.city,
      country: externalGuest.country,
      passport_number: externalGuest.passport_number,
      date_of_birth: externalGuest.date_of_birth,
      preferences: externalGuest.preferences || {},
      loyalty_points: externalGuest.loyalty_points || 0,
      status: externalGuest.status || 'active'
    };
  }

  /**
   * Update notification status in external system
   */
  async updateNotificationStatus(notificationId, status) {
    try {
      await this.initialize();
      
      const endpoint = `${this.config.endpoints.notifications || '/api/notifications'}/${notificationId}/status`;
      const response = await this.makeRequest('PUT', endpoint, { status });
      
      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      await this.logError('update_notification_status', error.message);
      throw error;
    }
  }

  /**
   * Get guest preferences from external system
   */
  async getGuestPreferences(guestId) {
    try {
      await this.initialize();
      
      const endpoint = `${this.config.endpoints.guests || '/api/guests'}/${guestId}/preferences`;
      const response = await this.makeRequest('GET', endpoint);
      
      return response.data;
    } catch (error) {
      await this.logError('get_guest_preferences', error.message);
      throw error;
    }
  }

  /**
   * Update guest preferences in external system
   */
  async updateGuestPreferences(guestId, preferences) {
    try {
      await this.initialize();
      
      const endpoint = `${this.config.endpoints.guests || '/api/guests'}/${guestId}/preferences`;
      const response = await this.makeRequest('PUT', endpoint, preferences);
      
      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      await this.logError('update_guest_preferences', error.message);
      throw error;
    }
  }

  /**
   * Test guest management integration
   */
  async testIntegration() {
    try {
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        return connectionTest;
      }

      // Test feedback endpoint
      const feedbackTest = await this.getFeedback({ limit: 1 });
      
      // Test chat endpoint
      const chatTest = await this.getChatMessages({ limit: 1 });
      
      // Test notifications endpoint
      const notificationTest = await this.getNotifications({ limit: 1 });
      
      return {
        success: true,
        connection: 'OK',
        feedback: 'OK',
        chat: 'OK',
        notifications: 'OK',
        feedbackCount: feedbackTest.total,
        chatCount: chatTest.total,
        notificationCount: notificationTest.total
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GuestManagementIntegrationService; 