const axios = require('axios');
const BaseIntegrationService = require('./base-integration.service');
const { Guest, Room, ConciergeRequest } = require('../../models');

class PMSIntegrationService extends BaseIntegrationService {
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
   * Sync reservations from PMS
   */
  async syncReservations(startDate = null, endDate = null) {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsSuccess = 0;
    let recordsFailed = 0;

    try {
      await this.initialize();
      
      const reservations = await this.getReservationsFromPMS(startDate, endDate);
      recordsProcessed = reservations.length;

      for (const reservation of reservations) {
        try {
          await this.processReservation(reservation);
          recordsSuccess++;
        } catch (error) {
          console.error(`Failed to process reservation ${reservation.id}:`, error);
          recordsFailed++;
        }
      }

      await this.updateSyncInfo('success', recordsProcessed, recordsSuccess, recordsFailed);
      
      const processingTime = Date.now() - startTime;
      await this.logActivity('sync', 'sync_reservations', 'inbound', 'success', {
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
      await this.logError('sync_reservations', error.message);
      throw error;
    }
  }

  /**
   * Get reservations from PMS
   */
  async getReservationsFromPMS(startDate, endDate) {
    const endpoint = this.config.endpoints.reservations || '/api/reservations';
    const params = {};
    
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await this.makeRequest('GET', endpoint, null, { params });
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from PMS');
    }

    return response.data;
  }

  /**
   * Process individual reservation from PMS
   */
  async processReservation(pmsReservation) {
    const reservationData = this.transformReservationData(pmsReservation);
    
    // Check if guest already exists
    let guest = await Guest.findOne({
      where: {
        external_id: pmsReservation.guest_id,
        external_source: this.integration.provider_name
      }
    });

    if (!guest) {
      // Create new guest
      guest = await Guest.create({
        ...reservationData.guest,
        external_id: pmsReservation.guest_id,
        external_source: this.integration.provider_name
      });
    } else {
      // Update existing guest
      await guest.update(reservationData.guest);
    }

    // Update room availability
    if (reservationData.room) {
      await this.updateRoomAvailability(reservationData.room);
    }

    return guest;
  }

  /**
   * Transform PMS reservation data
   */
  transformReservationData(pmsReservation) {
    return {
      guest: {
        first_name: pmsReservation.guest.first_name,
        last_name: pmsReservation.guest.last_name,
        email: pmsReservation.guest.email,
        phone: pmsReservation.guest.phone,
        address: pmsReservation.guest.address,
        city: pmsReservation.guest.city,
        country: pmsReservation.guest.country,
        passport_number: pmsReservation.guest.passport_number,
        date_of_birth: pmsReservation.guest.date_of_birth,
        special_requests: pmsReservation.guest.special_requests
      },
      room: {
        room_number: pmsReservation.room_number,
        room_type: pmsReservation.room_type,
        check_in_date: pmsReservation.check_in_date,
        check_out_date: pmsReservation.check_out_date,
        status: pmsReservation.status
      }
    };
  }

  /**
   * Update room availability
   */
  async updateRoomAvailability(roomData) {
    const room = await Room.findOne({
      where: {
        hotel_id: this.integration.hotel_id,
        room_number: roomData.room_number
      }
    });

    if (room) {
      await room.update({
        is_occupied: roomData.status === 'occupied',
        current_guest_id: roomData.status === 'occupied' ? roomData.guest_id : null,
        last_updated: new Date()
      });
    }
  }

  /**
   * Post check-in to PMS
   */
  async postCheckIn(checkInData) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.checkins || '/api/checkins';
      const transformedCheckIn = this.transformCheckInData(checkInData);
      
      const response = await this.makeRequest('POST', endpoint, transformedCheckIn);
      
      await this.logActivity('api_call', 'post_checkin', 'outbound', 'success', {
        request: transformedCheckIn,
        response: response.data
      });

      return {
        success: true,
        pmsCheckInId: response.data.id,
        response: response.data
      };
    } catch (error) {
      await this.logError('post_checkin', error.message, null, checkInData);
      throw error;
    }
  }

  /**
   * Transform check-in data to PMS format
   */
  transformCheckInData(checkInData) {
    return {
      reservation_id: checkInData.reservationId,
      guest_id: checkInData.guestId,
      room_number: checkInData.roomNumber,
      check_in_time: checkInData.checkInTime || new Date().toISOString(),
      check_in_by: checkInData.checkInBy,
      special_requests: checkInData.specialRequests,
      payment_method: checkInData.paymentMethod,
      deposit_amount: checkInData.depositAmount,
      notes: checkInData.notes
    };
  }

  /**
   * Post check-out to PMS
   */
  async postCheckOut(checkOutData) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.checkouts || '/api/checkouts';
      const transformedCheckOut = this.transformCheckOutData(checkOutData);
      
      const response = await this.makeRequest('POST', endpoint, transformedCheckOut);
      
      return {
        success: true,
        pmsCheckOutId: response.data.id,
        response: response.data
      };
    } catch (error) {
      await this.logError('post_checkout', error.message, null, checkOutData);
      throw error;
    }
  }

  /**
   * Transform check-out data to PMS format
   */
  transformCheckOutData(checkOutData) {
    return {
      reservation_id: checkOutData.reservationId,
      guest_id: checkOutData.guestId,
      room_number: checkOutData.roomNumber,
      check_out_time: checkOutData.checkOutTime || new Date().toISOString(),
      check_out_by: checkOutData.checkOutBy,
      final_bill_amount: checkOutData.finalBillAmount,
      payment_status: checkOutData.paymentStatus,
      feedback_rating: checkOutData.feedbackRating,
      feedback_comments: checkOutData.feedbackComments,
      notes: checkOutData.notes
    };
  }

  /**
   * Send request to PMS
   */
  async sendRequest(requestData) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.requests || '/api/requests';
      const transformedRequest = this.transformRequestData(requestData);
      
      const response = await this.makeRequest('POST', endpoint, transformedRequest);
      
      return {
        success: true,
        pmsRequestId: response.data.id,
        response: response.data
      };
    } catch (error) {
      await this.logError('send_request', error.message, null, requestData);
      throw error;
    }
  }

  /**
   * Transform request data to PMS format
   */
  transformRequestData(requestData) {
    return {
      guest_id: requestData.guestId,
      room_number: requestData.roomNumber,
      request_type: requestData.requestType,
      category: requestData.category,
      title: requestData.title,
      description: requestData.description,
      priority: requestData.priority || 'normal',
      requested_time: requestData.requestedTime || new Date().toISOString(),
      status: requestData.status || 'pending'
    };
  }

  /**
   * Get room status from PMS
   */
  async getRoomStatus(roomNumber = null) {
    try {
      await this.initialize();
      
      const endpoint = roomNumber 
        ? `${this.config.endpoints.rooms || '/api/rooms'}/${roomNumber}`
        : this.config.endpoints.rooms || '/api/rooms';
      
      const response = await this.makeRequest('GET', endpoint);
      
      return response.data;
    } catch (error) {
      await this.logError('get_room_status', error.message);
      throw error;
    }
  }

  /**
   * Get guest information from PMS
   */
  async getGuestInfo(guestId) {
    try {
      await this.initialize();
      
      const endpoint = `${this.config.endpoints.guests || '/api/guests'}/${guestId}`;
      const response = await this.makeRequest('GET', endpoint);
      
      return response.data;
    } catch (error) {
      await this.logError('get_guest_info', error.message);
      throw error;
    }
  }

  /**
   * Update guest information in PMS
   */
  async updateGuestInfo(guestId, guestData) {
    try {
      await this.initialize();
      
      const endpoint = `${this.config.endpoints.guests || '/api/guests'}/${guestId}`;
      const response = await this.makeRequest('PUT', endpoint, guestData);
      
      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      await this.logError('update_guest_info', error.message, null, { guestId, guestData });
      throw error;
    }
  }

  /**
   * Test PMS integration
   */
  async testIntegration() {
    try {
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        return connectionTest;
      }

      // Test reservation sync
      const reservationTest = await this.getReservationsFromPMS();
      
      // Test room status
      const roomTest = await this.getRoomStatus();
      
      return {
        success: true,
        connection: 'OK',
        reservationSync: 'OK',
        roomStatus: 'OK',
        reservationCount: reservationTest.length,
        roomCount: roomTest.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PMSIntegrationService; 