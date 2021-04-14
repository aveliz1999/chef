import {Request, Response} from "express";
import Docker from "dockerode";
import {Writable} from "stream";
import {v4 as uuid} from "uuid";
import fs from 'fs';
import * as os from "os";

const docker = new Docker();

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

export const exec = async function(req: Request, res: Response) {
    if(!initialized) {
        return res.status(503).send({message: 'The server is still initializing...'});
    }
    if(!Object.keys(languages).includes(req.body.language)) {
        return res.status(400).send({message: 'Unsupported language'});
    }
    const language = languages[req.body.language];

    const id = uuid();

    await fs.promises.mkdir(`${os.tmpdir()}/${id}`);
    await fs.promises.writeFile(`${os.tmpdir()}/${id}/exec`, req.body.code);
    let data = '';

    const stream = new Writable();
    stream._write = function(chunk, encoding, callback) {
        data += chunk;
    }

    const [result,_] = await docker.run(language.image, language.command, stream, {
        HostConfig: {
            Binds: [`${os.tmpdir()}/${id}:/app`]
        }
    });

    if(result.StatusCode) {
        res.status(400);
    }
    else{
        res.status(200);
    }
    return res.send({result: data});
}