import express from 'express';
import { getAllCourses, getCourseById, getLessonById } from '../controllers/courseController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /courses/dashboard
// @desc    Get all courses for the dashboard
// @access  Private
router.get('/dashboard', isAuthenticated, getAllCourses);

// @route   GET /courses/:courseId
// @desc    Get a single course by ID with its lessons
// @access  Private (assuming only logged-in users can see course details)
router.get('/:courseId', isAuthenticated, getCourseById);

// @route   GET /courses/:courseId/lessons/:lessonId
// @desc    Get a single lesson by ID
// @access  Private (assuming only logged-in users can see lesson details)
router.get('/:courseId/lessons/:lessonId', isAuthenticated, getLessonById);

export default router;
