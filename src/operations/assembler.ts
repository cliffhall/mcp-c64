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
export async function assembleProgram({command, sourcePath, args}: AssembleProgramParams): Promise<AssemblerResponse> {

  const commandArgs = args || [];
  const child = spawn(command, [sourcePath, ...commandArgs]);

  let stdoutData = '';
  let stderrData = '';
  let exitCode: number|null;
  let response: AssemblerResponse|null = null;

  child.stdout.on('data', (data) => {
    stdoutData += data.toString(); // Collect standard output
  });

  child.stderr.on('data', (data) => {
    stderrData += data.toString(); // Collect standard error
  });

  child.on('close', (code) => {
    exitCode = code;
    response = {
      output: (exitCode === 0) ? stdoutData : stderrData,
      status: exitCode as number
    }
  });

  while (!response) {}

  return new Promise((resolve) => {
    resolve(response as AssemblerResponse);
  });
}
