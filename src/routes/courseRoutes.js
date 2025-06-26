import express from 'express';
import { getAllCourses, getCourseById, getLessonById } from '../controllers/courseController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { checkActiveSubscription } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// @route   GET /courses/dashboard
// @desc    Get all courses for the dashboard
// @access  Private
router.get('/dashboard', isAuthenticated, getAllCourses);

// @route   GET /courses/:courseId
// @desc    Get a single course by ID with its lessons
// @access  Private
router.get('/:courseId', isAuthenticated, getCourseById);

// @route   GET /courses/:courseId/lessons/:lessonId
// @desc    Get a single lesson by ID
// @access  Private (Subscription required)
router.get('/:courseId/lessons/:lessonId', isAuthenticated, checkActiveSubscription, getLessonById);

export default router;
