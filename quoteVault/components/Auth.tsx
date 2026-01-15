import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Button, Input, Text } from '@rneui/themed';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'; // Required for Supabase Storage in RN
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Image State
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // 1. Pick Image Function
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Compress image to save bandwidth
        base64: true, // Crucial: We need base64 to upload via Supabase in RN
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not pick image.');
    }
  };

  // 2. Upload Image to Supabase Storage
  const uploadImageToSupabase = async (base64Data: string) => {
    try {
      const fileName = `public/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('avatars') // Ensure this bucket exists in Supabase
        .upload(fileName, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Handle Sign In
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert('Sign In Failed', error.message);
    setLoading(false);
  }

  // Handle Sign Up
  async function signUpWithEmail() {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = null;

      // 1. If user selected an image, upload it first
      if (image && image.base64) {
        avatarUrl = await uploadImageToSupabase(image.base64);
      }

      // 2. Sign Up with Metadata (Name + Avatar URL)
      const {
        data: { session },
        error,
      } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            avatar_url: avatarUrl, // Saving the URL to user metadata
          },
        },
      });

      if (error) throw error;

      if (!session) {
        Alert.alert('Verification', 'Please check your email to verify your account!');
        setIsSignUp(false);
      }
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (isSignUp) {
      signUpWithEmail();
    } else {
      signInWithEmail();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Feather name="layers" color="#FFD700" size={32} />
          </View>
          <Text style={styles.brandTitle}>QuoteVault</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text h3 style={styles.welcomeText}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitleText}>
            {isSignUp ? 'Join the collection of wisdom.' : 'Sign in to access your vault.'}
          </Text>

          {/* --- AVATAR PICKER (Sign Up Only) --- */}
          {isSignUp && (
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarTouch}>
                {image ? (
                  <Image source={{ uri: image.uri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Feather name="camera" size={24} color="#888" />
                    <Text style={styles.avatarText}>Add Photo</Text>
                  </View>
                )}
                {/* Edit Badge */}
                <View style={styles.editBadge}>
                  <Feather name="plus" size={14} color="#000" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Name Input (Sign Up Only) */}
          {isSignUp && (
            <Input
              placeholder="Full Name"
              leftIcon={<Feather name="user" size={20} color="#888" />}
              onChangeText={setFullName}
              value={fullName}
              autoCapitalize="words"
              placeholderTextColor="#666"
              inputStyle={styles.inputText}
              inputContainerStyle={styles.inputContainer}
              containerStyle={styles.inputWrapper}
            />
          )}

          <Input
            placeholder="Email Address"
            leftIcon={<Feather name="mail" size={20} color="#888" />}
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#666"
            inputStyle={styles.inputText}
            inputContainerStyle={styles.inputContainer}
            containerStyle={styles.inputWrapper}
          />

          <Input
            placeholder="Password"
            leftIcon={<Feather name="lock" size={20} color="#888" />}
            onChangeText={setPassword}
            value={password}
            secureTextEntry={true}
            autoCapitalize="none"
            placeholderTextColor="#666"
            inputStyle={styles.inputText}
            inputContainerStyle={styles.inputContainer}
            containerStyle={styles.inputWrapper}
          />

          {/* Buttons */}
          <View style={styles.buttonSection}>
            <Button
              title={isSignUp ? 'Create Account' : 'Sign In'}
              disabled={loading}
              onPress={handleSubmit}
              buttonStyle={styles.primaryButton}
              titleStyle={styles.primaryButtonText}
              disabledStyle={{ backgroundColor: '#444' }}
              icon={
                loading ? (
                  <ActivityIndicator color="white" style={{ marginRight: 10 }} />
                ) : undefined
              }
            />

            <View style={styles.footerAction}>
              <Text style={styles.footerText}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Button
                title={isSignUp ? 'Sign In' : 'Sign Up'}
                type="clear"
                onPress={() => setIsSignUp(!isSignUp)}
                titleStyle={styles.secondaryButtonText}
              />
            </View>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logoContainer: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
  },
  brandTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  formCard: {
    width: '100%',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleText: {
    color: '#888888',
    fontSize: 16,
    marginBottom: 30,
  },
  
  // Avatar Styles
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD700',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },

  // Inputs
  inputWrapper: {
    paddingHorizontal: 0,
    marginBottom: 5,
  },
  inputContainer: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
    height: 55,
  },
  inputText: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingLeft: 10,
  },
  buttonSection: {
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 30,
    paddingVertical: 15,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footerAction: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});