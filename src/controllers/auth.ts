import {Request, Response} from "express";
import jwt from 'jsonwebtoken';
import {jwtConfig} from "../../config";
import Joi, {ValidationError} from "joi";
import axios from 'axios';
import {githubConfig} from '../../config'

export const create = async function(req: Request, res: Response) {
    const defaultToken = {
        mode: 'docker-immediate',
        maxRuntime: 2500
    }

    const token = jwt.sign(defaultToken, jwtConfig.secret, {
        expiresIn: '1d'
    });

    return res.send(token);
}

export const github = async function(req: Request, res: Response) {
    const schema = Joi.object({
        code: Joi.string()
    });

    try {
        const {code}: {code: string} = await schema.validateAsync(req.body);

        const accessResponse = await axios.post('https://github.com/login/oauth/access_token', {
            'client_id': githubConfig.client_id,
            'client_secret': githubConfig.client_secret,
            'code': code
        }, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const {access_token} = accessResponse.data;

        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const {id: githubId} = userResponse.data;

        const token = {
            mode: 'docker-immediate',
            maxRuntime: 5000,
            githubId
        }

        const signedToken = jwt.sign(token, jwtConfig.secret, {
            expiresIn: '1d'
        });

        return res.send(signedToken);
    }
    catch(err) {
        if (err.isJoi) {
            return res.status(400).send({message: (err as ValidationError).message});
        }
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'})
    }
}