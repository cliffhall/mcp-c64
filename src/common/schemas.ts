import { z } from "zod";

export const NoArgSchema = z.object({});

export const AssembleProgramSchema = z.object({
  file: z.string().nonempty("File is required"),
  args: z.array(z.string()).optional()
});
