import { Router } from 'express';
import { wrap } from '../middleware/error.js';
import { protect } from '../middleware/auth.js';
import * as c from '../controllers/reviews.js';
const r = Router();
r.post('/', protect, wrap(c.createReview));
r.delete('/:id', protect, wrap(c.deleteReview));
export default r;
