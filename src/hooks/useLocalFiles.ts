import { useCallback } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { FileNode } from "../types/ide";
import { githubService } from "../services/githubService";
import { base64Service } from "../services/base64Service";

const REPOS_DIR = `${FileSystem.documentDirectory}repos/`;

export const useLocalFiles = () => {
  const getRepoPath = useCallback((repoName: string) => {
    return `${REPOS_DIR}${repoName}/`;
  }, []);

  const getFilePath = useCallback((repoName: string, path: string) => {
    return `${REPOS_DIR}${repoName}/${path}`;
  }, []);

  const ensureDir = useCallback(async (dirUri: string) => {
    const dirInfo = await FileSystem.getInfoAsync(dirUri);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }
  }, []);

  const writeLocalFile = useCallback(
    async (repoName: string, path: string, content: string) => {
      const fileUri = getFilePath(repoName, path);
      const lastSlashIdx = fileUri.lastIndexOf("/");
      const dirUri = fileUri.substring(0, lastSlashIdx + 1);

      await ensureDir(dirUri);
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    },
    [getFilePath, ensureDir],
  );

  const readLocalFile = useCallback(
    async (repoName: string, path: string): Promise<string> => {
      const fileUri = getFilePath(repoName, path);
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error(`FILE_NOT_FOUND: ${path}`);
      }
      return FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    },
    [getFilePath],
  );

  const cloneRepository = useCallback(
    async (
      token: string,
      owner: string,
      repoName: string,
      files: FileNode[],
      onProgress: (progress: number) => void,
    ) => {
      const repoDir = getRepoPath(repoName);
      await ensureDir(repoDir);

      const blobs = files.filter((f) => f.type === "blob");
      const totalBlobs = blobs.length;
      let completed = 0;
      let totalToDownload = 0;

      // Only download files not already on disk (preserves AI-edited and created files)
      const fileExists = async (path: string): Promise<boolean> => {
        try {
          const info = await FileSystem.getInfoAsync(getFilePath(repoName, path));
          return info.exists;
        } catch {
          return false;
        }
      };

      const missingFiles: FileNode[] = [];
      for (const f of blobs) {
        if (!(await fileExists(f.path))) {
          missingFiles.push(f);
        }
      }
      totalToDownload = missingFiles.length;

      const limit = 5;
      const queue = [...missingFiles];

      const updateProgress = () => {
        completed++;
        if (totalToDownload > 0) {
          onProgress(completed / totalToDownload);
        } else {
          onProgress(1);
        }
      };

      const worker = async () => {
        while (queue.length > 0) {
          const file = queue.shift();
          if (!file) break;

          try {
            const { content: base64Content } = await githubService.getFileContent(
              token,
              owner,
              repoName,
              file.path,
            );
            const rawContent = base64Service.decode(base64Content);
            await writeLocalFile(repoName, file.path, rawContent);
          } catch (error) {
            console.error(`useLocalFiles: Failed to clone file ${file.path}`, error);
          } finally {
            updateProgress();
          }
        }
      };

      if (totalToDownload > 0) {
        const workers = Array.from({ length: Math.min(limit, totalToDownload) }, () => worker());
        await Promise.all(workers);
      }
    },
    [getRepoPath, ensureDir, writeLocalFile],
  );

  const deleteLocalRepo = useCallback(
    async (repoName: string) => {
      const repoDir = getRepoPath(repoName);
      const dirInfo = await FileSystem.getInfoAsync(repoDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(repoDir, { idempotent: true });
      }
    },
    [getRepoPath],
  );

  return {
    getRepoPath,
    getFilePath,
    writeLocalFile,
    readLocalFile,
    cloneRepository,
    deleteLocalRepo,
  };
};
