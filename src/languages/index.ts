import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import Docker from "dockerode";

const docker = new Docker();

export type Language = {
    name: string,
    aliases: string[],
    image: string,
    command: string[]
}

export const init: () => Promise<[
    {
        [key: string]: Language
    },
    {
        [key: string]: Language
    }
]> = async function() {
    // Get the list of language config files
    const fileNames = await fs.promises.readdir(path.resolve(__dirname, './config'));
    const files = await Promise.all(fileNames.map(filename => fs.promises.readFile(path.resolve(__dirname, './config', filename), 'utf-8')));

    // Parse the language yaml config files into objects
    const parsedLanguages: Language[] = files.map(file => yaml.parse(file));

    // Populate the languages object and pull all the required docker images
    const languages: {
        [key: string]: Language
    } = {}
    for(let language of parsedLanguages) {
        languages[language.name] = language;
        await docker.pull(language.image);
    }

    const languagesWithAliases: {
        [key: string]: Language
    } = {...languages};
    // Set up the aliases
    for(let language of parsedLanguages) {
        for(let alias of language.aliases) {
            languagesWithAliases[alias] = language;
        }
    }

    return [languages, languagesWithAliases];
}