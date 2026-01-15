import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Icon } from '@rneui/themed';
import { useTheme } from '../context/ThemeContext';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShareText: () => void;
  onShareImage: () => void;
}

export default function ShareModal({
  visible,
  onClose,
  onShareText,
  onShareImage,
}: ShareModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Prevent clicks inside the modal from closing it */}
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              
              <Text style={[styles.header, { color: colors.text }]}>
                Share Quote
              </Text>

              {/* Option 1: Share as Text */}
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  onShareText();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Icon
                  name="format-quote"
                  type="material"
                  color={colors.primary}
                  size={28}
                />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  Share as Text
                </Text>
              </TouchableOpacity>

              {/* Option 2: Share as Image */}
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  onShareImage();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Icon
                  name="image"
                  type="material"
                  color={colors.primary}
                  size={28}
                />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  Share as Image
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.cancelButton}
                activeOpacity={0.6}
              >
                <Text style={[styles.cancelLabel, { color: colors.text, opacity: 0.6 }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

            </View>
          </TouchableWithoutFeedback>
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
  modalCard: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    // Depth shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  optionButton: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});