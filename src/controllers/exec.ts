import {Request, Response} from "express";
import Docker from "dockerode";
import {Writable} from "stream";
import {v4 as uuid} from "uuid";
import fs from 'fs';
import * as os from "os";
import Joi, {ValidationError} from 'joi';
import {init as initializeLanguages, Language} from '../languages';

const docker = new Docker();

let languages: {
    [key: string]: Language
};
let initialized = false;

// Initialize the language object and pull all the docker images
console.log('Pulling images...');
initializeLanguages()
    .then((languageList) => {
        languages = languageList;
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
            .valid('static', 'interactive')
            .default('static')
    });

    try {
        const request: {
            language: string,
            code: string,
            stdin?: string,
            mode: string
        } = await requestSchema.validateAsync(req.body);

        console.log(request);

        const language = languages[request.language];

        // Pad stdin with a newline if it doesn't end with one so that stdin doesn't hang
        if(request.stdin && !request.stdin.endsWith('\n')) {
            request.stdin += '\n';
        }

        // Generate a unique ID for the run and store the code in a temporary folder
        const id = uuid();
        await fs.promises.mkdir(`${os.tmpdir()}/${id}`);
        await fs.promises.writeFile(`${os.tmpdir()}/${id}/exec`, request.code);

        // StdOut and StdErr combined
        let combinedOutput = '';

        // Handle writing the stdout/stderr to the data variable
        const stdoutStream = new Writable();
        let stdinProcessed = false;
        let stdout = '';
        stdoutStream._write = function(chunk, encoding, callback) {
            stdout += chunk;
            combinedOutput += chunk;
            callback();
        }

        const stderrStream = new Writable();
        let stderr = '';
        stderrStream._write = function (chunk, encoding, callback) {
            stderr += chunk;
            combinedOutput += chunk;
            callback();
        }

        // Create the container with the volume mount
        const container = await docker.createContainer({
            Image: language.image,
            Tty: false,
            OpenStdin: true,
            HostConfig: {
                Binds: [`${os.tmpdir()}/${id}:/app`]
            },
            AttachStdout: true,
            AttachStderr: true,
            AttachStdin: true,
            Cmd: language.command
        });
        await container.start();

        // Attach the streams to the container
        const rwstream = await container.attach({
            hijack: true,
            stdin: true,
            stdout: true,
            stderr: true,
            stream: true
        });
        container.modem.demuxStream(rwstream, stdoutStream, stderrStream)
        if(request.stdin) {
            rwstream.write(request.stdin);
        }
        else {
            rwstream.write('\n');
        }

        // Wait until the container stops and remove it
        await container.wait({
            condition: 'not-running'
        });

        const result = {
            stdout,
            stderr,
            combinedOutput
        }
        res.send(result);

        // Remove the container and the temporary folder used to hold the code
        await fs.promises.rmdir(`${os.tmpdir()}/${id}`, {
            recursive: true
        });
        await container.remove();
    }
    catch(err) {
        if (err.isJoi) {
            return res.status(400).send({message: (err as ValidationError).message});
        }
        console.error(err);
        return res.status(500).send({message: 'An error has occurred on the server.'})
    }
}