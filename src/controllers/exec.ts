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
    }
}

const aliases = [
    ['javascript', 'js'],
    ['node', 'js']
]
for(let alias of aliases) {
    languages[alias[0]] = languages[alias[1]];
}

export const exec = async function(req: Request, res: Response) {
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

    await docker.pull(language.image);
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