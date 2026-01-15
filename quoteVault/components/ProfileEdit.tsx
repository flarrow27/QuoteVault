import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Input, Button, Avatar, Icon } from '@rneui/themed';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

interface ProfileEditProps {
  onBack?: () => void;
}

export default function ProfileEdit({ onBack }: ProfileEditProps) {
  const { colors, fontSizes } = useTheme();

  // --- State ---
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // URL from DB
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null); // Local selection

  // --- 1. Load Data on Mount ---
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // 1. Get Current User ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 2. Fetch from 'profiles' table
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "Row not found" - ignore it, user just hasn't created a profile yet
        throw error;
      }

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || null);
      } else {
        // Fallback to Auth Metadata if profile table is empty
        setFullName(user.user_metadata?.full_name || '');
        setAvatarUrl(user.user_metadata?.avatar_url || null);
      }

    } catch (error: any) {
      Alert.alert('Error', 'Error loading profile data.');
      console.error(error);
    } finally {
      setDataLoading(false);
    }
  };

  // --- 2. Image Picker ---
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, // Required for Supabase upload
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open image picker');
    }
  };

  // --- 3. Upload Helper ---
  const uploadImageToSupabase = async (base64Data: string) => {
    try {
      // Create a unique file path: public/user_id/timestamp.jpg
      const fileName = `public/${userId}/${Date.now()}.jpg`;
      
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      // Get the public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error: any) {
      throw new Error('Image upload failed: ' + error.message);
    }
  };

  // --- 4. Save Changes ---
  const handleSave = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      let finalAvatarUrl = avatarUrl;

      // A. Upload new image if selected
      if (selectedImage && selectedImage.base64) {
        finalAvatarUrl = await uploadImageToSupabase(selectedImage.base64);
      }

      // B. Update 'profiles' table
      const updates = {
        id: userId,
        full_name: fullName,
        avatar_url: finalAvatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      // C. Optional: Sync Auth Metadata so other parts of the app update instantly
      await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: finalAvatarUrl }
      });

      Alert.alert('Success', 'Profile updated successfully!');
      
      // Navigate back if prop provided
      if (onBack) onBack();

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Icon name="chevron-left" type="feather" color={colors.text} size={28} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSizes.title }]}>
              Edit Profile
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <Avatar
                size={120}
                rounded
                source={{ 
                  uri: selectedImage ? selectedImage.uri : (avatarUrl || undefined) 
                }}
                icon={!selectedImage && !avatarUrl ? { name: 'user', type: 'feather', color: '#000' } : undefined}
                containerStyle={{ 
                  backgroundColor: colors.card, 
                  borderWidth: 2, 
                  borderColor: colors.primary 
                }}
              >
                <Avatar.Accessory 
                  size={34} 
                  color="white" 
                  style={{ backgroundColor: colors.primary }} 
                />
              </Avatar>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
              Tap to change photo
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your Name"
              placeholderTextColor={colors.textSecondary}
              inputContainerStyle={{ borderColor: colors.border }}
              inputStyle={{ color: colors.text }}
              labelStyle={{ color: colors.textSecondary, marginBottom: 5 }}
              leftIcon={<Icon name="user" type="feather" size={20} color={colors.textSecondary} />}
            />

            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              buttonStyle={[styles.saveButton, { backgroundColor: colors.primary }]}
              titleStyle={{ color: colors.background, fontWeight: 'bold', fontSize: 16 }}
              containerStyle={{ marginTop: 30 }}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 14,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 12,
  },
});