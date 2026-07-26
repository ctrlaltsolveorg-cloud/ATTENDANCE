import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  checkSupabaseConnection,
} from '../services/supabase';

export default function SupabaseConfigModal({ visible, onClose, onRefresh }) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // { connected, error }

  useEffect(() => {
    if (visible) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setKey(cfg.key);
      testConnection();
    }
  }, [visible]);

  const testConnection = async () => {
    setTesting(true);
    const res = await checkSupabaseConnection();
    setStatus(res);
    setTesting(false);
  };

  const handleSave = async () => {
    if (!url.trim() || !key.trim()) {
      Alert.alert('Missing Fields', 'Please provide both Supabase URL and Anon API Key.');
      return;
    }

    const success = await saveSupabaseConfig(url, key);
    if (success) {
      Alert.alert('Cloud Config Saved! ☁️', 'Supabase client has been updated.');
      testConnection();
      if (onRefresh) onRefresh();
    } else {
      Alert.alert('Save Error', 'Failed to save Supabase configuration.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="cloud" size={24} color="#6366F1" />
              <Text style={styles.title}>Supabase Cloud Database</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody}>
            {/* Status Banner */}
            <View style={[styles.statusBanner, status?.connected ? styles.statusOnline : styles.statusOffline]}>
              <Ionicons
                name={status?.connected ? 'checkmark-circle' : 'cloud-offline'}
                size={20}
                color={status?.connected ? '#10B981' : '#F59E0B'}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusText, { color: status?.connected ? '#10B981' : '#F59E0B' }]}>
                  {testing ? 'Testing connection...' : status?.connected ? 'Online & Synced to Cloud' : 'Offline / Setup Required'}
                </Text>
                {status?.error && (
                  <Text style={styles.errorSub} numberOfLines={2}>{status.error}</Text>
                )}
              </View>
              <TouchableOpacity onPress={testConnection} disabled={testing}>
                {testing ? <ActivityIndicator size="small" color="#6366F1" /> : <Ionicons name="refresh" size={18} color="#94A3B8" />}
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <Text style={styles.inputLabel}>Supabase Project URL:</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://your-project.supabase.co"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Supabase Anon API Key:</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={key}
              onChangeText={setKey}
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              placeholderTextColor="#64748B"
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Actions */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save & Connect Supabase</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 How to connect your Supabase DB:</Text>
              <Text style={styles.infoText}>1. Create a free project at supabase.com</Text>
              <Text style={styles.infoText}>2. Open SQL Editor & paste `supabase_schema.sql`</Text>
              <Text style={styles.infoText}>3. Copy URL & Anon Key from Project Settings &gt; API</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    flexGrow: 0,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusText: {
    fontWeight: '700',
    fontSize: 13,
  },
  errorSub: {
    color: '#F87171',
    fontSize: 11,
    marginTop: 2,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    fontFamily: 'PlatformSelect',
  },
  saveBtn: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  infoBox: {
    marginTop: 16,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 3,
  },
});
