import yaml from "yaml";
import fs from "fs";
import path from "path";

const config = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'database.yaml'), 'utf-8'));

module.exports = {
    development: {
        ...config
    },
    test: {
        ...config
    },
    production: {
        ...config
    }
}