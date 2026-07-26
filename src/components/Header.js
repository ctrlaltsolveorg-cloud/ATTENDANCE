import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ branchInfo, title, subtitle, onOpenCloudConfig }) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Ionicons name="school" size={14} color="#6366F1" />
          <Text style={styles.badgeText}>Purnea College of Engineering</Text>
        </View>

        {onOpenCloudConfig && (
          <TouchableOpacity style={styles.cloudBadge} onPress={onOpenCloudConfig} activeOpacity={0.7}>
            <Ionicons name="cloud" size={14} color="#10B981" />
            <Text style={styles.cloudBadgeText}>Supabase DB</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>{title || branchInfo?.name || 'Mechatronics Engineering (M.T.E)'}</Text>
      <Text style={styles.subtitle}>{subtitle || `${branchInfo?.semester || '3rd Semester'} • 19 BEU Students • Room 202`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
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
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '600',
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
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});
