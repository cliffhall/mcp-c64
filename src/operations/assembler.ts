import {spawn} from 'child_process';

interface AssemblerResponse {
  output: string;
  status: number;
}

interface AssembleProgramParams {
  command: string;
  sourcePath: string;
  args?: string[];
}

/**
 * Assemble a program
 */
export function assembleProgram({command, sourcePath, args}: AssembleProgramParams): Promise<AssemblerResponse> {
  return new Promise((resolve, reject) => {
    const commandArgs = args ?? [];

    const child = spawn(command, [sourcePath, ...commandArgs]);

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    // This event is fired if the command cannot be spawned, etc.
    child.on('error', (err) => {
      reject(err);
    });

    // Use the 'close' event to ensure all I/O streams are closed.
    child.on('close', (code) => {
      // The exit code can be null; default to 0 for success if so.
      const exitCode = code ?? 0;

      resolve({
        output: (exitCode === 0) ? stdoutData : stderrData,
        status: exitCode,
      });
    });
  });
}
