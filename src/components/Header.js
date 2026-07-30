import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/theme';

export default function Header({ branchInfo, title, subtitle, onOpenCloudConfig, themeMode = 'light', onToggleTheme, userRole = 'student', onSwitchRole }) {
  const currentTheme = getTheme(themeMode);
  const colors = currentTheme.colors;
  const isLight = themeMode === 'light';

  return (
    <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(168, 85, 247, 0.15)', borderColor: isLight ? 'rgba(79, 70, 229, 0.25)' : 'rgba(168, 85, 247, 0.3)' }]}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>Purnea College of Engineering</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* CR Panel vs Student View Role Switcher Pill */}
          {onSwitchRole && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 14,
                backgroundColor: userRole === 'cr'
                  ? (isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.25)')
                  : (isLight ? '#EEF2FF' : 'rgba(99, 102, 241, 0.2)'),
                borderColor: userRole === 'cr'
                  ? '#F59E0B'
                  : colors.glassBorder,
                borderWidth: 1,
              }}
              onPress={onSwitchRole}
              activeOpacity={0.8}
            >
              <Ionicons
                name={userRole === 'cr' ? 'key' : 'school-outline'}
                size={14}
                color={userRole === 'cr' ? '#D97706' : colors.primary}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: userRole === 'cr' ? '#B45309' : colors.primary,
                }}
              >
                {userRole === 'cr' ? '👑 CR Panel' : '🎓 Student View'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Theme Switcher Toggle */}
          {onToggleTheme && (
            <TouchableOpacity
              style={[
                styles.themeToggleBtn,
                {
                  backgroundColor: isLight ? '#EEF2FF' : 'rgba(168, 85, 247, 0.2)',
                  borderColor: isLight ? '#C7D2FE' : 'rgba(168, 85, 247, 0.4)',
                },
              ]}
              onPress={onToggleTheme}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isLight ? 'sunny' : 'moon'}
                size={16}
                color={isLight ? '#4F46E5' : '#C084FC'}
              />
            </TouchableOpacity>
          )}

          {onOpenCloudConfig && (
            <TouchableOpacity style={styles.cloudBadge} onPress={onOpenCloudConfig} activeOpacity={0.7}>
              <Ionicons name="cloud-done" size={14} color="#10B981" />
              <Text style={styles.cloudBadgeText}>Supabase Sync</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={[styles.title, { color: colors.textMain }]}>{title || branchInfo?.name || 'Mechatronics Engineering (M.T.E)'}</Text>
      <Text style={[styles.subtitle, { color: colors.textSub }]}>{subtitle || `${branchInfo?.semester || '3rd Semester'} • BEU Patna Syllabus • Room 202`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
});
