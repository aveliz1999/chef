import {Request, Response} from "express";
import jwt from 'jsonwebtoken';
import {jwtConfig} from "../../config";
import Joi, {ValidationError} from "joi";
import axios from 'axios';
import {githubConfig} from '../../config'
import User from "../models/User";

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

        const {id: githubId}: {id: number} = userResponse.data;

        const user = await User.findOne({
            where: {
                githubId
            }
        });
        if(user) {
            if(user.banned) {
                return res.status(403).send({message: 'This account is disabled.'});
            }
        }
        else {
            // @ts-ignore
            const createdUser = await User.create({
                githubId,
                banned: false,
                accessLevel: 0
            });
        }

        const token = {
            githubId,
            modes: {
                'docker-immediate': {
                    maxRuntime: 5000
                }
            }
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