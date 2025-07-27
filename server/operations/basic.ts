import { spawn } from "child_process";
import { join, parse } from "path";
import { z } from "zod";

export const TokenizeProgramSchema = z.object({
  // 'file' is the only truly required parameter from the caller.
  file: z.string().nonempty("File is required"),

  // These are optional overrides.
  command: z.string().nonempty().optional(),
  path: z.string().nonempty().optional(),
  args: z.array(z.string()).optional(),
});

export interface TokenizeProgramResponse {
  output: string;
  error: string;
  status: number;
}

export interface TokenizeProgramParams {
  command: string;
  path: string;
  file: string;
  args?: string[];
}

/**
 * Tokenize a program
 */
export function tokenizeProgram({
  command,
  path,
  file,
  args,
}: TokenizeProgramParams): Promise<TokenizeProgramResponse> {
  return new Promise((resolve, reject) => {
    const commandArgs = args ?? [];

    const name = parse(file).name;
    const source = join(path, file);
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
