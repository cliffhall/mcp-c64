import dotenv from "dotenv";
dotenv.config({ path: `.env`, quiet: true });

import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { VERSION} from "./common/version.js";
import {
  AssembleProgramSchema,
  assembleProgram,
  AssembleProgramParams,
  AssembleProgramResponse
} from "./operations/assembler.ts";

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
          description: `Assemble a program.\n\tOnly .asm source filename is required in file parameter, output .prg and .map files will be generated.\n\tAny additional args such as -a, -cbm-prg, etc. should be supplied in an array in the args parameter.`,
          inputSchema: zodToJsonSchema(AssembleProgramSchema),
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
          const path = params.path ?? process.env.SRC_PATH;
          if (!command) {
            throw new Error("Assembler command is not defined. Provide it in the call or set ASSEMBLER in the environment.");
          }
          if (!path) {
            throw new Error("Source path is not defined. Provide it in the call or set SRC_PATH in the environment.");
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
