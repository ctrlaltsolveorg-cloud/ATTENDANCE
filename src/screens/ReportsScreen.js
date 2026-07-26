import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateCSVReport, generatePrintableHTMLRegister } from '../services/storage';

export default function ReportsScreen({ students, subjects, records, stats }) {
  const [selectedTab, setSelectedTab] = useState('summary'); // 'summary' | 'low' | 'export'
  const [selectedExportSubject, setSelectedExportSubject] = useState('ALL');

  const handleExportCSV = async () => {
    try {
      const csvContent = generateCSVReport(students, subjects, records);
      await Share.share({
        message: csvContent,
        title: 'PCE Mechatronics 3rd Sem Attendance Report.csv',
      });
    } catch (error) {
      Alert.alert('Export Error', error.message);
    }
  };

  const handlePrintPDF = () => {
    try {
      const htmlContent = generatePrintableHTMLRegister(students, subjects, records, null, selectedExportSubject);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        } else {
          Alert.alert('Popup Blocked', 'Please allow popups in your browser to print/save PDF.');
        }
      } else {
        Share.share({
          message: htmlContent,
          title: 'PCE_Mechatronics_Attendance_Register.html',
        });
      }
    } catch (error) {
      Alert.alert('PDF Print Error', error.message);
    }
  };

  const getPctColor = (pct) => {
    if (pct >= 75) return '#10B981';
    if (pct >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Reports</Text>
        <Text style={styles.headerSub}>
          Mechatronics (M.T.E) • {records.length} Total Sessions Recorded
        </Text>

        {/* Tab switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'summary' && styles.tabActive]}
            onPress={() => setSelectedTab('summary')}
          >
            <Text style={[styles.tabText, selectedTab === 'summary' && styles.tabTextActive]}>
              Student Matrix
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'low' && styles.tabActive]}
            onPress={() => setSelectedTab('low')}
          >
            <Text style={[styles.tabText, selectedTab === 'low' && styles.tabTextActive]}>
              Low Attendance ({stats.lowAttendanceStudents.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'export' && styles.tabActive]}
            onPress={() => setSelectedTab('export')}
          >
            <Text style={[styles.tabText, selectedTab === 'export' && styles.tabTextActive]}>
              Export Data
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {selectedTab === 'summary' && (
          <View>
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={18} color="#818CF8" />
              <Text style={styles.infoText}>
                Swipe horizontally to view subject-wise attendance percentage for each student.
              </Text>
            </View>

            {students.map((stu) => {
              return (
                <View key={stu.id} style={styles.studentReportRow}>
                  <View style={styles.stuRowHeader}>
                    <Text style={styles.stuName}>{stu.name}</Text>
                    <Text style={styles.stuRoll}>{stu.rollNo}</Text>
                  </View>

                  {/* Horizontal Scrollable Subject Percentage List */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalSubList}
                  >
                    {subjects.map((sub) => {
                      const subRecords = records.filter((r) => r.subjectId === sub.id);
                      const totalSub = subRecords.length;
                      const attended = subRecords.filter((r) => (r.presentStudentIds || []).includes(stu.id)).length;
                      const subPct = totalSub > 0 ? Math.round((attended / totalSub) * 100) : null;
                      const subColor = subPct !== null ? getPctColor(subPct) : '#64748B';

                      return (
                        <View
                          key={sub.id}
                          style={[
                            styles.subPill,
                            { borderColor: subPct !== null ? `${subColor}60` : '#334155' },
                          ]}
                        >
                          <Text style={styles.subPillTitle}>{sub.shortName}</Text>
                          <Text style={[styles.subPillPct, { color: subColor }]}>
                            {subPct !== null ? `${subPct}%` : 'N/A'}
                          </Text>
                          <Text style={styles.subPillCount}>
                            {totalSub === 0 ? '0 class' : `${attended}/${totalSub}`}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}
          </View>
        )}

        {selectedTab === 'low' && (
          <View>
            <Text style={styles.sectionHeader}>{"Shortage List (< 75% Attendance)"}</Text>
            {stats.lowAttendanceStudents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                <Text style={styles.emptyTitle}>All Clear!</Text>
                <Text style={styles.emptySub}>
                  No students are currently short on attendance. Everyone is above 75%.
                </Text>
              </View>
            ) : (
              stats.lowAttendanceStudents.map((stu) => (
                <View key={stu.id} style={styles.lowCard}>
                  <View style={styles.lowCardLeft}>
                    <Text style={styles.lowRoll}>{stu.rollNo}</Text>
                    <View>
                      <Text style={styles.lowName}>{stu.name}</Text>
                      <Text style={styles.lowSub}>
                        Attended {stu.present} out of {stu.total} total sessions
                      </Text>
                    </View>
                  </View>
                  <View style={styles.lowBadge}>
                    <Text style={styles.lowBadgeText}>{stu.percentage}%</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {selectedTab === 'export' && (
          <View style={styles.exportContainer}>
            {/* Subject Filter Section for Teachers */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Select Subject for PDF Register:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, selectedExportSubject === 'ALL' && styles.filterChipActive]}
                  onPress={() => setSelectedExportSubject('ALL')}
                >
                  <Text style={[styles.filterChipText, selectedExportSubject === 'ALL' && styles.filterChipTextActive]}>
                    All Subjects Combined
                  </Text>
                </TouchableOpacity>

                {subjects.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.filterChip, selectedExportSubject === sub.id && styles.filterChipActive]}
                    onPress={() => setSelectedExportSubject(sub.id)}
                  >
                    <Text style={[styles.filterChipText, selectedExportSubject === sub.id && styles.filterChipTextActive]}>
                      {sub.shortName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* PDF Attendance Register Export Card */}
            <View style={[styles.exportCard, { marginBottom: 16, borderColor: '#6366F1', borderWidth: 1 }]}>
              <View style={styles.iconCircle}>
                <Ionicons name="print-outline" size={32} color="#818CF8" />
              </View>
              <Text style={styles.exportTitle}>
                {selectedExportSubject === 'ALL'
                  ? 'All Subjects PDF Register'
                  : `${subjects.find((s) => s.id === selectedExportSubject)?.name || 'Subject'} PDF Register`}
              </Text>
              <Text style={styles.exportSub}>
                {selectedExportSubject === 'ALL'
                  ? 'Generate a full college attendance register showing all subjects month-by-month on separate pages.'
                  : `Generate a dedicated monthly attendance register for ${subjects.find((s) => s.id === selectedExportSubject)?.name} (${subjects.find((s) => s.id === selectedExportSubject)?.faculty || 'Faculty'}). Each month will be printed on a separate page!`}
              </Text>

              <TouchableOpacity style={styles.exportBtnPdf} onPress={handlePrintPDF} activeOpacity={0.8}>
                <Ionicons name="print-outline" size={20} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>
                  {selectedExportSubject === 'ALL' ? 'Print PDF Register (All Subjects)' : `Print ${subjects.find((s) => s.id === selectedExportSubject)?.shortName} PDF Register`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Excel / CSV Export Card */}
            <View style={styles.exportCard}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="stats-chart-outline" size={32} color="#10B981" />
              </View>
              <Text style={styles.exportTitle}>Excel / CSV Data Export</Text>
              <Text style={styles.exportSub}>
                Generate formatted Excel spreadsheet (.csv) containing student roll numbers, names, and subject-wise attendance percentages for Microsoft Excel.
              </Text>

              <TouchableOpacity style={styles.exportBtnCsv} onPress={handleExportCSV} activeOpacity={0.8}>
                <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Export Excel / CSV File</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: 4,
    borderRadius: 10,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: '#6366F1',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoText: {
    color: '#CBD5E1',
    fontSize: 12,
    flex: 1,
  },
  studentReportRow: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stuRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stuName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  stuRoll: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalSubList: {
    flexDirection: 'row',
    gap: 8,
  },
  subPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  subPillTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  subPillPct: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  subPillCount: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  lowCard: {
    backgroundColor: '#1E293B',
    borderColor: '#7F1D1D',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lowCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  lowRoll: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 12,
  },
  lowName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  lowSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  lowBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lowBadgeText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 14,
  },
  exportContainer: {
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  subFilterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  exportCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  exportTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  exportSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  exportBtnPdf: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  exportBtnCsv: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
