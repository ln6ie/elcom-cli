import * as Diff from "diff";

export interface DiffLineInfo {
  id: string;
  type: "added" | "removed" | "normal";
  content: string;
}

export const diffService = {
  computeDiff(oldContent: string, newContent: string): DiffLineInfo[] {
    const diffs = Diff.diffLines(oldContent, newContent);
    const result: DiffLineInfo[] = [];
    let lineCounter = 0;

    diffs.forEach((part) => {
      // Split the text into lines but keep empty lines
      const lines = part.value.split(/\r?\n/);
      
      // If the last element is empty because of a trailing newline, remove it
      if (lines.length > 1 && lines[lines.length - 1] === "") {
        lines.pop();
      }

      lines.forEach((line) => {
        lineCounter++;
        const type = part.added
          ? "added"
          : part.removed
            ? "removed"
            : "normal";

        result.push({
          id: `${type}-${lineCounter}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          content: line,
        });
      });
    });

    return result;
  },
};
