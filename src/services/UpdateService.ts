import Constants from "expo-constants";

export interface UpdateInfo {
  latestVersion: string;
  minimumVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
  updatedAt: string;
}

export type UpdateStatus =
  | "UP_TO_DATE"
  | "UPDATE_AVAILABLE"
  | "FORCE_UPDATE_REQUIRED"
  | "CHECK_FAILED";

import { env } from "./env";

const VERSION_ENDPOINT = env.EXPO_PUBLIC_UPDATE_URL;

export class UpdateService {
  static async checkUpdate(): Promise<{
    status: UpdateStatus;
    info?: UpdateInfo;
  }> {
    try {
      const response = await fetch(`${VERSION_ENDPOINT}?t=${Date.now()}`);
      if (!response.ok) throw new Error("FETCH_FAILED");

      const info: UpdateInfo = await response.json();
      const currentVersion = Constants.expoConfig?.version || "0.0.0";

      if (this.compareVersions(currentVersion, info.minimumVersion) < 0) {
        return { status: "FORCE_UPDATE_REQUIRED", info };
      }

      if (this.compareVersions(currentVersion, info.latestVersion) < 0) {
        return { status: "UPDATE_AVAILABLE", info };
      }

      return { status: "UP_TO_DATE" };
    } catch (error) {
      console.error("UpdateCheck: Failed", error);
      return { status: "CHECK_FAILED" };
    }
  }

  /**
   * Compares two semantic version strings.
   * Returns:
   *  - 1 if v1 > v2
   *  - -1 if v1 < v2
   *  - 0 if v1 == v2
   */
  private static compareVersions(v1: string, v2: string): number {
    const p1 = v1.split(".").map(Number);
    const p2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }

    return 0;
  }
}
