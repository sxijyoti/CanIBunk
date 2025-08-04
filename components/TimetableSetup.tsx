'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { TimetableData, Course, TimeSlot } from '@/app/page';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

const COURSE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetableSetup({ 
  onComplete, 
  onBack, 
  existingData 
}: { 
  onComplete: (data: TimetableData) => void;
  onBack: () => void;
  existingData: TimetableData | null;
}) {
  const [step, setStep] = useState(1);
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [classDuration, setClassDuration] = useState(60);
  const [breakStart, setBreakStart] = useState('10:30');
  const [breakEnd, setBreakEnd] = useState('10:45');
  const [lunchStart, setLunchStart] = useState('12:00');
  const [lunchEnd, setLunchEnd] = useState('13:00');
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  useEffect(() => {
    if (existingData) {
      setWorkingDays(existingData.workingDays);
      setStartTime(existingData.startTime);
      setEndTime(existingData.endTime);
      setClassDuration(existingData.classDuration);
      setBreakStart(existingData.breakStart);
      setBreakEnd(existingData.breakEnd);
      setLunchStart(existingData.lunchStart);
      setLunchEnd(existingData.lunchEnd);
      setTimeSlots(existingData.timeSlots);
      
      // Extract courses from time slots
      const uniqueCourseIds = [...new Set(existingData.timeSlots.map(slot => slot.courseId).filter(Boolean))];
      const extractedCourses = uniqueCourseIds.map((courseId, index) => ({
        id: courseId!,
        name: courseId!,
        color: COURSE_COLORS[index % COURSE_COLORS.length],
        totalClasses: 0,
        attendedClasses: 0
      }));
      setCourses(extractedCourses);
    }
  }, [existingData]);

  const handleDayToggle = (day: string) => {
    setWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const addCourse = () => {
    if (!newCourseName.trim()) return;
    
    const newCourse: Course = {
      id: newCourseName.trim(),
      name: newCourseName.trim(),
      color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
      totalClasses: 0,
      attendedClasses: 0
    };
    
    setCourses(prev => [...prev, newCourse]);
    setNewCourseName('');
  };

  const removeCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setTimeSlots(prev => prev.filter(slot => slot.courseId !== courseId));
  };

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const start = new Date(`2024-01-01 ${startTime}`);
    const end = new Date(`2024-01-01 ${endTime}`);
    const lunchStartTime = new Date(`2024-01-01 ${lunchStart}`);
    const lunchEndTime = new Date(`2024-01-01 ${lunchEnd}`);
    const breakStartTime = new Date(`2024-01-01 ${breakStart}`);
    const breakEndTime = new Date(`2024-01-01 ${breakEnd}`);

    workingDays.forEach(day => {
      let currentTime = new Date(start);
      
      while (currentTime < end) {
        const slotEnd = new Date(currentTime.getTime() + classDuration * 60000);
        
        // Skip lunch break and regular break
        const isLunchTime = currentTime >= lunchStartTime && currentTime < lunchEndTime;
        const isBreakTime = currentTime >= breakStartTime && currentTime < breakEndTime;
        
        if (!isLunchTime && !isBreakTime) {
          slots.push({
            day,
            startTime: currentTime.toTimeString().slice(0, 5),
            endTime: slotEnd.toTimeString().slice(0, 5),
          });
        }
        
        // Move to next slot
        currentTime = new Date(currentTime.getTime() + classDuration * 60000);
        
        // Skip break periods
        if (currentTime >= breakStartTime && currentTime < breakEndTime) {
          currentTime = new Date(breakEndTime);
        }
        if (currentTime >= lunchStartTime && currentTime < lunchEndTime) {
          currentTime = new Date(lunchEndTime);
        }
      }
    });
    
    setTimeSlots(slots);
    setStep(3);
  };

  const assignCourseToSlot = (slotIndex: number, courseId: string) => {
    setTimeSlots(prev => prev.map((slot, index) => 
      index === slotIndex 
        ? { ...slot, courseId: courseId || undefined }
        : slot
    ));
  };

  const handleComplete = () => {
    if (courses.length === 0) {
      toast.error('Please add at least one course');
      return;
    }

    const data: TimetableData = {
      workingDays,
      startTime,
      endTime,
      classDuration,
      breakStart,
      breakEnd,
      lunchStart,
      lunchEnd,
      timeSlots
    };
    
    onComplete(data);
    toast.success('Timetable setup completed!');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Timetable Setup</h1>
              <p className="text-muted-foreground">Step {step} of 3</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Step 1: Basic Settings */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Timetable Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Working Days</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={workingDays.includes(day)}
                        onCheckedChange={() => handleDayToggle(day)}
                      />
                      <Label htmlFor={day} className="text-sm">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="classDuration">Class Duration (minutes)</Label>
                <Input
                  id="classDuration"
                  type="number"
                  value={classDuration}
                  onChange={(e) => setClassDuration(Number(e.target.value))}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="breakStart">Break Start Time</Label>
                  <Input
                    id="breakStart"
                    type="time"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="breakEnd">Break End Time</Label>
                  <Input
                    id="breakEnd"
                    type="time"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="lunchStart">Lunch Start</Label>
                  <Input
                    id="lunchStart"
                    type="time"
                    value={lunchStart}
                    onChange={(e) => setLunchStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lunchEnd">Lunch End</Label>
                  <Input
                    id="lunchEnd"
                    type="time"
                    value={lunchEnd}
                    onChange={(e) => setLunchEnd(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Continue to Courses
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Add Courses */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Add Courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter course name (e.g., Mathematics, Physics)"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCourse()}
                />
                <Button onClick={addCourse}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {courses.map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="font-medium">{course.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCourse(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={generateTimeSlots}
                  disabled={courses.length === 0}
                  className="flex-1"
                >
                  Generate Timetable
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Assign Courses to Time Slots */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Assign Courses to Time Slots</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click on a time slot and select a course. Leave empty for free periods.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Palette */}
              <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
                <button
                  onClick={() => setSelectedCourse('')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCourse === '' 
                      ? 'bg-background border-2 border-primary' 
                      : 'bg-background/50 hover:bg-background'
                  }`}
                >
                  Empty
                </button>
                {courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                      selectedCourse === course.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: course.color }}
                  >
                    {course.name}
                  </button>
                ))}
              </div>

              {/* Timetable Grid */}
              <div className="overflow-x-auto">
                <div className="grid gap-4">
                  {workingDays.map(day => (
                    <div key={day} className="space-y-2">
                      <h3 className="font-semibold text-lg">{day}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {timeSlots
                          .filter(slot => slot.day === day)
                          .map((slot, index) => {
                            const slotIndex = timeSlots.indexOf(slot);
                            const assignedCourse = courses.find(c => c.id === slot.courseId);
                            
                            return (
                              <button
                                key={`${slot.day}-${slot.startTime}`}
                                onClick={() => assignCourseToSlot(slotIndex, selectedCourse)}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                  slot.courseId 
                                    ? 'text-white border-transparent' 
                                    : 'border-dashed border-muted-foreground/30 hover:border-primary'
                                }`}
                                style={{
                                  backgroundColor: assignedCourse?.color || 'transparent'
                                }}
                              >
                                <div className="text-sm font-medium">
                                  {slot.startTime} - {slot.endTime}
                                </div>
                                <div className="text-xs opacity-90">
                                  {assignedCourse?.name || 'Free Period'}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleComplete} className="flex-1">
                  Complete Timetable Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}