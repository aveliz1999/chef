import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export type JWTConfig = {
    secret: string
}

export const jwtConfig: JWTConfig = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'jwt.yaml'), 'utf-8'));