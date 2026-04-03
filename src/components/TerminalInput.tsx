import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { COLORS, FONTS } from '../constants/theme';
import { Paperclip, Camera, Image as ImageIcon, X, Globe, Maximize2, Send } from 'lucide-react-native';
import { useImagePicker } from '../hooks/useImagePicker';

interface TerminalInputProps {
  onSend: (content: string, attachment?: { uri: string, type: string, base64?: string }) => void;
  onStop?: () => void;
  onCommand: (command: string, args: string[]) => void;
  customModels: { id: string; name: string }[];
  disabled?: boolean;
  onLayoutY?: (y: number) => void;
}

const SUGGESTIONS = [
  { cmd: 'chat/', desc: 'INIT_NEW_SESSION' },
  { cmd: 'history/', desc: 'LOG_ARCHIVE' },
  { cmd: 'settings/', desc: 'CONFIG_SYSTEM' },
  { cmd: 'clear/', desc: 'WIPE_CURRENT_LOG' },
  { cmd: 'model/', desc: 'SWITCH_AI_MODEL' },
  { cmd: 'search/', desc: 'WEB_SEARCH_QUERY' },
];

const MODEL_PRESETS = [
  { id: 'qwen/qwen3.6-plus:free', name: 'QWEN_3.6_PLUS' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'LLAMA_3.3_70B' },
  { id: 'google/gemma-2-9b-it:free', name: 'GEMMA_2_9B' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'MISTRAL_7B' },
];

export const TerminalInput = ({ onSend, onStop, onCommand, customModels, disabled, onLayoutY }: TerminalInputProps) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string, type: string, base64?: string } | null>(null);
  const [inputHeight, setInputHeight] = useState(40);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const { pickImage, takePhoto } = useImagePicker();

  const isCommand = text.startsWith('/') || text.endsWith('/');
  const isModelCmd = text.toLowerCase().startsWith('model/') || text.toLowerCase().startsWith('/model');
  const isSearchCmd = text.toLowerCase().startsWith('search/') || text.toLowerCase().startsWith('/search ');
  
  const showSuggestions = (text === '/' || (text.length > 0 && isCommand && !text.includes(' ') && !text.endsWith('/'))) && !isModelCmd;
  const showModelPresets = isModelCmd && !text.includes(' ');

  const allModels = [...MODEL_PRESETS, ...customModels];

  const handleAction = () => {
    if (disabled) {
      onStop?.();
      return;
    }

    if ((!text.trim() && !attachment)) return;
    
    const currentText = text.trim();
    const currentAttachment = attachment || undefined;
    
    setText('');
    setAttachment(null);
    setInputHeight(40);

    if (isSearchCmd) {
      let query = currentText;
      if (query.toLowerCase().startsWith('search/')) query = query.slice(7).trim();
      else if (query.toLowerCase().startsWith('/search')) query = query.slice(7).trim();
      if (query) {
        onCommand('search', query.split(' '));
      }
      return;
    }

    if (isCommand && onCommand) {
      let cleanText = currentText;
      if (currentText.startsWith('/')) cleanText = currentText.slice(1);
      else if (currentText.endsWith('/')) cleanText = currentText.slice(0, -1);
      
      const tokens = cleanText.trim().split(' ');
      const cmd = tokens[0].toLowerCase();
      const args = tokens.slice(1);
      onCommand(cmd, args);
    } else {
      onSend(currentText, currentAttachment);
    }
  };

  const selectSuggestion = (cmd: string) => {
    if (cmd === 'settings/' || cmd === 'chat/' || cmd === 'clear/' || cmd === 'history/') {
      onCommand(cmd.replace('/', ''), []);
      setText('');
    } else {
      setText(cmd);
    }
  };

  const showEditorButton = text.split('\n').length >= 3 || text.length > 100;

  return (
    <View style={styles.outerContainer} onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}>
      <Modal visible={isEditorVisible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.editorSafe} edges={['top', 'bottom']}>
          <View style={styles.editorHeader}>
            <View style={styles.editorHeaderLeft}>
              <Text style={styles.editorTitle}>SYSTEM_EDITOR_v1.0</Text>
              <Text style={styles.editorSubtitle}>// MODE: LONG_FORMAT_TEXT</Text>
            </View>
            <TouchableOpacity onPress={() => setIsEditorVisible(false)} style={styles.editorClose}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.editorInput}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            placeholder="TYPE_YOUR_THOUGHTS_HERE..."
            placeholderTextColor={COLORS.textDim}
          />
          <View style={styles.editorFooter}>
            <Text style={styles.charCount}>{text.length} CHARS</Text>
            <TouchableOpacity 
              style={styles.editorSend} 
              onPress={() => {
                setIsEditorVisible(false);
                handleAction();
              }}
            >
              <Send size={18} color="#000" />
              <Text style={styles.editorSendText}>COMMIT & SEND</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {showSuggestions && (
        <View style={styles.suggestionsBox}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity key={s.cmd} style={styles.suggestionItem} onPress={() => selectSuggestion(s.cmd)}>
              <Text style={styles.suggestionCmd}>{s.cmd}</Text>
              <Text style={styles.suggestionDesc}>// {s.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showModelPresets && (
        <View style={styles.suggestionsBox}>
          {allModels.map((m) => (
            <TouchableOpacity key={m.id} style={styles.suggestionItem} onPress={() => selectSuggestion(`model/ ${m.id}`)}>
              <Text style={styles.suggestionCmd}>{m.name.slice(0, 15)}</Text>
              <Text style={styles.suggestionDesc}>// {m.id.slice(0, 30)}...</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {attachment && (
        <View style={styles.previewContainer}>
          <View style={styles.previewBox}>
            <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeButton} onPress={() => setAttachment(null)}>
              <X size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.container, { height: Math.min(Math.max(64, inputHeight + 20), 200) }]}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => pickImage().then(r => {
            if (r) setAttachment({ uri: r.uri, type: r.type, base64: r.base64 || undefined });
          })} 
          disabled={disabled}
        >
          <ImageIcon size={20} color={COLORS.textDim} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          {isSearchCmd ? (
            <Globe size={18} color={COLORS.primary} style={styles.searchIcon} />
          ) : (
            <Text style={[styles.prompt, isCommand && styles.commandPrompt]}>{isCommand ? '$' : '>'}</Text>
          )}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={isSearchCmd ? "SEARCH_QUERY..." : (isCommand ? "COMMAND..." : "MESSAGE...")}
            placeholderTextColor={COLORS.textDim}
            style={[styles.input, isCommand && styles.commandInput, isSearchCmd && styles.searchInput, { height: Math.min(Math.max(40, inputHeight), 180) }]}
            multiline
            onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
            editable={!disabled}
            autoCapitalize="none"
          />
          {showEditorButton && (
            <TouchableOpacity onPress={() => setIsEditorVisible(true)} style={styles.maximizeBtn}>
              <Maximize2 size={16} color={COLORS.primaryDim} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleAction}
          disabled={!disabled && !text.trim() && !attachment}
          style={[styles.sendBtn, isCommand && styles.execBtn, isSearchCmd && styles.webBtn]}
        >
          <Text style={styles.sendBtnText}>{disabled ? 'STOP' : (isSearchCmd ? 'WEB' : (isCommand ? 'EXEC' : 'SEND'))}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  container: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 12 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4 },
  input: { flex: 1, color: COLORS.text, fontFamily: FONTS.mono, fontSize: 14, paddingVertical: 8, textAlignVertical: 'bottom' },
  iconButton: { padding: 8, marginBottom: 2 },
  prompt: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: 18, marginBottom: 10, marginRight: 6 },
  commandPrompt: { color: COLORS.success },
  commandInput: { color: COLORS.success },
  searchInput: { color: COLORS.primary },
  searchIcon: { marginBottom: 14, marginRight: 6 },
  maximizeBtn: { padding: 8, marginBottom: 4 },
  sendBtn: { borderWidth: 1, borderColor: COLORS.primaryDim, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 8, marginLeft: 8 },
  execBtn: { borderColor: COLORS.success },
  webBtn: { borderColor: COLORS.primary },
  sendBtnText: { color: COLORS.text, fontFamily: FONTS.monoBold, fontSize: 12 },
  suggestionsBox: { position: 'absolute', bottom: '100%', left: 0, right: 0, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.primary, padding: 8, maxHeight: 200 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  suggestionCmd: { color: COLORS.success, fontFamily: FONTS.monoBold, fontSize: 12, width: 100 },
  suggestionDesc: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: 10, flex: 1 },
  previewContainer: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row' },
  previewBox: { width: 60, height: 60, borderWidth: 1, borderColor: COLORS.primary, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  removeButton: { position: 'absolute', top: -8, right: -8, backgroundColor: COLORS.error, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  editorSafe: { flex: 1, backgroundColor: COLORS.background },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  editorHeaderLeft: { flex: 1 },
  editorTitle: { color: COLORS.primary, fontFamily: FONTS.monoBold, fontSize: 14 },
  editorSubtitle: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: 10, marginTop: 4 },
  editorClose: { padding: 8 },
  editorInput: { flex: 1, color: COLORS.text, fontFamily: FONTS.mono, fontSize: 16, padding: 20, textAlignVertical: 'top' },
  editorFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  charCount: { color: COLORS.textDim, fontFamily: FONTS.mono, fontSize: 10 },
  editorSend: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 4 },
  editorSendText: { color: '#000', fontFamily: FONTS.monoBold, fontSize: 12, marginLeft: 8 }
});
