import Runner from "./Runner";
import {Writable} from "stream";
import Docker from "dockerode";
import {Language} from "../languages";
import {securityConfig} from "../../config";

const docker = new Docker();

export default class DockerImmediate implements Runner {
    type = 'docker-immediate';

    async run(execMountPath: string, language: Language, user: Express.User, stdin: string | undefined) {
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
                Binds: [`${execMountPath}:/app:ro`],
                Runtime: 'runsc'
            },
            AttachStdout: true,
            AttachStderr: true,
            AttachStdin: true,
            Cmd: language.command,
            NetworkDisabled: securityConfig.disableNetworking
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
        container.modem.demuxStream(rwstream, stdoutStream, stderrStream)
        await container.start();

        let running = true;

        setTimeout(async () => {
            if(running) {
                stderrStream.write(`\n\n\n---------------------\nExecution ran over ${user.modes[this.type].maxRuntime / 1000} seconds.\nKilling the process.\n---------------------\n\n\n`, 'utf-8');
                try{
                    await container.kill();
                }
                catch(err) {
                    // There is a small chance that the `running` check passes, but by the time the `kill` command is
                    // sent, the container was already stopped. This checks for that
                    if(err.statusCode !== 404) {
                        console.error(err);
                    }
                }
            }
        }, user.modes[this.type].maxRuntime)

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
        running = false;

        const stats = await container.inspect();
        const executionTime = new Date(stats.State.FinishedAt).getTime() - new Date(stats.State.StartedAt).getTime();

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
            combinedOutput,
            executionTime
        };
    }
}