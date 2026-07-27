import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/theme';
import Header from '../components/Header';
import PasswordModal from '../components/PasswordModal';
import {
  getNotice,
  saveNotice,
  getRoutine,
  saveRoutine,
  DEFAULT_NOTICE,
  DEFAULT_WEEKLY_ROUTINE,
} from '../services/storage';

const getCurrentDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const isPeriodOngoing = (timeStr) => {
  try {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const parts = timeStr.split('-');
    if (parts.length !== 2) return false;

    const parseMin = (tStr) => {
      tStr = tStr.trim();
      const isPM = tStr.toUpperCase().includes('PM');
      const clean = tStr.replace(/(AM|PM)/i, '').trim();
      let [h, m] = clean.split(':').map(Number);
      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0;
      return h * 60 + m;
    };

    const startMin = parseMin(parts[0]);
    const endMin = parseMin(parts[1]);

    return currentMin >= startMin && currentMin < endMin;
  } catch (e) {
    return false;
  }
};

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

  // CR Notice Board & Routine State
  const [noticeText, setNoticeText] = useState(DEFAULT_NOTICE);
  const [routineObj, setRoutineObj] = useState(DEFAULT_WEEKLY_ROUTINE);
  const [editingNotice, setEditingNotice] = useState(false);
  const [newNoticeInput, setNewNoticeInput] = useState('');
  
  // Room Editing State
  const [editingRoomSlot, setEditingRoomSlot] = useState(null); // { day, index, room }
  const [newRoomInput, setNewRoomInput] = useState('');

  // Password Protection Modal
  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'editNotice' | 'editRoom', data }

  useEffect(() => {
    loadNoticeAndRoutine();
  }, []);

  const loadNoticeAndRoutine = async () => {
    const n = await getNotice();
    const r = await getRoutine();
    setNoticeText(n || DEFAULT_NOTICE);
    setRoutineObj(r || DEFAULT_WEEKLY_ROUTINE);
  };

  const triggerProtectedCRAction = (action) => {
    setPendingAction(action);
    setPasscodeModalVisible(true);
  };

  const handlePasscodeSuccess = () => {
    setPasscodeModalVisible(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'editNotice') {
      setNewNoticeInput(noticeText);
      setEditingNotice(true);
    } else if (pendingAction.type === 'editRoom') {
      setEditingRoomSlot(pendingAction.data);
      setNewRoomInput(pendingAction.data.room);
    }
    setPendingAction(null);
  };

  const handleSaveNotice = async () => {
    if (!newNoticeInput.trim()) {
      Alert.alert('Empty Notice', 'Please enter notice content.');
      return;
    }
    await saveNotice(newNoticeInput.trim());
    setNoticeText(newNoticeInput.trim());
    setEditingNotice(false);
    Alert.alert('Notice Updated', 'CR Notice Board has been updated successfully!');
  };

  const handleSaveRoomNumber = async () => {
    if (!editingRoomSlot || !newRoomInput.trim()) return;

    const { day, index } = editingRoomSlot;
    const updatedRoutine = { ...routineObj };
    if (updatedRoutine[day] && updatedRoutine[day][index]) {
      updatedRoutine[day][index] = {
        ...updatedRoutine[day][index],
        room: newRoomInput.trim(),
      };
      await saveRoutine(updatedRoutine);
      setRoutineObj(updatedRoutine);
      Alert.alert('Room Updated', `Room number updated to ${newRoomInput.trim()}`);
    }
    setEditingRoomSlot(null);
  };

  const todayDayName = getCurrentDayName();
  const todayClasses = routineObj[todayDayName] || routineObj['Monday'];

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

        {/* 📢 CR Important Notice Board Banner Card */}
        <View style={[styles.noticeCard, { backgroundColor: isLight ? '#EEF2FF' : 'rgba(30, 20, 60, 0.85)', borderColor: isLight ? '#C7D2FE' : '#8B5CF6', boxShadow: colors.cardShadow }]}>
          <View style={styles.noticeHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="megaphone" size={18} color={isLight ? '#4F46E5' : '#C084FC'} />
              <Text style={[styles.noticeTitle, { color: isLight ? '#3730A3' : '#F8FAFC' }]}>CR Important Announcement</Text>
            </View>
            <TouchableOpacity
              style={[styles.crEditIconBtn, { backgroundColor: isLight ? '#E0E7FF' : 'rgba(168, 85, 247, 0.2)', borderColor: isLight ? '#C7D2FE' : 'rgba(168, 85, 247, 0.4)' }]}
              onPress={() => triggerProtectedCRAction({ type: 'editNotice' })}
              activeOpacity={0.7}
              title="Edit Notice"
            >
              <Ionicons name="pencil" size={14} color={isLight ? '#4F46E5' : '#C084FC'} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.noticeContentText, { color: isLight ? '#312E81' : '#E9D5FF' }]}>
            {noticeText}
          </Text>
        </View>

        {/* 🏫 Classes Going On / Today's Routine Schedule Card */}
        <View style={[styles.routineCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
          <View style={styles.routineHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.routineTitle, { color: colors.textMain }]}>Today's Live Classes</Text>
            </View>
            <View style={[styles.dayBadge, { backgroundColor: isLight ? '#EEF2FF' : 'rgba(15, 23, 42, 0.8)' }]}>
              <Text style={[styles.dayBadgeText, { color: colors.primary }]}>{todayDayName}</Text>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 12 }}>
            {todayClasses.map((item, index) => {
              const liveOngoing = isPeriodOngoing(item.time);

              return (
                <View
                  key={index}
                  style={[
                    styles.periodRow,
                    {
                      backgroundColor: liveOngoing ? (isLight ? '#ECFDF5' : 'rgba(6, 78, 59, 0.4)') : colors.bgGlass,
                      borderColor: liveOngoing ? '#10B981' : colors.glassBorder,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <View style={[styles.periodBadge, { backgroundColor: isLight ? '#EEF2FF' : 'rgba(15, 23, 42, 0.8)' }]}>
                        <Text style={[styles.periodBadgeText, { color: colors.primary }]}>P-{item.period}</Text>
                      </View>
                      <Text style={[styles.periodTime, { color: colors.textSub }]}>{item.time}</Text>

                      {liveOngoing && (
                        <View style={styles.livePill}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveText}>ONGOING NOW</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.periodSubject, { color: colors.textMain }]}>
                      {item.code} • {item.faculty}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.roomPill, { backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)', borderColor: isLight ? '#FDE68A' : '#F59E0B' }]}>
                      <Ionicons name="location" size={12} color="#D97706" />
                      <Text style={styles.roomPillText}>Room {item.room}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.changeRoomIconBtn, { backgroundColor: isLight ? '#EEF2FF' : 'rgba(15, 23, 42, 0.8)', borderColor: colors.glassBorder }]}
                      onPress={() => triggerProtectedCRAction({ type: 'editRoom', data: { day: todayDayName, index, room: item.room, name: item.name } })}
                      activeOpacity={0.7}
                      title="Change Room"
                    >
                      <Ionicons name="pencil" size={12} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

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
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Recent Attendance Logs</Text>
        </View>

        {records.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textMain }]}>No Attendance Recorded Yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSub }]}>Tap "Mark Attendance Now" to take today's roll call.</Text>
          </View>
        ) : (
          records.slice(0, 5).map((rec) => {
            const sub = subjects.find((s) => s.id === rec.subjectId) || { name: 'Subject', code: rec.subjectId };
            const isHoliday = rec.isHoliday;
            const presentCount = (rec.presentStudentIds || []).length;
            const pct = Math.round((presentCount / (rec.totalStudents || 30)) * 100);

            return (
              <View key={rec.id} style={[styles.historyItem, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
                <View style={[styles.historyIcon, isHoliday && { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Ionicons
                    name={isHoliday ? "sparkles" : "checkmark-circle"}
                    size={24}
                    color={isHoliday ? "#8B5CF6" : "#10B981"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historySubName, { color: colors.textMain }]}>{sub.name} ({sub.code})</Text>
                  <Text style={[styles.historyDate, { color: colors.textSub }]}>
                    {rec.date} • {isHoliday ? `HOLIDAY (${rec.holidayReason || 'College Closed'})` : (rec.time || 'Class')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.historyCount, { color: colors.textMain }, isHoliday && { color: colors.primary }]}>
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

      {/* Modal 1: Edit Notice Modal */}
      <Modal visible={editingNotice} transparent animationType="slide" onRequestClose={() => setEditingNotice(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: colors.bgGlassElevated, borderColor: colors.glassBorder, borderWidth: 1, borderRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textMain }}>📢 Edit CR Announcement</Text>
              <TouchableOpacity onPress={() => setEditingNotice(false)}>
                <Ionicons name="close" size={22} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={{
                backgroundColor: colors.bgGlass,
                borderColor: colors.glassBorder,
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                color: colors.textMain,
                fontSize: 14,
                minHeight: 90,
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
              multiline
              value={newNoticeInput}
              onChangeText={setNewNoticeInput}
              placeholder="Write important announcement message for students..."
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.bgGlass, borderColor: colors.glassBorder, borderWidth: 1 }}
                onPress={() => setEditingNotice(false)}
              >
                <Text style={{ color: colors.textSub, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primary }}
                onPress={handleSaveNotice}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save Notice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Edit Room Number Modal */}
      <Modal visible={Boolean(editingRoomSlot)} transparent animationType="fade" onRequestClose={() => setEditingRoomSlot(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: colors.bgGlassElevated, borderColor: colors.glassBorder, borderWidth: 1, borderRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textMain, marginBottom: 4 }}>
              ✏️ Update Room Number
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSub, marginBottom: 14 }}>
              {editingRoomSlot?.name}
            </Text>

            <TextInput
              style={{
                backgroundColor: colors.bgGlass,
                borderColor: colors.glassBorder,
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: colors.textMain,
                fontSize: 15,
                fontWeight: '700',
                marginBottom: 16,
              }}
              value={newRoomInput}
              onChangeText={setNewRoomInput}
              placeholder="e.g. Room 115 / Lab 3"
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.bgGlass, borderColor: colors.glassBorder, borderWidth: 1 }}
                onPress={() => setEditingRoomSlot(null)}
              >
                <Text style={{ color: colors.textSub, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primary }}
                onPress={handleSaveRoomNumber}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Update Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CR Security Passcode Modal */}
      <PasswordModal
        visible={passcodeModalVisible}
        onClose={() => setPasscodeModalVisible(false)}
        onSuccess={handlePasscodeSuccess}
        title="CR Security Passcode"
      />
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
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  noticeCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  crEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  crEditText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noticeContentText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  routineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  routineSub: {
    fontSize: 12,
    marginTop: 2,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  periodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  periodBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  periodTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
  },
  periodSubject: {
    fontSize: 13,
    fontWeight: '700',
  },
  periodFaculty: {
    fontSize: 11,
    marginTop: 2,
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  roomPillText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  crEditIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeRoomIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
