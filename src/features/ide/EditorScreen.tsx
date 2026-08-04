import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { MessageSquare, Eye } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES } from "@/constants/theme";
import { SharedHeader } from "@/components/SharedHeader";
import { useIDEState } from "@/hooks/useIDEState";
import { useLocalFiles } from "@/hooks/useLocalFiles";
import { base64Service } from "@/services/base64Service";
import { ElcomLoader } from "@/components/ElcomLoader";

interface EditorScreenProps {
  onBack: () => void;
  onOpenChat?: () => void;
  onOpenDiff?: () => void;
  embedded?: boolean;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  onBack,
  onOpenChat,
  onOpenDiff,
  embedded = false,
}) => {
  const { selectedRepo, openFiles, activeFile, updateOpenFileContent } = useIDEState();
  const { writeLocalFile } = useLocalFiles();
  const debounceTimerRef = useRef<any>(null);

  const currentOpenFile = openFiles.find((f) => f.path === activeFile);

  const getLanguage = (path: string): string => {
    const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
    const map: Record<string, string> = {
      ".js": "javascript",
      ".ts": "typescript",
      ".tsx": "typescript",
      ".json": "json",
      ".html": "html",
      ".css": "css",
      ".md": "markdown",
      ".py": "python",
      ".sh": "shell",
    };
    return map[ext] || "plaintext";
  };

  const handleMessage = (event: any) => {
    const newContent = event.nativeEvent.data;
    if (activeFile && currentOpenFile && newContent !== currentOpenFile.content) {
      updateOpenFileContent(activeFile, newContent);

      // Debounce local filesystem save (1s)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(async () => {
        if (selectedRepo && activeFile) {
          try {
            await writeLocalFile(selectedRepo.name, activeFile, newContent);
          } catch (e) {
            console.error("EditorScreen: Debounced save failed", e);
          }
        }
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!currentOpenFile || !activeFile) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>NO_ACTIVE_FILE</Text>
      </SafeAreaView>
    );
  }

  const fileName = activeFile.substring(activeFile.lastIndexOf("/") + 1);
  const fileLang = getLanguage(activeFile);
  const base64Content = base64Service.encode(currentOpenFile.content);

  const htmlSource = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          html, body, #editor-container {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #0E0E0E;
            overflow: hidden;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js"></script>
      </head>
      <body>
        <div id="editor-container"></div>
        <script>
          // Base64 decode supporting UTF-8 strings
          function decodeBase64Utf8(str) {
            return decodeURIComponent(
              atob(str).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join('')
            );
          }

          require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});
          require(['vs/editor/editor.main'], function() {
            var initialValue = decodeBase64Utf8('${base64Content}');
            window.editor = monaco.editor.create(document.getElementById('editor-container'), {
              value: initialValue,
              language: '${fileLang}',
              theme: 'vs-dark',
              automaticLayout: true,
              fontSize: 13,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
              }
            });

            window.editor.onDidChangeModelContent(function() {
              var content = window.editor.getValue();
              window.ReactNativeWebView.postMessage(content);
            });
          });
        </script>
      </body>
    </html>
  `;

  const rightActions = !embedded
    ? [
        ...(onOpenChat ? [{ icon: <MessageSquare size={20} color={COLORS.primary} />, onPress: onOpenChat }] : []),
        ...(onOpenDiff ? [{ icon: <Eye size={20} color={COLORS.success} />, onPress: onOpenDiff }] : []),
      ]
    : undefined;

  return (
    <View style={styles.safe}>
      <SharedHeader
        title={fileName.toUpperCase()}
        subtitle={activeFile}
        onBack={onBack}
        rightActions={rightActions && rightActions.length > 0 ? rightActions : undefined}
        variant="floating"
      />

      <View style={[styles.editorContainer, { paddingTop: 56 }]}>
        <WebView
          source={{ html: htmlSource }}
          onMessage={handleMessage}
          style={styles.webView}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          renderLoading={() => (
            <View style={styles.loaderWrapper}>
              <ElcomLoader size="large" />
            </View>
          )}
          startInLoadingState={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  editorContainer: { flex: 1, backgroundColor: "#0E0E0E" },
  webView: { flex: 1, backgroundColor: "#0E0E0E" },
  loaderWrapper: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#0E0E0E",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    textAlign: "center",
    marginTop: 48,
  },
});
