import { Language} from "../languages";

declare global {
    namespace Express {
        interface User {
            mode: string,
            maxRuntime?: number
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
        combinedOutput: string
    } | {
        message: string
    }>;
}