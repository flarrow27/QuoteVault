import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons'; // Use Expo Icons
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface ShareButtonProps {
  content: string;
  author: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ content, author }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      setSharing(true);
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        setSharing(false);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share this inspiration',
        UTI: 'public.png',
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate image.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)} 
        activeOpacity={0.7}
      >
        <Ionicons
          name="share-social-outline"
          color="#AAAAAA"
          size={26}
          style={{ marginLeft: 15 }}
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Preview Image</Text>

            <View 
              ref={viewShotRef} 
              style={styles.captureContainer}
              collapsable={false}
            >
              <View style={styles.quoteDecorationTop} />
              <Text style={styles.captureText}>"{content}"</Text>
              <View style={styles.captureFooter}>
                <Text style={styles.captureAuthor}>— {author}</Text>
                <Text style={styles.watermark}>QUOTEVAULT</Text>
              </View>
              <View style={styles.quoteDecorationBottom} />
            </View>

            <View style={styles.actionButtons}>
              <Button
                title={sharing ? 'Generating...' : 'Share Image'}
                onPress={handleShare}
                disabled={sharing}
                buttonStyle={styles.shareButton}
                titleStyle={{ color: 'black', fontWeight: 'bold' }}
                icon={
                  sharing ? (
                    <ActivityIndicator color="black" style={{ marginRight: 10 }} />
                  ) : (
                    <Ionicons name="share-outline" color="black" size={20} style={{ marginRight: 10 }} />
                  )
                }
              />
              <Button
                title="Cancel"
                type="clear"
                onPress={() => setModalVisible(false)}
                titleStyle={{ color: '#AAAAAA' }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: { width: '100%', alignItems: 'center' },
  modalTitle: { color: '#FFF', fontSize: 18, marginBottom: 20, fontWeight: '600' },
  captureContainer: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    padding: 30,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    minHeight: 350,
  },
  quoteDecorationTop: { width: 40, height: 4, backgroundColor: '#FFD700', marginBottom: 20 },
  quoteDecorationBottom: { width: 40, height: 4, backgroundColor: '#FFD700', marginTop: 20 },
  captureText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 34,
    fontFamily: 'serif',
    marginBottom: 20,
  },
  captureFooter: { width: '100%', alignItems: 'center', marginTop: 10 },
  captureAuthor: { color: '#FFD700', fontSize: 16, fontStyle: 'italic', marginBottom: 20 },
  watermark: { color: '#333333', fontSize: 10, letterSpacing: 2, fontWeight: 'bold', marginTop: 10 },
  actionButtons: { width: '100%', marginTop: 30, gap: 10 },
  shareButton: { backgroundColor: '#FFD700', borderRadius: 10, paddingVertical: 12 },
});

export default ShareButton;