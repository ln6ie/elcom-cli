export type ServerAuthType = "password" | "private_key";

export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: ServerAuthType;
  fingerprint?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServerCredentials {
  password?: string;
  privateKey?: string;
  passphrase?: string;
}
