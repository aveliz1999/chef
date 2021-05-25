import express from 'express';
import initSequelize from './sequelize';

initSequelize();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

import execRouter from './routes/exec';
import authRouter from './routes/auth'

app.use('/exec', execRouter);
app.use('/auth', authRouter);

export default app;
