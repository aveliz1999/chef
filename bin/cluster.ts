import cluster from 'cluster';
import os from 'os';
import app from '../src/app';
import http from 'http';

if(cluster.isMaster) {
    const cpus = os.cpus().length / 2;

    console.log(`Scaling to ${cpus} cpus`);
    for(let i = 0; i < cpus; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code) => {
        if (code !== 0 && !worker.exitedAfterDisconnect) {
            console.log(`\x1b[34mWorker ${worker.process.pid} crashed.\nStarting a new worker...\n\x1b[0m`);
            const nw = cluster.fork();
            console.log(`\x1b[32mWorker ${nw.process.pid} will replace him \x1b[0m`);
        }
    })

    console.log(`Master PID: ${process.pid}`);
}
else {
    const port = process.env.PORT || '3000';

    const server = http.createServer(app);

    server.listen(port);
}