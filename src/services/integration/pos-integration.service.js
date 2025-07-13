const axios = require('axios');
const BaseIntegrationService = require('./base-integration.service');
const { Menu, Restaurant } = require('../../models');

class POSIntegrationService extends BaseIntegrationService {
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
      timeout: 30000 // 30 second timeout
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  }

  /**
   * Sync menus from POS system
   */
  async syncMenus() {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsSuccess = 0;
    let recordsFailed = 0;

    try {
      await this.initialize();
      
      // Get menus from POS system
      const posMenus = await this.getMenusFromPOS();
      recordsProcessed = posMenus.length;

      // Process each menu
      for (const posMenu of posMenus) {
        try {
          await this.processMenu(posMenu);
          recordsSuccess++;
        } catch (error) {
          console.error(`Failed to process menu ${posMenu.id}:`, error);
          recordsFailed++;
        }
      }

      await this.updateSyncInfo('success', recordsProcessed, recordsSuccess, recordsFailed);
      
      const processingTime = Date.now() - startTime;
      await this.logActivity('sync', 'sync_menus', 'inbound', 'success', {
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
      await this.logError('sync_menus', error.message);
      throw error;
    }
  }

  /**
   * Get menus from POS system
   */
  async getMenusFromPOS() {
    const endpoint = this.config.endpoints.menus || '/api/menus';
    const response = await this.makeRequest('GET', endpoint);
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from POS system');
    }

    return response.data;
  }

  /**
   * Process individual menu from POS
   */
  async processMenu(posMenu) {
    // Transform POS menu to our format
    const menuData = this.transformMenuData(posMenu);
    
    // Check if menu already exists
    const existingMenu = await Menu.findOne({
      where: {
        hotel_id: this.integration.hotel_id,
        external_id: posMenu.id,
        external_source: this.integration.provider_name
      }
    });

    if (existingMenu) {
      // Update existing menu
      await existingMenu.update(menuData);
    } else {
      // Create new menu
      await Menu.create({
        ...menuData,
        hotel_id: this.integration.hotel_id,
        external_id: posMenu.id,
        external_source: this.integration.provider_name
      });
    }
  }

  /**
   * Transform POS menu data to our format
   */
  transformMenuData(posMenu) {
    return {
      name: posMenu.name || posMenu.title,
      description: posMenu.description,
      category: posMenu.category || 'main',
      price: posMenu.price || 0,
      currency: posMenu.currency || 'USD',
      is_available: posMenu.is_available !== false,
      image_url: posMenu.image_url || posMenu.image,
      allergens: posMenu.allergens || [],
      nutritional_info: posMenu.nutritional_info || {},
      preparation_time: posMenu.preparation_time || null,
      tags: posMenu.tags || []
    };
  }

  /**
   * Post guest check to POS system
   */
  async postGuestCheck(checkData) {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.checks || '/api/checks';
      const transformedCheck = this.transformCheckData(checkData);
      
      const response = await this.makeRequest('POST', endpoint, transformedCheck);
      
      await this.logActivity('api_call', 'post_guest_check', 'outbound', 'success', {
        request: transformedCheck,
        response: response.data
      });

      return {
        success: true,
        posCheckId: response.data.id,
        response: response.data
      };
    } catch (error) {
      await this.logError('post_guest_check', error.message, null, checkData);
      throw error;
    }
  }

  /**
   * Transform check data to POS format
   */
  transformCheckData(checkData) {
    return {
      guest_id: checkData.guestId,
      room_number: checkData.roomNumber,
      items: checkData.items.map(item => ({
        menu_id: item.menuId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        special_instructions: item.specialInstructions || ''
      })),
      subtotal: checkData.subtotal,
      tax: checkData.tax,
      total: checkData.total,
      payment_method: checkData.paymentMethod,
      payment_status: checkData.paymentStatus,
      timestamp: checkData.timestamp || new Date().toISOString()
    };
  }

  /**
   * Get check status from POS system
   */
  async getCheckStatus(checkId) {
    try {
      await this.initialize();
      
      const endpoint = `${this.config.endpoints.checks || '/api/checks'}/${checkId}`;
      const response = await this.makeRequest('GET', endpoint);
      
      return {
        success: true,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      await this.logError('get_check_status', error.message);
      throw error;
    }
  }

  /**
   * Void/cancel check in POS system
   */
  async voidCheck(checkId, reason = 'Guest request') {
    try {
      await this.initialize();
      
      const endpoint = `${this.config.endpoints.checks || '/api/checks'}/${checkId}/void`;
      const response = await this.makeRequest('POST', endpoint, { reason });
      
      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      await this.logError('void_check', error.message);
      throw error;
    }
  }

  /**
   * Get menu categories from POS
   */
  async getMenuCategories() {
    try {
      await this.initialize();
      
      const endpoint = this.config.endpoints.categories || '/api/menu-categories';
      const response = await this.makeRequest('GET', endpoint);
      
      return response.data;
    } catch (error) {
      await this.logError('get_menu_categories', error.message);
      throw error;
    }
  }

  /**
   * Test POS integration
   */
  async testIntegration() {
    try {
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        return connectionTest;
      }

      // Test menu sync
      const menuTest = await this.getMenusFromPOS();
      
      return {
        success: true,
        connection: 'OK',
        menuSync: 'OK',
        menuCount: menuTest.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = POSIntegrationService; 