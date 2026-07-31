export interface CommandDefinition<TVersion = unknown> {
  id: string;
  timeoutMs: number;
  maxOutputBytes: number;
  build: (version?: TVersion) => string;
}

export interface CommandBatch {
  id: string;
  timeoutMs: number;
  maxOutputBytes: number;
  build: () => string;
}
