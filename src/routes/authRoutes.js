import express from 'express';
import { 
  renderRegisterForm, 
  registerUser, 
  renderLoginForm, 
  loginUser, 
  logoutUser 
} from '../controllers/authController.js';
// import { isAuthenticated, isGuest } from '../middleware/authMiddleware.js'; // Will be added later

const router = express.Router();

// Authentication Routes
// For now, middleware like isGuest and isAuthenticated will be added in a later step
router.get('/register', renderRegisterForm);
router.post('/register', registerUser);

router.get('/login', renderLoginForm);
router.post('/login', loginUser);

router.get('/logout', logoutUser); // Should be isAuthenticated later

export default router;
