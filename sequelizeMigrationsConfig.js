const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

const config = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'config', 'database.yaml'), 'utf-8'));

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