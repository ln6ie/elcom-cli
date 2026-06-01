import * as FileSystem from "expo-file-system/legacy";

export const attachmentService = {
  async getBase64(uri: string): Promise<string | null> {
    try {
      return await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    } catch (e) {
      return null;
    }
  },

  async prepareMessageWithBase64(msg: {
    attachment_uri?: string;
    attachment_type?: string;
    content: string;
    role: string;
    id: string;
    reasoning?: string;
  }) {
    const message: any = {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      reasoning: msg.reasoning,
    };

    if (msg.attachment_uri) {
      const base64 = await this.getBase64(msg.attachment_uri);
      if (base64) {
        message.attachment = {
          uri: msg.attachment_uri,
          type: msg.attachment_type || "image/jpeg",
          base64,
        };
      }
    }
    return message;
  },
};
