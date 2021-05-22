import express from 'express';
import {github} from '../controllers/auth';

const router = express.Router();

router.post('/github', github)

export default router;