import {Sequelize} from 'sequelize-typescript';
import {databaseConfig} from '../config';
import User from "./models/User";

const sequelize =  new Sequelize({
    ...databaseConfig
});

export default () => {
    sequelize.addModels([User]);
    return sequelize;
};