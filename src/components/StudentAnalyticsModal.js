import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StudentAnalyticsModal({
  visible,
  student,
  subjects = [],
  records = [],
  onClose,
}) {
  if (!student) return null;

  // Calculate subject-wise attendance for this student
  let totalAttendedAll = 0;
  let totalHeldAll = 0;
  let totalHolidaysExempt = 0;

  // Count holiday records
  records.forEach((r) => {
    if (r.isHoliday) {
      totalHolidaysExempt += 1;
    }
  });

  const subjectBreakdown = subjects.map((sub) => {
    const activeSubRecords = records.filter((r) => r.subjectId === sub.id && !r.isHoliday);
    const totalHeld = activeSubRecords.length;
    const attended = activeSubRecords.filter((r) =>
      (r.presentStudentIds || []).includes(student.id)
    ).length;

    totalAttendedAll += attended;
    totalHeldAll += totalHeld;

    const pct = totalHeld > 0 ? Math.round((attended / totalHeld) * 100) : null;
    return {
      ...sub,
      totalHeld,
      attended,
      percentage: pct,
    };
  });

  const detainedSubjects = subjectBreakdown.filter((s) => s.percentage !== null && s.percentage < 75);
  const isFullEligible = detainedSubjects.length === 0;

  const getPctColor = (pct) => {
    if (pct === null) return '#64748B';
    if (pct >= 75) return '#10B981'; // Emerald
    if (pct >= 60) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Top Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <Ionicons name="bar-chart" size={20} color="#818CF8" />
              <Text style={styles.modalHeaderTitle}>Student Graphical Analytics</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
            {/* Student Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarRow}>
                <View style={[styles.avatarCircle, { borderColor: isFullEligible ? '#10B981' : '#EF4444' }]}>
                  <Text style={styles.avatarText}>
                    {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentRoll}>BEU Roll No: {student.rollNo}</Text>
                  {student.regNo ? (
                    <Text style={styles.studentReg}>Reg No: {student.regNo}</Text>
                  ) : null}
                </View>

                {/* Detained Papers Count Badge */}
                <View style={[styles.pctBadgeLarge, { backgroundColor: isFullEligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', borderColor: isFullEligible ? '#10B981' : '#EF4444' }]}>
                  <Text style={[styles.pctBadgeTextLarge, { color: isFullEligible ? '#10B981' : '#EF4444' }]}>
                    {detainedSubjects.length}
                  </Text>
                  <Text style={styles.pctBadgeSub}>Detained</Text>
                </View>
              </View>

              {/* Status Banner */}
              <View style={[styles.statusBanner, isFullEligible ? styles.statusEligible : styles.statusDetained]}>
                <Ionicons
                  name={isFullEligible ? 'checkmark-shield' : 'alert-circle'}
                  size={18}
                  color={isFullEligible ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.statusText, { color: isFullEligible ? '#10B981' : '#EF4444' }]}>
                  {isFullEligible
                    ? 'FULL EXAM ELIGIBILITY (>= 75% in all subjects)'
                    : `DETAINED IN ${detainedSubjects.length} PAPER(S): ${detainedSubjects.map((s) => s.shortName).join(', ')}`}
                </Text>
              </View>

              {/* Student Bio Grid */}
              <View style={styles.bioGrid}>
                {student.fatherName ? (
                  <View style={styles.bioItem}>
                    <Text style={styles.bioLabel}>Father's Name:</Text>
                    <Text style={styles.bioValue}>{student.fatherName}</Text>
                  </View>
                ) : null}

                {student.motherName ? (
                  <View style={styles.bioItem}>
                    <Text style={styles.bioLabel}>Mother's Name:</Text>
                    <Text style={styles.bioValue}>{student.motherName}</Text>
                  </View>
                ) : null}

                {student.dob ? (
                  <View style={styles.bioItem}>
                    <Text style={styles.bioLabel}>Date of Birth:</Text>
                    <Text style={styles.bioValue}>{student.dob}</Text>
                  </View>
                ) : null}

                <View style={styles.bioItem}>
                  <Text style={styles.bioLabel}>Branch & Sem:</Text>
                  <Text style={styles.bioValue}>{student.branch || 'Mechatronics'} • {student.semester || '3rd'} Sem</Text>
                </View>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsRow}>
              <View style={styles.statMiniCard}>
                <Text style={styles.statMiniNum}>{totalAttendedAll}</Text>
                <Text style={styles.statMiniLabel}>Classes Attended</Text>
              </View>
              <View style={styles.statMiniCard}>
                <Text style={styles.statMiniNum}>{totalHeldAll}</Text>
                <Text style={styles.statMiniLabel}>Total Held</Text>
              </View>
              <View style={styles.statMiniCard}>
                <Text style={[styles.statMiniNum, { color: '#C4B5FD' }]}>{totalHolidaysExempt}</Text>
                <Text style={styles.statMiniLabel}>Holidays Exempt</Text>
              </View>
            </View>

            {/* Subject-Wise Graphical Chart Section */}
            <View style={styles.chartSection}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="bar-chart-outline" size={18} color="#818CF8" />
                <Text style={styles.sectionTitleText}>Subject-Wise Attendance Graphical Analysis</Text>
              </View>
              <Text style={styles.sectionSubText}>All 11 Mechatronics BEU Syllabus Subjects & Labs</Text>

              {/* Combined 11-Subject Histogram Chart Diagram */}
              <View style={styles.histogramCard}>
                <View style={styles.histogramHeader}>
                  <Ionicons name="analytics" size={18} color="#818CF8" />
                  <Text style={styles.histogramTitle}>Combined 11-Subject Attendance Histogram Diagram</Text>
                </View>
                <Text style={styles.histogramSub}>Unified side-by-side comparative histogram chart for all subjects:</Text>

                <View style={styles.histogramContainer}>
                  {/* Guideline Overlay */}
                  <View style={styles.yAxisLine100}>
                    <Text style={styles.yAxisLabel}>100%</Text>
                  </View>
                  <View style={styles.yAxisLine75}>
                    <Text style={styles.yAxisLabel75}>75% Target Line</Text>
                  </View>
                  <View style={styles.yAxisLine50}>
                    <Text style={styles.yAxisLabel}>50%</Text>
                  </View>

                  {/* Unified Bar Histogram */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsRowScroll}>
                    {subjectBreakdown.map((sub) => {
                      const pct = sub.percentage !== null ? sub.percentage : 0;
                      const barColor = getPctColor(sub.percentage);

                      return (
                        <View key={sub.id} style={styles.histogramCol}>
                          <Text style={[styles.barTopPct, { color: barColor }]}>
                            {sub.percentage !== null ? `${sub.percentage}%` : 'N/A'}
                          </Text>

                          <View style={styles.verticalPlotArea}>
                            <View
                              style={[
                                styles.verticalBarFill,
                                {
                                  height: `${Math.max(pct, 5)}%`,
                                  backgroundColor: barColor,
                                },
                              ]}
                            />
                          </View>

                          <Text style={styles.xBarCode} numberOfLines={1}>
                            {sub.shortName}
                          </Text>
                          <Text style={styles.xBarDetail}>
                            {sub.attended}/{sub.totalHeld}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* Detailed Breakdown List */}
              <View style={styles.graphContainer}>
                {subjectBreakdown.map((sub) => {
                  const barColor = getPctColor(sub.percentage);
                  const fillPct = sub.percentage !== null ? sub.percentage : 0;

                  return (
                    <View key={sub.id} style={styles.graphBarRow}>
                      <View style={styles.graphBarHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name={sub.icon || 'book-outline'} size={14} color="#818CF8" />
                          <Text style={styles.graphSubName}>{sub.name} ({sub.shortName})</Text>
                        </View>
                        <Text style={[styles.graphPctText, { color: barColor }]}>
                          {sub.percentage !== null ? `${sub.percentage}%` : 'N/A'}
                        </Text>
                      </View>

                      {/* Visual Bar Track */}
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${fillPct}%`,
                              backgroundColor: barColor,
                            },
                          ]}
                        />
                      </View>

                      <View style={styles.graphBarFooter}>
                        <Text style={[styles.graphDetailText, { color: sub.percentage !== null && sub.percentage < 75 ? '#F87171' : '#94A3B8' }]}>
                          {sub.totalHeld === 0
                            ? 'No classes recorded yet'
                            : `${sub.attended} attended of ${sub.totalHeld} held • ${sub.percentage >= 75 ? '🟢 Eligible' : '🔴 Detained Paper (<75%)'}`}
                        </Text>
                        <Text style={styles.graphFacultyText}>
                          Faculty: {sub.faculty || 'Department'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 24,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 20,
    gap: 16,
  },
  profileCard: {
    backgroundColor: 'rgba(27, 38, 59, 0.75)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  studentRoll: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  studentReg: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  pctBadgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  pctBadgeTextLarge: {
    fontSize: 20,
    fontWeight: '900',
  },
  pctBadgeSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1,
  },
  statusEligible: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDetained: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bioGrid: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bioItem: {
    width: '47%',
  },
  bioLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  bioValue: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(27, 38, 59, 0.75)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statMiniNum: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  statMiniLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  chartSection: {
    backgroundColor: 'rgba(27, 38, 59, 0.75)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  graphContainer: {
    gap: 14,
  },
  graphBarRow: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  graphBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  graphSubName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  graphPctText: {
    fontSize: 13,
    fontWeight: '800',
  },
  barTrack: {
    height: 10,
    backgroundColor: '#1E293B',
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  graphBarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  graphDetailText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  graphFacultyText: {
    color: '#64748B',
    fontSize: 11,
  },
  histogramCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  histogramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  histogramTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  histogramSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 12,
  },
  histogramContainer: {
    height: 200,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingTop: 24,
    paddingBottom: 36,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  yAxisLine100: {
    position: 'absolute',
    top: 24,
    left: 8,
    right: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  yAxisLine75: {
    position: 'absolute',
    top: 60,
    left: 8,
    right: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.4)',
    borderStyle: 'dashed',
  },
  yAxisLine50: {
    position: 'absolute',
    top: 96,
    left: 8,
    right: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  yAxisLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
    position: 'absolute',
    top: -12,
    right: 4,
  },
  yAxisLabel75: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
    position: 'absolute',
    top: -12,
    right: 4,
  },
  barsRowScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 8,
    height: '100%',
  },
  histogramCol: {
    alignItems: 'center',
    width: 42,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopPct: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  verticalPlotArea: {
    width: 22,
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  verticalBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  xBarCode: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  xBarDetail: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 1,
    textAlign: 'center',
  },
});
