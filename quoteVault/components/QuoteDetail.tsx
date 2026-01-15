import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
  Share,
  ScrollView,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { Quote } from './QuoteCard';
import AddToCollectionModal from './AddToCollectionModal';
import CustomAlert from './CustomAlert';
import ShareModal from './ShareModal'; // 1. Import ShareModal
import { supabase } from '../lib/supabase';

type TemplateType = 'Standard' | 'Minimalist' | 'Neon' | 'Retro' | 'Luxury' | 'Vibrant' | 'Cyber' | 'Stark';

const CATEGORY_IMAGES: Record<string, string> = {
  Motivation: 'https://images.unsplash.com/photo-1497561813398-8fcc7a37b567?q=80&w=1000&auto=format&fit=crop',
  Love: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?q=80&w=1000&auto=format&fit=crop',
  Success: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
  Wisdom: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop',
  Humor: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1000&auto=format&fit=crop',
  Life: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?q=80&w=1000&auto=format&fit=crop',
  Friendship: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000&auto=format&fit=crop',
  Leadership: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop',
  Happiness: 'https://images.unsplash.com/photo-1472289065668-ce650ac443b2?q=80&w=1000&auto=format&fit=crop',
  Creativity: 'https://images.unsplash.com/photo-1491245338813-c6832976196e?q=80&w=1000&auto=format&fit=crop',
  Default: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=1000&auto=format&fit=crop',
};

interface QuoteDetailProps {
  quote: Quote;
  onBack: () => void;
  sourceCollectionId?: string;
}

export default function QuoteDetail({ quote, onBack, sourceCollectionId }: QuoteDetailProps) {
  const { colors } = useTheme();
  const viewShotRef = useRef<View>(null);
  
  // --- State ---
  const [processing, setProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [removeAlertVisible, setRemoveAlertVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false); // 2. New State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('Standard');
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({ writeOnly: true });

  // --- Logic: Style Engine ---
  const getTemplateStyles = () => {
    const mono = Platform.OS === 'ios' ? 'Courier' : 'monospace';
    const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif';
    switch (selectedTemplate) {
      case 'Minimalist': return { container: { backgroundColor: '#F5F5DC', padding: 40 }, text: { color: '#333', fontSize: 24, textAlign: 'center' as const, fontFamily: serif, lineHeight: 34 }, author: { color: '#666', marginTop: 20, fontSize: 14, letterSpacing: 1, textAlign: 'center' as const } };
      case 'Neon': return { container: { backgroundColor: '#000', padding: 30 }, text: { color: '#39FF14', fontSize: 28, fontWeight: '900' as const, textAlign: 'center' as const, textShadowColor: '#39FF14', textShadowRadius: 10, lineHeight: 38 }, author: { color: '#FFF', marginTop: 25, fontSize: 12, letterSpacing: 4, textAlign: 'center' as const } };
      case 'Retro': return { container: { backgroundColor: '#fdf6e3', padding: 35 }, text: { color: '#586e75', fontSize: 22, fontFamily: mono, textAlign: 'left' as const, lineHeight: 30 }, author: { color: '#93a1a1', marginTop: 30, fontSize: 14, fontFamily: mono, textAlign: 'right' as const } };
      case 'Luxury': return { container: { backgroundColor: '#0F172A', padding: 40 }, text: { color: '#FFD700', fontSize: 26, fontFamily: serif, textAlign: 'center' as const, fontStyle: 'italic' as const, lineHeight: 38 }, author: { color: '#FFD700', marginTop: 30, fontSize: 13, letterSpacing: 3, textAlign: 'center' as const, fontWeight: '300' as const, opacity: 0.8 } };
      case 'Vibrant': return { container: { backgroundColor: '#FF4500', padding: 30 }, text: { color: '#FFFFFF', fontSize: 30, fontWeight: 'bold' as const, textAlign: 'center' as const, lineHeight: 40 }, author: { color: '#FFFFFF', marginTop: 20, fontSize: 15, opacity: 0.9, textAlign: 'center' as const, fontWeight: '600' as const } };
      case 'Cyber': return { container: { backgroundColor: '#240046', padding: 30 }, text: { color: '#00FFFF', fontSize: 24, fontFamily: mono, fontWeight: 'bold' as const, textAlign: 'center' as const, textShadowColor: '#00FFFF', textShadowRadius: 15 }, author: { color: '#FF00FF', marginTop: 30, fontSize: 12, fontFamily: mono, letterSpacing: 2, textAlign: 'center' as const } };
      case 'Stark': return { container: { backgroundColor: '#FFFFFF', padding: 20 }, innerBorder: { flex: 1, borderWidth: 4, borderColor: '#000', padding: 20, justifyContent: 'center' as const }, text: { color: '#000000', fontSize: 26, fontWeight: '900' as const, textAlign: 'center' as const, textTransform: 'uppercase' as const }, author: { color: '#000000', marginTop: 20, fontSize: 14, fontWeight: '400' as const, textAlign: 'center' as const } };
      default: return null;
    }
  };

  const template = getTemplateStyles();

  // --- Logic: Functions ---
  const handleConfirmRemove = async () => {
    setRemoveAlertVisible(false);
    setProcessing(true);
    await supabase.from('collection_quotes').delete().match({ collection_id: sourceCollectionId, quote_id: quote.id });
    setProcessing(false);
    onBack();
  };

  const shareText = async () => {
    try {
      await Share.share({ message: `"${quote.content}" — ${quote.author}\n\nShared via QuoteVault` });
    } catch (e) { console.error(e); }
  };

  const shareImage = async () => {
    setProcessing(true);
    try {
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert('Error', 'Capture failed'); }
    setProcessing(false);
  };

  const handleSaveToGallery = async () => {
    setProcessing(true);
    try {
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      if (permissionResponse?.status !== 'granted') await requestPermission();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Saved to gallery!');
    } catch (e) { Alert.alert('Error', 'Save failed'); }
    setProcessing(false);
  };

  const templates: TemplateType[] = ['Standard', 'Minimalist', 'Neon', 'Retro', 'Luxury', 'Vibrant', 'Cyber', 'Stark'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Design Quote</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.cardWrapper}>
        <ViewShot ref={viewShotRef} style={{ flex: 1 }} options={{ format: 'png', quality: 1 }}>
          {selectedTemplate === 'Standard' ? (
            <ImageBackground source={{ uri: CATEGORY_IMAGES[quote.category] || CATEGORY_IMAGES.Default }} style={{ flex: 1 }}>
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient}>
                <FontAwesome name="quote-left" size={30} color="#FFD700" style={{ marginBottom: 15 }} />
                <Text style={styles.standardText}>{quote.content}</Text>
                <Text style={styles.standardAuthor}>— {quote.author.toUpperCase()}</Text>
              </LinearGradient>
            </ImageBackground>
          ) : (
            <View style={[styles.templateBase, template?.container]}>
               {selectedTemplate === 'Stark' ? (
                 <View style={template?.innerBorder}>
                    <Text style={template?.text}>"{quote.content}"</Text>
                    <Text style={template?.author}>{quote.author}</Text>
                 </View>
               ) : (
                 <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={template?.text}>"{quote.content}"</Text>
                    <Text style={template?.author}>— {quote.author}</Text>
                 </View>
               )}
            </View>
          )}
        </ViewShot>
      </View>

      <View style={styles.selectorContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>SELECT STYLE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {templates.map((t) => (
            <TouchableOpacity key={t} onPress={() => setSelectedTemplate(t)} style={[styles.chip, { backgroundColor: selectedTemplate === t ? colors.primary : colors.card, borderColor: colors.border }]}>
              <Text style={[styles.chipText, { color: selectedTemplate === t ? colors.background : colors.text }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionCol}>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={sourceCollectionId ? () => setRemoveAlertVisible(true) : () => setModalVisible(true)}>
            <Ionicons name={sourceCollectionId ? "trash-outline" : "bookmark-outline"} size={26} color={sourceCollectionId ? "#FF5252" : colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.btnLabel, { color: colors.textSecondary }]}>{sourceCollectionId ? "Remove" : "Save"}</Text>
        </View>

        <View style={styles.actionCol}>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleSaveToGallery}>
            {processing ? <ActivityIndicator size="small" color={colors.text} /> : <Ionicons name="download-outline" size={26} color={colors.text} />}
          </TouchableOpacity>
          <Text style={[styles.btnLabel, { color: colors.textSecondary }]}>Gallery</Text>
        </View>

        <View style={styles.actionCol}>
          {/* 3. Updated Share Button Trigger */}
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShareModalVisible(true)}>
            <Ionicons name="share-social-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.btnLabel, { color: colors.textSecondary }]}>Share</Text>
        </View>
      </View>

      {/* --- MODALS --- */}
      <AddToCollectionModal visible={modalVisible} onClose={() => setModalVisible(false)} quoteId={quote.id} />
      
      <CustomAlert 
        visible={removeAlertVisible}
        title="Remove Quote?"
        message="Are you sure you want to remove this quote from your collection?"
        confirmText="Remove"
        isDestructive={true}
        onCancel={() => setRemoveAlertVisible(false)}
        onConfirm={handleConfirmRemove}
      />

      {/* 4. The Share Modal Implementation */}
      <ShareModal 
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        onShareText={() => {
            setShareModalVisible(false);
            setTimeout(shareText, 400); // 400ms for smooth modal close
        }}
        onShareImage={() => {
            setShareModalVisible(false);
            setTimeout(shareImage, 400);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconBtn: { padding: 5 },
  cardWrapper: { flex: 1, marginHorizontal: 20, marginVertical: 10, borderRadius: 24, overflow: 'hidden', elevation: 8, backgroundColor: '#000' },
  templateBase: { flex: 1, justifyContent: 'center' },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  standardText: { color: 'white', fontSize: 24, textAlign: 'center', fontWeight: 'bold', lineHeight: 34, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  standardAuthor: { color: '#FFD700', marginTop: 20, fontWeight: 'bold', letterSpacing: 2, fontSize: 12 },
  selectorContainer: { paddingVertical: 20 },
  label: { fontSize: 10, fontWeight: '800', textAlign: 'center', letterSpacing: 2, marginBottom: 15 },
  chipScroll: { paddingHorizontal: 20 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: 'bold' },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', paddingBottom: 30 },
  actionCol: { alignItems: 'center' },
  circleBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginBottom: 8 },
  btnLabel: { fontSize: 11, fontWeight: '600' }
});