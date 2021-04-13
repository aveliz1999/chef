import express from 'express';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

import execRouter from './routes/exec';

app.use('/exec', execRouter);

export default app;
