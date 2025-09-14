import { Router } from 'express';
import { trackController } from '../controllers/trackController';

const router = Router();

router.post('/', trackController);

export { router as trackRoute };
