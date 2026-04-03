import { View, TextInput, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { useState } from 'react';
import { COLORS, FONTS } from '../constants/theme';
import { Paperclip, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { useImagePicker } from '../hooks/useImagePicker';

interface TerminalInputProps {
  onSend: (content: string, attachment?: { uri: string, type: string, base64?: string }) => void;
  onCommand: (command: string, args: string[]) => void;
  customModels: { id: string; name: string }[];
  disabled?: boolean;
}

const SUGGESTIONS = [
  { cmd: 'chat/', desc: 'INIT_NEW_SESSION' },
  { cmd: 'history/', desc: 'LOG_ARCHIVE' },
  { cmd: 'settings/', desc: 'CONFIG_SYSTEM' },
  { cmd: 'clear/', desc: 'WIPE_CURRENT_LOG' },
  { cmd: 'model/', desc: 'SWITCH_AI_MODEL' },
];

const MODEL_PRESETS = [
  { id: 'qwen/qwen3.6-plus:free', name: 'QWEN_3.6_PLUS' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'LLAMA_3.3_70B' },
  { id: 'google/gemma-2-9b-it:free', name: 'GEMMA_2_9B' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'MISTRAL_7B' },
];

export const TerminalInput = ({ onSend, onCommand, customModels, disabled }: TerminalInputProps) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string, type: string, base64?: string } | null>(null);
  const { pickImage, takePhoto } = useImagePicker();

  const isCommand = text.startsWith('/') || text.endsWith('/');
  const isModelCmd = text.toLowerCase().startsWith('model/') || text.toLowerCase().startsWith('/model');
  
  const showSuggestions = (text === '/' || (text.length > 0 && isCommand && !text.includes(' ') && !text.endsWith('/'))) && !isModelCmd;
  const showModelPresets = isModelCmd && !text.includes(' ');

  const allModels = [...MODEL_PRESETS, ...customModels];

  const handleAttach = async () => {
    const result = await pickImage();
    if (result) {
      setAttachment({
        uri: result.uri,
        type: result.type,
        base64: result.base64 || undefined
      });
    }
  };

  const handleCamera = async () => {
    const result = await takePhoto();
    if (result) {
      setAttachment({
        uri: result.uri,
        type: result.type,
        base64: result.base64 || undefined
      });
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !attachment) || disabled) return;
    
    if (isCommand && onCommand) {
      let cleanText = text;
      if (text.startsWith('/')) cleanText = text.slice(1);
      else if (text.endsWith('/')) cleanText = text.slice(0, -1);
      
      const tokens = cleanText.trim().split(' ');
      const cmd = tokens[0].toLowerCase();
      const args = tokens.slice(1);
      onCommand(cmd, args);
    } else {
      onSend(text.trim(), attachment || undefined);
    }
    setText('');
    setAttachment(null);
  };

  const selectSuggestion = (cmd: string) => {
    setText(cmd);
  };

  return (
    <View style={styles.outerContainer}>
      {showSuggestions && (
        <View style={styles.suggestionsBox}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity 
              key={s.cmd} 
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(s.cmd)}
            >
              <Text style={styles.suggestionCmd}>{s.cmd}</Text>
              <Text style={styles.suggestionDesc}>// {s.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showModelPresets && (
        <View style={styles.suggestionsBox}>
          {allModels.map((m) => (
            <TouchableOpacity 
              key={m.id} 
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(`model/ ${m.id}`)}
            >
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
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={() => setAttachment(null)}
            >
              <X size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.container}>
        <TouchableOpacity style={styles.iconButton} onPress={handleAttach}>
          <ImageIcon size={18} color={COLORS.textDim} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton} onPress={handleCamera}>
          <Camera size={18} color={COLORS.textDim} />
        </TouchableOpacity>

        <Text style={[styles.prompt, isCommand && styles.commandPrompt]}>
          {isCommand ? '$' : '>'}
        </Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={isCommand ? "ENTER_COMMAND..." : "ENTER_PROMPT..."}
          placeholderTextColor={isCommand ? COLORS.success : COLORS.textDim}
          style={[styles.input, isCommand && styles.commandInput]}
          multiline={false}
          editable={!disabled}
          onSubmitEditing={handleSend}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={disabled || (!text.trim() && !attachment)}
          activeOpacity={0.7}
          style={[
            styles.button,
            (disabled || (!text.trim() && !attachment)) && styles.buttonDisabled,
            isCommand && styles.commandButton,
          ]}
        >
          <Text style={[styles.buttonText, isCommand && styles.commandButtonText]}>
            {isCommand ? 'EXEC' : 'RUN'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'relative',
  },
  suggestionsBox: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
    padding: 8,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suggestionCmd: {
    color: COLORS.success,
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    width: 100,
  },
  suggestionDesc: {
    color: COLORS.textDim,
    fontFamily: FONTS.mono,
    fontSize: 10,
    flex: 1,
  },
  previewContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
  },
  previewBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: COLORS.primary,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 6,
    marginRight: 4,
  },
  prompt: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 18,
    marginRight: 8,
    marginLeft: 4,
  },
  commandPrompt: {
    color: COLORS.success,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 13,
    height: 40,
    padding: 0,
  },
  commandInput: {
    color: COLORS.success,
  },
  button: {
    marginLeft: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 1,
  },
  commandButton: {
    borderColor: COLORS.success,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 11,
  },
  commandButtonText: {
    color: COLORS.success,
  },
});
