function toBinaryString(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

export const base64Service = {
  encode(str: string): string {
    const bytes = new TextEncoder().encode(str);
    return btoa(toBinaryString(bytes));
  },

  decode(str: string): string {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  },
};
