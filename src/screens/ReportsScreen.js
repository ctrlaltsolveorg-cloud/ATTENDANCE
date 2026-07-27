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

import { getTheme } from '../theme/theme';

export default function ReportsScreen({
  students,
  subjects,
  records,
  stats,
  onSelectStudent,
  themeMode = 'light',
  onToggleTheme,
}) {
  const currentTheme = getTheme(themeMode);
  const colors = currentTheme.colors;
  const isLight = themeMode === 'light';

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
    <View style={[styles.container, { backgroundColor: colors.bgDark }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>Attendance Reports</Text>
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
        </View>
        <Text style={[styles.headerSub, { color: colors.textSub }]}>
          Mechatronics (M.T.E) • {records.length} Total Sessions Recorded
        </Text>

        {/* Separate Tab Chips with Icons (Order: Student, Analytics, PDF, Shortage) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollContainer}
          contentContainerStyle={styles.tabContainer}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: selectedTab === 'summary' ? colors.primary : colors.bgGlass,
                borderColor: selectedTab === 'summary' ? colors.glassBorderActive : colors.glassBorder,
              },
            ]}
            onPress={() => setSelectedTab('summary')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="grid"
              size={14}
              color={selectedTab === 'summary' ? '#FFFFFF' : colors.primary}
            />
            <Text style={[styles.tabText, { color: selectedTab === 'summary' ? '#FFFFFF' : colors.textSub }]}>
              Student
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: selectedTab === 'analytics' ? colors.primary : colors.bgGlass,
                borderColor: selectedTab === 'analytics' ? colors.glassBorderActive : colors.glassBorder,
              },
            ]}
            onPress={() => setSelectedTab('analytics')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="stats-chart"
              size={14}
              color={selectedTab === 'analytics' ? '#FFFFFF' : colors.primary}
            />
            <Text style={[styles.tabText, { color: selectedTab === 'analytics' ? '#FFFFFF' : colors.textSub }]}>
              Analytics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: selectedTab === 'export' ? colors.primary : colors.bgGlass,
                borderColor: selectedTab === 'export' ? colors.glassBorderActive : colors.glassBorder,
              },
            ]}
            onPress={() => setSelectedTab('export')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="download"
              size={14}
              color={selectedTab === 'export' ? '#FFFFFF' : '#10B981'}
            />
            <Text style={[styles.tabText, { color: selectedTab === 'export' ? '#FFFFFF' : colors.textSub }]}>
              PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: selectedTab === 'low' ? colors.primary : colors.bgGlass,
                borderColor: selectedTab === 'low' ? colors.glassBorderActive : colors.glassBorder,
              },
            ]}
            onPress={() => setSelectedTab('low')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="alert-circle"
              size={14}
              color={selectedTab === 'low' ? '#FFFFFF' : '#EF4444'}
            />
            <Text style={[styles.tabText, { color: selectedTab === 'low' ? '#FFFFFF' : colors.textSub }]}>
              Shortage
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {selectedTab === 'summary' && (
          <View>
            <View style={[styles.infoBanner, { backgroundColor: isLight ? '#EEF2FF' : 'rgba(99, 102, 241, 0.1)', borderColor: isLight ? '#C7D2FE' : '#6366F1' }]}>
              <Ionicons name="information-circle" size={18} color={isLight ? '#4F46E5' : '#818CF8'} />
              <Text style={[styles.infoText, { color: isLight ? '#3730A3' : '#CBD5E1' }]}>
                Swipe horizontally to view subject-wise attendance percentage for each student.
              </Text>
            </View>

            {students.map((stu) => {
              return (
                <View key={stu.id} style={[styles.studentReportRow, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
                  <TouchableOpacity
                    style={styles.stuRowHeader}
                    onPress={() => onSelectStudent && onSelectStudent(stu)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stuName, { color: colors.textMain }]}>{stu.name}</Text>
                      <Text style={[styles.stuRoll, { color: colors.primary }]}>{stu.rollNo} • Tap for Bar Chart 📊</Text>
                    </View>
                    <Ionicons name="bar-chart" size={16} color={colors.primary} />
                  </TouchableOpacity>

                  {/* Horizontal Scrollable Subject Percentage List */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalSubList}
                  >
                    {subjects.map((sub) => {
                      const subRecords = records.filter((r) => r.subjectId === sub.id && !r.isHoliday);
                      const totalSub = subRecords.length;
                      const attended = subRecords.filter((r) => (r.presentStudentIds || []).includes(stu.id)).length;
                      const subPct = totalSub > 0 ? Math.round((attended / totalSub) * 100) : null;
                      const subColor = subPct !== null ? getPctColor(subPct) : colors.textMuted;

                      return (
                        <View
                          key={sub.id}
                          style={[
                            styles.subPill,
                            {
                              backgroundColor: colors.bgGlass,
                              borderColor: subPct !== null ? `${subColor}60` : colors.glassBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.subPillTitle, { color: colors.textSub }]}>{sub.shortName}</Text>
                          <Text style={[styles.subPillPct, { color: subColor }]}>
                            {subPct !== null ? `${subPct}%` : 'N/A'}
                          </Text>
                          <Text style={[styles.subPillCount, { color: colors.textMuted }]}>
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
            <Text style={[styles.sectionHeader, { color: colors.textMain }]}>{"Subject-Wise Detained Papers Shortage List (< 75%)"}</Text>
            {(!stats?.lowAttendanceStudents || stats.lowAttendanceStudents.length === 0) ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>All Clear!</Text>
                <Text style={[styles.emptySub, { color: colors.textSub }]}>
                  No students are currently detained in any subject paper. Everyone is above 75% in all subjects.
                </Text>
              </View>
            ) : (
              stats.lowAttendanceStudents.map((stu) => (
                <TouchableOpacity
                  key={stu.id}
                  style={[styles.lowCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}
                  onPress={() => onSelectStudent && onSelectStudent(stu)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={[styles.lowName, { color: colors.textMain }]}>{stu.name}</Text>
                      <Text style={[styles.lowRoll, { color: colors.primary }]}>{stu.rollNo}</Text>
                    </View>
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
                      Detained in {stu.detainedCount} Paper(s):
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {(stu.detainedSubjects || []).map((sub) => (
                        <View key={sub.subjectId} style={styles.detainedPill}>
                          <Text style={styles.detainedPillText}>
                            {sub.shortName}: {sub.percentage}% ({sub.attended}/{sub.totalHeld})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {selectedTab === 'analytics' && (
          <View style={styles.analyticsTabContainer}>
            {/* Subject-Wise Exam Eligibility Summary */}
            <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
              <View style={styles.chartCardHeader}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                <Text style={[styles.chartCardTitle, { color: colors.textMain }]}>BEU Subject-Wise Exam Eligibility Status</Text>
              </View>
              
              <View style={styles.overviewRingRow}>
                <View style={[styles.ringBadge, { backgroundColor: isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(168, 85, 247, 0.15)', borderColor: colors.primary }]}>
                  <Text style={[styles.ringNum, { color: colors.primary }]}>{students.length - (stats?.lowAttendanceStudents?.length || 0)}</Text>
                  <Text style={[styles.ringSub, { color: colors.textSub }]}>All Pass</Text>
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={[styles.overviewText, { color: colors.textSub }]}>
                    • <Text style={{ color: colors.textMain, fontWeight: '700' }}>{students.length}</Text> Registered Mechatronics Students
                  </Text>
                  <Text style={[styles.overviewText, { color: colors.textSub }]}>
                    • <Text style={{ color: '#10B981', fontWeight: '700' }}>{students.length - (stats?.lowAttendanceStudents?.length || 0)}</Text> Eligible in ALL 11 Subjects
                  </Text>
                  <Text style={[styles.overviewText, { color: colors.textSub }]}>
                    • <Text style={{ color: '#EF4444', fontWeight: '700' }}>{stats?.lowAttendanceStudents?.length || 0}</Text> Students Detained in 1 or more papers (&lt; 75%)
                  </Text>
                </View>
              </View>
            </View>

            {/* Subject-Wise Class Average Graphical Bar Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
              <View style={styles.chartCardHeader}>
                <Ionicons name="analytics" size={20} color={colors.primary} />
                <Text style={[styles.chartCardTitle, { color: colors.textMain }]}>Class-Wide 11-Subject Combined Histogram Diagram</Text>
              </View>
              <Text style={[styles.chartSub, { color: colors.textSub }]}>Combined comparative histogram chart for all 11 Mechatronics subjects & labs:</Text>

              <View style={[styles.histogramContainer, { backgroundColor: colors.bgGlass, borderColor: colors.glassBorder }]}>
                {/* Guidelines */}
                <View style={styles.yAxisLine100}>
                  <Text style={[styles.yAxisLabel, { color: colors.textMuted }]}>100%</Text>
                </View>
                <View style={styles.yAxisLine75}>
                  <Text style={styles.yAxisLabel75}>75% Target Line</Text>
                </View>
                <View style={styles.yAxisLine50}>
                  <Text style={[styles.yAxisLabel, { color: colors.textMuted }]}>50%</Text>
                </View>

                {/* Bars Scroll */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsRowScroll}>
                  {subjects.map((sub) => {
                    const subStat = (stats?.subjectStats && stats.subjectStats[sub.id]) || { sessions: 0, present: 0, totalPossible: 0 };
                    const pct = subStat.totalPossible > 0 ? Math.round((subStat.present / subStat.totalPossible) * 100) : 0;
                    const barColor = getPctColor(pct);

                    return (
                      <View key={sub.id} style={styles.histogramCol}>
                        <Text style={[styles.barTopPct, { color: barColor }]}>
                          {subStat.sessions > 0 ? `${pct}%` : 'N/A'}
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

                        <Text style={[styles.xBarCode, { color: colors.textMain }]} numberOfLines={1}>
                          {sub.shortName}
                        </Text>
                        <Text style={[styles.xBarDetail, { color: colors.textMuted }]}>
                          {subStat.sessions} sess
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Subject Breakdown List */}
            <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
              <View style={styles.chartCardHeader}>
                <Ionicons name="stats-chart" size={20} color={colors.primary} />
                <Text style={[styles.chartCardTitle, { color: colors.textMain }]}>Subject-Wise Class Performance</Text>
              </View>
              <Text style={[styles.chartSub, { color: colors.textSub }]}>Class average attendance percentage per subject:</Text>

              <View style={{ gap: 12, marginTop: 12 }}>
                {subjects.map((sub) => {
                  const subStat = (stats?.subjectStats && stats.subjectStats[sub.id]) || { sessions: 0, present: 0, totalPossible: 0 };
                  const pct = subStat.totalPossible > 0 ? Math.round((subStat.present / subStat.totalPossible) * 100) : 0;
                  const barColor = getPctColor(pct);

                  return (
                    <View key={sub.id} style={[styles.subjectGraphRow, { backgroundColor: colors.bgGlass, borderColor: colors.glassBorder }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[styles.subGraphName, { color: colors.textMain }]}>{sub.name} ({sub.shortName})</Text>
                        <Text style={[styles.subGraphPct, { color: barColor }]}>{pct}%</Text>
                      </View>
                      <View style={[styles.graphBarTrack, { backgroundColor: isLight ? '#E2E8F0' : 'rgba(15, 23, 42, 0.8)' }]}>
                        <View style={[styles.graphBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                      </View>
                      <Text style={[styles.subGraphSub, { color: colors.textSub }]}>
                        {subStat.sessions === 0 ? 'No classes held' : `${subStat.sessions} sessions held • Faculty: ${sub.faculty || 'Dept'}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Clickable Roster List for Individual Graph Inspection */}
            <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
              <View style={styles.chartCardHeader}>
                <Ionicons name="people" size={20} color={colors.primary} />
                <Text style={[styles.chartCardTitle, { color: colors.textMain }]}>Student Graphical Analytics Roster</Text>
              </View>
              <Text style={[styles.chartSub, { color: colors.textSub }]}>Tap any student below to open their full graph & profile:</Text>

              <View style={{ gap: 8, marginTop: 12 }}>
                {students.map((stu) => {
                  const stuStat = (stats?.studentStats && stats.studentStats[stu.id]) || { present: 0, total: 0 };
                  const pct = stuStat.total > 0 ? Math.round((stuStat.present / stuStat.total) * 100) : 100;
                  const color = getPctColor(pct);

                  return (
                    <TouchableOpacity
                      key={stu.id}
                      style={[styles.rosterGraphItem, { backgroundColor: colors.bgGlass, borderColor: colors.glassBorder }]}
                      onPress={() => onSelectStudent && onSelectStudent(stu)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={[styles.rosterName, { color: colors.textMain }]}>{stu.name}</Text>
                        <Text style={[styles.rosterRoll, { color: colors.primary }]}>{stu.rollNo} • Tap for Analytics Graph 📊</Text>
                      </View>
                      <View style={[styles.rosterBadge, { backgroundColor: `${color}20`, borderColor: color }]}>
                        <Text style={[styles.rosterBadgeText, { color }]}>Graph 📈</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'export' && (
          <View style={styles.exportContainer}>
            {/* Subject Filter Section for Teachers */}
            <View style={[styles.filterSection, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder }]}>
              <Text style={[styles.filterTitle, { color: colors.textMain }]}>Select Subject for PDF Register:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedExportSubject === 'ALL' ? colors.primary : colors.bgGlass,
                      borderColor: selectedExportSubject === 'ALL' ? colors.glassBorderActive : colors.glassBorder,
                    },
                  ]}
                  onPress={() => setSelectedExportSubject('ALL')}
                >
                  <Text style={[styles.filterChipText, { color: selectedExportSubject === 'ALL' ? '#FFFFFF' : colors.textSub }]}>
                    All Subjects Combined
                  </Text>
                </TouchableOpacity>

                {subjects.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selectedExportSubject === sub.id ? colors.primary : colors.bgGlass,
                        borderColor: selectedExportSubject === sub.id ? colors.glassBorderActive : colors.glassBorder,
                      },
                    ]}
                    onPress={() => setSelectedExportSubject(sub.id)}
                  >
                    <Text style={[styles.filterChipText, { color: selectedExportSubject === sub.id ? '#FFFFFF' : colors.textSub }]}>
                      {sub.shortName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* PDF Attendance Register Export Card */}
            <View style={[styles.exportCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow, marginBottom: 16 }]}>
              <View style={[styles.iconCircle, { backgroundColor: isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(168, 85, 247, 0.15)' }]}>
                <Ionicons name="print-outline" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.exportTitle, { color: colors.textMain }]}>
                {selectedExportSubject === 'ALL'
                  ? 'All Subjects PDF Register'
                  : `${subjects.find((s) => s.id === selectedExportSubject)?.name || 'Subject'} PDF Register`}
              </Text>
              <Text style={[styles.exportSub, { color: colors.textSub }]}>
                {selectedExportSubject === 'ALL'
                  ? 'Generate a full college attendance register showing all subjects month-by-month on separate pages.'
                  : `Generate a dedicated monthly attendance register for ${subjects.find((s) => s.id === selectedExportSubject)?.name} (${subjects.find((s) => s.id === selectedExportSubject)?.faculty || 'Faculty'}). Each month will be printed on a separate page!`}
              </Text>

              <TouchableOpacity style={[styles.exportBtnPdf, { backgroundColor: colors.primary }]} onPress={handlePrintPDF} activeOpacity={0.8}>
                <Ionicons name="print-outline" size={20} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>
                  {selectedExportSubject === 'ALL' ? 'Print PDF Register (All Subjects)' : `Print ${subjects.find((s) => s.id === selectedExportSubject)?.shortName} PDF Register`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Excel / CSV Export Card */}
            <View style={[styles.exportCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="stats-chart-outline" size={32} color="#10B981" />
              </View>
              <Text style={[styles.exportTitle, { color: colors.textMain }]}>Excel / CSV Data Export</Text>
              <Text style={[styles.exportSub, { color: colors.textSub }]}>
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
    backgroundColor: '#0B132B',
  },
  header: {
    padding: 16,
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
    marginBottom: 12,
  },
  tabScrollContainer: {
    marginTop: 6,
    marginBottom: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabActive: {
    backgroundColor: '#3A86FF',
    borderColor: '#70D6FF',
    boxShadow: '0 4px 14px rgba(58, 134, 255, 0.4)',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    backgroundColor: 'rgba(27, 38, 59, 0.75)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
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
  analyticsTabContainer: {
    gap: 16,
    paddingVertical: 8,
  },
  chartCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  chartSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  overviewRingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  ringBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNum: {
    color: '#818CF8',
    fontSize: 20,
    fontWeight: '900',
  },
  ringSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  overviewText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  subjectGraphRow: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  subGraphName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  subGraphPct: {
    fontSize: 13,
    fontWeight: '800',
  },
  graphBarTrack: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 4,
  },
  graphBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  subGraphSub: {
    color: '#64748B',
    fontSize: 11,
  },
  rosterGraphItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rosterName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  rosterRoll: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  rosterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  rosterBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  detainedPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detainedPillText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  histogramContainer: {
    height: 200,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingTop: 24,
    paddingBottom: 36,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 10,
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
    width: 44,
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
    backgroundColor: '#0F172A',
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
