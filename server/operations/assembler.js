import { spawn } from "child_process";
import { join, parse } from "path";
import { z } from "zod";
export const AssembleProgramSchema = z.object({
    // 'file' is the only truly required parameter from the caller.
    file: z.string().nonempty("File is required"),
    // These are optional overrides.
    command: z.string().nonempty().optional(),
    path: z.string().nonempty().optional(),
    args: z.array(z.string()).optional(),
});
/**
 * Assemble a program
 */
export function assembleProgram({ command, path, file, args, }) {
    return new Promise((resolve, reject) => {
        const commandArgs = args ?? [];
        const name = parse(file).name;
        const source = join(path, file);
        const output = join(path, `${name}.prg`);
        const map = join(path, `${name}.map`);
        const child = spawn(command, [
            source,
            "-o",
            output,
            "--map",
            map,
            ...commandArgs,
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
