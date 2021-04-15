import {Request, Response} from "express";
import Docker from "dockerode";
import {Writable} from "stream";
import {v4 as uuid} from "uuid";
import fs from 'fs';
import * as os from "os";

const docker = new Docker();

// Declare the language images and container commands
const languages = {
    js: {
        image: 'node:15.14.0-alpine3.10',
        command: ['node', '/app/exec']
    },
    python2: {
        image: 'python:2-alpine',
        command: ['python2', '/app/exec']
    },
    python3: {
        image: 'python:3-alpine',
        command: ['python3', '/app/exec']
    }
}

// Pull all the images ahead of time to save execution time
let initialized = false;
console.log('Pulling images...');
Promise.all(Object.values(languages).map(lang => docker.pull(lang.image)))
    .then(() => {
        initialized = true;
        console.log('All images pulled successfully')
    })
    .catch((e) => {
        console.error('An error occurred while pulling the images:');
        console.error(e);
        process.exit(1);
    });

// Declare language aliases in the form of [alias, language]
const aliases = [
    ['javascript', 'js'],
    ['node', 'js'],
    ['python', 'python3'],
    ['py', 'python3'],
    ['py3', 'python3'],
    ['py2', 'python2']
]
for(let alias of aliases) {
    languages[alias[0]] = languages[alias[1]];
}

/**
 * TODO Implement error handling and reporting
 *
 * TODO Validate request inputs properly (with something like Joi)
 */
export const exec = async function(req: Request, res: Response) {
    // Don't execute code until all the images are pulled
    if(!initialized) {
        return res.status(503).send({message: 'The server is still initializing...'});
    }

    // Don't allow executing unless the language is supported
    if(!Object.keys(languages).includes(req.body.language)) {
        return res.status(400).send({message: 'Unsupported language'});
    }
    const language = languages[req.body.language];

    // Pad stdin with a newline if it doesn't end with one so that stdin doesn't hang
    if(req.body.stdin && !req.body.stdin.endsWith('\n')) {
        req.body.stdin += '\n';
    }

    // Generate a unique ID for the run and store the code in a temporary folder
    const id = uuid();
    await fs.promises.mkdir(`${os.tmpdir()}/${id}`);
    await fs.promises.writeFile(`${os.tmpdir()}/${id}/exec`, req.body.code);

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
    if(req.body.stdin) {
        rwstream.write(req.body.stdin);
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