import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { VERSION} from "./common/version.js";
import {
  assembleProgram,
} from "./operations/assembler.ts";
import {AssembleProgramSchema} from "./common/schemas.js";
import dotenv from "dotenv";

dotenv.config({ path: `.env`, quiet: true });

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
          description: "Assemble a program",
          inputSchema: zodToJsonSchema(AssembleProgramSchema),
        }
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case "assemble_program": {
          const command = process.env.ASSEMBLER;
          if (!command) {
            throw new Error("ASSEMBLER environment variable not set");
          }
          const path = process.env.SRC_PATH;
          if (!path) {
            throw new Error("SRC_PATH environment variable not set");
          }
          const args = AssembleProgramSchema.parse(request.params.arguments);
          const result = await assembleProgram({command, path, ...args});
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
