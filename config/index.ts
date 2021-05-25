import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import {Dialect} from "sequelize";

export type JWTConfig = {
    secret: string
}

export type GithubConfig = {
    client_id: string,
    client_secret: string
}

export type DatabaseConfig = {
    username: string,
    password: string,
    database: string,
    host: string,
    dialect: Dialect
}

export const jwtConfig: JWTConfig = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'jwt.yaml'), 'utf-8'));
export const githubConfig: GithubConfig = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'github.yaml'), 'utf-8'));
export const databaseConfig: DatabaseConfig = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'database.yaml'), 'utf-8'));