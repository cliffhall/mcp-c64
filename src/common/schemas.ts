import { z } from "zod";

export const NoArgSchema = z.object({});

export const AssembleProgramSchema = z.object({
  command: z.string().nonempty("Command is required"),
  sourcePath: z.string().nonempty("Source path is required"),
  args: z.array(z.string()).optional()
});

