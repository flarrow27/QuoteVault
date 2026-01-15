import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // Recommended for React Native

const supabaseUrl = 'https://esxljuhnsznbckcnavfu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeGxqdWhuc3puYmNrY25hdmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDMwMTcsImV4cCI6MjA4Mzg3OTAxN30.ziu658gnQSLKT-TVsz1ZOxlK1r2Zaalz5fFxzl5A8ak';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});