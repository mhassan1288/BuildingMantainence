import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireAuth, signToken } from '../auth';

const router = Router();
const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });

router.post('/login', async (req, res, next) => {
  try {
    const input = credentials.parse(req.body);
    const user = await authenticate(input.email, input.password);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });
    return res.json({ success: true, data: { token: signToken(user), user } });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, data: req.user }));
router.post('/logout', requireAuth, (_req, res) => res.json({ success: true }));

export default router;
