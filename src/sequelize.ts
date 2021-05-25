import {Sequelize} from 'sequelize-typescript';
import {databaseConfig} from '../config';

const sequelize =  new Sequelize({
    ...databaseConfig
});

export default () => {
    sequelize.addModels([]);
    return sequelize;
};