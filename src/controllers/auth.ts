import {Request, Response} from "express";
import jwt from 'jsonwebtoken';
import {jwtConfig} from "../../config";

/**
 * TODO This should have some form of authentication in order to prevent new tokens from being given out infinitely
 */
export const create = async function(req: Request, res: Response) {
    const defaultToken = {
        mode: 'docker-immediate',
        maxRuntime: 3000
    }

    const token = jwt.sign(defaultToken, jwtConfig.secret, {
        expiresIn: '1d'
    });

    return res.send(token);
}