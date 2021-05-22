import express from 'express';
import {exec, versions} from '../controllers/exec';
import jwt from 'express-jwt';
import {jwtConfig} from '../../config';

const router = express.Router();

router.post('/', jwt({
    secret: jwtConfig.secret,
    algorithms: ['HS256'],
    credentialsRequired: false
}), exec);

router.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send('invalid token...');
    }
    else{
        next();
    }
});

router.get('/versions', versions);

export default router;