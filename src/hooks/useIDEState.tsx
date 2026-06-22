import React, { createContext, useContext, useState, useCallback } from "react";
import { GitHubRepo, FileNode, OpenFile, GitHubUser } from "../types/ide";

interface IDEState {
  githubToken: string | null;
  currentUser: GitHubUser | null;
  selectedRepo: GitHubRepo | null;
  fileTree: FileNode[];
  openFiles: OpenFile[];
  activeFile: string | null;
  isCloning: boolean;
  cloneProgress: number;
}

interface IDEContextType extends IDEState {
  setGithubToken: (token: string | null) => void;
  setCurrentUser: (user: GitHubUser | null) => void;
  setSelectedRepo: (repo: GitHubRepo | null) => void;
  setFileTree: (tree: FileNode[]) => void;
  setOpenFiles: React.Dispatch<React.SetStateAction<OpenFile[]>>;
  setActiveFile: (path: string | null) => void;
  setIsCloning: (cloning: boolean) => void;
  setCloneProgress: (progress: number) => void;
  openFileInEditor: (path: string, content: string, originalContent: string, sha: string) => void;
  closeFileInEditor: (path: string) => void;
  updateOpenFileContent: (path: string, newContent: string) => void;
  clearIDEState: () => void;
}

const IDEContext = createContext<IDEContextType | undefined>(undefined);

// مزود حالة بيئة التطوير المتكاملة
export const IDEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);

  // فتح ملف في المحرر (يحدث المحتوى إذا كان موجوداً)
  const openFileInEditor = useCallback((path: string, content: string, originalContent: string, sha: string) => {
    setOpenFiles((prev) => {
      const exists = prev.some((f) => f.path === path);
      if (exists) {
        return prev.map((f) =>
          f.path === path ? { ...f, content, originalContent, sha } : f
        );
      }
      return [...prev, { path, content, originalContent, sha }];
    });
    setActiveFile(path);
  }, []);

  // إغلاق ملف في المحرر
  const closeFileInEditor = useCallback((path: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.path !== path));
    setActiveFile((prev) => {
      if (prev !== path) return prev;
      return null;
    });
  }, []);

  // تحديث محتوى الملف المفتوح
  const updateOpenFileContent = useCallback((path: string, newContent: string) => {
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: newContent } : f)),
    );
  }, []);

  // مسح حالة بيئة التطوير
  const clearIDEState = useCallback(() => {
    setSelectedRepo(null);
    setFileTree([]);
    setOpenFiles([]);
    setActiveFile(null);
    setIsCloning(false);
    setCloneProgress(0);
  }, []);

  return (
    <IDEContext.Provider
      value={{
        githubToken,
        currentUser,
        selectedRepo,
        fileTree,
        openFiles,
        activeFile,
        isCloning,
        cloneProgress,
        setGithubToken,
        setCurrentUser,
        setSelectedRepo,
        setFileTree,
        setOpenFiles,
        setActiveFile,
        setIsCloning,
        setCloneProgress,
        openFileInEditor,
        closeFileInEditor,
        updateOpenFileContent,
        clearIDEState,
      }}
    >
      {children}
    </IDEContext.Provider>
  );
};

// خطاف استخدام حالة بيئة التطوير
export const useIDEState = () => {
  const context = useContext(IDEContext);
  if (context === undefined) {
    throw new Error("useIDEState must be used within an IDEProvider");
  }
  return context;
};
