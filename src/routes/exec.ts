import express from 'express';
import {exec, versions} from '../controllers/exec';
import jwt from 'express-jwt';
import {jwtConfig} from '../../config';
import {rateLimitConfig} from "../../config";
import rateLimit from 'express-rate-limit';

const router = express.Router();

router.get('/versions', versions);

router.use(jwt({
    secret: jwtConfig.secret,
    algorithms: ['HS256'],
    credentialsRequired: false
}));

// TODO switch from using MemoryStore to another storage. Redis recommended
router.use(rateLimit({
    windowMs: rateLimitConfig.timeInMs,
    max: (req, res): number => {
        if(req.user) {
            return rateLimitConfig.maxRequestsAuthenticated
        }
        return rateLimitConfig.maxRequestsUnauthenticated;
    },
    keyGenerator: (req, res): string => {
        // Rate limit by github ID if authenticated or by IP if not
        if(req.user) {
            return `GITHUB_${req.user.githubId}`;
        }
        return `IP_${req.ip}`
    },
    handler: (req, res) => {
        if(!req.user) {
            return res.status(429).send({message: 'Too many requests, please try again later. ' +
                    `Authenticated to increase the rate limit from ${rateLimitConfig.maxRequestsUnauthenticated} to ` +
                    `${rateLimitConfig.maxRequestsAuthenticated}.`});
        }
        return res.status(429).send({message: 'Too many requests, please try again later.'});
    }
}))

router.post('/', exec);

router.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send('invalid token...');
    }
    else{
        next();
    }
});

export default router;