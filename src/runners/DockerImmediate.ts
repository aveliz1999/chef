import Runner from "./Runner";
import {Writable} from "stream";
import Docker from "dockerode";
import {Language} from "../languages";

const docker = new Docker();

export default class DockerImmediate implements Runner {
    type = 'docker-immediate';

    async run(execMountPath: string, language: Language, stdin: string | undefined) {
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
                Binds: [`${execMountPath}:/app`],
                Runtime: 'runsc'
            },
            AttachStdout: true,
            AttachStderr: true,
            AttachStdin: true,
            Cmd: language.command
        });

        // Attach the streams to the container
        const rwstream = await container.attach({
            hijack: true,
            stdin: true,
            stdout: true,
            stderr: true,
            stream: true
        });

        console.log(`Starting ${this.type} runner to run ${language.name} code. Container ID: ${container.id}`);
        await container.start();

        container.modem.demuxStream(rwstream, stdoutStream, stderrStream)
        if(stdin) {
            rwstream.write(stdin);
        }
        else {
            rwstream.write('\n');
        }

        // Wait until the container stops and remove it
        await container.wait({
            condition: 'not-running'
        });

        /*
         * Remove the container from the system. Done with then/catch rather than await so that this step is done
         * asynchronously
         */
        container.remove()
            .then(() => {
                console.log(`Removing ${this.type} runner container with ID ${container.id}`);
            })
            .catch((e) => {
                console.error(`Error while removing ${this.type} runner container with ID ${container.id}:`);
                console.error(e);
            });

        return {
            stdout,
            stderr,
            combinedOutput
        };
    }
}