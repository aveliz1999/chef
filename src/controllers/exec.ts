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

export const exec = async function(req: Request, res: Response) {
    console.time('fullRun');
    if(!Object.keys(languages).includes(req.body.language)) {
        return res.status(400).send({message: 'Unsupported language'});
    }
    const language = languages[req.body.language];

    const id = uuid();

    console.time('fs');
    await fs.promises.mkdir(`${os.tmpdir()}/${id}`);
    await fs.promises.writeFile(`${os.tmpdir()}/${id}/exec`, req.body.code);
    console.timeEnd('fs');
    let data = '';

    const stream = new Writable();
    stream._write = function(chunk, encoding, callback) {
        data += chunk;
    }

    console.time('pull');
    await docker.pull(language.image);
    console.timeEnd('pull');
    console.time('run');
    const [result,_] = await docker.run(language.image, language.command, stream, {
        HostConfig: {
            Binds: [`${os.tmpdir()}/${id}:/app`]
        }
    });
    console.timeEnd('run');
    console.timeEnd('fullRun');
    console.log(`Result: ${data}`);

    if(result.StatusCode) {
        res.status(400);
    }
    else{
        res.status(200);
    }
    return res.send({result: data});
}