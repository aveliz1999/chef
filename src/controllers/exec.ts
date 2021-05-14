import {Request, Response} from "express";
import {v4 as uuid} from "uuid";
import fs from 'fs';
import * as os from "os";
import Joi, {ValidationError} from 'joi';
import {init as initializeLanguages, Language} from '../languages';
import {runners, runnerTypes, defaultRunnerType} from "../runners";

let languages: {
    [key: string]: Language
};
let languagesNoAliases: {
    [key: string]: Language
};
let initialized = false;

// Initialize the language object and pull all the docker images
console.log('Pulling images...');
initializeLanguages()
    .then(([languageList, languageListWithAliases]) => {
        languages = languageListWithAliases;
        languagesNoAliases = languageList;
        initialized = true;
        console.log('All images pulled successfully')
    })
    .catch((err) => {
        console.error('An error occurred while pulling the images:');
        console.error(err);
        process.exit(1);
    })

export const exec = async function(req: Request, res: Response) {
    // Don't execute code until all the images are pulled
    if(!initialized) {
        return res.status(503).send({message: 'The server is still initializing...'});
    }

    const requestSchema = Joi.object({
        language: Joi.string()
            .required()
            .valid(...Object.keys(languages)),
        code: Joi.string()
            .required()
            .max(2048),
        stdin: Joi.string()
            .optional()
            .max(64),
        mode: Joi.string()
            .optional()
            .valid(...runnerTypes)
            .default(defaultRunnerType)
    });

    try {
        const request: {
            language: string,
            code: string,
            stdin?: string,
            mode: string
        } = await requestSchema.validateAsync(req.body);

        const language = languages[request.language];

        // Pad stdin with a newline if it doesn't end with one so that stdin doesn't hang
        if(request.stdin && !request.stdin.endsWith('\n')) {
            request.stdin += '\n';
        }

        // Generate a unique ID for the run and store the code in a temporary folder
        const id = uuid();
        await fs.promises.mkdir(`${os.tmpdir()}/${id}`);
        await fs.promises.writeFile(`${os.tmpdir()}/${id}/exec${language.fileExtension || ''}`, request.code);

        // Run the code through the appropriate runner and send back the result
        const result = await runners[request.mode].run(`${os.tmpdir()}/${id}`, language, req.user, request.stdin);
        res.send(result);

        // Remove the temporary folder used to hold the code
        await fs.promises.rmdir(`${os.tmpdir()}/${id}`, {
            recursive: true
        });
    }
    catch(err) {
        if (err.isJoi) {
            return res.status(400).send({message: (err as ValidationError).message});
        }
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'})
    }
}

export const versions = async function(req: Request, res: Response) {
    return res.send(languagesNoAliases);
}