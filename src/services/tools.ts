import { githubService } from "./githubService";
import { base64Service } from "./base64Service";
import * as FileSystem from "expo-file-system/legacy";

const REPOS_DIR = `${FileSystem.documentDirectory}repos/`;

async function ensureDir(dirUri: string) {
  const dirInfo = await FileSystem.getInfoAsync(dirUri);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
}

async function writeLocalFile(repoName: string, path: string, content: string) {
  const fileUri = `${REPOS_DIR}${repoName}/${path}`;
  const lastSlashIdx = fileUri.lastIndexOf("/");
  const dirUri = fileUri.substring(0, lastSlashIdx + 1);
  await ensureDir(dirUri);
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

async function readLocalFile(repoName: string, path: string): Promise<string | null> {
  try {
    const fileUri = `${REPOS_DIR}${repoName}/${path}`;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) return null;
    return FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch {
    return null;
  }
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolArgs {
  file_path?: string;
  old_string?: string;
  new_string?: string;
  content?: string;
  pattern?: string;
  include?: string;
  offset?: number;
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _fileCache: { path: string; content: string; sha?: string }[] = [];

export function setFileCache(files: { path: string; content: string; sha?: string }[]) {
  _fileCache = files;
}

export interface ToolExecutionResult {
  result: string;
  originalContent?: string;
  sha?: string;
}

export async function executeTool(
  toolCall: ToolCall,
  repoOwner: string,
  repoName: string,
  token: string,
  openFiles: { path: string; content: string; sha?: string }[],
): Promise<ToolExecutionResult> {
  const args: ToolArgs = JSON.parse(toolCall.function.arguments);

  switch (toolCall.function.name) {
    case "read": {
      const { content, sha } = await getFileContent(args.file_path || "", repoOwner, repoName, token, openFiles);
      const result = formatReadResult(args, content);
      return { result, originalContent: content, sha };
    }
    case "edit":
      return await executeEdit(args, repoOwner, repoName, token);
    case "create":
      return await executeCreate(args, repoName);
    case "grep":
      return { result: await executeGrep(args, openFiles) };
    case "glob":
      return { result: await executeGlob(args, openFiles) };
    default:
      return { result: `Unknown tool: ${toolCall.function.name}` };
  }
}

async function getFileContent(
  filePath: string,
  repoOwner: string,
  repoName: string,
  token: string,
  openFiles: { path: string; content: string; sha?: string }[],
): Promise<{ content: string; sha?: string; fromCache: boolean }> {
  const openFile = openFiles.find((f) => f.path === filePath);
  if (openFile) {
    // Sync _fileCache so executeEdit can find the file when editing
    const cached = _fileCache.find((f) => f.path === filePath);
    if (cached) {
      cached.content = openFile.content;
      cached.sha = openFile.sha;
    } else {
      _fileCache.push({ path: filePath, content: openFile.content, sha: openFile.sha });
    }
    return { content: openFile.content, sha: openFile.sha, fromCache: true };
  }

  const cached = _fileCache.find((f) => f.path === filePath);
  if (cached) return { content: cached.content, sha: cached.sha, fromCache: true };

  // Try local file system first
  const localContent = await readLocalFile(repoName, filePath);
  if (localContent !== null) {
    _fileCache.push({ path: filePath, content: localContent });
    return { content: localContent, fromCache: true };
  }

  try {
    const fileData = await githubService.getFileContent(token, repoOwner, repoName, filePath);
    const decoded = base64Service.decode(fileData.content);
    _fileCache.push({ path: filePath, content: decoded, sha: fileData.sha });
    return { content: decoded, sha: fileData.sha, fromCache: false };
  } catch (e: any) {
    return { content: `Error: ${e.message || "File not found"}`, fromCache: false };
  }
}

function formatReadResult(args: ToolArgs, content: string): string {
  const filePath = args.file_path || "";
  const lines = content.split("\n");
  const totalLines = lines.length;
  const offset = args.offset || 1;
  const limit = args.limit || totalLines;
  const startIdx = Math.max(0, offset - 1);
  const endIdx = Math.min(startIdx + limit, totalLines);
  const selectedLines = lines.slice(startIdx, endIdx);

  let result = `File: ${filePath} (${totalLines} lines)`;
  if (args.offset || args.limit) {
    result += ` [lines ${offset}-${endIdx}]`;
  }
  result += "\n\n";
  result += selectedLines.map((line: string, i: number) => {
    const lineNum = startIdx + i + 1;
    return `${String(lineNum).padStart(4, " ")} | ${line}`;
  }).join("\n");

  return result;
}

async function executeEdit(
  args: ToolArgs,
  repoOwner: string,
  repoName: string,
  token: string,
): Promise<ToolExecutionResult> {
  const filePath = args.file_path || "";
  const oldString = args.old_string || "";
  const newString = args.new_string || "";

  if (!filePath) return { result: "Error: file_path is required" };
  if (!oldString) return { result: "Error: old_string is required" };

  const cacheEntry = _fileCache.find((f) => f.path === filePath);
  if (!cacheEntry) return { result: `Error: File ${filePath} has not been read yet. Use the read tool first.` };

  const occurrences = cacheEntry.content.split(oldString).length - 1;
  if (occurrences === 0) return { result: `Error: The specified text was not found in ${filePath}. Read the file again to get the exact content.` };
  if (occurrences > 1) return { result: `Error: Found ${occurrences} occurrences in ${filePath}. The edit must match exactly one location. Provide more context in old_string.` };

  const originalContent = cacheEntry.content;
  const sha = cacheEntry.sha;
  cacheEntry.content = cacheEntry.content.replace(oldString, newString);

  // Write locally only (user commits manually via CommitModal)
  try {
    await writeLocalFile(repoName, filePath, cacheEntry.content);
    return { result: `Edited ${filePath}. Changes saved locally. Use git to push when ready.`, originalContent, sha };
  } catch (e: any) {
    return { result: `Warning: Local write failed (${e.message}). Edit applied in memory only.`, originalContent, sha };
  }
}

async function executeCreate(
  args: ToolArgs,
  repoName: string,
): Promise<ToolExecutionResult> {
  const filePath = args.file_path || "";
  const content = args.content || "";

  if (!filePath) return { result: "Error: file_path is required" };
  if (!content) return { result: "Error: content is required" };

  _fileCache.push({ path: filePath, content });

  try {
    await writeLocalFile(repoName, filePath, content);
    return { result: `Created file ${filePath}` };
  } catch (e: any) {
    return { result: `Created file ${filePath} (in memory, local write failed: ${e.message})` };
  }
}

async function executeGrep(
  args: ToolArgs,
  openFiles: { path: string; content: string }[],
): Promise<string> {
  const pattern = args.pattern || "";
  if (!pattern) return "Error: pattern is required";

  const includeFilter = args.include ? new RegExp(args.include.replace(/\*/g, ".*")) : null;
  const searchRegex = new RegExp(pattern, "gi");
  const results: string[] = [];

  const filesToSearch = openFiles.length > 0 ? openFiles : _fileCache;
  if (filesToSearch.length === 0) return "No files available to search. Read some files first.";

  for (const file of filesToSearch) {
    if (includeFilter && !includeFilter.test(file.path)) continue;
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (searchRegex.test(lines[i])) {
        results.push(`${file.path}:${i + 1}: ${lines[i].trim()}`);
      }
    }
  }

  if (results.length === 0) return `No matches found for pattern: ${pattern}`;
  return results.slice(0, 50).join("\n") + (results.length > 50 ? `\n... and ${results.length - 50} more matches` : "");
}

async function executeGlob(
  args: ToolArgs,
  openFiles: { path: string; content: string }[],
): Promise<string> {
  const pattern = args.pattern || "";
  if (!pattern) return "Error: pattern is required";

  const regexPattern = pattern
    .replace(/\*\*/g, "$$$$")
    .replace(/\*/g, "[^/]*")
    .replace(/\$\$\$\$/g, ".*");
  const regex = new RegExp(`^${regexPattern}$`);

  const files = openFiles.length > 0 ? openFiles.map((f) => f.path) : _fileCache.map((f) => f.path);
  const matches = files.filter((f: string) => regex.test(f));

  if (matches.length === 0) return `No files match pattern: ${pattern}`;
  return matches.join("\n");
}

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "read",
      description: "Read file contents from the repository. Returns content with line numbers. Use offset and limit to read specific sections of large files.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Relative path to the file from repository root" },
          offset: { type: "number", description: "Starting line number (1-based). Optional - reads from line 1 if not specified." },
          limit: { type: "number", description: "Number of lines to read. Optional - reads entire file if not specified." },
        },
        required: ["file_path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit",
      description: "Replace exact text in a file. The old_string must match EXACTLY and appear only ONCE in the file. Always read the file first to get the exact text to replace.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Relative path to the file" },
          old_string: { type: "string", description: "The exact text to find and replace (must be unique in the file)" },
          new_string: { type: "string", description: "The new text to replace with" },
        },
        required: ["file_path", "old_string", "new_string"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create",
      description: "Create a new file with the given content. Use this for new files only.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Relative path for the new file" },
          content: { type: "string", description: "Full file content" },
        },
        required: ["file_path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "grep",
      description: "Search file contents using a regex pattern. Returns matching lines with file paths and line numbers.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Regex pattern to search for" },
          include: { type: "string", description: "Optional file glob filter (e.g. *.ts, *.jsx) to limit search scope" },
        },
        required: ["pattern"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "glob",
      description: "Find files matching a glob pattern. Use this to discover file locations in the repository.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Glob pattern (e.g. **/*.ts, src/**/*.{tsx,jsx})" },
        },
        required: ["pattern"],
      },
    },
  },
];

export function getToolSystemPrompt(): string {
  return `
لديك الأدوات التالية للتفاعل مع الكود:

- read(file_path, offset?, limit?): قراءة محتوى ملف مع أرقام الأسطر
- edit(file_path, old_string, new_string): استبدال نص دقيق في ملف (يجب أن يكون النص فريداً)
- create(file_path, content): إنشاء ملف جديد
- grep(pattern, include?): البحث في محتوى الملفات باستخدام regex
- glob(pattern): إيجاد الملفات المطابقة لنمط glob

القواعد:
1. اقرأ الملف دائماً قبل تعديله
2. استخدم grep لإيجاد الأنماط البرمجية قبل إجراء التغييرات
3. أداة edit تتطلب النص المطابق تماماً - اقرأ الملف أولاً لتحصل عليه
4. إذا فشل التعديل، اقرأ الملف مجدداً لتحصل على المحتوى الحالي
5. بعد إجراء التغييرات، لخّص ما تم تعديله باختصار
6. استخدم glob لاكتشاف مواقع الملفات
7. عند إنشاء ملفات جديدة، قدم المحتوى كاملاً - لا تختصر أو تحذف
8. الملفات تُحفظ محلياً فقط. المستخدم سيرفعها إلى GitHub يدوياً لاحقاً
9. للملفات الكبيرة، استخدم read مع offset و limit لقراءة جزء صغير (50-100 سطر) بدلاً من قراءة الملف بالكامل
10. أداة edit تستبدل النص المطابق فقط - لا تقم بإعادة كتابة الملف بالكامل
`;
}
