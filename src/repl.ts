import dotenv from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createInterface } from "node:readline";
import {
  ListToolsRequest,
  ListToolsResultSchema,
  CallToolRequest,
  CallToolResultSchema,
  ListPromptsRequest,
  ListPromptsResultSchema,
  GetPromptRequest,
  GetPromptResultSchema,
  ListResourcesRequest,
  ListResourcesResultSchema,
  LoggingMessageNotificationSchema,
  ResourceListChangedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Create readline interface for user input
const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Track received notifications for debugging resumability
let notificationCount = 0;

// Global client and transport for interactive commands
let client: Client | null = null;
let transport: StdioClientTransport | null = null;
let serverUrl = "http://localhost:3001/mcp";
let notificationsToolLastEventId: string | undefined = undefined;
let sessionId: string | undefined = undefined;

const errorHandler = (error: Error) => {
  if (error?.cause && JSON.stringify(error.cause).includes("ECONNREFUSED")) {
    console.error("Connection refused. Is the MCP server running?");
  } else if (error.message && error.message.includes("404")) {
    console.error("Error accessing endpoint (HTTP 404)");
  } else {
    console.error("Error from MCP server:", error);
  }
};

async function main(): Promise<void> {
  console.log("MCP Interactive Client");
  console.log("=====================");

  // Connect to server immediately with default settings
  await connect();

  // Print help and start the command loop
  printHelp();
  commandLoop();
}

function printHelp(): void {
  console.log("\nAvailable commands:");
  console.log("  help                       - Show this help");
  console.log("  list-tools                 - List available tools");
  console.log("  call-tool <name> [args]    - Call a tool with optional JSON arguments");
  console.log("  list-resources             - List available resources");
  console.log("  terminate-session          - Terminate the current session");
  console.log("  quit                       - Exit the program");
}

function commandLoop(): void {
  readline.question("\n> ", async (input) => {
    const args = input.trim().split(/\s+/);
    const command = args[0]?.toLowerCase();

    try {
      switch (command) {
        case "list-tools":
          await listTools();
          break;

        case "call-tool":
          if (args.length < 2) {
            console.log("Usage: call-tool <name> [args]");
          } else {
            const toolName = args[1];
            let toolArgs = {};
            if (args.length > 2) {
              try {
                toolArgs = JSON.parse(args.slice(2).join(" "));
              } catch {
                console.log("Invalid JSON arguments. Using empty args.");
              }
            }
            await callTool(toolName, toolArgs);
          }
          break;

        case "list-prompts":
          await listPrompts();
          break;

        case "get-prompt":
          if (args.length < 2) {
            console.log("Usage: get-prompt <name> [args]");
          } else {
            const promptName = args[1];
            let promptArgs = {};
            if (args.length > 2) {
              try {
                promptArgs = JSON.parse(args.slice(2).join(" "));
              } catch {
                console.log("Invalid JSON arguments. Using empty args.");
              }
            }
            await getPrompt(promptName, promptArgs);
          }
          break;

        case "list-resources":
          await listResources();
          break;

        case "help":
          printHelp();
          break;

        case "quit":
        case "exit":
          await quit();
          return;

        default:
          if (command) {
            console.log(`Unknown command: ${command}`);
          }
          break;
      }
    } catch (error) {
      console.error(`Error executing command: ${error}`);
    }

    // Continue the command loop
    commandLoop();
  });
}


async function connect(url?: string): Promise<void> {
  if (client) {
    console.log("Already connected. Disconnect first.");
    return;
  }

  try {
    // Create a new client
    client = new Client({
      name: "repl",
      version: "1.0.0",
    });
    client.onerror = errorHandler;

    const command = "node";
    console.log(`STDIO transport: command=${command}`);

    const transport = new StdioClientTransport({
      command,
      args: ["dist/index.js"],
      env: {
        srcPath: process.env.SRC_PATH || '.',
        vicePath: process.env.VICE_PATH || '.'
      },
      stderr: "pipe",
    });

    // Set up notification handlers
    client.setNotificationHandler(
      LoggingMessageNotificationSchema,
      (notification) => {
        notificationCount++;
        console.log(
          `\nNotification #${notificationCount}: ${notification.params.level} - ${notification.params.data}`,
        );

        // Re-display the prompt
        process.stdout.write("> ");
      },
    );

    client.setNotificationHandler(
      ResourceListChangedNotificationSchema,
      async () => {
        console.log(`\nResource list changed notification received!`);
        try {
          if (!client) {
            console.log("Client disconnected, cannot fetch resources");
            return;
          }
          const resourcesResult = await client.request(
            {
              method: "resources/list",
              params: {},
            },
            ListResourcesResultSchema,
          );
          console.log(
            "Available resources count:",
            resourcesResult.resources.length,
          );
        } catch {
          console.log("Failed to list resources after change notification");
        }
        // Re-display the prompt
        process.stdout.write("> ");
      },
    );

    // Connect the client
    await client.connect(transport);
    console.log("Connected to mcp-c64 server");
  } catch (error) {
    if (error instanceof Error) errorHandler(error);
    client = null;
    transport = null;
  }
}

async function listTools(): Promise<void> {
  if (!client) {
    console.log("Not connected to server.");
    return;
  }

  try {
    const toolsRequest: ListToolsRequest = {
      method: "tools/list",
      params: {},
    };
    const toolsResult = await client.request(
      toolsRequest,
      ListToolsResultSchema,
    );

    console.log("Available tools:");
    if (toolsResult.tools.length === 0) {
      console.log("  No tools available");
    } else {
      for (const tool of toolsResult.tools) {
        console.log(`  - ${tool.name}: ${tool.description}`);
      }
    }
  } catch (error) {
    console.log(`Tools not supported by this server (${error})`);
  }
}

async function callTool( name: string, args: Record<string, unknown>): Promise<void> {
  if (!client) {
    console.log("Not connected to server.");
    return;
  }

  try {
    const request: CallToolRequest = {
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    };

    console.log(`Calling tool '${name}' with args:`, args);
    const onLastEventIdUpdate = (event: string) => {
      notificationsToolLastEventId = event;
    };
    const result = await client.request(request, CallToolResultSchema, {
      resumptionToken: notificationsToolLastEventId,
      onresumptiontoken: onLastEventIdUpdate,
    });

    console.log("Tool result:");
    if (result.structuredContent){
      console.log(result.structuredContent);
    } else if (result.content) {
      console.log(result.content);
    }

  } catch (error) {
    console.log(`Error calling tool ${name}: ${error}`);
  }
}

async function listPrompts(): Promise<void> {
  if (!client) {
    console.log("Not connected to server.");
    return;
  }

  try {
    const promptsRequest: ListPromptsRequest = {
      method: "prompts/list",
      params: {},
    };
    const promptsResult = await client.request(
      promptsRequest,
      ListPromptsResultSchema,
    );
    console.log("Available prompts:");
    if (promptsResult.prompts.length === 0) {
      console.log("  No prompts available");
    } else {
      for (const prompt of promptsResult.prompts) {
        console.log(`  - ${prompt.name}: ${prompt.description}`);
      }
    }
  } catch (error) {
    console.log(`Prompts not supported by this server (${error})`);
  }
}

async function getPrompt( name: string, args: Record<string, unknown>,): Promise<void> {
  if (!client) {
    console.log("Not connected to server.");
    return;
  }

  try {
    const promptRequest: GetPromptRequest = {
      method: "prompts/get",
      params: {
        name,
        arguments: args as Record<string, string>,
      },
    };

    const promptResult = await client.request(
      promptRequest,
      GetPromptResultSchema,
    );
    console.log("Prompt template:");
    promptResult.messages.forEach((msg, index) => {
      console.log(`  [${index + 1}] ${msg.role}: ${msg.content.text}`);
    });
  } catch (error) {
    console.log(`Error getting prompt ${name}: ${error}`);
  }
}

async function listResources(): Promise<void> {
  if (!client) {
    console.log("Not connected to server.");
    return;
  }

  try {
    const resourcesRequest: ListResourcesRequest = {
      method: "resources/list",
      params: {},
    };
    const resourcesResult = await client.request(
      resourcesRequest,
      ListResourcesResultSchema,
    );

    console.log("Available resources:");
    if (resourcesResult.resources.length === 0) {
      console.log("  No resources available");
    } else {
      for (const resource of resourcesResult.resources) {
        console.log(`  - ${resource.name}: ${resource.uri}`);
      }
    }
  } catch (error) {
    console.log(`Resources not supported by this server (${error})`);
  }
}

async function quit(): Promise<void> {
  process.stdin.setRawMode(false);
  readline.close();
  console.log("\nGoodbye!");
  process.exit(0);
}

// Set up raw mode for keyboard input to capture the Escape key
process.stdin.setRawMode(true);
process.stdin.on("data", async (data) => {
  // Check for the Escape key (27)
  if (data.length === 1 && data[0] === 27) {
    console.log("\nESC key pressed. Disconnecting from server...");

    // Abort the current operation and disconnect from the server
    if (client && transport) {
      await quit();
      console.log("Disconnected. Press Enter to continue.");
    } else {
      console.log("Not connected to server.");
    }

    // Re-display the prompt
    process.stdout.write("> ");
  }
});

// Handle Ctrl+C
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Cleaning up...");
  await quit();
});

// Start the interactive client
main().catch((error: unknown) => {
  console.error("Error running MCP client:", error);
  process.exit(1);
});
