'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { SemesterData, Course } from '@/app/page';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

const COURSE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export default function SemesterSetup({ 
  onComplete, 
  onBack, 
  existingData 
}: { 
  onComplete: (data: SemesterData) => void;
  onBack: () => void;
  existingData: SemesterData | null;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    if (existingData) {
      setStartDate(existingData.startDate);
      setEndDate(existingData.endDate);
      setCourses(existingData.courses);
      setSelectedCourse(existingData.selectedCourse);
    } else {
      // Load courses from timetable if available
      const timetableData = localStorage.getItem('canibunk-timetable');
      if (timetableData) {
        const parsed = JSON.parse(timetableData);
        const uniqueCourseIds = [...new Set(parsed.timeSlots.map((slot: any) => slot.courseId).filter(Boolean))];
        const coursesFromTimetable = uniqueCourseIds.map((courseId: string, index: number) => ({
          id: courseId,
          name: courseId,
          color: COURSE_COLORS[index % COURSE_COLORS.length],
          totalClasses: 0,
          attendedClasses: 0
        }));
        setCourses(coursesFromTimetable);
      }
    }
  }, [existingData]);

  const updateCourse = (courseId: string, field: 'totalClasses' | 'attendedClasses', value: number) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, [field]: Math.max(0, value) }
        : course
    ));
  };

  const handleComplete = () => {
    if (!startDate || !endDate) {
      toast.error('Please set semester start and end dates');
      return;
    }
    
    if (!selectedCourse) {
      toast.error('Please select a course to track');
      return;
    }

    const data: SemesterData = {
      startDate,
      endDate,
      courses,
      selectedCourse
    };
    
    onComplete(data);
    toast.success('Semester setup completed!');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Semester Details</h1>
              <p className="text-muted-foreground">Configure your semester and course attendance</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Semester Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Semester Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Semester Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Semester End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Course Details */}
            {/* Course Selection for Tracking */}
            <div>
              <Label htmlFor="selectedCourse">Select Course to Track</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course to track for bunking" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: course.color }}
                        />
                        <span>{course.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attendance Details for Selected Course Only */}
            {selectedCourse && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Attendance Details for {courses.find(c => c.id === selectedCourse)?.name}</Label>
                <div className="p-4 border border-border rounded-lg space-y-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: courses.find(c => c.id === selectedCourse)?.color }}
                    />
                    <h3 className="font-medium">{courses.find(c => c.id === selectedCourse)?.name}</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`total-${selectedCourse}`}>Total Classes So Far</Label>
                      <Input
                        id={`total-${selectedCourse}`}
                        type="number"
                        min="0"
                        value={courses.find(c => c.id === selectedCourse)?.totalClasses || 0}
                        onChange={(e) => updateCourse(selectedCourse, 'totalClasses', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`attended-${selectedCourse}`}>Classes Attended</Label>
                      <Input
                        id={`attended-${selectedCourse}`}
                        type="number"
                        min="0"
                        max={courses.find(c => c.id === selectedCourse)?.totalClasses || 0}
                        value={courses.find(c => c.id === selectedCourse)?.attendedClasses || 0}
                        onChange={(e) => updateCourse(selectedCourse, 'attendedClasses', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  {(courses.find(c => c.id === selectedCourse)?.totalClasses || 0) > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Current attendance: {(((courses.find(c => c.id === selectedCourse)?.attendedClasses || 0) / (courses.find(c => c.id === selectedCourse)?.totalClasses || 1)) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button 
              onClick={handleComplete} 
              className="w-full"
              disabled={!selectedCourse}
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}