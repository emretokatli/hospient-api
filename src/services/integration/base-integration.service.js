const crypto = require('crypto');
const axios = require('axios');
const { Integration, IntegrationLog } = require('../../models');

class BaseIntegrationService {
  constructor(integrationId) {
    this.integrationId = integrationId;
    this.integration = null;
    this.config = null;
    this.credentials = null;
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!';
  }

  /**
   * Initialize the integration service
   */
  async initialize() {
    try {
      this.integration = await Integration.findByPk(this.integrationId, {
        include: ['Hotel']
      });

      if (!this.integration) {
        throw new Error(`Integration ${this.integrationId} not found`);
      }

      if (this.integration.status !== 'active') {
        throw new Error(`Integration ${this.integrationId} is not active`);
      }

      this.config = this.integration.config;
      this.credentials = this.decryptCredentials(this.integration.credentials);
      
      return true;
    } catch (error) {
      await this.logOperation('error', 'initialize', 'outbound', 'failed', null, null, error.message, error.code || 'CONNECTION_ERROR', null, null, null, null);
      throw error;
    }
  }

  /**
   * Encrypt sensitive credentials
   */
  encryptCredentials(credentials) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt sensitive credentials
   */
  decryptCredentials(encryptedCredentials) {
    if (!encryptedCredentials || !encryptedCredentials.encrypted) {
      return null;
    }

    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = Buffer.from(encryptedCredentials.iv, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedCredentials.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Log integration activity
   */
  async logOperation(operationType, operationName, direction, status, requestData = null, responseData = null, errorMessage = null, errorCode = null, processingTime = null, recordsProcessed = null, recordsSuccess = null, recordsFailed = null, metadata = null) {
    try {
      await IntegrationLog.create({
        integration_id: this.integrationId,
        operation_type: operationType,
        operation_name: operationName,
        direction: direction,
        status: status,
        request_data: requestData ? JSON.stringify(requestData) : null,
        response_data: responseData ? JSON.stringify(responseData) : null,
        error_message: errorMessage,
        error_code: errorCode,
        processing_time: processingTime,
        records_processed: recordsProcessed,
        records_success: recordsSuccess,
        records_failed: recordsFailed,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
    } catch (error) {
      console.error('Error logging operation:', error);
    }
  }

  /**
   * Make HTTP request to 3rd party API
   */
  async makeRequest(method, endpoint, data = null, headers = {}) {
    const startTime = Date.now();
    
    try {
      const url = this.buildUrl(endpoint);
      const requestHeaders = this.buildHeaders(headers);
      
      const requestData = {
        method,
        url,
        headers: requestHeaders,
        ...(data && { data })
      };

      // Log the request
      await this.logOperation('api_call', `${method}_${endpoint}`, 'outbound', 'pending', requestData, null, null, null, null, null, null, null, null);

      // Make the actual request (to be implemented by specific integrations)
      const response = await this.executeRequest(requestData);
      
      const processingTime = Date.now() - startTime;

      // Log successful response
      await this.logOperation('api_call', `${method}_${endpoint}`, 'outbound', 'success', requestData, response, null, null, processingTime, null, null, null, null);

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      await this.logOperation('error', `${method}_${endpoint}`, 'outbound', 'failed', null, null, error.message, error.code || 'CONNECTION_ERROR', processingTime, null, null, null, null);

      throw error;
    }
  }

  /**
   * Build full URL for API endpoint
   */
  buildUrl(endpoint) {
    const baseUrl = this.config.baseUrl;
    return `${baseUrl}${endpoint}`;
  }

  /**
   * Build request headers
   */
  buildHeaders(customHeaders = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Hospient-Integration/1.0'
    };

    // Add authentication headers based on integration type
    if (this.credentials.apiKey) {
      defaultHeaders['X-API-Key'] = this.credentials.apiKey;
    }

    if (this.credentials.bearerToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.credentials.bearerToken}`;
    }

    if (this.credentials.username && this.credentials.password) {
      const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
      defaultHeaders['Authorization'] = `Basic ${auth}`;
    }

    return { ...defaultHeaders, ...customHeaders };
  }

  /**
   * Execute HTTP request (to be overridden by specific integrations)
   */
  async executeRequest(requestData) {
    throw new Error('executeRequest must be implemented by specific integration service');
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload, signature, secret) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Update integration status
   */
  async updateStatus(status, errorMessage = null) {
    try {
      const updateData = { status };
      
      if (errorMessage) {
        updateData.last_error = errorMessage;
        updateData.error_count = this.integration.error_count + 1;
      } else {
        updateData.error_count = 0;
        updateData.last_error = null;
      }

      await this.integration.update(updateData);
    } catch (error) {
      console.error('Failed to update integration status:', error);
    }
  }

  /**
   * Update last sync information
   */
  async updateSyncInfo(status, recordsProcessed = null, recordsSuccess = null, recordsFailed = null) {
    try {
      const updateData = {
        last_sync: new Date(),
        sync_status: status
      };

      await this.integration.update(updateData);
    } catch (error) {
      console.error('Failed to update sync info:', error);
    }
  }

  /**
   * Test integration connectivity
   */
  async testConnection() {
    const integration = await this.loadIntegration();
    const startTime = Date.now();
    
    try {
      let testResult;
      
      // Provider-specific test connections
      switch (integration.provider) {
        case 'simphony_cloud':
          testResult = await this.testSimphonyCloudConnection();
          break;
        case 'simpra':
          testResult = await this.testSimpraConnection();
          break;
        case 'opera_cloud':
          testResult = await this.testOperaCloudConnection();
          break;
        case 'simpra_pms':
          testResult = await this.testSimpraPMSConnection();
          break;
        default:
          testResult = await this.testGenericConnection();
      }

      const processingTime = Date.now() - startTime;
      
      await this.logOperation(
        'test',
        'connection_test',
        'outbound',
        'success',
        testResult.request,
        testResult.response,
        null,
        null,
        processingTime
      );

      return {
        success: true,
        connection: 'successful',
        details: testResult.response,
        processing_time: processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      await this.logOperation(
        'test',
        'connection_test',
        'outbound',
        'failed',
        null,
        null,
        error.message,
        error.code || 'CONNECTION_ERROR',
        processingTime
      );

      return {
        success: false,
        connection: 'failed',
        details: {
          error: error.message,
          code: error.code || 'CONNECTION_ERROR'
        },
        processing_time: processingTime
      };
    }
  }

  async testSimphonyCloudConnection() {
    const integration = await this.loadIntegration();
    const credentials = this.decryptCredentials(integration.credentials);
    
    if (!credentials) {
      throw new Error('Credentials not found or invalid');
    }

    const config = {
      method: 'head',
      maxBodyLength: Infinity,
      url: `${credentials.apiUrl}/api/v1/checks/connectionStatus`,
      headers: {
        'Simphony-OrgShortName': credentials.companyCode || 'PRO',
        'Simphony-LocRef': credentials.locationRef || 'location 1',
        'Simphony-RvcRef': '1',
        'Accept': 'application/json',
        'Authorization': credentials.accessToken || '••••••'
      }
    };

    const response = await axios.request(config);
    
    return {
      request: {
        method: config.method,
        url: config.url,
        headers: {
          ...config.headers,
          'Authorization': '••••••' // Hide token in logs
        }
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      }
    };
  }

  async testSimpraConnection() {
    const integration = await this.loadIntegration();
    const credentials = this.decryptCredentials(integration.credentials);
    
    if (!credentials) {
      throw new Error('Credentials not found or invalid');
    }

    const config = {
      method: 'get',
      url: `${credentials.apiUrl}/health`,
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Accept': 'application/json'
      }
    };

    const response = await axios.request(config);
    
    return {
      request: {
        method: config.method,
        url: config.url,
        headers: {
          ...config.headers,
          'Authorization': 'Bearer ••••••' // Hide token in logs
        }
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      }
    };
  }

  async testOperaCloudConnection() {
    const integration = await this.loadIntegration();
    const credentials = this.decryptCredentials(integration.credentials);
    
    if (!credentials) {
      throw new Error('Credentials not found or invalid');
    }

    const config = {
      method: 'get',
      url: `${credentials.apiUrl}/status`,
      headers: {
        'X-App-Key': credentials.appKey,
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Accept': 'application/json'
      }
    };

    const response = await axios.request(config);
    
    return {
      request: {
        method: config.method,
        url: config.url,
        headers: {
          ...config.headers,
          'Authorization': 'Bearer ••••••' // Hide token in logs
        }
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      }
    };
  }

  async testSimpraPMSConnection() {
    const integration = await this.loadIntegration();
    const credentials = this.decryptCredentials(integration.credentials);
    
    if (!credentials) {
      throw new Error('Credentials not found or invalid');
    }

    const config = {
      method: 'get',
      url: `${credentials.apiUrl}/health`,
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Accept': 'application/json'
      }
    };

    const response = await axios.request(config);
    
    return {
      request: {
        method: config.method,
        url: config.url,
        headers: {
          ...config.headers,
          'Authorization': 'Bearer ••••••' // Hide token in logs
        }
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      }
    };
  }

  async testGenericConnection() {
    const integration = await this.loadIntegration();
    const credentials = this.decryptCredentials(integration.credentials);
    
    if (!credentials) {
      throw new Error('Credentials not found or invalid');
    }

    const testUrl = integration.config?.testEndpoint || `${integration.config?.baseUrl}/health`;
    
    const config = {
      method: 'get',
      url: testUrl,
      headers: {
        'Accept': 'application/json'
      }
    };

    // Add authorization if available
    if (credentials.accessToken) {
      config.headers['Authorization'] = `Bearer ${credentials.accessToken}`;
    } else if (credentials.apiKey) {
      config.headers['X-API-Key'] = credentials.apiKey;
    }

    const response = await axios.request(config);
    
    return {
      request: {
        method: config.method,
        url: config.url,
        headers: config.headers
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      }
    };
  }

  async loadIntegration() {
    if (!this.integration) {
      this.integration = await Integration.findByPk(this.integrationId);
      if (!this.integration) {
        throw new Error('Integration not found');
      }
    }
    return this.integration;
  }
}

module.exports = BaseIntegrationService; 