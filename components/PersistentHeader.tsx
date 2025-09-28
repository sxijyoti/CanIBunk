'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface PersistentHeaderProps {
  currentStep: string;
  onNavigate: (step: 'landing' | 'menu' | 'timetable' | 'semester' | 'dashboard') => void;
  onBack?: () => void;
  showBack?: boolean;
}

export default function PersistentHeader({ 
  currentStep, 
  onNavigate, 
  onBack, 
  showBack = false 
}: PersistentHeaderProps) {
  const getStepLabel = (step: string) => {
    switch (step) {
      case 'landing': return 'Home';
      case 'menu': return 'Setup';
      case 'timetable': return 'Timetable';
      case 'semester': return 'Semester';
      case 'dashboard': return 'Dashboard';
      default: return 'Home';
    }
  };

  const getBreadcrumbs = () => {
    const paths = [];
    
    // Always start with Home
    paths.push({ step: 'landing', label: 'Home' });
    
    if (currentStep !== 'landing') {
      if (currentStep === 'menu') {
        paths.push({ step: 'menu', label: 'Setup' });
      } else if (currentStep === 'timetable' || currentStep === 'semester') {
        paths.push({ step: 'menu', label: 'Setup' });
        paths.push({ step: currentStep, label: getStepLabel(currentStep) });
      } else if (currentStep === 'dashboard') {
        paths.push({ step: 'menu', label: 'Setup' });
        paths.push({ step: 'dashboard', label: 'Dashboard' });
      }
    }
    
    return paths;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <button 
            className="font-bold text-xl cursor-pointer hover:text-primary transition-colors"
            onClick={() => onNavigate('landing')}
          >
            CanIBunk
          </button>
        </div>
        
        {/* Breadcrumb Navigation - Centered */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.step} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
              <button
                onClick={() => onNavigate(breadcrumb.step as 'landing' | 'menu' | 'timetable' | 'semester' | 'dashboard')}
                className={`px-2 py-1 rounded-md hover:text-foreground hover:bg-muted/50 transition-all ${
                  breadcrumb.step === currentStep ? 'text-foreground font-medium bg-muted' : ''
                }`}
              >
                {breadcrumb.label}
              </button>
            </div>
          ))}
        </nav>
        
        {/* Back Button */}
        <div className="flex items-center">
          {showBack && onBack ? (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <div className="w-16"></div> // Placeholder for balance
          )}
        </div>
      </div>
    </header>
  );
}
