import Runner from "./Runner";

export const runners: {
    [key: string]: Runner
} = {};

export const runnerTypes: string[] = Object.values(runners).map(runner => runner.type);

// TODO assign a default runner type
export const defaultRunnerType = '';