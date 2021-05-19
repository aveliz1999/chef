import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export type JWTConfig = {
    secret: string
}

export type GithubConfig = {
    client_id: string,
    client_secret: string
}

export const jwtConfig: JWTConfig = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'jwt.yaml'), 'utf-8'));
export const githubConfig: GithubConfig = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'github.yaml'), 'utf-8'));