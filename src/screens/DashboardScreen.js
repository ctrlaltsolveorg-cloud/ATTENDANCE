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
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getTheme } from '../theme/theme';
import Header from '../components/Header';
import PasswordModal from '../components/PasswordModal';
import {
  getNotice,
  saveNotice,
  getRoutine,
  saveRoutine,
  getLivePunches,
  saveLivePunches,
  getHolidayOverride,
  saveHolidayOverride,
  DEFAULT_NOTICE,
  DEFAULT_WEEKLY_ROUTINE,
} from '../services/storage';

const getCurrentDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const parseTimeStringToMinutes = (tStr) => {
  try {
    if (!tStr) return 0;
    tStr = tStr.trim();
    const isPM = tStr.toUpperCase().includes('PM');
    const clean = tStr.replace(/(AM|PM)/i, '').trim();
    let [h, m] = clean.split(':').map(Number);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + m;
  } catch (e) {
    return 0;
  }
};

const getNowTimeInfo = () => {
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();
  const isPM = hours >= 12;
  const h12 = hours % 12 || 12;
  const timeStr = `${h12}:${mins < 10 ? '0' : ''}${mins} ${isPM ? 'PM' : 'AM'}`;
  const totalMins = hours * 60 + mins;
  return { timeStr, totalMins, timestamp: now.getTime() };
};

const getPeriodStatus = (timeStr) => {
  try {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const parts = timeStr.split('-');
    if (parts.length !== 2) return { isOngoing: false, isCompleted: false, pct: 0, minsRemaining: 0 };

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
    const totalDuration = endMin - startMin;

    if (currentMin < startMin) {
      return { isOngoing: false, isCompleted: false, pct: 0, minsRemaining: Math.ceil(startMin - currentMin) };
    }

    if (currentMin >= endMin) {
      return { isOngoing: false, isCompleted: true, pct: 100, minsRemaining: 0 };
    }

    const elapsed = currentMin - startMin;
    const pct = Math.min(100, Math.max(1, Math.round((elapsed / totalDuration) * 100)));
    const minsRemaining = Math.max(1, Math.ceil(endMin - currentMin));

    return { isOngoing: true, isCompleted: false, pct, minsRemaining };
  } catch (e) {
    return { isOngoing: false, isCompleted: false, pct: 0, minsRemaining: 0 };
  }
};

const formatMinToTimeStr = (totalMins) => {
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const isPM = hours >= 12;
  const h12 = hours % 12 || 12;
  return `${h12}:${mins < 10 ? '0' : ''}${mins} ${isPM ? 'PM' : 'AM'}`;
};

const getTimelineSegments = (timeStr, punch = {}, isToday = true) => {
  try {
    const timeParts = timeStr.split('-');
    if (timeParts.length !== 2) {
      return { segments: [], popups: [], totalFilledPct: 0, yellowMins: 0, greenMins: 0, minsRemaining: 0, isOngoing: false };
    }

    const schedStartMin = parseTimeStringToMinutes(timeParts[0]);
    const schedEndMin = parseTimeStringToMinutes(timeParts[1]);
    const totalDuration = Math.max(1, schedEndMin - schedStartMin);

    const nowInfo = getNowTimeInfo();
    const nowMins = isToday ? nowInfo.totalMins : (schedEndMin + 60);

    const effNow = Math.max(schedStartMin, Math.min(schedEndMin, nowMins));
    const elapsedMins = Math.max(0, effNow - schedStartMin);
    const minsRemaining = Math.max(0, schedEndMin - nowMins);
    const isOngoing = isToday && nowMins >= schedStartMin && nowMins < schedEndMin;

    if (elapsedMins === 0) {
      return {
        segments: [],
        popups: [],
        totalFilledPct: 0,
        yellowMins: 0,
        greenMins: 0,
        minsRemaining,
        isOngoing,
      };
    }

    let intervals = Array.isArray(punch.intervals) ? [...punch.intervals] : [];

    // Fallback for legacy single-interval punch format
    if (intervals.length === 0 && (punch.status === 'IN_CLASS' || punch.status === 'PAUSED' || punch.status === 'ENDED')) {
      const sMin = punch.startMins || schedStartMin;
      const eMin = punch.endMins || (punch.status === 'IN_CLASS' ? null : schedEndMin);
      intervals = [{ startMins: sMin, endMins: eMin, startTime: punch.startTime, endTime: punch.endTime }];
    }

    const minuteColors = [];
    for (let m = schedStartMin; m < effNow; m++) {
      let isTeacherIn = false;
      for (const intv of intervals) {
        const intvStart = Math.max(schedStartMin, intv.startMins || schedStartMin);
        const intvEnd = intv.endMins !== null && intv.endMins !== undefined
          ? Math.min(schedEndMin, intv.endMins)
          : effNow;

        if (m >= intvStart && m < intvEnd) {
          isTeacherIn = true;
          break;
        }
      }
      minuteColors.push(isTeacherIn ? '#F59E0B' : '#10B981');
    }

    const segments = [];
    const popups = [];
    let yellowCount = 0;
    let greenCount = 0;

    if (minuteColors.length > 0) {
      let curColor = minuteColors[0];
      let curMins = 0;
      let segStartMin = schedStartMin;
      let cumPct = 0;

      for (let i = 0; i < minuteColors.length; i++) {
        const c = minuteColors[i];
        if (c === '#F59E0B') yellowCount++;
        else greenCount++;

        if (c === curColor) {
          curMins++;
        } else {
          const widthPct = (curMins / totalDuration) * 100;
          segments.push({
            color: curColor,
            durationMins: curMins,
            widthPct,
            startMins: segStartMin,
            startPct: cumPct,
          });

          // Add popup for transition point between colors
          const transitionTimeMin = schedStartMin + i;
          const displayTime = punch.startTime && Math.abs(transitionTimeMin - (punch.startMins || 0)) <= 2
            ? punch.startTime
            : formatMinToTimeStr(transitionTimeMin);

          popups.push({
            timeStr: displayTime,
            leftPct: cumPct + widthPct,
            color: c,
            type: c === '#F59E0B' ? 'IN' : 'OUT',
          });

          cumPct += widthPct;
          curColor = c;
          curMins = 1;
          segStartMin = schedStartMin + i;
        }
      }

      const widthPct = (curMins / totalDuration) * 100;
      segments.push({
        color: curColor,
        durationMins: curMins,
        widthPct,
        startMins: segStartMin,
        startPct: cumPct,
      });

      // If first segment is Yellow, add initial entry popup
      if (segments[0].color === '#F59E0B') {
        popups.unshift({
          timeStr: punch.startTime || formatMinToTimeStr(segments[0].startMins),
          leftPct: segments[0].startPct,
          color: '#F59E0B',
          type: 'IN',
        });
      }
    }

    const totalFilledPct = Math.min(100, Math.round((elapsedMins / totalDuration) * 100));

    return {
      segments,
      popups,
      totalFilledPct,
      yellowMins: yellowCount,
      greenMins: greenCount,
      elapsedMins,
      minsRemaining,
      isOngoing,
    };
  } catch (e) {
    return { segments: [], popups: [], totalFilledPct: 0, yellowMins: 0, greenMins: 0, minsRemaining: 0, isOngoing: false };
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
  userRole = 'student',
  onToggleRole,
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

  // College Closed / Holiday / Event Override State
  const [holidayOverride, setHolidayOverride] = useState({ isClosed: false, reason: '', type: 'Event' });
  const [editingHoliday, setEditingHoliday] = useState(false);
  const [holidayReasonInput, setHolidayReasonInput] = useState('');
  const [holidayTypeInput, setHolidayTypeInput] = useState('Event');

  // Password Protection Modal
  const [passcodeModalVisible, setPasscodeModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'editNotice' | 'editRoom' | 'declareHoliday', data }

  // Live timer tick for real-time progress bar fill
  const [, setTick] = useState(0);

  // Live Teacher Check-in / Punching State
  const [livePunches, setLivePunches] = useState({});

  useEffect(() => {
    loadNoticeAndRoutine();

    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const loadNoticeAndRoutine = async () => {
    const n = await getNotice();
    const r = await getRoutine();
    const p = await getLivePunches();
    const h = await getHolidayOverride();
    setNoticeText(n || DEFAULT_NOTICE);
    setRoutineObj(r || DEFAULT_WEEKLY_ROUTINE);
    setLivePunches(p || {});
    setHolidayOverride(h || { isClosed: false, reason: '', type: 'Event' });
  };

  const handlePunchToggle = async (day, item, index) => {
    if (holidayOverride.isClosed && day === todayDayName) {
      Alert.alert(
        '🎉 College Closed Today',
        `Regular live attendance is suspended today for: ${holidayOverride.reason}`
      );
      return;
    }

    const slotKey = `${day}_${item.period}_${index}`;
    const nowInfo = getNowTimeInfo();
    const currentPunch = livePunches[slotKey] || { status: 'NOT_STARTED', intervals: [] };

    const timeParts = item.time.split('-');
    const schedStartMin = timeParts.length === 2 ? parseTimeStringToMinutes(timeParts[0]) : nowInfo.totalMins;
    const schedEndMin = timeParts.length === 2 ? parseTimeStringToMinutes(timeParts[1]) : nowInfo.totalMins;

    let intervals = Array.isArray(currentPunch.intervals) ? [...currentPunch.intervals] : [];

    // Fallback for legacy single-interval format
    if (intervals.length === 0 && (currentPunch.status === 'IN_CLASS' || currentPunch.status === 'PAUSED' || currentPunch.status === 'ENDED')) {
      const sMin = currentPunch.startMins || schedStartMin;
      const eMin = currentPunch.endMins || (currentPunch.status === 'IN_CLASS' ? null : schedEndMin);
      intervals = [{ startMins: sMin, endMins: eMin, startTime: currentPunch.startTime, endTime: currentPunch.endTime }];
    }

    let updatedPunch = {};

    if (currentPunch.status === 'IN_CLASS') {
      // 🟢 PAUSE CLASS: Teacher Left / Out of Class -> Timeline turns GREEN
      if (intervals.length > 0 && (intervals[intervals.length - 1].endMins === null || intervals[intervals.length - 1].endMins === undefined)) {
        intervals[intervals.length - 1] = {
          ...intervals[intervals.length - 1],
          endMins: nowInfo.totalMins,
          endTime: nowInfo.timeStr,
        };
      }
      const totalYellowMins = intervals.reduce((acc, intv) => acc + Math.max(0, (intv.endMins || nowInfo.totalMins) - intv.startMins), 0);

      updatedPunch = {
        ...currentPunch,
        status: 'PAUSED',
        endTime: nowInfo.timeStr,
        endMins: nowInfo.totalMins,
        endedAtMs: nowInfo.timestamp,
        intervals,
        yellowMins: totalYellowMins,
      };

      Alert.alert(
        '🟢 Teacher Out of Classroom',
        `Teacher left classroom at ${nowInfo.timeStr}.\nTimeline is running in GREEN while teacher is out!`
      );
    } else if (currentPunch.status === 'NOT_STARTED' || currentPunch.status === 'PAUSED' || !currentPunch.status) {
      // 🟡 START / RESUME CLASS: Teacher Came / In Class -> Timeline turns YELLOW
      const lateMins = currentPunch.startTime ? currentPunch.lateMins : Math.max(0, nowInfo.totalMins - schedStartMin);
      intervals.push({
        startMins: nowInfo.totalMins,
        endMins: null,
        startTime: nowInfo.timeStr,
      });

      updatedPunch = {
        ...currentPunch,
        status: 'IN_CLASS',
        startTime: currentPunch.startTime || nowInfo.timeStr,
        startMins: currentPunch.startMins || nowInfo.totalMins,
        startedAtMs: currentPunch.startedAtMs || nowInfo.timestamp,
        lateMins,
        intervals,
      };

      Alert.alert(
        '🟡 Teacher Entered Classroom',
        `Teacher entered class at ${nowInfo.timeStr}${lateMins > 0 ? ` (${lateMins} mins late)` : ' (On Time!)'}\nTimeline is now running in YELLOW!`
      );
    } else {
      // RESET PUNCH
      updatedPunch = { status: 'NOT_STARTED', intervals: [] };
      Alert.alert('🔄 Session Reset', 'Attendance timeline session has been reset.');
    }

    const updatedMap = {
      ...livePunches,
      [slotKey]: updatedPunch,
    };
    setLivePunches(updatedMap);
    await saveLivePunches(updatedMap);
  };

  const executeAction = (action) => {
    if (!action) return;
    if (action.type === 'editNotice') {
      setNewNoticeInput(noticeText);
      setEditingNotice(true);
    } else if (action.type === 'editRoom') {
      setEditingRoomSlot(action.data);
      setNewRoomInput(action.data.room);
    } else if (action.type === 'declareHoliday') {
      setHolidayReasonInput(holidayOverride.reason || '');
      setHolidayTypeInput(holidayOverride.type || 'Event');
      setEditingHoliday(true);
    } else if (action.type === 'punch') {
      const { day, item, index } = action.data;
      handlePunchToggle(day, item, index);
    }
  };

  const triggerProtectedCRAction = (action) => {
    if (userRole === 'cr') {
      executeAction(action);
    } else {
      setPendingAction(action);
      setPasscodeModalVisible(true);
    }
  };

  const handlePasscodeSuccess = () => {
    setPasscodeModalVisible(false);
    if (onToggleRole) onToggleRole('cr'); // Auto unlock CR Mode!
    if (pendingAction) {
      executeAction(pendingAction);
      setPendingAction(null);
    }
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

  const handleSaveHolidayOverride = async () => {
    if (!holidayReasonInput.trim()) {
      Alert.alert('Specify Reason', 'Please enter a reason or event name (e.g. Annual Sports Day, Mid-Sem Exam).');
      return;
    }
    const todayFormatted = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const newOverride = {
      isClosed: true,
      reason: holidayReasonInput.trim(),
      type: holidayTypeInput || 'Event',
      dateStr: todayFormatted,
    };
    await saveHolidayOverride(newOverride);
    setHolidayOverride(newOverride);
    setEditingHoliday(false);

    // Auto publish to Notice Board as well
    const autoNotice = `📢 SPECIAL ANNOUNCEMENT: College is CLOSED today (${todayFormatted}) for ${holidayReasonInput.trim()}. Regular class schedule is suspended.`;
    await saveNotice(autoNotice);
    setNoticeText(autoNotice);

    Alert.alert('🎉 Holiday / Event Declared', `College status set to CLOSED for: ${holidayReasonInput.trim()}`);
  };

  const handleClearHolidayOverride = async () => {
    const resetOverride = { isClosed: false, reason: '', type: 'Event' };
    await saveHolidayOverride(resetOverride);
    setHolidayOverride(resetOverride);
    setEditingHoliday(false);
    Alert.alert('✅ Classes Resumed', 'College status updated to Normal Open. Daily class timetable is active.');
  };

  const todayDayName = getCurrentDayName();
  const [selectedDay, setSelectedDay] = useState(getCurrentDayName() === 'Sunday' ? 'Monday' : getCurrentDayName());
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const displayedClasses = routineObj[selectedDay] || routineObj['Monday'];

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
        userRole={userRole}
        onSwitchRole={onToggleRole}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* 🎥 Unified Hero Section with Background Video */}
        <View style={[styles.videoHeroContainer, { borderColor: isLight ? 'rgba(99, 102, 241, 0.3)' : 'rgba(168, 85, 247, 0.4)', boxShadow: colors.cardShadow }]}>
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
                opacity: isLight ? 0.4 : 0.6,
                pointerEvents: 'none',
              }}
            />
          ) : (
            <View style={styles.videoFallback} />
          )}

          {/* Semi-transparent Glass Tint Overlay for legibility */}
          <View style={[styles.videoHeroOverlay, { backgroundColor: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(11, 15, 35, 0.72)' }]} />

          {/* Hero Content Inside Video Container */}
          <View style={{ position: 'relative', zIndex: 2, padding: 14, gap: 10 }}>
            {/* Hero Header Content */}
            <View style={styles.heroStripContent}>
              <View style={styles.stripHeaderBadge}>
                <Ionicons name="sparkles" size={13} color="#818CF8" />
                <Text style={styles.stripBadgeText}>MECHATRONICS DEPT</Text>
              </View>
              <Text style={[styles.stripTitle, { color: isLight ? '#0F172A' : '#F8FAFC' }]} numberOfLines={1}>Purnea College of Engineering</Text>
              <Text style={[styles.stripSubtitle, { color: isLight ? '#334155' : '#CBD5E1' }]} numberOfLines={1}>3rd Semester Attendance Portal • BEU Patna</Text>
            </View>

            {/* Quick Action Floating CTA Button */}
            <TouchableOpacity
              style={[styles.markCTA, { backgroundColor: isLight ? 'rgba(79, 70, 229, 0.92)' : 'rgba(124, 58, 237, 0.88)' }]}
              activeOpacity={0.8}
              onPress={() => onNavigate('mark')}
            >
              <View style={styles.markCTAContent}>
                <View style={styles.markCTAIcon}>
                  <Ionicons name="checkbox" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.markCTATitle}>Mark Attendance</Text>
              </View>

              <View style={styles.markCTAArrow}>
                <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🎉 College Closed Banner OR 📢 CR Announcement (Clean Single Card View) */}
        {holidayOverride.isClosed ? (
          <View style={{
            backgroundColor: isLight ? 'rgba(254, 242, 242, 0.96)' : 'rgba(70, 20, 20, 0.92)',
            borderColor: isLight ? '#FCA5A5' : '#EF4444',
            borderWidth: 1.5,
            borderRadius: 18,
            padding: 14,
            marginBottom: 14,
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="sparkles" size={18} color="#EF4444" />
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#EF4444', letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>
                  COLLEGE CLOSED • {holidayOverride.type || 'SPECIAL EVENT'}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.3)',
                  borderColor: isLight ? '#FCA5A5' : 'rgba(239, 68, 68, 0.6)',
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
                onPress={() => triggerProtectedCRAction({ type: 'declareHoliday' })}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#991B1B' : '#FCA5A5' }}>Manage</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '800', color: isLight ? '#991B1B' : '#FEE2E2', lineHeight: 20 }}>
              {holidayOverride.reason}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: isLight ? '#B91C1C' : '#FCA5A5', marginTop: 4 }}>
              Regular classes & labs suspended ({holidayOverride.dateStr || 'Today'})
            </Text>
          </View>
        ) : (
          <View style={[styles.noticeCard, { backgroundColor: isLight ? 'rgba(238, 242, 255, 0.9)' : 'rgba(19, 27, 46, 0.92)', borderColor: isLight ? '#C7D2FE' : '#334155', marginBottom: 14 }]}>
            <View style={styles.noticeHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="megaphone" size={17} color={isLight ? '#4F46E5' : '#38BDF8'} />
                <Text style={[styles.noticeTitle, { color: isLight ? '#3730A3' : '#F8FAFC' }]} numberOfLines={1}>CR Announcement</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)',
                    borderColor: isLight ? '#FDE68A' : 'rgba(245, 158, 11, 0.4)',
                    borderWidth: 1,
                    paddingHorizontal: 9,
                    height: 28,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onPress={() => triggerProtectedCRAction({ type: 'declareHoliday' })}
                  activeOpacity={0.7}
                  title="Declare Special Event"
                >
                  <Ionicons name="calendar-outline" size={13} color={isLight ? '#D97706' : '#FBBF24'} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#B45309' : '#FBBF24', whiteSpace: 'nowrap' }}>Declare Event</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: isLight ? '#E0E7FF' : 'rgba(30, 41, 59, 0.8)',
                    borderColor: isLight ? '#C7D2FE' : 'rgba(56, 189, 248, 0.4)',
                    borderWidth: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => triggerProtectedCRAction({ type: 'editNotice' })}
                  activeOpacity={0.7}
                  title="Edit Notice"
                >
                  <Ionicons name="pencil" size={13} color={isLight ? '#4F46E5' : '#38BDF8'} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.noticeContentText, { color: isLight ? '#312E81' : '#CBD5E1' }]}>
              {noticeText}
            </Text>
          </View>
        )}

        {/* 🏫 Classes Going On / Today's & Weekly Routine Schedule Card */}
        <View style={[styles.routineCard, { backgroundColor: colors.bgCard, borderColor: colors.glassBorder, boxShadow: colors.cardShadow }]}>
          <View style={styles.routineHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.routineTitle, { color: colors.textMain }]}>Daily Class Routine</Text>
            </View>
            <View style={[styles.dayBadge, { backgroundColor: isLight ? '#EEF2FF' : 'rgba(15, 23, 42, 0.8)' }]}>
              <Text style={[styles.dayBadgeText, { color: colors.primary }]}>{selectedDay}</Text>
            </View>
          </View>

          {/* Day Selector Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginBottom: 4 }}>
            {daysOfWeek.map((day) => {
              const isSelected = day === selectedDay;
              const isToday = day === todayDayName;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    marginRight: 8,
                    backgroundColor: isSelected
                      ? colors.primary
                      : (isLight ? '#EEF2FF' : 'rgba(30, 41, 59, 0.7)'),
                    borderColor: isSelected ? colors.primary : (isToday ? colors.primary : colors.glassBorder),
                    borderWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {isToday && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isSelected ? '#FFFFFF' : '#10B981' }} />
                  )}
                  <Text style={{
                    fontSize: 12,
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#FFFFFF' : (isToday ? colors.primary : colors.textMain),
                  }}>
                    {day} {isToday ? '(Today)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ gap: 10, marginTop: 10 }}>
            {displayedClasses
              .filter((item) => item.code !== 'RECESS' && item.period !== 'RECESS')
              .map((item, index) => {
              const slotKey = `${selectedDay}_${item.period}_${index}`;
              const punch = livePunches[slotKey] || { status: 'NOT_STARTED' };
              const isPunchIn = punch.status === 'IN_CLASS';
              const isPunchPaused = punch.status === 'PAUSED';
              const isPunchEnded = punch.status === 'ENDED';

              const status = selectedDay === todayDayName ? getPeriodStatus(item.time) : { isOngoing: false, isCompleted: false, pct: 0, minsRemaining: 0 };
              const timelineData = getTimelineSegments(item.time, punch, selectedDay === todayDayName);

              const isClassCompleted = status.isCompleted || isPunchEnded;

              // Determine row background & border colors based on live punch status
              let rowBg = isClassCompleted
                ? (isLight ? '#F8FAFC' : 'rgba(15, 23, 42, 0.45)') // Muted Gray div when class completed
                : isPunchIn
                ? (isLight ? '#FFFBEB' : 'rgba(180, 83, 9, 0.22)') // Yellow tint when Teacher in class
                : isPunchPaused
                ? (isLight ? '#ECFDF5' : 'rgba(6, 78, 59, 0.35)') // Green tint when Teacher out
                : status.isOngoing
                ? (isLight ? '#ECFDF5' : 'rgba(6, 78, 59, 0.35)')
                : colors.bgGlass;

              let rowBorder = isClassCompleted
                ? (isLight ? '#CBD5E1' : '#334155') // Gray border when done
                : isPunchIn
                ? '#F59E0B' // Yellow border for Teacher in Class
                : isPunchPaused
                ? '#10B981' // Green border for Teacher out
                : status.isOngoing
                ? '#10B981'
                : colors.glassBorder;

              let borderLeftColor = isClassCompleted
                ? (isLight ? '#94A3B8' : '#475569') // Gray left border accent when done
                : isPunchIn
                ? '#F59E0B'
                : isPunchPaused
                ? '#10B981'
                : rowBorder;

              return (
                <View
                  key={index}
                  style={[
                    styles.periodRow,
                    {
                      backgroundColor: rowBg,
                      borderColor: rowBorder,
                      borderLeftWidth: isPunchIn || isPunchPaused ? 5 : isClassCompleted ? 4 : 1,
                      borderLeftColor: borderLeftColor,
                      flexDirection: 'column',
                    },
                  ]}
                >
                  {/* Top Row: Info (Left) & Controls (Right) */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                    {/* Left Info: Period Badge, Scheduled Time, Live Status, Subject, Faculty */}
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      {/* Header Badges */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <View style={[styles.periodBadge, { backgroundColor: isLight ? '#EEF2FF' : 'rgba(15, 23, 42, 0.8)' }]}>
                          <Text style={[styles.periodBadgeText, { color: colors.primary }]}>P-{item.period}</Text>
                        </View>
                        <Text style={[styles.periodTime, { color: colors.textSub }]}>{item.time}</Text>

                        {/* Live Punch Status & Completed Badges */}
                        {isClassCompleted ? (
                          <View style={[styles.livePill, { backgroundColor: isLight ? '#F1F5F9' : 'rgba(100, 116, 139, 0.2)', borderColor: isLight ? '#CBD5E1' : '#475569', borderWidth: 1 }]}>
                            <Ionicons name="checkmark-circle" size={11} color={isLight ? '#475569' : '#94A3B8'} />
                            <Text style={[styles.liveText, { color: isLight ? '#475569' : '#94A3B8', fontWeight: '800' }]}>
                              DONE
                            </Text>
                          </View>
                        ) : isPunchIn ? (
                          <View style={[styles.livePill, { backgroundColor: '#F59E0B' }]}>
                            <View style={[styles.liveDot, { backgroundColor: '#FFFFFF' }]} />
                            <Text style={[styles.liveText, { color: '#FFFFFF', fontWeight: '800' }]}>
                              TEACHER IN CLASS ({punch.startTime})
                            </Text>
                          </View>
                        ) : isPunchPaused ? (
                          <View style={[styles.livePill, { backgroundColor: '#10B981' }]}>
                            <View style={styles.liveDot} />
                            <Text style={[styles.liveText, { color: '#FFFFFF', fontWeight: '800' }]}>
                              TEACHER OUT
                            </Text>
                          </View>
                        ) : status.isOngoing ? (
                          <View style={styles.livePill}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE {timelineData.totalFilledPct}%</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Subject & Teacher Name */}
                      <View style={{ marginTop: 2 }}>
                        <Text style={[styles.periodSubject, { color: isClassCompleted ? (isLight ? '#64748B' : '#94A3B8') : colors.textMain, fontSize: 15, fontWeight: '700' }]}>
                          {item.code}
                        </Text>
                        {item.faculty && item.faculty !== '-' ? (
                          <Text style={{ fontSize: 12, fontWeight: '500', color: isLight ? '#64748B' : '#94A3B8', marginTop: 2, opacity: 0.85 }}>
                            {item.faculty.replace(/\b(Prof\.|Dr\.|Prof|Dr)\b\s*/gi, '').trim()}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Right Actions Column: Play/Pause Button, Room Pill */}
                    <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {/* Live Punch Play/Pause Icon Button (Deactivated when class is completed) */}
                      <TouchableOpacity
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isClassCompleted
                            ? (isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)')
                            : isPunchIn
                            ? '#F59E0B' // Yellow button when active (Teacher in class)
                            : '#10B981', // Green button when paused / ready (Teacher out)
                          opacity: isClassCompleted ? 0.4 : 1,
                        }}
                        disabled={isClassCompleted}
                        onPress={() => triggerProtectedCRAction({ type: 'punch', data: { day: selectedDay, item, index } })}
                        activeOpacity={0.8}
                        title={isClassCompleted ? 'Class Completed' : isPunchIn ? 'Pause (Teacher Out)' : 'Play (Teacher In)'}
                      >
                        <Ionicons
                          name={isClassCompleted ? 'checkmark-circle' : isPunchIn ? 'pause' : 'play'}
                          size={15}
                          color={isClassCompleted ? (isLight ? '#94A3B8' : '#64748B') : '#FFFFFF'}
                        />
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={[styles.roomPill, { backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.2)', borderColor: isLight ? '#FDE68A' : '#F59E0B' }]}>
                          <Image
                            source={require('../../assets/classroom_logo.png')}
                            style={{ width: 14, height: 14, tintColor: isLight ? '#D97706' : '#FBBF24' }}
                            resizeMode="contain"
                          />
                          <Text style={styles.roomPillText}>{item.room.replace(/^Room\s*/i, '')}</Text>
                        </View>

                        {/* Room edit pencil button (Deactivated / hidden when class is completed) */}
                        {!isClassCompleted && (
                          <TouchableOpacity
                            style={[styles.changeRoomIconBtn, { backgroundColor: isLight ? '#EEF2FF' : 'rgba(15, 23, 42, 0.8)', borderColor: colors.glassBorder }]}
                            onPress={() => triggerProtectedCRAction({ type: 'editRoom', data: { day: selectedDay, index, room: item.room, name: item.name } })}
                            activeOpacity={0.7}
                            title="Change Room"
                          >
                            <Ionicons name="pencil" size={12} color={colors.primary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Bottom Row: Full-width Multi-segment Timeline Progress Bar */}
                  {(status.isOngoing || isPunchIn || isPunchPaused || isPunchEnded) && timelineData.totalFilledPct > 0 && (
                    <View style={{ marginTop: (timelineData.popups && timelineData.popups.length > 0) ? 22 : 10, width: '100%', position: 'relative' }}>
                      
                      {/* Floating Location Pin Drop Markers on Color Transition Boundaries */}
                      {timelineData.popups && timelineData.popups.map((pop, pIdx) => (
                        <View
                          key={pIdx}
                          style={{
                            position: 'absolute',
                            left: `${Math.min(88, Math.max(12, pop.leftPct))}%`,
                            top: -20,
                            transform: [{ translateX: '-50%' }],
                            backgroundColor: pop.color,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3,
                            elevation: 5,
                            zIndex: 20,
                          }}
                        >
                          <Ionicons name="location-sharp" size={10} color="#FFFFFF" />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2, whiteSpace: 'nowrap' }}>
                            {pop.timeStr}
                          </Text>
                          {/* Pointer tip arrow sitting directly on the bar */}
                          <View
                            style={{
                              position: 'absolute',
                              bottom: -4,
                              left: '50%',
                              marginLeft: -4,
                              width: 0,
                              height: 0,
                              borderLeftWidth: 4,
                              borderRightWidth: 4,
                              borderTopWidth: 4,
                              borderLeftColor: 'transparent',
                              borderRightColor: 'transparent',
                              borderTopColor: pop.color,
                            }}
                          />
                        </View>
                      ))}

                      {/* Segmented Progress Bar */}
                      <View style={{ height: 7, backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)', borderRadius: 4, overflow: 'hidden', flexDirection: 'row', width: '100%' }}>
                        {timelineData.segments.map((seg, sIdx) => (
                          <View
                            key={sIdx}
                            style={{
                              height: '100%',
                              width: `${seg.widthPct}%`,
                              backgroundColor: seg.color,
                            }}
                          />
                        ))}
                      </View>

                      {/* Footer Stats */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: isLight ? '#475569' : '#94A3B8' }}>
                          ⚡ {timelineData.totalFilledPct}% filled
                        </Text>
                        {timelineData.yellowMins > 0 ? (
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>
                            • 🟨 Teacher in class: {timelineData.yellowMins}m
                          </Text>
                        ) : null}
                        {timelineData.minsRemaining > 0 ? (
                          <Text style={{ fontSize: 11, fontWeight: '700', color: isLight ? '#64748B' : '#64748B' }}>
                            • {timelineData.minsRemaining} mins remaining
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  )}
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

      {/* Modal 3: Declare College Closed / Event Day Modal */}
      <Modal visible={editingHoliday} transparent animationType="slide" onRequestClose={() => setEditingHoliday(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
          <View style={{ width: '100%', maxWidth: 460, backgroundColor: colors.bgGlassElevated, borderColor: colors.glassBorder, borderWidth: 1, borderRadius: 24, padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles" size={22} color="#EF4444" />
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textMain }}>College Event / Holiday Status</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingHoliday(false)}>
                <Ionicons name="close" size={22} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: colors.textSub, marginBottom: 14 }}>
              Declare college closed for today due to a special event, fest, exam, or official holiday. This will update the portal banner and suspend regular live attendance.
            </Text>

            {/* Quick Event Preset Pills */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textMain, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Select Event Preset:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {[
                { label: '🏆 Annual College Fest / Sports Day', type: 'Fest' },
                { label: '🚀 Hackathon & Seminar Day', type: 'Seminar' },
                { label: '📝 BEU Mid-Sem Examination', type: 'Exam' },
                { label: '🇮🇳 National Holiday / Festival', type: 'Holiday' },
                { label: '🚨 Emergency Weather / Heavy Rain', type: 'Emergency' },
                { label: '🧹 Department Off Day', type: 'Off-Day' },
              ].map((preset) => {
                const isSelected = holidayReasonInput === preset.label;
                return (
                  <TouchableOpacity
                    key={preset.type}
                    onPress={() => {
                      setHolidayReasonInput(preset.label);
                      setHolidayTypeInput(preset.type);
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 14,
                      backgroundColor: isSelected ? (isLight ? '#FEE2E2' : 'rgba(239, 68, 68, 0.25)') : colors.bgGlass,
                      borderColor: isSelected ? '#EF4444' : colors.glassBorder,
                      borderWidth: 1,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#EF4444' : colors.textMain }}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Reason TextInput */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textMain, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Custom Event Reason / Announcement:
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.bgGlass,
                borderColor: colors.glassBorder,
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                color: colors.textMain,
                fontSize: 14,
                fontWeight: '600',
                minHeight: 70,
                textAlignVertical: 'top',
                marginBottom: 18,
              }}
              multiline
              value={holidayReasonInput}
              onChangeText={setHolidayReasonInput}
              placeholder="e.g. Annual College Sports Meet 2026 - All classes suspended"
              placeholderTextColor={colors.textMuted}
            />

            {/* Action Buttons */}
            <View style={{ flexDirection: 'column', gap: 10 }}>
              <TouchableOpacity
                style={{ paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }}
                onPress={handleSaveHolidayOverride}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                  🎉 Declare College Closed Today
                </Text>
              </TouchableOpacity>

              {holidayOverride.isClosed && (
                <TouchableOpacity
                  style={{ paddingVertical: 12, borderRadius: 12, backgroundColor: colors.bgGlass, borderColor: '#10B981', borderWidth: 1.5, alignItems: 'center' }}
                  onPress={handleClearHolidayOverride}
                >
                  <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 14 }}>
                    ✅ Clear Holiday & Resume Normal Classes
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={{ paddingVertical: 10, alignItems: 'center' }}
                onPress={() => setEditingHoliday(false)}
              >
                <Text style={{ color: colors.textSub, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
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
  videoHeroContainer: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  videoHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  heroStripContent: {
    paddingVertical: 4,
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
  crAdminCard: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  crActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  crActionChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
