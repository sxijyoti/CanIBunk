'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Calendar, Settings, RotateCcw, BookOpen, TrendingUp, AlertTriangle, ChevronDown } from 'lucide-react';
import { TimetableData, SemesterData } from '@/app/page';
import { toast } from 'sonner';

type DayStatus = 'attending' | 'bunking' | 'holiday' | 'exam' | 'normal';

type CalendarDay = {
  date: Date;
  status: DayStatus;
  classCount: number;
  bunkedClasses: number;
};

export default function Dashboard({
  timetableData,
  semesterData,
  onReset,
  onEdit
}: {
  timetableData: TimetableData;
  semesterData: SemesterData;
  onReset: () => void;
  onEdit: () => void;
}) {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Start with the semester start month, or current month if within semester
    const semStart = new Date(semesterData.startDate);
    const now = new Date();
    const semEnd = new Date(semesterData.endDate);
    
    if (now >= semStart && now <= semEnd) {
      return now; // Current month if within semester
    } else {
      return semStart; // Otherwise start with semester start
    }
  });
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [bunkedClassesInput, setBunkedClassesInput] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [targetAttendance, setTargetAttendance] = useState(75);
  const [markingMode, setMarkingMode] = useState<'normal' | 'holiday' | 'exam'>('normal');
  const [clickedDay, setClickedDay] = useState<number | null>(null);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize selected courses from semester data
    if (semesterData.selectedCourses) {
      setSelectedCourses(semesterData.selectedCourses);
      setActiveSubject(semesterData.selectedCourses[0] || '');
    } else {
      // Fallback for old data structure
      setSelectedCourses([semesterData.selectedCourse]);
      setActiveSubject(semesterData.selectedCourse);
    }
  }, [semesterData]);

  useEffect(() => {
    generateCalendarData();
  }, [currentMonth, timetableData, semesterData, activeSubject]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clickedDay !== null) {
        const popup = document.getElementById('bunk-popup');
        if (popup && !popup.contains(event.target as Node)) {
          setClickedDay(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clickedDay]);



  const generateCalendarData = () => {
    const startDate = new Date(semesterData.startDate);
    const endDate = new Date(semesterData.endDate);
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(calendarStart.getDate() - monthStart.getDay());
    
    const calendarEnd = new Date(monthEnd);
    calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));
    
    // Don't show dates beyond semester end
    if (calendarEnd > endDate) {
      calendarEnd.setTime(endDate.getTime());
      // Extend to complete the week only if it's not too far
      const endDayOfWeek = endDate.getDay();
      if (endDayOfWeek < 6) {
        calendarEnd.setDate(endDate.getDate() + (6 - endDayOfWeek));
      }
    }

    const days: CalendarDay[] = [];
    const currentDate = new Date(calendarStart);

    // Load saved data for current subject
    const savedData = localStorage.getItem('canibunk-calendar');
    const allCalendarData = savedData ? JSON.parse(savedData) : {};
    const subjectKey = `subject_${activeSubject}`;
    const savedCalendarData = allCalendarData[subjectKey] || {};
    
    // Load global holidays/exams
    const globalData = localStorage.getItem('canibunk-global-status') || '{}';
    const globalStatus = JSON.parse(globalData);

    while (currentDate <= calendarEnd) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isInSemester = currentDate >= startDate && currentDate <= endDate;
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isWorkingDay = timetableData.workingDays.includes(dayName);
      
      let classCount = 0;
      if (isInSemester && isWorkingDay) {
        classCount = timetableData.timeSlots.filter(
          slot => slot.day === dayName && slot.courseId === activeSubject
        ).length;
      }

      const savedDay = savedCalendarData[dateStr];
      const globalStatusForDate = globalStatus[dateStr];
      
      // Default status logic: 
      // - If in semester and working day with classes: 'attending'
      // - If no classes but in semester and working day: 'normal' 
      // - If not in semester or not working day: 'normal'
      let defaultStatus: DayStatus = 'normal';
      if (isInSemester && isWorkingDay && classCount > 0) {
        defaultStatus = 'attending';
      }
      
      // Priority: Global status (holidays/exams) > saved subject data > default
      let status: DayStatus;
      if (globalStatusForDate === 'holiday' || globalStatusForDate === 'exam') {
        status = globalStatusForDate;
      } else {
        status = savedDay?.status || defaultStatus;
      }
      
      const bunkedClasses = savedDay?.bunkedClasses || 0;

      days.push({
        date: new Date(currentDate),
        status,
        classCount,
        bunkedClasses
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setCalendarData(days);
  };

  const saveCalendarData = (updatedData: CalendarDay[]) => {
    // Load existing calendar data
    const savedData = localStorage.getItem('canibunk-calendar');
    const allCalendarData = savedData ? JSON.parse(savedData) : {};
    
    // Load global holidays/exams
    const globalData = localStorage.getItem('canibunk-global-status') || '{}';
    const globalStatus = JSON.parse(globalData);
    
    // Save data for current subject
    const subjectKey = `subject_${activeSubject}`;
    if (!allCalendarData[subjectKey]) {
      allCalendarData[subjectKey] = {};
    }
    
    updatedData.forEach(day => {
      const dateStr = day.date.toISOString().split('T')[0];
      
      // Save subject-specific data
      allCalendarData[subjectKey][dateStr] = {
        status: day.status,
        bunkedClasses: day.bunkedClasses
      };
      
      // Save holidays and exams globally (they apply to all subjects)
      if (day.status === 'holiday' || day.status === 'exam') {
        globalStatus[dateStr] = day.status;
        
        // Apply to all other subjects as well
        selectedCourses.forEach(courseId => {
          const otherSubjectKey = `subject_${courseId}`;
          if (!allCalendarData[otherSubjectKey]) {
            allCalendarData[otherSubjectKey] = {};
          }
          if (!allCalendarData[otherSubjectKey][dateStr]) {
            allCalendarData[otherSubjectKey][dateStr] = { status: day.status, bunkedClasses: 0 };
          } else {
            allCalendarData[otherSubjectKey][dateStr].status = day.status;
            if (day.status === 'holiday' || day.status === 'exam') {
              allCalendarData[otherSubjectKey][dateStr].bunkedClasses = 0;
            }
          }
        });
      } else if (day.status === 'attending' || day.status === 'bunking') {
        // Remove from global status if changing back to normal
        delete globalStatus[dateStr];
      }
    });
    
    localStorage.setItem('canibunk-calendar', JSON.stringify(allCalendarData));
    localStorage.setItem('canibunk-global-status', JSON.stringify(globalStatus));
  };

  const handleDayClick = (dayIndex: number, event?: React.MouseEvent) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const semStart = new Date(semesterData.startDate);
    const semEnd = new Date(semesterData.endDate);
    const dayDate = calendarData[dayIndex].date;
    
    if (dayDate < today) {
      toast.error('Cannot modify past dates');
      return;
    }
    
    if (dayDate < semStart || dayDate > semEnd) {
      toast.error('Date is outside semester period');
      return;
    }

    const updatedData = [...calendarData];
    const day = updatedData[dayIndex];

    if (markingMode === 'holiday') {
      // Holiday marking mode - cycle: normal/attending -> holiday -> normal
      if (day.status === 'holiday') {
        // Remove holiday - go back to normal state
        day.status = 'normal';
        day.bunkedClasses = 0;
        toast.success('Removed holiday');
      } else {
        day.status = 'holiday';
        day.bunkedClasses = 0;
        toast.success('Marked as holiday');
      }
      setCalendarData(updatedData);
      saveCalendarData(updatedData);
    } else if (markingMode === 'exam') {
      // Exam marking mode - cycle: normal/attending -> exam -> normal
      if (day.status === 'exam') {
        // Remove exam - go back to normal state
        day.status = 'normal';
        day.bunkedClasses = 0;
        toast.success('Removed exam period');
      } else {
        day.status = 'exam';
        day.bunkedClasses = 0;
        toast.success('Marked as exam period');
      }
      setCalendarData(updatedData);
      saveCalendarData(updatedData);
    } else {
      // Normal mode
      if (day.status === 'holiday') {
        // If it's a holiday, convert back to normal first
        day.status = day.classCount > 0 ? 'attending' : 'holiday';
        day.bunkedClasses = 0;
        toast.success('Converted from holiday to normal');
        setCalendarData(updatedData);
        saveCalendarData(updatedData);
        return;
      } else if (day.status === 'exam') {
        // If it's an exam, convert back to normal first
        day.status = day.classCount > 0 ? 'attending' : 'holiday';
        day.bunkedClasses = 0;
        toast.success('Converted from exam to normal');
        setCalendarData(updatedData);
        saveCalendarData(updatedData);
        return;
      }

      // Normal bunk setting
      if (day.classCount === 0) {
        toast.info('No classes scheduled for this day');
        return;
      }

      // Show click popup for bunk input
      if (event) {
        setClickPosition({ x: event.clientX, y: event.clientY });
      }
      setSelectedDayIndex(dayIndex);
      setBunkedClassesInput(day.bunkedClasses || 0);
      setClickedDay(dayIndex);
    }
  };





  const handlePartialBunkSubmit = () => {
    if (selectedDayIndex === null) return;
    
    const updatedData = [...calendarData];
    const day = updatedData[selectedDayIndex];
    
    // Validate input
    if (bunkedClassesInput < 0 || bunkedClassesInput > day.classCount) {
      toast.error(`Please enter a number between 0 and ${day.classCount}`);
      return;
    }
    
    // Update day status based on bunked classes
    if (bunkedClassesInput === 0) {
      day.status = 'attending';
    } else if (bunkedClassesInput === day.classCount) {
      day.status = 'bunking';
    } else {
      day.status = 'bunking'; // Partial bunking is still considered bunking
    }
    
    day.bunkedClasses = bunkedClassesInput;
    
    setCalendarData(updatedData);
    saveCalendarData(updatedData);
    setSelectedDayIndex(null);
    setBunkedClassesInput(0);
    
    if (bunkedClassesInput === 0) {
      toast.success('Attending all classes');
    } else if (bunkedClassesInput === day.classCount) {
      toast.success(`Bunking all ${day.classCount} classes`);
    } else {
      toast.success(`Bunking ${bunkedClassesInput} out of ${day.classCount} classes`);
    }
  };

  const resetAttendance = () => {
    // Reset only attendance data for all courses
    const updatedCourses = semesterData.courses.map(course => ({
      ...course,
      totalClasses: 0,
      attendedClasses: 0
    }));
    
    const updatedSemesterData = {
      ...semesterData,
      courses: updatedCourses
    };
    
    localStorage.setItem('canibunk-semester', JSON.stringify(updatedSemesterData));
    toast.success('Attendance data reset successfully');
    window.location.reload(); // Reload to reflect changes
  };

  const resetCalendar = () => {
    // Reset only calendar data
    localStorage.removeItem('canibunk-calendar');
    localStorage.removeItem('canibunk-global-status');
    generateCalendarData();
    toast.success('Calendar data reset successfully');
  };

  const resetTimetable = () => {
    // Reset only timetable data
    localStorage.removeItem('canibunk-timetable');
    toast.success('Timetable data reset successfully');
    onEdit(); // Go back to setup
  };

  const resetSemester = () => {
    // Reset only semester data
    localStorage.removeItem('canibunk-semester');
    toast.success('Semester data reset successfully');
    onEdit(); // Go back to setup
  };

  const resetAll = () => {
    // Reset everything
    localStorage.removeItem('canibunk-timetable');
    localStorage.removeItem('canibunk-semester');
    localStorage.removeItem('canibunk-calendar');
    localStorage.removeItem('canibunk-global-status');
    toast.success('All data reset successfully');
    onReset();
  };

  const calculateSmartBunk = () => {
    const attendanceData = calculateAttendance();
    const selectedCourseData = semesterData.courses.find(c => c.id === activeSubject);
    if (!selectedCourseData || attendanceData.totalClasses === 0) return 0;

    // Use predicted attendance values from calculateAttendance
    const predictedTotalClasses = attendanceData.totalClasses;
    const predictedAttendedClasses = attendanceData.attendedClasses;
    
    // Calculate minimum classes needed to maintain target attendance
    const minRequiredClasses = Math.ceil((targetAttendance / 100) * predictedTotalClasses);
    
    // Classes that can still be bunked = currently predicted attended - minimum required
    // This represents how many more classes can be bunked from the current prediction
    const maxBunkable = Math.max(0, predictedAttendedClasses - minRequiredClasses);
    
    return maxBunkable;
  };

  const calculateAttendance = () => {
    const selectedCourseData = semesterData.courses.find(c => c.id === activeSubject);
    if (!selectedCourseData) return { current: 0, predicted: 0, totalClasses: 0, attendedClasses: 0 };

    const semesterStart = new Date(semesterData.startDate);
    const semesterEnd = new Date(semesterData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate past holidays/exams to adjust the original semester data
    let pastHolidayExamClasses = 0;
    let futureClasses = 0;
    let bunkedFutureClasses = 0;

    // Generate all days in the semester to count holidays/exams and future classes
    const currentDate = new Date(semesterStart);
    while (currentDate <= semesterEnd) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isWorkingDay = timetableData.workingDays.includes(dayName);
      
      if (isWorkingDay) {
        // Count classes for this day
        const dayClassCount = timetableData.timeSlots.filter(
          slot => slot.day === dayName && slot.courseId === activeSubject
        ).length;
        
        // Find the day in calendar data
        const calendarDay = calendarData.find(d => 
          d.date.toDateString() === currentDate.toDateString()
        );
        
        // If it's marked as holiday or exam, count it for exclusion
        if (calendarDay && (calendarDay.status === 'holiday' || calendarDay.status === 'exam')) {
          if (currentDate < today) {
            // Past holiday/exam - subtract from original semester data
            pastHolidayExamClasses += dayClassCount;
          }
          // We exclude these from calculations entirely
        } else {
          // Regular working day
          if (currentDate >= today) {
            // Future day - use calendar data for planning
            futureClasses += dayClassCount;
            
            if (calendarDay) {
              bunkedFutureClasses += calendarDay.bunkedClasses || 0;
            }
          }
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Adjust past classes by removing holidays/exams
    const totalPastClasses = Math.max(0, selectedCourseData.totalClasses - pastHolidayExamClasses);
    const attendedPastClasses = Math.min(selectedCourseData.attendedClasses, totalPastClasses);

    // Calculate totals
    const totalClasses = totalPastClasses + futureClasses;
    const attendedClasses = attendedPastClasses + (futureClasses - bunkedFutureClasses);
    
    // Current attendance (past classes only)
    const currentAttendance = totalPastClasses > 0 
      ? (attendedPastClasses / totalPastClasses) * 100 
      : 0;
    
    // Predicted attendance (entire semester)
    const predictedAttendance = totalClasses > 0 
      ? (attendedClasses / totalClasses) * 100 
      : 0;

    return {
      current: currentAttendance,
      predicted: predictedAttendance,
      totalClasses,
      attendedClasses,
      totalFutureClasses: futureClasses,
      bunkedFutureClasses
    };
  };

  const attendance = calculateAttendance();
  const selectedCourseData = semesterData.courses.find(c => c.id === activeSubject);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const semStart = new Date(semesterData.startDate);
    const semEnd = new Date(semesterData.endDate);
    
    setCurrentMonth(prev => {
      if (direction === 'prev') {
        // Check if we can go to previous month
        const prevMonth = new Date(prev);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        
        // Don't go before semester start month
        if (prevMonth.getFullYear() < semStart.getFullYear() || 
           (prevMonth.getFullYear() === semStart.getFullYear() && prevMonth.getMonth() < semStart.getMonth())) {
          return prev; // Stay at current month
        }
        return prevMonth;
      } else {
        // Check if we can go to next month
        const nextMonth = new Date(prev);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Don't go after semester end month
        if (nextMonth.getFullYear() > semEnd.getFullYear() || 
           (nextMonth.getFullYear() === semEnd.getFullYear() && nextMonth.getMonth() > semEnd.getMonth())) {
          return prev; // Stay at current month
        }
        return nextMonth;
      }
    });
  };

  const getDayStatusColor = (day: CalendarDay) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const semStart = new Date(semesterData.startDate);
    const semEnd = new Date(semesterData.endDate);
    
    if (day.date < today) {
      return 'bg-muted text-muted-foreground';
    }
    
    // Gray out dates outside semester
    if (day.date < semStart || day.date > semEnd) {
      return 'bg-muted/20 text-muted-foreground cursor-not-allowed';
    }
    
    switch (day.status) {
      case 'attending':
        return 'status-attending hover:opacity-90';
      case 'bunking':
        return 'status-bunking hover:opacity-90';
      case 'holiday':
        return 'status-holiday hover:opacity-90';
      case 'exam':
        return 'status-exam hover:opacity-90';
      case 'normal':
        return 'bg-muted/30 hover:bg-muted/50 border border-muted-foreground/30';
      default:
        return 'bg-background hover:bg-muted';
    }
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CanIBunk Dashboard</h1>
            <p className="text-muted-foreground">
              Tracking: {semesterData.courses.find(c => c.id === activeSubject)?.name || 'No subject selected'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onEdit}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Setup
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={resetAttendance}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Reset Attendance Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={resetCalendar}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Reset Calendar Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={resetTimetable}>
                  <Settings className="h-4 w-4 mr-2" />
                  Reset Timetable
                </DropdownMenuItem>
                <DropdownMenuItem onClick={resetSemester}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Reset Semester Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={resetAll} className="text-destructive">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reset Everything
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Subject Selection Tabs */}
        {selectedCourses.length > 1 && (
          <Tabs value={activeSubject} onValueChange={setActiveSubject}>
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full overflow-x-auto">
              <div className="flex space-x-1 min-w-full">
                {selectedCourses.map(courseId => {
                  const course = semesterData.courses.find(c => c.id === courseId);
                  if (!course) return null;
                  return (
                    <TabsTrigger 
                      key={courseId} 
                      value={courseId} 
                      className="flex items-center space-x-2 whitespace-nowrap flex-shrink-0 min-w-fit px-3"
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="truncate max-w-[120px]">{course.name}</span>
                    </TabsTrigger>
                  );
                })}
              </div>
            </TabsList>
          </Tabs>
        )}



        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Attendance</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendance.current.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {selectedCourseData?.attendedClasses}/{selectedCourseData?.totalClasses} classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predicted Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendance.predicted.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {attendance.attendedClasses}/{attendance.totalClasses} total classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Smart Bunk Calculator</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Label htmlFor="targetAttendance" className="text-xs">Target %:</Label>
                <Input
                  id="targetAttendance"
                  type="number"
                  min="60"
                  max="100"
                  value={targetAttendance}
                  onChange={(e) => setTargetAttendance(Number(e.target.value))}
                  className="w-16 h-6 text-xs"
                />
              </div>
              <div className="text-2xl font-bold">{calculateSmartBunk()}</div>
              <p className="text-xs text-muted-foreground">
                More classes you can bunk from predicted ({attendance.predicted.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateMonth('prev')}
                  disabled={(() => {
                    const semStart = new Date(semesterData.startDate);
                    // Disable if current month is the same as or before semester start month
                    return currentMonth.getFullYear() < semStart.getFullYear() || 
                           (currentMonth.getFullYear() === semStart.getFullYear() && 
                            currentMonth.getMonth() <= semStart.getMonth());
                  })()}
                >
                  ←
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateMonth('next')}
                  disabled={(() => {
                    const semEnd = new Date(semesterData.endDate);
                    // Disable if current month is the same as or after semester end month
                    return currentMonth.getFullYear() > semEnd.getFullYear() || 
                           (currentMonth.getFullYear() === semEnd.getFullYear() && 
                            currentMonth.getMonth() >= semEnd.getMonth());
                  })()}
                >
                  →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {calendarData.map((day, index) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const semStart = new Date(semesterData.startDate);
                const semEnd = new Date(semesterData.endDate);
                const dayDate = new Date(day.date);
                dayDate.setHours(0, 0, 0, 0);
                const isPastDate = dayDate < today;
                const isOutsideSemester = dayDate < semStart || dayDate > semEnd;
                
                return (
                  <button
                    key={index}
                    onClick={(e) => !isPastDate && !isOutsideSemester && handleDayClick(index, e)}
                    className={`
                      p-2 text-sm rounded-lg transition-all duration-200 min-h-[60px] flex flex-col items-center justify-center relative
                      ${getDayStatusColor(day)}
                      ${!isCurrentMonth(day.date) ? 'opacity-30' : ''}
                      ${isPastDate || isOutsideSemester ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span className="font-medium">{day.date.getDate()}</span>
                    {day.classCount > 0 && (
                      <span className="text-xs opacity-75">
                        {day.status === 'bunking' ? `${day.bunkedClasses || 0}/${day.classCount}` : day.classCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Click Popup for Bunk Input */}
            {clickedDay !== null && markingMode === 'normal' && calendarData[clickedDay] && (
              <div 
                id="bunk-popup"
                className="fixed z-50 bg-popover border rounded-lg shadow-lg p-3 min-w-[220px]"
                style={{ 
                  left: `${Math.max(10, Math.min(clickPosition.x - 110, window.innerWidth - 240))}px`,
                  top: `${Math.max(10, clickPosition.y - 100)}px`,
                  pointerEvents: 'auto'
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {calendarData[clickedDay].date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setClickedDay(null)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Classes: {calendarData[clickedDay].classCount}
                  </div>
                  
                  {/* Smart Bunk Info */}
                  <div className="text-xs p-2 bg-muted rounded text-center">
                    <span className="font-medium">Smart Bunk: </span>
                    <span className="text-primary font-bold">{calculateSmartBunk()}</span>
                    <span className="text-muted-foreground"> classes left for {targetAttendance}%</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="bunk-input" className="text-xs">Bunk:</Label>
                    <Input
                      id="bunk-input"
                      type="number"
                      min="0"
                      max={calendarData[clickedDay].classCount}
                      value={bunkedClassesInput}
                      onChange={(e) => setBunkedClassesInput(Number(e.target.value))}
                      className="w-16 h-6 text-xs"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        handlePartialBunkSubmit();
                        setClickedDay(null);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Bunk
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Directly set to 0 and apply
                        const updatedData = [...calendarData];
                        const day = updatedData[clickedDay];
                        day.status = 'attending';
                        day.bunkedClasses = 0;
                        setCalendarData(updatedData);
                        saveCalendarData(updatedData);
                        setClickedDay(null);
                        toast.success('Attending all classes');
                      }}
                      className="h-6 px-3 text-xs flex-1"
                    >
                      Attend All
                    </Button>
                    {calculateSmartBunk() > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setBunkedClassesInput(Math.min(calculateSmartBunk(), calendarData[clickedDay].classCount));
                          handlePartialBunkSubmit();
                          setClickedDay(null);
                        }}
                        className="h-6 px-3 text-xs bg-green-50 hover:bg-green-100 flex-1"
                      >
                        Smart Bunk
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Legend / Mode Selector */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  onClick={() => setMarkingMode('normal')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    markingMode === 'normal' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="w-4 h-4 status-attending rounded"></div>
                  <span>Normal Mode</span>
                </button>
                <button
                  onClick={() => setMarkingMode('holiday')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    markingMode === 'holiday' 
                      ? 'bg-orange-500 text-white hover:bg-orange-600' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="w-4 h-4 status-holiday rounded"></div>
                  <span>Mark Holidays</span>
                </button>
                <button
                  onClick={() => setMarkingMode('exam')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    markingMode === 'exam' 
                      ? 'bg-purple-500 text-white hover:bg-purple-600' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="w-4 h-4 status-exam rounded"></div>
                  <span>Mark Exams</span>
                </button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {markingMode === 'normal' && '• Click dates to set bunk classes • Hover for quick input'}
                {markingMode === 'holiday' && '• Click dates to mark/unmark holidays'}
                {markingMode === 'exam' && '• Click dates to mark/unmark exam periods'}
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}