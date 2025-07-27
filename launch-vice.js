import dotenv from "dotenv";
import { spawn } from "child_process";

// Get the EMULATOR
dotenv.config({ path: `.env` });
console.log(process.env.EMULATOR)

// Launch VICE
spawn(process.env.VICE, ["-autostart", "/Users/cliffhall/Projects/mcp-c64/basic/token/token_test.prg"]);
