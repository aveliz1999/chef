import express from 'express';
import {create} from '../controllers/auth';

const router = express.Router();

router.post('/', create);

export default router;