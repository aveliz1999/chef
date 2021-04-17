import Runner from "./Runner";
import DockerImmediate from "./DockerImmediate";

export const runners: {
    [key: string]: Runner
} = {};

// Declare all the available runners
const runnerList = [
    new DockerImmediate()
]
runnerList.forEach((runner) => runners[runner.type] = runner)

export const runnerTypes: string[] = Object.keys(runners);

export const defaultRunnerType: string = runnerList[0].type;