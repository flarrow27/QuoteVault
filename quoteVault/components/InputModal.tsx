import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface InputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  title?: string;
  placeholder?: string;
}

export default function InputModal({
  visible,
  onClose,
  onSubmit,
  title = "New Collection",
  placeholder = "Enter name...",
}: InputModalProps) {
  const { colors, fontSizes } = useTheme();
  const [text, setText] = useState('');

  // Reset text when modal opens
  useEffect(() => {
    if (visible) setText('');
  }, [visible]);

  const handleSubmit = () => {
    if (text.trim().length > 0) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* KeyboardAvoidingView ensures the card shifts up when the keyboard appears */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                
                <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSizes.title }]}>
                  {title}
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background, 
                      color: colors.text,
                      fontSize: fontSizes.body,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder={placeholder}
                  placeholderTextColor={`${colors.text}80`} // 50% opacity hex
                  value={text}
                  onChangeText={setText}
                  autoFocus={true}
                  selectionColor={colors.primary}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    onPress={onClose} 
                    style={styles.cancelBtn}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.cancelLabel, { color: colors.text, opacity: 0.6 }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={handleSubmit} 
                    style={[
                      styles.submitBtn, 
                      { backgroundColor: text.trim().length > 0 ? colors.primary : `${colors.primary}40` }
                    ]}
                    disabled={text.trim().length === 0}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.submitLabel, { color: colors.background }]}>
                      Create
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginVertical: 20,
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 50, // Pill Shape
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});