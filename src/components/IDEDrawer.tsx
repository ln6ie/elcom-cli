import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FolderGit, LogOut, Search, ChevronLeft } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "../constants/theme";
import { useGitHub } from "../hooks/useGitHub";
import { useIDEState } from "../hooks/useIDEState";
import { useLocalFiles } from "../hooks/useLocalFiles";
import { githubService } from "../services/githubService";
import { GithubConnect } from "./GithubConnect";
import { FileTreeItem } from "./FileTreeItem";
import { CodeViewer } from "./CodeViewer";
import { GitHubRepo, FileNode, OpenFile } from "../types/ide";

interface IDEDrawerProps {
  onClose: () => void;
  onSelectFile: (path: string) => void;
  openFiles: OpenFile[];
}

export const IDEDrawer: React.FC<IDEDrawerProps> = ({ onClose, onSelectFile, openFiles }) => {
  const { token, user, isLoading: authLoading, loginWithOAuth, loginWithToken, logout } = useGitHub();
  const {
    selectedRepo,
    fileTree,
    isCloning,
    cloneProgress,
    setGithubToken,
    setCurrentUser,
    setSelectedRepo,
    setFileTree,
    setIsCloning,
    setCloneProgress,
    clearIDEState,
  } = useIDEState();

  const { cloneRepository, readLocalFile } = useLocalFiles();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});
  const [codeViewer, setCodeViewer] = useState<{ visible: boolean; path: string; content: string }>({
    visible: false,
    path: "",
    content: "",
  });

  const modifiedFiles = React.useMemo(
    () => openFiles.filter((f) => f.content !== f.originalContent),
    [openFiles],
  );
  const modifiedPaths = React.useMemo(
    () => new Set(modifiedFiles.map((f) => f.path)),
    [modifiedFiles],
  );

  useEffect(() => {
    setGithubToken(token);
    setCurrentUser(user);
    if (!authLoading && !token) {
      setRepos([]);
      clearIDEState();
    }
  }, [token, user, authLoading]);

  useEffect(() => {
    if (token) loadRepos();
  }, [token]);

  const loadRepos = async () => {
    if (!token) return;
    setIsLoadingRepos(true);
    try {
      const data = await githubService.getRepos(token);
      setRepos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleSelectRepo = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setIsCloning(true);
    setCloneProgress(0);
    try {
      const tree = await githubService.getRepoTree(token!, repo.owner.login, repo.name);
      const sortedTree = [...tree].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "tree" ? -1 : 1;
        }
        return a.path.localeCompare(b.path);
      });
      setFileTree(sortedTree);
      await cloneRepository(token!, repo.owner.login, repo.name, sortedTree, (p) => setCloneProgress(p));
    } catch (e) {
      console.error(e);
    } finally {
      setIsCloning(false);
    }
  };

  const handleFilePress = async (node: FileNode) => {
    onSelectFile(node.path);
    try {
      let content = "";
      const tracked = openFiles.find((f) => f.path === node.path);
      if (tracked) {
        content = tracked.content;
      } else if (selectedRepo) {
        const localContent = await readLocalFile(selectedRepo.name, node.path);
        if (localContent !== null) content = localContent;
        else content = "// File content not available locally.\n// Pull the repository to fetch this file.";
      }
      setCodeViewer({ visible: true, path: node.path, content });
    } catch (e) {
      setCodeViewer({ visible: true, path: node.path, content: "// Error loading file content." });
    }
  };

  const toggleDirectory = (path: string) => {
    setExpandedDirs((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const isNodeVisible = (node: FileNode): boolean => {
    const parts = node.path.split("/");
    if (parts.length === 1) return true;
    let parentPath = "";
    for (let i = 0; i < parts.length - 1; i++) {
      parentPath = parentPath ? `${parentPath}/${parts[i]}` : parts[i];
      if (!expandedDirs[parentPath]) return false;
    }
    return true;
  };

  const sortedFileTree = React.useMemo(
    () => [...fileTree].sort((a, b) => {
      if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
      return a.path.localeCompare(b.path);
    }),
    [fileTree],
  );
  const filteredRepos = repos.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const visibleNodes = sortedFileTree.filter(isNodeVisible);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <FolderGit size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
        )}
        <Text style={styles.title}>IDE_WORKSPACE</Text>
        {modifiedFiles.length > 0 && (
          <View style={styles.modifiedBadge}>
            <Text style={styles.modifiedBadgeText}>{modifiedFiles.length}</Text>
          </View>
        )}
        {token && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={16} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>

      {authLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : !token ? (
        <GithubConnect loginWithOAuth={loginWithOAuth} loginWithToken={loginWithToken} />
      ) : isCloning ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.progressText}>CLONING_REPO: {Math.round(cloneProgress * 100)}%</Text>
        </View>
      ) : selectedRepo ? (
        <View style={styles.flex1}>
          <TouchableOpacity style={styles.repoMeta} onPress={clearIDEState}>
            <ChevronLeft size={16} color={COLORS.primaryDim} />
            <Text style={styles.repoName} numberOfLines={1}>{selectedRepo.name.toUpperCase()}</Text>
          </TouchableOpacity>
          <FlatList
            data={visibleNodes}
            keyExtractor={(item) => item.path}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const parts = item.path.split("/");
              const name = parts[parts.length - 1];
              const level = parts.length - 1;
              return (
                <FileTreeItem
                  node={item}
                  name={name}
                  level={level}
                  isExpanded={!!expandedDirs[item.path]}
                  isModified={modifiedPaths.has(item.path)}
                  onToggle={() => toggleDirectory(item.path)}
                  onSelect={() => handleFilePress(item)}
                />
              );
            }}
          />
        </View>
      ) : (
        <View style={styles.flex1}>
          <View style={styles.searchRow}>
            <Search size={14} color={COLORS.textDim} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search repos..."
              placeholderTextColor={COLORS.textDim}
              autoCapitalize="none"
            />
          </View>
          {isLoadingRepos ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredRepos}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.repoCard} onPress={() => handleSelectRepo(item)}>
                  <Text style={styles.repoCardTitle}>{item.name}</Text>
                  <Text style={styles.repoCardLang}>{item.language || "Plain Text"}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      <CodeViewer
        visible={codeViewer.visible}
        filePath={codeViewer.path}
        content={codeViewer.content}
        onClose={() => setCodeViewer((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface, borderRightWidth: 1, borderRightColor: COLORS.border },
  avatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  flex1: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { flex: 1, color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.body },
  modifiedBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    marginRight: 8,
  },
  modifiedBadgeText: {
    color: "#0E0E0E",
    fontFamily: FONTS.monoBold,
    fontSize: 10,
  },
  logoutBtn: { padding: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  progressText: { marginTop: 12, color: COLORS.primaryDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small },
  repoMeta: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  repoName: { flex: 1, color: COLORS.success, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.label },
  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: { flex: 1, color: COLORS.text, fontFamily: FONTS.mono, fontSize: FONT_SIZES.small, padding: 0 },
  repoCard: { padding: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background, borderRadius: 4, marginBottom: 8 },
  repoCardTitle: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: FONT_SIZES.small },
  repoCardLang: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: FONT_SIZES.tiny, marginTop: 4 },
});
