'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ArrowLeft } from 'lucide-react';
import { SemesterData, Course } from '@/app/page';
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
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(''); // Keep for backward compatibility

  useEffect(() => {
    // Always refresh courses from timetable to get the latest data
    const timetableData = localStorage.getItem('canibunk-timetable');
    if (timetableData) {
      const parsed = JSON.parse(timetableData);
      const uniqueCourseIds = Array.from(new Set(parsed.timeSlots.map((slot: any) => slot.courseId).filter(Boolean))) as string[];
      const coursesFromTimetable = uniqueCourseIds.map((courseId: string, index: number) => ({
        id: courseId,
        name: courseId,
        color: COURSE_COLORS[index % COURSE_COLORS.length],
        totalClasses: 0,
        attendedClasses: 0
      }));
      
      // If we have existing data, merge the attendance numbers but use fresh course list
      if (existingData) {
        const mergedCourses = coursesFromTimetable.map(course => {
          const existingCourse = existingData.courses.find(c => c.id === course.id);
          return existingCourse ? { ...course, totalClasses: existingCourse.totalClasses, attendedClasses: existingCourse.attendedClasses } : course;
        });
        setCourses(mergedCourses);
        setStartDate(existingData.startDate);
        setEndDate(existingData.endDate);
      } else {
        setCourses(coursesFromTimetable);
      }
      
      // Automatically select all courses
      const allCourseIds = coursesFromTimetable.map(c => c.id);
      setSelectedCourses(allCourseIds);
      setSelectedCourse(allCourseIds[0] || '');
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

    const data: SemesterData = {
      startDate,
      endDate,
      courses,
      selectedCourses,
      selectedCourse: selectedCourses[0] // First selected course for backward compatibility
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

            {/* Attendance Details for All Courses */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Attendance Details</Label>
              <div className="space-y-4">
                {courses.map(course => (
                  <div key={course.id} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                      <h3 className="font-medium">{course.name}</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`attended-${course.id}`}>Classes Attended</Label>
                        <Input
                          id={`attended-${course.id}`}
                          type="number"
                          min="0"
                          max={course.totalClasses || undefined}
                          value={course.attendedClasses}
                          onChange={(e) => updateCourse(course.id, 'attendedClasses', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`total-${course.id}`}>Total Classes So Far</Label>
                        <Input
                          id={`total-${course.id}`}
                          type="number"
                          min="0"
                          value={course.totalClasses}
                          onChange={(e) => updateCourse(course.id, 'totalClasses', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    {course.totalClasses > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Current attendance: {((course.attendedClasses / course.totalClasses) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleComplete} 
              className="w-full"
              disabled={courses.length === 0}
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}