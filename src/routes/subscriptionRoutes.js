import express from 'express';
import { getSubscriptionPlans, subscribeToPlan, getCheckoutPage } from '../controllers/subscriptionController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Display subscription plans page
// @route   GET /
// @access  Private (user must be logged in to see plans)
router.get('/', isAuthenticated, getSubscriptionPlans);

// @desc    Display checkout page for a specific plan
// @route   GET /checkout/:planId
// @access  Private
router.get('/checkout/:planId', isAuthenticated, getCheckoutPage);

// @desc    Handle subscription creation
// @route   POST /subscribe/:planId
// @access  Private
router.post('/subscribe/:planId', isAuthenticated, subscribeToPlan);


export default router;
