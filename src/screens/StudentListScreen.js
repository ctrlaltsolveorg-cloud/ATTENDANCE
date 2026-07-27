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

export default function StudentListScreen({
  students,
  stats,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSelectStudent,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [rollInput, setRollInput] = useState('');

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
    <View style={styles.container}>
      {/* Top Title Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Students Roster</Text>
            <Text style={styles.headerSub}>Mechatronics Engineering ({students.length} Total)</Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
            <Ionicons name="person-add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Student</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Roll No or Name..."
            placeholderTextColor="#64748B"
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
          const studentStat = stats.studentStats[item.id] || { present: 0, total: 0 };
          const pct = studentStat.total > 0 ? Math.round((studentStat.present / studentStat.total) * 100) : 100;
          const statusColor = getPctColor(pct);

          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardLeft}
                onPress={() => onSelectStudent && onSelectStudent(item)}
                activeOpacity={0.7}
              >
                <View style={styles.rollBadge}>
                  <Text style={styles.rollText}>{item.rollNo}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.studentName}>{item.name}</Text>

                  <View style={styles.statsRow}>
                    <Text style={styles.statLabel}>
                      Attended: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{studentStat.present}</Text> / {studentStat.total} • <Ionicons name="bar-chart" size={12} color="#818CF8" /> <Text style={{ color: '#818CF8' }}>Graph</Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.cardRight}>
                <View style={[styles.pctBadge, { backgroundColor: `${statusColor}20`, borderColor: statusColor }]}>
                  <Text style={[styles.pctText, { color: statusColor }]}>{pct}%</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity onPress={() => handleOpenEdit(item)}>
                    <Ionicons name="pencil" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
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
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
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
});
