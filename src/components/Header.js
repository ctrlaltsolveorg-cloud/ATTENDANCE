import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ branchInfo, title, subtitle, onOpenCloudConfig }) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={14} color="#70D6FF" />
          <Text style={styles.badgeText}>Purnea College of Engineering</Text>
        </View>

        {onOpenCloudConfig && (
          <TouchableOpacity style={styles.cloudBadge} onPress={onOpenCloudConfig} activeOpacity={0.7}>
            <Ionicons name="cloud-done" size={14} color="#10B981" />
            <Text style={styles.cloudBadgeText}>Supabase Sync</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>{title || branchInfo?.name || 'Mechatronics Engineering (M.T.E)'}</Text>
      <Text style={styles.subtitle}>{subtitle || `${branchInfo?.semester || '3rd Semester'} • BEU Patna Syllabus • Room 202`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(112, 214, 255, 0.1)',
    borderColor: 'rgba(112, 214, 255, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
  },
  badgeText: {
    color: '#70D6FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cloudBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
});
