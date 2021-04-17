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

export const init: () => Promise<{
    [key: string]: Language
}> = async function() {

    const fileNames = await fs.promises.readdir(path.resolve(__dirname, './config'));
    console.log(fileNames);
    const files = await Promise.all(fileNames.map(filename => fs.promises.readFile(path.resolve(__dirname, './config', filename), 'utf-8')));
    const parsedLanguages: Language[] = files.map(file => yaml.parse(file));
    const languages: {
        [key: string]: Language
    } = {}
    for(let language of parsedLanguages) {
        languages[language.name] = language;
        await docker.pull(language.image);
    }
    for(let language of parsedLanguages) {
        for(let alias of language.aliases) {
            languages[alias] = language;
        }
    }
    return languages;
}