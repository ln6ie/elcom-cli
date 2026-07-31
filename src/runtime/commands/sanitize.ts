/** Only permit identifiers accepted by provider actions. Never interpolate raw UI input. */
export function shellIdentifier(value: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:@/-]*$/.test(value)) throw new Error("INVALID_RESOURCE_IDENTIFIER");
  return value;
}
