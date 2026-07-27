import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/theme';

export default function DashboardScreen({
  branchInfo,
  students,
  subjects,
  records,
  stats,
  onNavigate,
  onResetData,
  onOpenCloudConfig,
  onSelectStudent,
  themeMode = 'light',
  onToggleTheme,
}) {
  const currentTheme = getTheme(themeMode);
  const colors = currentTheme.colors;
  const isLight = themeMode === 'light';

  const getPctColor = (pct) => {
    if (pct >= 75) return '#10B981'; // Emerald Green
    if (pct >= 60) return '#F59E0B'; // Amber Yellow
    return '#EF4444'; // Red
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
      <Header
        branchInfo={branchInfo}
        onReset={onResetData}
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Hero Background Video Banner Strip */}
        <View style={styles.videoStripContainer}>
          {Platform.OS === 'web' ? (
            <video
              src={require('../../assets/logov.mp4')}
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.45,
                pointerEvents: 'none',
              }}
            />
          ) : (
            <View style={styles.videoFallback} />
          )}

          {/* Dark Glass Overlay & Content Strip */}
          <View style={styles.videoStripOverlay}>
            <View style={styles.stripHeaderBadge}>
              <Ionicons name="sparkles" size={14} color="#818CF8" />
              <Text style={styles.stripBadgeText}>MECHATRONICS DEPT</Text>
            </View>
            <Text style={styles.stripTitle}>Purnea College of Engineering</Text>
            <Text style={styles.stripSubtitle}>3rd Semester Attendance Portal • BEU Patna</Text>
          </View>
        </View>

        {/* Quick Action Button */}
        <TouchableOpacity
          style={styles.markCTA}
          activeOpacity={0.8}
          onPress={() => onNavigate('mark')}
        >
          <View style={styles.markCTAContent}>
            <View style={styles.markCTAIcon}>
              <Ionicons name="checkbox" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.markCTATitle}>Mark Attendance Now</Text>
          </View>

          <View style={styles.markCTAArrow}>
            <Ionicons name="arrow-forward" size={18} color="#4F46E5" />
          </View>
        </TouchableOpacity>

        {/* Top 5 Students Leaderboard Section */}
        {stats?.topStudents && stats.topStudents.length > 0 && (
          <View style={[styles.topCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
            <View style={styles.topHeader}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <Text style={[styles.topTitle, { color: colors.textMain }]}>Top 5 Students (Highest Attendance)</Text>
            </View>
            <Text style={[styles.topSub, { color: colors.textSub }]}>Tap any student to open detailed graphical attendance charts:</Text>
            <View style={styles.topList}>
              {stats.topStudents.map((stu, index) => (
                <TouchableOpacity
                  key={stu.id}
                  style={[styles.topItem, { backgroundColor: colors.bgGlass, borderColor: colors.glassBorder }]}
                  onPress={() => onSelectStudent && onSelectStudent(stu)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.topName, { color: colors.textMain }]}>{stu.name}</Text>
                    <Text style={[styles.topRoll, { color: colors.primary }]}>{stu.rollNo} • Tap for Graph 📊</Text>
                  </View>
                  <View style={styles.topBadge}>
                    <Text style={styles.topBadgeText}>{stu.percentage}%</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Subject-Wise Performance List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Subject Attendance Breakdown</Text>
          <Text style={[styles.sectionSub, { color: colors.textSub }]}>11 Subjects from PCE Schedule</Text>
        </View>

        {subjects.map((sub) => {
          const subStat = (stats?.subjectStats && stats.subjectStats[sub.id]) || { sessions: 0, present: 0, totalPossible: 0 };
          const pct = subStat.totalPossible > 0 ? Math.round((subStat.present / subStat.totalPossible) * 100) : 0;
          const barColor = getPctColor(pct);

          return (
            <View key={sub.id} style={[styles.subjectCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
              <View style={styles.subTopRow}>
                <View style={styles.subLeft}>
                  <View style={[styles.subIconBg, { backgroundColor: sub.type === 'Lab' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)' }]}>
                    <Ionicons name={sub.icon || 'book-outline'} size={18} color={sub.type === 'Lab' ? '#F59E0B' : colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.subName, { color: colors.textMain }]}>{sub.name}</Text>
                    <Text style={[styles.subFaculty, { color: colors.textSub }]}>{sub.code} • {sub.faculty}</Text>
                  </View>
                </View>
                <View style={styles.subRight}>
                  <Text style={[styles.subPct, { color: barColor }]}>
                    {subStat.sessions === 0 ? 'No Data' : `${pct}%`}
                  </Text>
                  <Text style={[styles.subSessions, { color: colors.textMuted }]}>{subStat.sessions} Classes</Text>
                </View>
              </View>

              {/* Attendance Progress Bar */}
              <View style={[styles.progressBg, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(15, 23, 42, 0.8)' }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${subStat.sessions === 0 ? 0 : pct}%`, backgroundColor: barColor },
                  ]}
                />
              </View>
            </View>
          );
        })}

        {/* Recent Attendance Sessions History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Attendance Logs</Text>
        </View>

        {records.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color="#64748B" />
            <Text style={styles.emptyTitle}>No Attendance Recorded Yet</Text>
            <Text style={styles.emptySub}>Tap "Mark Attendance Now" to take today's roll call.</Text>
          </View>
        ) : (
          records.slice(0, 5).map((rec) => {
            const sub = subjects.find((s) => s.id === rec.subjectId) || { name: 'Subject', code: rec.subjectId };
            const isHoliday = rec.isHoliday;
            const presentCount = (rec.presentStudentIds || []).length;
            const pct = Math.round((presentCount / (rec.totalStudents || 30)) * 100);

            return (
              <View key={rec.id} style={styles.historyItem}>
                <View style={[styles.historyIcon, isHoliday && { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Ionicons
                    name={isHoliday ? "sparkles" : "checkmark-circle"}
                    size={24}
                    color={isHoliday ? "#8B5CF6" : "#10B981"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historySubName}>{sub.name} ({sub.code})</Text>
                  <Text style={styles.historyDate}>
                    {rec.date} • {isHoliday ? `HOLIDAY (${rec.holidayReason || 'College Closed'})` : (rec.time || 'Class')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.historyCount, isHoliday && { color: '#C4B5FD' }]}>
                    {isHoliday ? 'Exempt' : `${presentCount} / ${rec.totalStudents || 30} Present`}
                  </Text>
                  <Text style={[styles.historyPct, { color: isHoliday ? '#8B5CF6' : getPctColor(pct) }]}>
                    {isHoliday ? 'HOLIDAY' : `${pct}%`}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  videoStripContainer: {
    width: '100%',
    height: 110,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0B132B',
    borderWidth: 1,
    borderColor: 'rgba(112, 214, 255, 0.3)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },
  videoStripOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  stripHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.4)',
  },
  stripBadgeText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  stripTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stripSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  videoFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  markCTA: {
    marginTop: 8,
    backgroundColor: '#3A86FF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#70D6FF',
    boxShadow: '0 10px 28px rgba(58, 134, 255, 0.4)',
  },
  markCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  markCTAIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCTATitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  markCTAArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCard: {
    marginTop: 16,
    backgroundColor: 'rgba(27, 38, 59, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  topSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  topList: {
    gap: 8,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    padding: 12,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rankBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#F59E0B',
    fontWeight: '900',
    fontSize: 12,
  },
  topName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  topRoll: {
    color: '#70D6FF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  topBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  topBadgeText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 13,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sectionSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  subjectCard: {
    backgroundColor: 'rgba(27, 38, 59, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  subTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  subFaculty: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  subRight: {
    alignItems: 'flex-end',
  },
  subPct: {
    fontSize: 15,
    fontWeight: '700',
  },
  subSessions: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  progressBg: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  historyItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historySubName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  historyDate: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  historyCount: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  historyPct: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
