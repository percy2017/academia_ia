import { Router } from 'express';
import { createPaypalOrder, generateQrCode, uploadQrReceipt } from '../controllers/paymentController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { uploadReceipt } from '../middleware/receiptUploadMiddleware.js';

const router = Router();

// Rutas de Pagos
router.post('/paypal/create-order', isAuthenticated, createPaypalOrder);
router.post('/qr/generate', isAuthenticated, generateQrCode);
router.post('/qr/upload-receipt', isAuthenticated, uploadReceipt.single('receipt'), uploadQrReceipt);


// Aquí irían las rutas para capturar la respuesta de PayPal y verificar el pago QR
// router.post('/paypal/capture-order', isLoggedIn, capturePaypalOrder);
// router.get('/qr/verify/:subscriptionId', isAdmin, verifyQrPayment);

export default router;
