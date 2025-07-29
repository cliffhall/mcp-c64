import { spawn } from "child_process";
import { join, parse } from "path";
import { z } from "zod";
export const TokenizeProgramSchema = z.object({
    // 'filename' is the only truly required parameter from the caller.
    filename: z.string().nonempty("File is required"),
    // These are optional overrides.
    path: z.string().nonempty().optional(),
    args: z.array(z.string()).optional(),
});
/**
 * Tokenize a program
 */
export function tokenizeProgram({ path, filename, args, }) {
    return new Promise((resolve, reject) => {
        const commandArgs = args ?? [];
        const command = process.env.TOKENIZER;
        const name = parse(filename).name;
        const source = join(path, filename);
        const output = join(path, `${name}.prg`);
        const child = spawn(command, [...commandArgs, "-o", output, "--", source]);
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
