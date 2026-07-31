import { shellIdentifier } from "@/runtime/commands/sanitize";

describe("command safety", () => {
  it("accepts safe provider identifiers", () => expect(shellIdentifier("api-container_1")).toBe("api-container_1"));
  it("rejects shell injection", () => expect(() => shellIdentifier("api; rm -rf /")) .toThrow("INVALID_RESOURCE_IDENTIFIER"));
});
