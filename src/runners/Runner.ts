import { Language} from "../languages";

export default interface Runner {
    type: string;
    run: (execMountPath: string, language: Language, stdin?: string) => Promise<{
        stdout: string,
        stderr: string,
        combinedOutput: string
    }>;
}