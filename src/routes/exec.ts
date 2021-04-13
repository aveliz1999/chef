import express from 'express';
import {exec} from '../controllers/exec';

const router = express.Router();

router.post('/', exec);

export default router;