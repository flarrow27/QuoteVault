import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  isDestructive?: boolean;
}

export default function CustomAlert({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "Confirm",
  isDestructive = false,
}: CustomAlertProps) {
  const { colors } = useTheme();

  // Helper to determine the primary action button color
  const primaryActionColor = isDestructive ? '#FF5252' : colors.primary;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          {/* Prevent clicks inside the alert from closing the modal */}
          <TouchableWithoutFeedback>
            <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
              
              {/* Header */}
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>

              {/* Body */}
              <Text style={[styles.message, { color: colors.text, opacity: 0.8 }]}>
                {message}
              </Text>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  onPress={onCancel} 
                  style={styles.flexBtn}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={onConfirm} 
                  style={[styles.confirmBtn, { backgroundColor: primaryActionColor }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.confirmText, { color: colors.background }]}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>

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
    backgroundColor: 'rgba(0,0,0,0.75)', // Deep backdrop
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flexBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 50, // Pill Shape
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for the pill button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});