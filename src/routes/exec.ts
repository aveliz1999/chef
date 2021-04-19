import express from 'express';
import {exec, versions} from '../controllers/exec';

const router = express.Router();

router.post('/', exec);
router.get('/versions', versions);

export default router;