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
          <Ionicons name="sparkles" size={13} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]} numberOfLines={1}>PCE Engineering</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* CR Panel vs Student View Role Switcher Pill */}
          {onSwitchRole && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
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
                size={13}
                color={userRole === 'cr' ? '#D97706' : colors.primary}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: userRole === 'cr' ? '#B45309' : colors.primary,
                }}
              >
                {userRole === 'cr' ? '👑 CR' : '🎓 Student'}
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
                size={15}
                color={isLight ? '#4F46E5' : '#C084FC'}
              />
            </TouchableOpacity>
          )}

          {onOpenCloudConfig && (
            <TouchableOpacity style={styles.cloudBadge} onPress={onOpenCloudConfig} activeOpacity={0.7}>
              <Ionicons name="cloud-done" size={14} color="#10B981" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>{title || branchInfo?.name || 'Mechatronics Engineering (M.T.E)'}</Text>
      <Text style={[styles.subtitle, { color: colors.textSub }]} numberOfLines={1}>{subtitle || `${branchInfo?.semester || '3rd Semester'} • BEU Patna Syllabus • Room 202`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    flexShrink: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  themeToggleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
});
