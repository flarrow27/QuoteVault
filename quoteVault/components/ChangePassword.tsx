import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Input, Button, Icon } from '@rneui/themed';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

interface ChangePasswordProps {
  onBack: () => void;
}

export default function ChangePassword({ onBack }: ChangePasswordProps) {
  const { colors, fontSizes } = useTheme();

  // --- State ---
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Handler ---
  const handleUpdate = async () => {
    // 1. Validation
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // 2. Update via Supabase
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      // 3. Success Feedback
      Alert.alert('Success', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: onBack }
      ]);
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Icon name="chevron-left" type="feather" color={colors.text} size={28} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSizes.title }]}>
              Change Password
            </Text>
            {/* Spacer for alignment */}
            <View style={{ width: 28 }} />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.instructions, { color: colors.textSecondary }]}>
              Please enter a new password for your account. Ensure it is at least 6 characters long.
            </Text>

            <Input
              label="New Password"
              placeholder="Enter new password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={colors.textSecondary}
              inputContainerStyle={{ borderColor: colors.border }}
              inputStyle={{ color: colors.text }}
              labelStyle={{ color: colors.textSecondary, marginBottom: 5 }}
              leftIcon={<Icon name="lock" type="feather" size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter new password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor={colors.textSecondary}
              inputContainerStyle={{ borderColor: colors.border }}
              inputStyle={{ color: colors.text }}
              labelStyle={{ color: colors.textSecondary, marginBottom: 5 }}
              leftIcon={<Icon name="check-circle" type="feather" size={20} color={colors.textSecondary} />}
            />

            <Button
              title="Update Password"
              onPress={handleUpdate}
              loading={loading}
              buttonStyle={[styles.saveButton, { backgroundColor: colors.primary }]}
              titleStyle={{ color: colors.background, fontWeight: 'bold', fontSize: 16 }}
              containerStyle={{ marginTop: 20 }}
              disabled={!password || !confirmPassword}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  instructions: {
    marginBottom: 30,
    lineHeight: 20,
    fontSize: 14,
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 12,
  },
});