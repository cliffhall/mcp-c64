import dotenv from "dotenv";
import { spawn } from "child_process";

// Get the VICE
dotenv.config({ path: `.env` });
console.log(process.env.VICE)

// Launch VICE
spawn(process.env.VICE, ["-autostart", "/Users/cliffhall/Projects/mcp-c64/asm/hello/hello-world.prg", "-logfile", "/Users/cliffhall/Projects/mcp-c64/asm/hello/hello-world.log"]);
