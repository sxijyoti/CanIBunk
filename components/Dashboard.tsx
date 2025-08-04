'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Settings, RotateCcw, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';
import { TimetableData, SemesterData } from '@/app/page';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

type DayStatus = 'attending' | 'bunking' | 'holiday' | 'exam';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCourse] = useState(semesterData.selectedCourse);

  useEffect(() => {
    generateCalendarData();
  }, [currentMonth, timetableData, semesterData]);

  const generateCalendarData = () => {
    const startDate = new Date(semesterData.startDate);
    const endDate = new Date(semesterData.endDate);
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(calendarStart.getDate() - monthStart.getDay());
    
    const calendarEnd = new Date(monthEnd);
    calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));

    const days: CalendarDay[] = [];
    const currentDate = new Date(calendarStart);

    // Load saved data
    const savedData = localStorage.getItem('canibunk-calendar');
    const savedCalendarData = savedData ? JSON.parse(savedData) : {};

    while (currentDate <= calendarEnd) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isInSemester = currentDate >= startDate && currentDate <= endDate;
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isWorkingDay = timetableData.workingDays.includes(dayName);
      
      let classCount = 0;
      if (isInSemester && isWorkingDay) {
        classCount = timetableData.timeSlots.filter(
          slot => slot.day === dayName && slot.courseId === selectedCourse
        ).length;
      }

      const savedDay = savedCalendarData[dateStr];
      const status: DayStatus = savedDay?.status || (isInSemester && isWorkingDay ? 'attending' : 'holiday');
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
    const dataToSave: Record<string, any> = {};
    updatedData.forEach(day => {
      const dateStr = day.date.toISOString().split('T')[0];
      dataToSave[dateStr] = {
        status: day.status,
        bunkedClasses: day.bunkedClasses
      };
    });
    localStorage.setItem('canibunk-calendar', JSON.stringify(dataToSave));
  };

  const handleDayClick = (dayIndex: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (calendarData[dayIndex].date < today) {
      toast.error('Cannot modify past dates');
      return;
    }

    const updatedData = [...calendarData];
    const day = updatedData[dayIndex];
    
    if (day.classCount === 0) {
      toast.info('No classes scheduled for this day');
      return;
    }

    if (day.status === 'holiday' || day.status === 'exam') {
      toast.info('Cannot bunk on holidays or exam days');
      return;
    }

    // Toggle between attending and bunking all classes
    if (day.status === 'attending') {
      day.status = 'bunking';
      day.bunkedClasses = day.classCount;
      toast.success(`Bunking all ${day.classCount} classes`);
    } else {
      day.status = 'attending';
      day.bunkedClasses = 0;
      toast.success('Attending all classes');
    }

    setCalendarData(updatedData);
    saveCalendarData(updatedData);
  };

  const handleDayRightClick = (e: React.MouseEvent, dayIndex: number) => {
    e.preventDefault();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (calendarData[dayIndex].date < today) {
      toast.error('Cannot modify past dates');
      return;
    }

    const updatedData = [...calendarData];
    const day = updatedData[dayIndex];

    if (e.shiftKey) {
      // Shift + Right-click for exam periods
      if (day.status === 'exam') {
        day.status = day.classCount > 0 ? 'attending' : 'holiday';
        day.bunkedClasses = 0;
        toast.success('Removed exam period');
      } else {
        day.status = 'exam';
        day.bunkedClasses = 0;
        toast.success('Marked as exam period');
      }
    } else {
      // Regular right-click for holidays
      if (day.status === 'holiday') {
        day.status = day.classCount > 0 ? 'attending' : 'holiday';
        day.bunkedClasses = 0;
        toast.success('Marked as working day');
      } else {
        day.status = 'holiday';
        day.bunkedClasses = 0;
        toast.success('Marked as holiday');
      }
    }

    setCalendarData(updatedData);
    saveCalendarData(updatedData);
  };

  const calculateAttendance = () => {
    const selectedCourseData = semesterData.courses.find(c => c.id === selectedCourse);
    if (!selectedCourseData) return { current: 0, predicted: 0, totalClasses: 0, attendedClasses: 0 };

    let totalFutureClasses = 0;
    let bunkedFutureClasses = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    calendarData.forEach(day => {
      if (day.date >= today && day.status !== 'holiday' && day.status !== 'exam') {
        totalFutureClasses += day.classCount;
        bunkedFutureClasses += day.bunkedClasses;
      }
    });

    const totalClasses = selectedCourseData.totalClasses + totalFutureClasses;
    const attendedClasses = selectedCourseData.attendedClasses + (totalFutureClasses - bunkedFutureClasses);
    
    const currentAttendance = selectedCourseData.totalClasses > 0 
      ? (selectedCourseData.attendedClasses / selectedCourseData.totalClasses) * 100 
      : 0;
    
    const predictedAttendance = totalClasses > 0 
      ? (attendedClasses / totalClasses) * 100 
      : 0;

    return {
      current: currentAttendance,
      predicted: predictedAttendance,
      totalClasses,
      attendedClasses,
      totalFutureClasses,
      bunkedFutureClasses
    };
  };

  const attendance = calculateAttendance();
  const selectedCourseData = semesterData.courses.find(c => c.id === selectedCourse);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDayStatusColor = (day: CalendarDay) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (day.date < today) {
      return 'bg-muted text-muted-foreground';
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
              Tracking: {selectedCourseData?.name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onEdit}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Setup
            </Button>
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <ThemeToggle />
          </div>
        </div>

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
              <CardTitle className="text-sm font-medium">Classes to Bunk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendance.bunkedFutureClasses}</div>
              <p className="text-xs text-muted-foreground">
                Out of {attendance.totalFutureClasses} future classes
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
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  ←
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
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
              
              {calendarData.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDayClick(index)}
                  onContextMenu={(e) => handleDayRightClick(e, index)}
                  className={`
                    p-2 text-sm rounded-lg transition-all duration-200 min-h-[60px] flex flex-col items-center justify-center
                    ${getDayStatusColor(day)}
                    ${!isCurrentMonth(day.date) ? 'opacity-30' : ''}
                    ${day.classCount > 0 ? 'cursor-pointer' : 'cursor-default'}
                  `}
                  disabled={day.date < new Date()}
                >
                  <span className="font-medium">{day.date.getDate()}</span>
                  {day.classCount > 0 && (
                    <span className="text-xs opacity-75">
                      {day.status === 'bunking' ? `${day.bunkedClasses}/${day.classCount}` : day.classCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 status-attending rounded"></div>
                <span>Attending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 status-bunking rounded"></div>
                <span>Bunking</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 status-holiday rounded"></div>
                <span>Holiday</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 status-exam rounded"></div>
                <span>Exam Period</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>• Click to toggle bunking all classes</p>
              <p>• Right-click to mark as holiday</p>
              <p>• Shift + Right-click to mark as exam period</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}