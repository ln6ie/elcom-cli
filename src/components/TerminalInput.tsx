import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { COLORS, FONTS } from '../constants/theme';

interface TerminalInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export const TerminalInput = ({ onSend, disabled }: TerminalInputProps) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>&#10095;</Text>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="ENTER_PROMPT..."
        placeholderTextColor={COLORS.textDim}
        style={styles.input}
        multiline={false}
        editable={!disabled}
        onSubmitEditing={handleSend}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />

      <TouchableOpacity
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        activeOpacity={0.7}
        style={[
          styles.button,
          (disabled || !text.trim()) && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonText}>RUN</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  prompt: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: 13,
    height: 40,
    padding: 0,
  },
  button: {
    marginLeft: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    opacity: 1,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: COLORS.primary,
    fontFamily: FONTS.monoBold,
    fontSize: 11,
  },
});
