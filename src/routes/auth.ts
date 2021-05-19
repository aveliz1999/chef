import express from 'express';
import {create, github} from '../controllers/auth';

const router = express.Router();

router.post('/', create);
router.post('/github', github)

export default router;