import { spawn } from "child_process";
import { join } from "path";
import { z } from "zod";
export const RunProgramSchema = z.object({
    // 'file' and path are the only truly required parameters from the caller.
    file: z.string().nonempty("File is required"),
    path: z.string().nonempty("Path is required"),
    // These are optional overrides.
    command: z.string().nonempty().optional(),
    args: z.array(z.string()).optional(),
});
/**
 * Run a program
 */
export function runProgram({ command, path, file, args, }) {
    return new Promise((resolve, reject) => {
        const commandArgs = args ?? [];
        const program = join(path, file);
        const child = spawn(command, [...commandArgs, "-chdir", path, "-autostart", file]);
        let stdoutData = "";
        let stderrData = "";
        child.stdout.on("data", (data) => {
            stdoutData += data.toString();
        });
        child.stderr.on("data", (data) => {
            stderrData += data.toString();
        });
        child.on("error", (err) => {
            reject(err);
        });
        child.on("close", (code) => {
            const exitCode = code ?? 0;
            resolve({
                output: stdoutData,
                error: stderrData,
                status: exitCode,
            });
        });
    });
}
