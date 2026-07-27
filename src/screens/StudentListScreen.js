import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/theme';

export default function StudentListScreen({
  students,
  stats,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSelectStudent,
  themeMode = 'light',
  onToggleTheme,
}) {
  const currentTheme = getTheme(themeMode);
  const colors = currentTheme.colors;
  const isLight = themeMode === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [rollInput, setRollInput] = useState('');

  // Password Protection State
  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const triggerProtectedAction = (action) => {
    setPendingAction(action);
    setPasscodeInput('');
    setPasscodeError('');
    setPasscodeModalVisible(true);
  };

  const handleVerifyPasscode = () => {
    if (passcodeInput.trim() === '9932123') {
      setPasscodeModalVisible(false);
      setPasscodeError('');
      const action = pendingAction;
      setPendingAction(null);

      if (action?.type === 'add') {
        handleOpenAdd();
      } else if (action?.type === 'edit') {
        handleOpenEdit(action.student);
      } else if (action?.type === 'delete') {
        handleDelete(action.student);
      }
    } else {
      setPasscodeError('Incorrect Password! Access denied.');
    }
  };

  const getPctColor = (pct) => {
    if (pct >= 75) return '#10B981';
    if (pct >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const handleOpenAdd = () => {
    setEditStudent(null);
    const nextRollNum = String(students.length + 1).padStart(2, '0');
    setRollInput(`25MTE${nextRollNum}`);
    setNameInput('');
    setModalVisible(true);
  };

  const handleOpenEdit = (stu) => {
    setEditStudent(stu);
    setRollInput(stu.rollNo);
    setNameInput(stu.name);
    setModalVisible(true);
  };

  const handleSaveModal = () => {
    if (!nameInput.trim() || !rollInput.trim()) {
      Alert.alert('Required Fields', 'Please enter student name and roll number.');
      return;
    }

    if (editStudent) {
      onUpdateStudent({
        ...editStudent,
        name: nameInput.trim(),
        rollNo: rollInput.trim(),
      });
    } else {
      const newStu = {
        id: `mte_stu_${Date.now()}`,
        rollNo: rollInput.trim(),
        rollInt: students.length + 1,
        name: nameInput.trim(),
        branch: 'Mechatronics',
        semester: '3rd',
      };
      onAddStudent(newStu);
    }

    setModalVisible(false);
  };

  const handleDelete = (stu) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to remove ${stu.name} (${stu.rollNo})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteStudent(stu.id),
        },
      ]
    );
  };

  const filteredStudents = students.filter(
    (stu) =>
      stu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
      {/* Top Title Bar */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textMain }]}>Students Roster</Text>
            <Text style={[styles.headerSub, { color: colors.textSub }]}>Mechatronics Engineering ({students.length} Total)</Text>
          </View>

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

            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary, borderColor: colors.glassBorderActive }]}
              onPress={() => triggerProtectedAction({ type: 'add' })}
              activeOpacity={0.8}
            >
              <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add Student</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.bgGlass, borderColor: colors.glassBorder }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textMain }]}
            placeholder="Search by Roll No or Name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const studentStat = (stats?.studentStats && stats.studentStats[item.id]) || { present: 0, total: 0 };
          const pct = studentStat.total > 0 ? Math.round((studentStat.present / studentStat.total) * 100) : 100;
          const statusColor = getPctColor(pct);

          return (
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
              <TouchableOpacity
                style={styles.cardLeft}
                onPress={() => onSelectStudent && onSelectStudent(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.rollBadge, { backgroundColor: isLight ? '#EEF2FF' : 'rgba(15, 23, 42, 0.8)' }]}>
                  <Text style={[styles.rollText, { color: colors.primary }]}>{item.rollNo}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={[styles.studentName, { color: colors.textMain }]}>{item.name}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtnIcon}
                  onPress={() => triggerProtectedAction({ type: 'edit', student: item })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={16} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnIcon}
                  onPress={() => triggerProtectedAction({ type: 'delete', student: item })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Add / Edit Student Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editStudent ? 'Edit Student Details' : 'Add New Mechatronics Student'}
            </Text>

            <Text style={styles.inputLabel}>Roll Number:</Text>
            <TextInput
              style={styles.modalInput}
              value={rollInput}
              onChangeText={setRollInput}
              placeholder="e.g. 25MTE31"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>Student Name:</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Full Name"
              placeholderTextColor="#64748B"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveModal}>
                <Text style={styles.saveModalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Authentication Modal for Admin Protection */}
      <Modal visible={passcodeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.lockIconCircle}>
              <Ionicons name="lock-closed" size={28} color="#818CF8" />
            </View>

            <Text style={styles.modalTitle}>Admin Password Required</Text>
            <Text style={styles.passcodeSub}>
              Editing student records is password protected. Enter Admin Password to proceed:
            </Text>

            <TextInput
              style={[styles.modalInput, passcodeError ? { borderColor: '#EF4444' } : null]}
              value={passcodeInput}
              onChangeText={(text) => {
                setPasscodeInput(text);
                setPasscodeError('');
              }}
              placeholder="Enter Password"
              placeholderTextColor="#64748B"
              secureTextEntry
            />

            {passcodeError ? (
              <Text style={styles.passcodeErrorText}>{passcodeError}</Text>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setPasscodeModalVisible(false);
                  setPendingAction(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleVerifyPasscode}>
                <Text style={styles.saveModalBtnText}>Unlock & Proceed 🔓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3A86FF',
    borderColor: '#70D6FF',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    boxShadow: '0 4px 14px rgba(58, 134, 255, 0.4)',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    padding: 0,
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(27, 38, 59, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rollBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rollText: {
    color: '#818CF8',
    fontWeight: '700',
    fontSize: 12,
  },
  infoCol: {
    flex: 1,
  },
  studentName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    marginTop: 4,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pctText: {
    fontWeight: '800',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(27, 38, 59, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  saveModalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#6366F1',
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  lockIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  passcodeSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  passcodeErrorText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  actionBtnIcon: {
    padding: 6,
  },
});
