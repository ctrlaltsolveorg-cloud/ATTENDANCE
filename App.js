import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Inject Expo Vector Icons font-face for web browsers
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const fontStyle = `
    @font-face {
      font-family: 'Ionicons';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
    }
  `;
  if (!document.getElementById('expo-vector-icons-font')) {
    const style = document.createElement('style');
    style.id = 'expo-vector-icons-font';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(fontStyle));
    document.head.appendChild(style);
  }
}

import {
  initStorage,
  getBranchInfo,
  getStudents,
  saveStudents,
  getSubjects,
  getAttendanceRecords,
  saveAttendanceSession,
  calculateStats,
  resetToDefaultData,
} from './src/services/storage';

import DashboardScreen from './src/screens/DashboardScreen';
import MarkAttendanceScreen from './src/screens/MarkAttendanceScreen';
import StudentListScreen from './src/screens/StudentListScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SupabaseConfigModal from './src/components/SupabaseConfigModal';
import StudentAnalyticsModal from './src/components/StudentAnalyticsModal';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'mark' | 'students' | 'reports'
  const [initialHoliday, setInitialHoliday] = useState(false);
  const [cloudModalVisible, setCloudModalVisible] = useState(false);
  const [analyticsStudent, setAnalyticsStudent] = useState(null);
  const [themeMode, setThemeMode] = useState('light'); // 'light' | 'dark'

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [branchInfo, setBranchInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    overallPercentage: 0,
    studentStats: {},
    subjectStats: {},
    lowAttendanceStudents: [],
    topStudents: [],
  });

  const handleNavigate = (tab, holiday = false) => {
    setInitialHoliday(Boolean(holiday));
    setActiveTab(tab);
  };

  const loadData = async () => {
    setLoading(true);
    await initStorage();

    const branch = await getBranchInfo();
    const stuList = await getStudents();
    const subList = await getSubjects();
    const attRecords = await getAttendanceRecords();

    setBranchInfo(branch);
    setStudents(stuList);
    setSubjects(subList);
    setRecords(attRecords);

    const computedStats = calculateStats(stuList, subList, attRecords);
    setStats(computedStats);

    setLoading(false);
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.location.pathname && window.location.pathname !== '/' && !window.location.pathname.endsWith('.html')) {
        try {
          window.history.replaceState(null, '', '/');
        } catch (e) {
          // ignore
        }
      }
    }
    loadData();
  }, []);

  const handleSaveSession = async (session) => {
    const res = await saveAttendanceSession(session);
    const updatedRecords = res?.updated || res || [];
    setRecords(updatedRecords);
    const newStats = calculateStats(students, subjects, updatedRecords);
    setStats(newStats);
    return res;
  };

  const handleAddStudent = async (newStudent) => {
    const updated = [...students, newStudent];
    setStudents(updated);
    await saveStudents(updated);
    const newStats = calculateStats(updated, subjects, records);
    setStats(newStats);
  };

  const handleUpdateStudent = async (updatedStu) => {
    const updated = students.map((s) => (s.id === updatedStu.id ? updatedStu : s));
    setStudents(updated);
    await saveStudents(updated);
    const newStats = calculateStats(updated, subjects, records);
    setStats(newStats);
  };

  const handleDeleteStudent = async (studentId) => {
    const updated = students.filter((s) => s.id !== studentId);
    setStudents(updated);
    await saveStudents(updated);
    const newStats = calculateStats(updated, subjects, records);
    setStats(newStats);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Attendance Data?',
      'This will reset attendance logs back to 0, restoring the default 30 Mechatronics students and 11 timetable subjects.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaultData();
            await loadData();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading PCE Mechatronics Attendance...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Dynamic Screen View */}
      <View style={styles.screenContainer}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            branchInfo={branchInfo}
            students={students}
            subjects={subjects}
            records={records}
            stats={stats}
            onNavigate={handleNavigate}
            onResetData={handleResetData}
            onOpenCloudConfig={() => setCloudModalVisible(true)}
            onSelectStudent={setAnalyticsStudent}
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
          />
        )}

        {activeTab === 'mark' && (
          <MarkAttendanceScreen
            students={students}
            subjects={subjects}
            records={records}
            initialHoliday={initialHoliday}
            onSaveSession={handleSaveSession}
            onCancel={() => handleNavigate('dashboard')}
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
          />
        )}

        {activeTab === 'students' && (
          <StudentListScreen
            students={students}
            stats={stats}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onSelectStudent={setAnalyticsStudent}
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen
            students={students}
            subjects={subjects}
            records={records}
            stats={stats}
            onSelectStudent={setAnalyticsStudent}
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
          />
        )}
      </View>

      {/* Supabase Cloud Connection & Setup Modal */}
      <SupabaseConfigModal
        visible={cloudModalVisible}
        onClose={() => setCloudModalVisible(false)}
        onRefresh={loadData}
      />

      {/* Student Graphical Analytics Modal */}
      <StudentAnalyticsModal
        visible={Boolean(analyticsStudent)}
        student={analyticsStudent}
        subjects={subjects}
        records={records}
        onClose={() => setAnalyticsStudent(null)}
        themeMode={themeMode}
      />

      {/* Floating Navigation Tab Bar */}
      <View style={[styles.tabBarWrapper, { backgroundColor: themeMode === 'light' ? '#F8FAFC' : '#120B2E' }]}>
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 12, 45, 0.9)',
              borderColor: themeMode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.15)',
              boxShadow: themeMode === 'light' ? '0 8px 30px rgba(15, 23, 42, 0.12)' : '0 16px 40px rgba(0, 0, 0, 0.7)',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
              size={22}
              color={activeTab === 'dashboard' ? (themeMode === 'light' ? '#4F46E5' : '#C084FC') : '#64748B'}
            />
            <Text style={[styles.tabLabel, activeTab === 'dashboard' && { color: themeMode === 'light' ? '#4F46E5' : '#C084FC', fontWeight: '800' }]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('mark')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.markIconCircle,
                { backgroundColor: themeMode === 'light' ? '#4F46E5' : '#A855F7' },
                activeTab === 'mark' && { transform: [{ scale: 1.08 }] },
              ]}
            >
              <Ionicons name="checkbox-outline" size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'mark' && { color: themeMode === 'light' ? '#4F46E5' : '#C084FC', fontWeight: '800' }]}>
              Mark Roll
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('students')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'students' ? 'people' : 'people-outline'}
              size={22}
              color={activeTab === 'students' ? (themeMode === 'light' ? '#4F46E5' : '#C084FC') : '#64748B'}
            />
            <Text style={[styles.tabLabel, activeTab === 'students' && { color: themeMode === 'light' ? '#4F46E5' : '#C084FC', fontWeight: '800' }]}>
              Students
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('reports')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'reports' ? 'document-text' : 'document-text-outline'}
              size={22}
              color={activeTab === 'reports' ? (themeMode === 'light' ? '#4F46E5' : '#C084FC') : '#64748B'}
            />
            <Text style={[styles.tabLabel, activeTab === 'reports' && { color: themeMode === 'light' ? '#4F46E5' : '#C084FC', fontWeight: '800' }]}>
              Reports
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  screenContainer: {
    flex: 1,
  },
  tabBarWrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#70D6FF',
    fontWeight: '700',
  },
  markIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
  },
  markIconCircleActive: {
    backgroundColor: '#3A86FF',
    transform: [{ scale: 1.08 }],
  },
});
