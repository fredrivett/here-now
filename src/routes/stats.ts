import { Router } from 'express';
import { statsController } from '../controllers/statsController';

const router = Router();

router.get('/', statsController);

export { router as statsRoute };
