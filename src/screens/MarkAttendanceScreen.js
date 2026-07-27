import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PasswordModal from '../components/PasswordModal';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

import { getTheme } from '../theme/theme';

export default function MarkAttendanceScreen({
  students,
  subjects,
  records = [],
  onSaveSession,
  onCancel,
  themeMode = 'light',
  onToggleTheme,
}) {
  const currentTheme = getTheme(themeMode);
  const colors = currentTheme.colors;
  const isLight = themeMode === 'light';
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [dateStr, setDateStr] = useState(getTodayDateString);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true); // 2-Column Grid view by default
  
  // Set of student IDs marked present
  const [presentMap, setPresentMap] = useState({});
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayReason, setHolidayReason] = useState('College Holiday');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const shiftDate = (days) => {
    const parts = (dateStr || '').split('-');
    const current = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setDateStr(`${yyyy}-${mm}-${dd}`);
  };

  const setToday = () => {
    setDateStr(getTodayDateString());
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDateStr(`${yyyy}-${mm}-${dd}`);
  };

  // Pre-load saved attendance if a record already exists for (selectedSubjectId, dateStr)
  useEffect(() => {
    const existingRec = records.find(
      (r) => r.subjectId === selectedSubjectId && r.date === dateStr
    );

    const updatedMap = {};
    if (existingRec) {
      const presentSet = new Set(existingRec.presentStudentIds || []);
      students.forEach((stu) => {
        updatedMap[stu.id] = presentSet.has(stu.id);
      });
      setEditingSessionId(existingRec.id);
      setIsHoliday(Boolean(existingRec.isHoliday));
      setHolidayReason(existingRec.holidayReason || 'College Holiday');
    } else {
      students.forEach((stu) => {
        updatedMap[stu.id] = false;
      });
      setEditingSessionId(null);
      setIsHoliday(false);
      setHolidayReason('College Holiday');
    }
    setPresentMap(updatedMap);
  }, [selectedSubjectId, dateStr, records, students]);

  const toggleAttendance = (stuId) => {
    setPresentMap((prev) => ({
      ...prev,
      [stuId]: !prev[stuId],
    }));
  };

  const markAllPresent = () => {
    const updated = {};
    students.forEach((stu) => {
      updated[stu.id] = true;
    });
    setPresentMap(updated);
  };

  const markAllAbsent = () => {
    const updated = {};
    students.forEach((stu) => {
      updated[stu.id] = false;
    });
    setPresentMap(updated);
  };

  const toggleHolidayMode = () => {
    if (!isHoliday) {
      setIsHoliday(true);
      const updated = {};
      students.forEach((stu) => {
        updated[stu.id] = false;
      });
      setPresentMap(updated);
    } else {
      setIsHoliday(false);
    }
  };

  const handleSavePress = () => {
    const selectedSub = subjects.find((s) => s.id === selectedSubjectId);
    if (!selectedSub) {
      Alert.alert('Select Subject', 'Please select a subject first.');
      return;
    }
    setPasswordModalVisible(true);
  };

  const executeConfirmedSave = async () => {
    setPasswordModalVisible(false);
    const selectedSub = subjects.find((s) => s.id === selectedSubjectId);
    const presentStudentIds = isHoliday ? [] : Object.keys(presentMap).filter((id) => presentMap[id]);
    const absentCount = isHoliday ? 0 : (students.length - presentStudentIds.length);
    const sessionId = editingSessionId || `${selectedSubjectId}_${dateStr}`;

    const sessionData = {
      id: sessionId,
      subjectId: selectedSubjectId,
      date: dateStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      presentStudentIds,
      totalStudents: students.length,
      isHoliday,
      holidayReason: isHoliday ? (holidayReason || 'College Holiday') : '',
    };

    const res = await onSaveSession(sessionData);

    const isCloud = res?.syncedCloud;
    const title = isHoliday
      ? '🎉 Holiday Saved!'
      : (isCloud ? '☁️ Synced to Supabase Cloud DB!' : '💾 Saved to Local Storage');

    const msg = isHoliday
      ? `Subject: ${selectedSub.name}\nDate: ${formatDisplayDate(dateStr)}\nStatus: HOLIDAY (${holidayReason})\n\nResult: 0% Penalty (Excluded from student attendance percentage)`
      : `Subject: ${selectedSub.name} (${selectedSub.code})\nDate: ${formatDisplayDate(dateStr)} (${dateStr})\n\n• Present: ${presentStudentIds.length} Students\n• Absent: ${absentCount} Students\n\nDatabase Status: ${isCloud ? '🟢 Live Synced on Supabase Cloud' : '🟡 Stored Locally'}`;

    Alert.alert(title, msg, [{ text: 'OK' }]);
  };

  const filteredStudents = students.filter(
    (stu) =>
      stu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = Object.values(presentMap).filter(Boolean).length;
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>Mark Attendance</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {onToggleTheme && (
              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isLight ? '#EEF2FF' : 'rgba(168, 85, 247, 0.2)',
                  borderColor: isLight ? '#C7D2FE' : 'rgba(168, 85, 247, 0.4)',
                  borderWidth: 1,
                }}
                onPress={onToggleTheme}
                activeOpacity={0.7}
              >
                <Ionicons name={isLight ? 'sunny' : 'moon'} size={16} color={isLight ? '#4F46E5' : '#C084FC'} />
              </TouchableOpacity>
            )}

            <View style={[styles.counterBadge, isHoliday && styles.counterBadgeHoliday]}>
              <Text style={[styles.counterText, isHoliday && styles.counterTextHoliday]}>
                {isHoliday ? '🎉 HOLIDAY (Exempt)' : `${presentCount} / ${students.length} Present`}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.headerSub, { color: colors.textSub }]}>Mechatronics 3rd Semester • Purnea College of Engg.</Text>

        {/* Interactive Date Selector & Plus/Minus Stepper Buttons */}
        <View style={[styles.dateBar, { backgroundColor: 'transparent' }]}>
          <View style={[styles.dateRow, { backgroundColor: colors.bgGlass, borderColor: colors.glassBorder, borderWidth: 1 }]}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.dateLabel, { color: colors.textSub }]}>Date:</Text>
            
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  color: colors.textMain,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '120px',
                }}
              />
            ) : (
              <TextInput
                style={[styles.dateInput, { color: colors.textMain }]}
                value={dateStr}
                onChangeText={setDateStr}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            )}
          </View>

          {/* Plus and Minus Stepper Buttons */}
          <TouchableOpacity
            style={[
              styles.pmBtn,
              {
                backgroundColor: isLight ? '#EEF2FF' : '#334155',
                borderColor: isLight ? '#C7D2FE' : '#475569',
              },
            ]}
            onPress={() => shiftDate(-1)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pmBtnText, { color: isLight ? '#4F46E5' : '#F8FAFC' }]}>-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pmBtn,
              {
                backgroundColor: isLight ? '#EEF2FF' : '#334155',
                borderColor: isLight ? '#C7D2FE' : '#475569',
              },
            ]}
            onPress={() => shiftDate(1)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pmBtnText, { color: isLight ? '#4F46E5' : '#F8FAFC' }]}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.todayBtn,
              {
                backgroundColor: isLight ? '#EEF2FF' : 'rgba(99, 102, 241, 0.15)',
                borderColor: isLight ? '#C7D2FE' : '#6366F1',
              },
            ]}
            onPress={setToday}
            activeOpacity={0.7}
          >
            <Text style={[styles.todayBtnText, { color: colors.primary }]}>Today</Text>
          </TouchableOpacity>
        </View>

        {/* Prominent Formatted Live Date Display Pill */}
        <View style={[styles.dateFormattedBadge, { backgroundColor: colors.bgGlass, borderColor: colors.glassBorder }]}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[styles.dateFormattedText, { color: colors.primary }]}>{formatDisplayDate(dateStr)}</Text>
          {editingSessionId ? (
            <View style={styles.editPill}>
              <Text style={styles.editPillText}>Editing Saved Record</Text>
            </View>
          ) : (
            <View style={styles.newPill}>
              <Text style={styles.newPillText}>New Roll Call</Text>
            </View>
          )}
        </View>
      </View>

      {/* Subject Select Horizontal Chips */}
      <View style={[styles.subjectSection, { backgroundColor: colors.bgCard, borderBottomColor: colors.headerBorder }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSub }]}>Select Subject / Lab ({subjects.length}):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.bgGlass,
                    borderColor: isSelected ? colors.glassBorderActive : colors.glassBorder,
                  },
                ]}
                onPress={() => setSelectedSubjectId(sub.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={sub.icon || 'book-outline'}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSub}
                />
                <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.textSub }]}>
                  {sub.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {selectedSubject && (
          <Text style={[styles.facultyDetail, { color: colors.textSub }]}>
            Faculty: <Text style={{ color: colors.textMain, fontWeight: '700' }}>{selectedSubject.faculty}</Text> ({selectedSubject.code})
          </Text>
        )}
      </View>

      {/* Controls & Search */}
      <View style={styles.controlsRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.bgGlass, borderColor: colors.glassBorder }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textMain }]}
            placeholder="Search Roll No or Name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.batchBtnRow}>
          <TouchableOpacity
            style={[
              styles.holidayBtn,
              {
                backgroundColor: isHoliday ? '#8B5CF6' : (isLight ? '#F5F3FF' : 'rgba(139, 92, 246, 0.15)'),
                borderColor: isHoliday ? '#8B5CF6' : (isLight ? '#DDD6FE' : '#8B5CF6'),
              },
            ]}
            onPress={toggleHolidayMode}
            activeOpacity={0.7}
          >
            <Ionicons name={isHoliday ? "close-circle" : "sparkles"} size={14} color={isHoliday ? '#FFFFFF' : '#8B5CF6'} />
            <Text style={[styles.holidayBtnText, { color: isHoliday ? '#FFFFFF' : '#8B5CF6' }]}>
              {isHoliday ? 'Cancel Holiday' : 'Holiday'}
            </Text>
          </TouchableOpacity>

          {!isHoliday && (
            <>
              <TouchableOpacity style={styles.batchBtnP} onPress={markAllPresent}>
                <Text style={styles.batchBtnPText}>All P</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.batchBtnA} onPress={markAllAbsent}>
                <Text style={styles.batchBtnAText}>All A</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Holiday Banner Alert */}
      {isHoliday && (
        <View style={[styles.holidayBanner, { backgroundColor: isLight ? '#F3E8FF' : 'rgba(139, 92, 246, 0.15)', borderColor: isLight ? '#C084FC' : 'rgba(139, 92, 246, 0.4)' }]}>
          <Ionicons name="umbrella" size={28} color={isLight ? '#7C3AED' : '#A78BFA'} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.holidayBannerTitle, { color: isLight ? '#4C1D95' : '#DDD6FE' }]}>Official Holiday / Class Cancelled</Text>
              <TouchableOpacity style={styles.cancelHolidayPill} onPress={toggleHolidayMode} activeOpacity={0.7}>
                <Ionicons name="close" size={12} color="#FFFFFF" />
                <Text style={styles.cancelHolidayPillText}>Cancel Holiday</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.holidayBannerSub, { color: isLight ? '#6B21A8' : '#A78BFA' }]}>
              Students will NOT be marked absent. Attendance percentage is completely exempt for this date.
            </Text>
            <View style={styles.reasonInputRow}>
              <Text style={[styles.reasonLabel, { color: isLight ? '#581C87' : '#C4B5FD' }]}>Reason:</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="text"
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                    color: isLight ? '#1E1B4B' : '#F8FAFC',
                    border: isLight ? '1px solid #C084FC' : '1px solid rgba(167, 139, 250, 0.4)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    outline: 'none',
                    width: '180px',
                  }}
                  placeholder="e.g. Sunday / College Festival"
                />
              ) : (
                <TextInput
                  style={[
                    styles.reasonInput,
                    {
                      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)',
                      color: isLight ? '#1E1B4B' : '#F8FAFC',
                      borderColor: isLight ? '#C084FC' : 'rgba(167, 139, 250, 0.4)',
                    },
                  ]}
                  value={holidayReason}
                  onChangeText={setHolidayReason}
                  placeholder="Reason (e.g. Sunday / Holiday)"
                  placeholderTextColor={isLight ? '#7C3AED' : '#94A3B8'}
                />
              )}
            </View>
          </View>
        </View>
      )}

      {/* Ultra Clean Attendance Register List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isPresent = Boolean(presentMap[item.id]);

          return (
            <TouchableOpacity
              style={[
                styles.registerRow,
                {
                  backgroundColor: isHoliday ? (isLight ? '#F5F3FF' : 'rgba(107, 33, 168, 0.25)') : (isPresent ? (isLight ? '#ECFDF5' : 'rgba(6, 78, 59, 0.4)') : colors.bgCard),
                  borderColor: isHoliday ? '#8B5CF6' : (isPresent ? '#10B981' : colors.glassBorder),
                  boxShadow: colors.cardShadow,
                },
              ]}
              onPress={() => !isHoliday && toggleAttendance(item.id)}
              disabled={isHoliday}
              activeOpacity={0.7}
            >
              {/* Roll Badge */}
              <View style={[styles.rollBadge, { backgroundColor: isHoliday ? '#8B5CF6' : (isPresent ? '#10B981' : (isLight ? '#EEF2FF' : 'rgba(15, 23, 42, 0.8)')) }]}>
                <Text style={[styles.rollText, { color: (isHoliday || isPresent) ? '#FFFFFF' : colors.primary }]}>
                  {item.rollNo}
                </Text>
              </View>

              {/* Student Name */}
              <Text style={[styles.studentName, { color: colors.textMain }]} numberOfLines={1}>
                {item.name}
              </Text>

              {/* Status Badge Checkbox */}
              {isHoliday ? (
                <View style={[styles.holidayTagPill, { backgroundColor: isLight ? '#E9D5FF' : 'rgba(139, 92, 246, 0.25)', borderColor: isLight ? '#C084FC' : 'rgba(139, 92, 246, 0.4)' }]}>
                  <Text style={[styles.holidayTagPillText, { color: isLight ? '#6B21A8' : '#C4B5FD' }]}>EXEMPT</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.checkboxSquare,
                    isPresent
                      ? styles.checkboxChecked
                      : {
                          backgroundColor: isLight ? '#F1F5F9' : 'rgba(15, 23, 42, 0.8)',
                          borderColor: isLight ? '#CBD5E1' : '#475569',
                          borderWidth: 2,
                        },
                  ]}
                >
                  {isPresent && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Save Floating Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.headerBg, borderTopColor: colors.headerBorder }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }, isHoliday && styles.saveBtnHoliday]}
          onPress={handleSavePress}
          activeOpacity={0.8}
        >
          <Ionicons name={isHoliday ? 'sparkles' : 'cloud-upload'} size={20} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>
            {isHoliday ? 'Save Date as Holiday' : 'Save Attendance Session'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CR Security Passcode Verification Modal */}
      <PasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onSuccess={executeConfirmedSave}
        title="CR Security Verification"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  counterBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  dateInput: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    padding: 0,
    minWidth: 90,
  },
  quickDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pmBtn: {
    backgroundColor: '#334155',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  pmBtnText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginTop: -2,
    textAlign: 'center',
  },
  todayBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
  },
  todayBtnText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },
  dateFormattedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignSelf: 'flex-start',
  },
  dateFormattedText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '800',
  },
  editPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editPillText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  newPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  subjectSection: {
    padding: 14,
    backgroundColor: 'rgba(27, 38, 59, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipActive: {
    backgroundColor: '#3A86FF',
    borderColor: '#70D6FF',
    boxShadow: '0 4px 12px rgba(58, 134, 255, 0.4)',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  facultyDetail: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    maxWidth: 650,
    width: '100%',
    alignSelf: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    padding: 0,
  },
  viewToggleBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  batchBtnP: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  batchBtnPText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
  },
  batchBtnA: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  batchBtnAText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27, 38, 59, 0.75)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },
  rowPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  rowAbsent: {
    backgroundColor: 'rgba(27, 38, 59, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rollBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 14,
    minWidth: 80,
    alignItems: 'center',
  },
  rollBadgePresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  rollText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 12,
  },
  rollTextPresent: {
    color: '#10B981',
  },
  studentName: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  checkboxSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  checkboxUnchecked: {
    backgroundColor: '#0F172A',
    borderColor: '#475569',
    borderWidth: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 650,
    width: '100%',
    alignSelf: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  counterBadgeHoliday: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  counterTextHoliday: {
    color: '#C4B5FD',
  },
  holidayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  holidayBtnActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  holidayBtnText: {
    color: '#C4B5FD',
    fontWeight: '700',
    fontSize: 12,
  },
  holidayBtnTextActive: {
    color: '#FFFFFF',
  },
  holidayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
    maxWidth: 650,
    alignSelf: 'center',
    width: '95%',
  },
  holidayBannerTitle: {
    color: '#DDD6FE',
    fontSize: 15,
    fontWeight: '800',
  },
  holidayBannerSub: {
    color: '#A78BFA',
    fontSize: 12,
    marginTop: 2,
  },
  reasonInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  reasonLabel: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  reasonInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    borderWidth: 1,
    flex: 1,
  },
  rowHoliday: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
    opacity: 0.85,
  },
  rollBadgeHoliday: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  rollTextHoliday: {
    color: '#C4B5FD',
  },
  holidayTagPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  holidayTagPillText: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  saveBtnHoliday: {
    backgroundColor: '#8B5CF6',
  },
  cancelHolidayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  cancelHolidayPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
