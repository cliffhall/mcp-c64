import { spawn } from "child_process";
import { z } from "zod";
export const RunProgramSchema = z.object({
    // 'filename' and 'path' are the only truly required parameters from the caller.
    filename: z.string().nonempty("Filename is required"),
    path: z.string().nonempty("Path is required"),
    // These are optional overrides.
    args: z.array(z.string()).optional(),
});
/**
 * Run a program
 */
export function runProgram({ path, filename, args, }) {
    return new Promise((resolve, reject) => {
        const commandArgs = args ?? [];
        const command = process.env.EMULATOR;
        const child = spawn(command, [
            ...commandArgs,
            "-chdir",
            path,
            "-autostart",
            filename,
        ]);
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
