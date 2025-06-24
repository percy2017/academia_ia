import express from 'express';
import { getSubscriptionPlans, subscribeToPlan } from '../controllers/subscriptionController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Display subscription plans page
// @route   GET /
// @access  Private (user must be logged in to see plans)
router.get('/', isAuthenticated, getSubscriptionPlans);

// @desc    Handle subscription creation
// @route   POST /subscribe/:planId
// @access  Private
router.post('/subscribe/:planId', isAuthenticated, subscribeToPlan);


export default router;
