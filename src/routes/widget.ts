import { Router } from 'express';
import { widgetController } from '@/controllers/widgetController';

const router = Router();

router.get('/', widgetController);

export { router as widgetRoute };
