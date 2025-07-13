const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { 
  Hotel, 
  Restaurant, 
  Menu, 
  ConciergeRequest, 
  ConciergeCategory,
  Communication,
  Offer
} = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * /api/dashboard/metrics:
 *   get:
 *     summary: Get comprehensive dashboard metrics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalHotels:
 *                   type: integer
 *                 totalRestaurants:
 *                   type: integer
 *                 totalMenuItems:
 *                   type: integer
 *                 totalConciergeRequests:
 *                   type: integer
 *                 pendingConciergeRequests:
 *                   type: integer
 *                 inProgressConciergeRequests:
 *                   type: integer
 *                 completedConciergeRequests:
 *                   type: integer
 *                 cancelledConciergeRequests:
 *                   type: integer
 *                 totalOffers:
 *                   type: integer
 *                 activeOffers:
 *                   type: integer
 *                 expiredOffers:
 *                   type: integer
 *                 totalCommunications:
 *                   type: integer
 *                 totalFeedbacks:
 *                   type: integer
 *                 totalChats:
 *                   type: integer
 *                 totalNotifications:
 *                   type: integer
 *                 totalPushNotifications:
 *                   type: integer
 *                 unreadCommunications:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/metrics', async (req, res) => {
  try {
    console.log('Fetching dashboard metrics...');
    
    // Hotel metrics
    const totalHotels = await Hotel.count();
    console.log('Total hotels:', totalHotels);
    
    const totalRestaurants = await Restaurant.count();
    console.log('Total restaurants:', totalRestaurants);
    
    const totalMenuItems = await Menu.count();
    console.log('Total menu items:', totalMenuItems);

    // Concierge metrics
    const conciergeRequests = await ConciergeRequest.findAll({
      attributes: ['status'],
      raw: true
    });
    console.log('Concierge requests found:', conciergeRequests.length);

    const conciergeStatusCounts = conciergeRequests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {});

    // Offer metrics
    const now = new Date();
    const offers = await Offer.findAll({
      attributes: ['valid_until', 'is_active'],
      raw: true
    });
    console.log('Offers found:', offers.length);

    const offerMetrics = offers.reduce((acc, offer) => {
      acc.total++;
      if (offer.is_active && new Date(offer.valid_until) > now) {
        acc.active++;
      } else {
        acc.expired++;
      }
      return acc;
    }, { total: 0, active: 0, expired: 0 });

    // Communication metrics
    const communications = await Communication.findAll({
      attributes: ['type', 'status', 'read_at', 'priority'],
      raw: true
    });
    console.log('Communications found:', communications.length);

    const communicationMetrics = communications.reduce((acc, comm) => {
      acc.total++;
      acc.byType[comm.type] = (acc.byType[comm.type] || 0) + 1;
      acc.byStatus[comm.status] = (acc.byStatus[comm.status] || 0) + 1;
      acc.byPriority[comm.priority] = (acc.byPriority[comm.priority] || 0) + 1;
      if (!comm.read_at) {
        acc.unread++;
      }
      return acc;
    }, {
      total: 0,
      byType: {},
      byStatus: {},
      byPriority: {},
      unread: 0
    });

    // Recent activity
    const recentConciergeRequests = await ConciergeRequest.findAll({
      attributes: ['id', 'title', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true
    });

    const recentCommunications = await Communication.findAll({
      attributes: ['id', 'title', 'type', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true
    });

    const recentOffers = await Offer.findAll({
      attributes: ['id', 'title', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true
    });

    const metrics = {
      // Hotel metrics
      totalHotels,
      totalRestaurants,
      totalMenuItems,
      
      // Concierge metrics
      totalConciergeRequests: conciergeRequests.length,
      pendingConciergeRequests: conciergeStatusCounts.requested || 0,
      inProgressConciergeRequests: conciergeStatusCounts.in_progress || 0,
      completedConciergeRequests: conciergeStatusCounts.done || 0,
      cancelledConciergeRequests: conciergeStatusCounts.cancelled || 0,
      
      // Offer metrics
      totalOffers: offerMetrics.total,
      activeOffers: offerMetrics.active,
      expiredOffers: offerMetrics.expired,
      
      // Communication metrics
      totalCommunications: communicationMetrics.total,
      totalFeedbacks: communicationMetrics.byType.feedback || 0,
      totalChats: communicationMetrics.byType.chat || 0,
      totalNotifications: communicationMetrics.byType.notification || 0,
      totalPushNotifications: communicationMetrics.byType.push_notification || 0,
      unreadCommunications: communicationMetrics.unread,
      
      // Status breakdowns
      communicationStatusBreakdown: {
        draft: communicationMetrics.byStatus.draft || 0,
        sent: communicationMetrics.byStatus.sent || 0,
        delivered: communicationMetrics.byStatus.delivered || 0,
        read: communicationMetrics.byStatus.read || 0,
        failed: communicationMetrics.byStatus.failed || 0,
      },
      
      communicationPriorityBreakdown: {
        low: communicationMetrics.byPriority.low || 0,
        normal: communicationMetrics.byPriority.normal || 0,
        high: communicationMetrics.byPriority.high || 0,
        urgent: communicationMetrics.byPriority.urgent || 0,
      },
      
      // Recent activity
      recentConciergeRequests,
      recentCommunications,
      recentOffers,
    };

    console.log('Dashboard metrics calculated successfully:', metrics);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching dashboard metrics', error: error.message });
  }
});

/**
 * @swagger
 * /api/dashboard/hotel/{hotelId}/metrics:
 *   get:
 *     summary: Get dashboard metrics for a specific hotel
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the hotel
 *     responses:
 *       200:
 *         description: Hotel dashboard metrics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/hotel/:hotelId/metrics', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    
    // Hotel-specific metrics
    const totalRestaurants = await Restaurant.count({ where: { hotel_id: hotelId } });
    const totalMenuItems = await Menu.count({
      where: { hotel_id: hotelId }
    });

    // Concierge metrics for this hotel
    const conciergeRequests = await ConciergeRequest.findAll({
      where: { hotel_id: hotelId },
      attributes: ['status'],
      raw: true
    });

    const conciergeStatusCounts = conciergeRequests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {});

    // Offer metrics for this hotel
    const now = new Date();
    const offers = await Offer.findAll({
      where: { hotel_id: hotelId },
      attributes: ['valid_until', 'is_active'],
      raw: true
    });

    const offerMetrics = offers.reduce((acc, offer) => {
      acc.total++;
      if (offer.is_active && new Date(offer.valid_until) > now) {
        acc.active++;
      } else {
        acc.expired++;
      }
      return acc;
    }, { total: 0, active: 0, expired: 0 });

    // Communication metrics for this hotel
    const communications = await Communication.findAll({
      where: { hotel_id: hotelId },
      attributes: ['type', 'status', 'read_at', 'priority'],
      raw: true
    });

    const communicationMetrics = communications.reduce((acc, comm) => {
      acc.total++;
      acc.byType[comm.type] = (acc.byType[comm.type] || 0) + 1;
      acc.byStatus[comm.status] = (acc.byStatus[comm.status] || 0) + 1;
      acc.byPriority[comm.priority] = (acc.byPriority[comm.priority] || 0) + 1;
      if (!comm.read_at) {
        acc.unread++;
      }
      return acc;
    }, {
      total: 0,
      byType: {},
      byStatus: {},
      byPriority: {},
      unread: 0
    });

    // Recent activity for this hotel
    const recentConciergeRequests = await ConciergeRequest.findAll({
      where: { hotel_id: hotelId },
      attributes: ['id', 'title', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true
    });

    const recentCommunications = await Communication.findAll({
      where: { hotel_id: hotelId },
      attributes: ['id', 'title', 'type', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true
    });

    const recentOffers = await Offer.findAll({
      where: { hotel_id: hotelId },
      attributes: ['id', 'title', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true
    });

    const metrics = {
      // Hotel metrics (single hotel)
      totalHotels: 1,
      totalRestaurants,
      totalMenuItems,
      
      // Concierge metrics
      totalConciergeRequests: conciergeRequests.length,
      pendingConciergeRequests: conciergeStatusCounts.requested || 0,
      inProgressConciergeRequests: conciergeStatusCounts.in_progress || 0,
      completedConciergeRequests: conciergeStatusCounts.done || 0,
      cancelledConciergeRequests: conciergeStatusCounts.cancelled || 0,
      
      // Offer metrics
      totalOffers: offerMetrics.total,
      activeOffers: offerMetrics.active,
      expiredOffers: offerMetrics.expired,
      
      // Communication metrics
      totalCommunications: communicationMetrics.total,
      totalFeedbacks: communicationMetrics.byType.feedback || 0,
      totalChats: communicationMetrics.byType.chat || 0,
      totalNotifications: communicationMetrics.byType.notification || 0,
      totalPushNotifications: communicationMetrics.byType.push_notification || 0,
      unreadCommunications: communicationMetrics.unread,
      
      // Status breakdowns
      communicationStatusBreakdown: {
        draft: communicationMetrics.byStatus.draft || 0,
        sent: communicationMetrics.byStatus.sent || 0,
        delivered: communicationMetrics.byStatus.delivered || 0,
        read: communicationMetrics.byStatus.read || 0,
        failed: communicationMetrics.byStatus.failed || 0,
      },
      
      communicationPriorityBreakdown: {
        low: communicationMetrics.byPriority.low || 0,
        normal: communicationMetrics.byPriority.normal || 0,
        high: communicationMetrics.byPriority.high || 0,
        urgent: communicationMetrics.byPriority.urgent || 0,
      },
      
      // Recent activity
      recentConciergeRequests,
      recentCommunications,
      recentOffers,
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching hotel dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching hotel dashboard metrics' });
  }
});

/**
 * @swagger
 * /api/dashboard/test:
 *   get:
 *     summary: Test dashboard connectivity
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Database connectivity test
 *       500:
 *         description: Server error
 */
router.get('/test', async (req, res) => {
  try {
    console.log('Testing dashboard connectivity...');
    
    // Test basic model availability
    const models = {
      Hotel: !!Hotel,
      Restaurant: !!Restaurant,
      Menu: !!Menu,
      ConciergeRequest: !!ConciergeRequest,
      Communication: !!Communication,
      Offer: !!Offer
    };
    
    console.log('Models available:', models);
    
    // Test basic counts
    const counts = {
      hotels: await Hotel.count(),
      restaurants: await Restaurant.count(),
      menus: await Menu.count(),
      conciergeRequests: await ConciergeRequest.count(),
      communications: await Communication.count(),
      offers: await Offer.count()
    };
    
    console.log('Basic counts:', counts);
    
    res.json({
      status: 'success',
      models,
      counts,
      message: 'Dashboard connectivity test completed'
    });
  } catch (error) {
    console.error('Dashboard connectivity test failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Dashboard connectivity test failed', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/dashboard/organization/metrics:
 *   get:
 *     summary: Get dashboard metrics for the authenticated user's organization
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization dashboard metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/organization/metrics', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching organization dashboard metrics...');
    
    // Get the user's organization
    const organization = await req.member.getOrganization();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    console.log('Organization found:', organization.id);
    
    // Get organization's hotels
    const organizationHotels = await Hotel.findAll({
      where: { organization_id: organization.id },
      attributes: ['id'],
      raw: true
    });
    
    const hotelIds = organizationHotels.map(hotel => hotel.id);
    console.log('Organization hotel IDs:', hotelIds);
    
    if (hotelIds.length === 0) {
      // Return empty metrics if no hotels
      const emptyMetrics = {
        totalHotels: 0,
        totalRestaurants: 0,
        totalMenuItems: 0,
        totalConciergeRequests: 0,
        pendingConciergeRequests: 0,
        inProgressConciergeRequests: 0,
        completedConciergeRequests: 0,
        cancelledConciergeRequests: 0,
        totalOffers: 0,
        activeOffers: 0,
        expiredOffers: 0,
        totalCommunications: 0,
        totalFeedbacks: 0,
        totalChats: 0,
        totalNotifications: 0,
        totalPushNotifications: 0,
        unreadCommunications: 0,
        communicationStatusBreakdown: {
          draft: 0,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
        },
        communicationPriorityBreakdown: {
          low: 0,
          normal: 0,
          high: 0,
          urgent: 0,
        },
        recentConciergeRequests: [],
        recentCommunications: [],
        recentOffers: [],
      };
      
      return res.json(emptyMetrics);
    }
    
    // Hotel metrics for organization
    const totalHotels = hotelIds.length;
    console.log('Total hotels in organization:', totalHotels);
    
    const totalRestaurants = await Restaurant.count({
      where: { hotel_id: { [Op.in]: hotelIds } }
    });
    console.log('Total restaurants in organization:', totalRestaurants);
    
    const totalMenuItems = await Menu.count({
      where: { hotel_id: { [Op.in]: hotelIds } }
    });
    console.log('Total menu items in organization:', totalMenuItems);

    // Concierge metrics for organization
    const conciergeRequests = await ConciergeRequest.findAll({
      where: { hotel_id: { [Op.in]: hotelIds } },
      attributes: ['status'],
      raw: true
    });
    console.log('Concierge requests found for organization:', conciergeRequests.length);

    const conciergeStatusCounts = conciergeRequests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {});

    // Offer metrics for organization
    const now = new Date();
    const offers = await Offer.findAll({
      where: { hotel_id: { [Op.in]: hotelIds } },
      attributes: ['valid_until', 'is_active'],
      raw: true
    });
    console.log('Offers found for organization:', offers.length);

    const offerMetrics = offers.reduce((acc, offer) => {
      acc.total++;
      if (offer.is_active && new Date(offer.valid_until) > now) {
        acc.active++;
      } else {
        acc.expired++;
      }
      return acc;
    }, { total: 0, active: 0, expired: 0 });

    // Communication metrics for organization
    const communications = await Communication.findAll({
      where: { hotel_id: { [Op.in]: hotelIds } },
      attributes: ['type', 'status', 'read_at', 'priority'],
      raw: true
    });
    console.log('Communications found for organization:', communications.length);

    const communicationMetrics = communications.reduce((acc, comm) => {
      acc.total++;
      acc.byType[comm.type] = (acc.byType[comm.type] || 0) + 1;
      acc.byStatus[comm.status] = (acc.byStatus[comm.status] || 0) + 1;
      acc.byPriority[comm.priority] = (acc.byPriority[comm.priority] || 0) + 1;
      if (!comm.read_at) {
        acc.unread++;
      }
      return acc;
    }, {
      total: 0,
      byType: {},
      byStatus: {},
      byPriority: {},
      unread: 0
    });

    // Recent activity for organization
    const recentConciergeRequests = await ConciergeRequest.findAll({
      where: { hotel_id: { [Op.in]: hotelIds } },
      attributes: ['id', 'title', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true
    });

    const recentCommunications = await Communication.findAll({
      where: { hotel_id: { [Op.in]: hotelIds } },
      attributes: ['id', 'title', 'type', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true
    });

    const recentOffers = await Offer.findAll({
      where: { hotel_id: { [Op.in]: hotelIds } },
      attributes: ['id', 'title', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true
    });

    const metrics = {
      // Hotel metrics
      totalHotels,
      totalRestaurants,
      totalMenuItems,
      
      // Concierge metrics
      totalConciergeRequests: conciergeRequests.length,
      pendingConciergeRequests: conciergeStatusCounts.requested || 0,
      inProgressConciergeRequests: conciergeStatusCounts.in_progress || 0,
      completedConciergeRequests: conciergeStatusCounts.done || 0,
      cancelledConciergeRequests: conciergeStatusCounts.cancelled || 0,
      
      // Offer metrics
      totalOffers: offerMetrics.total,
      activeOffers: offerMetrics.active,
      expiredOffers: offerMetrics.expired,
      
      // Communication metrics
      totalCommunications: communicationMetrics.total,
      totalFeedbacks: communicationMetrics.byType.feedback || 0,
      totalChats: communicationMetrics.byType.chat || 0,
      totalNotifications: communicationMetrics.byType.notification || 0,
      totalPushNotifications: communicationMetrics.byType.push_notification || 0,
      unreadCommunications: communicationMetrics.unread,
      
      // Status breakdowns
      communicationStatusBreakdown: {
        draft: communicationMetrics.byStatus.draft || 0,
        sent: communicationMetrics.byStatus.sent || 0,
        delivered: communicationMetrics.byStatus.delivered || 0,
        read: communicationMetrics.byStatus.read || 0,
        failed: communicationMetrics.byStatus.failed || 0,
      },
      
      communicationPriorityBreakdown: {
        low: communicationMetrics.byPriority.low || 0,
        normal: communicationMetrics.byPriority.normal || 0,
        high: communicationMetrics.byPriority.high || 0,
        urgent: communicationMetrics.byPriority.urgent || 0,
      },
      
      // Recent activity
      recentConciergeRequests,
      recentCommunications,
      recentOffers,
    };

    console.log('Organization dashboard metrics calculated successfully:', metrics);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching organization dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching organization dashboard metrics', error: error.message });
  }
});

module.exports = router; 