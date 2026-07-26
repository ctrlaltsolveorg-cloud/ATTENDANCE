import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_CONFIG_KEY = '@pce_supabase_config';

// Default Supabase project credentials (can be overridden dynamically by user in app settings)
const DEFAULT_SUPABASE_URL = 'https://gadcttldhsiaszppnqef.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZGN0dGxkaHNpYXN6cHBucWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTcxNzAsImV4cCI6MjEwMDU3MzE3MH0.PpZb0dDvt02tVKAQ7tlBWhd1mexWh4xtAHCd1j0ZgQo';

let currentUrl = DEFAULT_SUPABASE_URL;
let currentKey = DEFAULT_SUPABASE_ANON_KEY;
let supabase = createClient(currentUrl, currentKey);

export const getSupabaseClient = () => supabase;

/**
 * Initialize Supabase configuration from storage
 */
export const initSupabaseConfig = async () => {
  try {
    const stored = await AsyncStorage.getItem(SUPABASE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.key) {
        currentUrl = parsed.url;
        currentKey = parsed.key;
        supabase = createClient(currentUrl, currentKey);
      }
    }
  } catch (e) {
    console.error('Error loading Supabase config:', e);
  }
};

/**
 * Save custom Supabase credentials
 */
export const saveSupabaseConfig = async (url, key) => {
  try {
    currentUrl = url.trim();
    currentKey = key.trim();
    supabase = createClient(currentUrl, currentKey);
    await AsyncStorage.setItem(
      SUPABASE_CONFIG_KEY,
      JSON.stringify({ url: currentUrl, key: currentKey })
    );
    return true;
  } catch (e) {
    console.error('Error saving Supabase config:', e);
    return false;
  }
};

export const getSupabaseConfig = () => ({
  url: currentUrl,
  key: currentKey,
  isDefault: currentUrl === DEFAULT_SUPABASE_URL,
});

/**
 * Check connection to Supabase cloud
 */
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('students').select('id').limit(1);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true, data };
  } catch (e) {
    return { connected: false, error: e.message };
  }
};
