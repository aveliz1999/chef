import { Language} from "../languages";

declare global {
    namespace Express {
        interface User {
            githubId?: number
            modes: {
                [key: string]: {
                    maxRuntime: number
                }
            }
        }

        interface Request {
            user?: User;
        }
    }
}

export default interface Runner {
    type: string;
    run: (execMountPath: string, language: Language, user: Express.User, stdin?: string) => Promise<{
        stdout: string,
        stderr: string,
        combinedOutput: string,
        executionTime: number
    } | {
        message: string
    }>;
}