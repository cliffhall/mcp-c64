import dotenv from "dotenv";
import { spawn } from "child_process";

// Get the VICE_PATH
dotenv.config({ path: `.env` });
console.log(process.env.VICE_PATH)

// Launch VICE
spawn(process.env.VICE_PATH);
