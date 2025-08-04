'use client';

import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import LandingPage from '@/components/LandingPage';
import TimetableSetup from '@/components/TimetableSetup';
import SemesterSetup from '@/components/SemesterSetup';
import Dashboard from '@/components/Dashboard';
import { Toaster } from '@/components/ui/sonner';

export type Course = {
  id: string;
  name: string;
  color: string;
  totalClasses: number;
  attendedClasses: number;
};

export type TimeSlot = {
  day: string;
  startTime: string;
  endTime: string;
  courseId?: string;
};

export type TimetableData = {
  workingDays: string[];
  startTime: string;
  endTime: string;
  classDuration: number;
  breakStart: string;
  breakEnd: string;
  lunchStart: string;
  lunchEnd: string;
  timeSlots: TimeSlot[];
};

export type SemesterData = {
  startDate: string;
  endDate: string;
  courses: Course[];
  selectedCourse: string;
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'landing' | 'menu' | 'timetable' | 'semester' | 'dashboard'>('landing');
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [semesterData, setSemesterData] = useState<SemesterData | null>(null);

  useEffect(() => {
    // Load data from localStorage on mount
    const savedTimetable = localStorage.getItem('canibunk-timetable');
    const savedSemester = localStorage.getItem('canibunk-semester');
    
    if (savedTimetable) {
      setTimetableData(JSON.parse(savedTimetable));
    }
    
    if (savedSemester) {
      setSemesterData(JSON.parse(savedSemester));
    }
    
    // If both are saved, go to dashboard
    if (savedTimetable && savedSemester) {
      setCurrentStep('dashboard');
    }
  }, []);

  const handleTimetableComplete = (data: TimetableData) => {
    setTimetableData(data);
    localStorage.setItem('canibunk-timetable', JSON.stringify(data));
    setCurrentStep('semester');
  };

  const handleSemesterComplete = (data: SemesterData) => {
    setSemesterData(data);
    localStorage.setItem('canibunk-semester', JSON.stringify(data));
    setCurrentStep('dashboard');
  };

  const resetData = () => {
    localStorage.removeItem('canibunk-timetable');
    localStorage.removeItem('canibunk-semester');
    setTimetableData(null);
    setSemesterData(null);
    setCurrentStep('landing');
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background text-foreground">
        {currentStep === 'landing' && (
          <LandingPage onGetStarted={() => setCurrentStep('menu')} />
        )}
        
        {currentStep === 'menu' && (
          <MenuSelection
            onSelectTimetable={() => setCurrentStep('timetable')}
            onSelectSemester={() => setCurrentStep('semester')}
            hasExistingData={!!(timetableData && semesterData)}
            onGoToDashboard={() => setCurrentStep('dashboard')}
            onBack={() => setCurrentStep('landing')}
          />
        )}
        
        {currentStep === 'timetable' && (
          <TimetableSetup 
            onComplete={handleTimetableComplete}
            onBack={() => setCurrentStep('menu')}
            existingData={timetableData}
          />
        )}
        
        {currentStep === 'semester' && (
          <SemesterSetup 
            onComplete={handleSemesterComplete}
            onBack={() => setCurrentStep('menu')}
            existingData={semesterData}
          />
        )}
        
        {currentStep === 'dashboard' && timetableData && semesterData && (
          <Dashboard 
            timetableData={timetableData}
            semesterData={semesterData}
            onReset={resetData}
            onEdit={() => setCurrentStep('menu')}
          />
        )}
        
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

function MenuSelection({ 
  onSelectTimetable, 
  onSelectSemester, 
  hasExistingData, 
  onGoToDashboard,
  onBack
}: {
  onSelectTimetable: () => void;
  onSelectSemester: () => void;
  hasExistingData: boolean;
  onGoToDashboard: () => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/50 flex items-center justify-center p-4">
      {/* Theme Toggle and Back Button */}
      <div className="absolute top-6 right-6 z-10 flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Setup Your Tracker</h1>
          <p className="text-muted-foreground">Configure your timetable and semester details</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={onSelectTimetable}
            className="w-full p-6 card-enhanced hover-lift text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-all duration-200">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Enter Timetable</h3>
                <p className="text-sm text-muted-foreground">Set up your weekly class schedule</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={onSelectSemester}
            className="w-full p-6 card-enhanced hover-lift text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-all duration-200">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Semester Details</h3>
                <p className="text-sm text-muted-foreground">Configure semester dates and courses</p>
              </div>
            </div>
          </button>
          
          {hasExistingData && (
            <button
              onClick={onGoToDashboard}
              className="w-full p-6 btn-primary rounded-lg transition-all duration-200 text-left group hover-lift"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold">Go to Dashboard</h3>
                  <p className="text-sm opacity-80">Continue tracking your attendance</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}