export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  output: string;
}

export interface StreamUpdate {
  content?: string;
  reasoning?: string;
  tool_calls?: ToolCall[];
  done?: boolean;
}
