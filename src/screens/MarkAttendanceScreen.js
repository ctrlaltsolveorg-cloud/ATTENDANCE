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

export default function MarkAttendanceScreen({
  students,
  subjects,
  records = [],
  onSaveSession,
  onCancel,
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [dateStr, setDateStr] = useState(getTodayDateString);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true); // 2-Column Grid view by default
  
  // Set of student IDs marked present
  const [presentMap, setPresentMap] = useState({});
  const [editingSessionId, setEditingSessionId] = useState(null);
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
    } else {
      students.forEach((stu) => {
        updatedMap[stu.id] = false;
      });
      setEditingSessionId(null);
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
    const presentStudentIds = Object.keys(presentMap).filter((id) => presentMap[id]);
    const absentCount = students.length - presentStudentIds.length;
    const sessionId = editingSessionId || `${selectedSubjectId}_${dateStr}`;

    const sessionData = {
      id: sessionId,
      subjectId: selectedSubjectId,
      date: dateStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      presentStudentIds,
      totalStudents: students.length,
    };

    const res = await onSaveSession(sessionData);

    const isCloud = res?.syncedCloud;
    const title = isCloud ? '☁️ Synced to Supabase Cloud DB!' : '💾 Saved to Local Storage';
    const msg = `Subject: ${selectedSub.name} (${selectedSub.code})\nDate: ${formatDisplayDate(dateStr)} (${dateStr})\n\n• Present: ${presentStudentIds.length} Students\n• Absent: ${absentCount} Students\n\nDatabase Status: ${isCloud ? '🟢 Live Synced on Supabase Cloud' : '🟡 Stored Locally'}`;

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
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {presentCount} / {students.length} Present
            </Text>
          </View>
        </View>
        <Text style={styles.headerSub}>Mechatronics 3rd Semester • Purnea College of Engg.</Text>

        {/* Interactive Date Selector & Plus/Minus Stepper Buttons */}
        <View style={styles.dateBar}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={16} color="#818CF8" />
            <Text style={styles.dateLabel}>Date:</Text>
            
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#F8FAFC',
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
                style={styles.dateInput}
                value={dateStr}
                onChangeText={setDateStr}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
              />
            )}
          </View>

          {/* Plus and Minus Stepper Buttons */}
          <TouchableOpacity style={styles.pmBtn} onPress={() => shiftDate(-1)} activeOpacity={0.7}>
            <Text style={styles.pmBtnText}>-</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pmBtn} onPress={() => shiftDate(1)} activeOpacity={0.7}>
            <Text style={styles.pmBtnText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.todayBtn} onPress={setToday} activeOpacity={0.7}>
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
        </View>

        {/* Prominent Formatted Live Date Display Pill */}
        <View style={styles.dateFormattedBadge}>
          <Ionicons name="calendar-outline" size={14} color="#818CF8" />
          <Text style={styles.dateFormattedText}>{formatDisplayDate(dateStr)}</Text>
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
      <View style={styles.subjectSection}>
        <Text style={styles.sectionLabel}>Select Subject / Lab ({subjects.length}):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <TouchableOpacity
                key={sub.id}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedSubjectId(sub.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={sub.icon || 'book-outline'}
                  size={14}
                  color={isSelected ? '#FFFFFF' : '#94A3B8'}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {sub.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {selectedSubject && (
          <Text style={styles.facultyDetail}>
            Faculty: <Text style={{ color: '#F8FAFC' }}>{selectedSubject.faculty}</Text> ({selectedSubject.code})
          </Text>
        )}
      </View>

      {/* Controls & Search */}
      <View style={styles.controlsRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Roll No or Name..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.batchBtnRow}>
          <TouchableOpacity style={styles.batchBtnP} onPress={markAllPresent}>
            <Text style={styles.batchBtnPText}>All P</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.batchBtnA} onPress={markAllAbsent}>
            <Text style={styles.batchBtnAText}>All A</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                isPresent ? styles.rowPresent : styles.rowAbsent,
              ]}
              onPress={() => toggleAttendance(item.id)}
              activeOpacity={0.7}
            >
              {/* Roll Badge */}
              <View style={[styles.rollBadge, isPresent && styles.rollBadgePresent]}>
                <Text style={[styles.rollText, isPresent && styles.rollTextPresent]}>
                  {item.rollNo}
                </Text>
              </View>

              {/* Student Name */}
              <Text style={styles.studentName} numberOfLines={1}>
                {item.name}
              </Text>

              {/* Minimal Checkbox: Green when Present, Empty dark when Absent */}
              <View
                style={[
                  styles.checkboxSquare,
                  isPresent ? styles.checkboxChecked : styles.checkboxUnchecked,
                ]}
              >
                {isPresent && (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Save Floating Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSavePress} activeOpacity={0.8}>
          <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Save Attendance Session</Text>
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
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
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
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
  rowPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  rowAbsent: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
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
});
