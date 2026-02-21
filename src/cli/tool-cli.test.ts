import { Command } from "commander";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseArgs, registerToolCli } from "./tool-cli.js";

vi.mock("../agents/pi-tools.js", () => ({
  createOpenClawCodingTools: vi.fn(() => [
    {
      name: "dummy-tool",
      description: "A dummy tool for testing",
      execute: vi.fn(async () => ({
        content: [{ type: "text", text: "dummy result" }],
      })),
    },
  ]),
}));

vi.mock("../config/config.js", () => ({
  loadConfig: vi.fn(() => ({})),
}));

describe("tool-cli", () => {
  describe("parseArgs", () => {
    it("should parse JSON arguments", () => {
      const args = ['{"key": "value"}'];
      const result = parseArgs(args);
      expect(result).toEqual({ key: "value" });
    });

    it("should parse key=value arguments", () => {
      const args = ["action", "key1=value1", "key2=value2=part3"];
      const result = parseArgs(args);
      expect(result).toEqual({ action: "action", key1: "value1", key2: "value2=part3" });
    });

    it("should assign the first positional argument to action if it has no equals sign", () => {
      const args = ["list", "foo=bar"];
      const result = parseArgs(args);
      expect(result).toEqual({ action: "list", foo: "bar" });
    });

    it("should fallback to positional parsing if JSON is invalid", () => {
      const args = ["{invalid json}"];
      const result = parseArgs(args);
      expect(result).toEqual({ action: "{invalid json}" });
    });
  });

  describe("registerToolCli", () => {
    let program: Command;

    beforeEach(() => {
      program = new Command();
      registerToolCli(program);
      vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(process, "exit").mockImplementation((() => {}) as unknown as () => never);
    });

    it("registers the 'tool' command and its subcommands", () => {
      const toolCmd = program.commands.find((c) => c.name() === "tool");
      expect(toolCmd).toBeDefined();
      expect(toolCmd?.commands.map((c) => c.name())).toEqual(["list", "run"]);
    });
  });
});
