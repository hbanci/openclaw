import type { Command } from "commander";
import { createOpenClawCodingTools } from "../agents/pi-tools.js";
import { loadConfig } from "../config/config.js";
import { theme } from "../terminal/theme.js";

export function parseArgs(args: string[]): Record<string, unknown> {
  if (args.length === 1 && args[0].trim().startsWith("{")) {
    try {
      return JSON.parse(args[0]) as Record<string, unknown>;
    } catch {
      // Fallback
    }
  }
  const result: Record<string, unknown> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (i === 0 && !arg.includes("=")) {
      // Heuristic: First positional argument is mapped to "action" for tools like process
      result.action = arg;
      continue;
    }
    if (arg.includes("=")) {
      const [key, ...valueParts] = arg.split("=");
      if (key && valueParts.length > 0) {
        result[key] = valueParts.join("=");
      }
    } else {
      // If we need another positional heuristic, but for now just assign to something or ignore
      // For `process list`, `args[0]` will be "list" which maps to `action`.
    }
  }
  return result;
}

export function registerToolCli(program: Command) {
  const toolCmd = program.command("tool").description("Manage and execute agent tools locally");

  toolCmd
    .command("list")
    .description("List available agent tools")
    .action(async () => {
      const config = loadConfig();
      const tools = createOpenClawCodingTools({ config });
      for (const tool of tools) {
        console.log(`${theme.command(tool.name.padEnd(16))} ${tool.description}`);
      }
    });

  toolCmd
    .command("run <toolName> [args...]")
    .description("Run a specific agent tool locally")
    .option("--json", "Output result as JSON")
    .action(async (toolName: string, args: string[], options: { json?: boolean }) => {
      const config = loadConfig();
      const tools = createOpenClawCodingTools({ config });
      const tool = tools.find((t) => t.name === toolName);

      if (!tool) {
        console.error(theme.error(`Tool not found: ${toolName}`));
        process.exit(1);
      }

      const parsedArgs = parseArgs(args);

      try {
        const result = await tool.execute("cmd-1", parsedArgs, undefined, () => {});
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          for (const content of result.content) {
            if (content.type === "text") {
              console.log(content.text);
            } else {
              console.log(`[${content.type}]`);
            }
          }
        }
      } catch (err) {
        console.error(
          theme.error(`Error executing tool: ${err instanceof Error ? err.message : String(err)}`),
        );
        process.exit(1);
      }
    });
}
