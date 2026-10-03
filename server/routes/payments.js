import { Router } from 'express';
import { wrap } from '../middleware/error.js';
import { protect } from '../middleware/auth.js';
import * as c from '../controllers/payments.js';
const r = Router();
r.get('/mode', c.mode);
r.post('/checkout', protect, wrap(c.createCheckout));
r.post('/confirm', protect, wrap(c.confirmPayment));
export default r;
