import dotenv from "dotenv";
dotenv.config({ path: `.env`, quiet: true });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { VERSION } from "./common/version.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import {
  AssembleProgramSchema,
  assembleProgram,
  AssembleProgramParams,
  AssembleProgramResponse
} from "./operations/assembler.ts";
import {
  TokenizeProgramSchema,
  tokenizeProgram,
  TokenizeProgramParams,
  TokenizeProgramResponse
} from "./operations/basic.js";

export const createServer = () => {
  // Instantiate the MCP server
  const server = new Server(
    {
      name: "mcp-c64",
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register MCP request handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "assemble_program",
          description: `Assemble an assembly language program.\n\tOnly the .asm source filename is required in file parameter, output .prg and .map files will be generated.\n\tAny additional args such as -a, -cbm-prg, etc. should be supplied in an array in the args parameter.`,
          inputSchema: zodToJsonSchema(AssembleProgramSchema),
        },
        {
          name: "tokenize_program",
          description: `Tokenize a BASIC program.\n\tOnly the .bas source filename is required in file parameter, output .prg file will be generated.\n\tAny additional args such as -w2, etc. should be supplied in an array in the args parameter.`,
          inputSchema: zodToJsonSchema(TokenizeProgramSchema),
        }
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case "assemble_program": {
          // Process the parameters
          const params = AssembleProgramSchema.parse(request.params.arguments);
          const command = params.command ?? process.env.ASSEMBLER;
          const path = params.path ?? process.env.ASM_PATH;
          if (!command) {
            throw new Error("Assembler command is not defined. Provide it in the call or set ASSEMBLER in the environment.");
          }
          if (!path) {
            throw new Error("Assembly source path is not defined. Provide it in the call or set ASM_PATH in the environment.");
          }
          const operationParams: AssembleProgramParams = {
            command,
            path,
            "file": params.file,
            "args": params.args,
          };

          const result: AssembleProgramResponse = await assembleProgram(operationParams);
          return {
            structuredContent: result,
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        case "tokenize_program": {
          // Process the parameters
          const params = TokenizeProgramSchema.parse(request.params.arguments);
          const command = params.command ?? process.env.TOKENIZER;
          const path = params.path ?? process.env.BASIC_PATH;
          if (!command) {
            throw new Error("Tokenizer command is not defined. Provide it in the call or set TOKENIZER in the environment.");
          }
          if (!path) {
            throw new Error("BASIC source path is not defined. Provide it in the call or set ASM_PATH in the environment.");
          }
          const operationParams: TokenizeProgramParams = {
            command,
            path,
            "file": params.file,
            "args": params.args,
          };

          const result: TokenizeProgramResponse = await tokenizeProgram(operationParams);
          return {
            structuredContent: result,
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      throw new Error(
        `Error processing request: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  });

  return { server };
};
