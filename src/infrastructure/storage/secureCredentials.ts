import * as SecureStore from "expo-secure-store";

export interface ServerCredentials {
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

const keyFor = (serverId: string) => `elcomcli.vps.credentials.${serverId}`;

export async function saveServerCredentials(serverId: string, credentials: ServerCredentials) {
  await SecureStore.setItemAsync(keyFor(serverId), JSON.stringify(credentials));
}

export async function getServerCredentials(serverId: string): Promise<ServerCredentials | null> {
  const value = await SecureStore.getItemAsync(keyFor(serverId));
  return value ? (JSON.parse(value) as ServerCredentials) : null;
}

export async function deleteServerCredentials(serverId: string) {
  await SecureStore.deleteItemAsync(keyFor(serverId));
}
