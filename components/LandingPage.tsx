'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/50 relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Title */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary to-primary/90 bg-clip-text text-transparent animate-fade-in-up">
              CanIBunk?
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 mx-auto rounded-full" />
          </div>
          
          {/* Catchphrase */}
          <div className="space-y-6">
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The smart way to track your attendance and make informed decisions about skipping classes
            </p>
            <p className="text-lg text-muted-foreground/80 max-w-xl mx-auto">
              Never wonder "Will my attendance drop too much?" again
            </p>
          </div>
          
          {/* Features */}
          {/* CTA Button */}
          <div className="pt-8">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="text-lg px-8 py-6 btn-primary shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 animate-pulse-primary"
            >
              Get Started
              <span className="ml-2">→</span>
            </Button>
          </div>
          
          {/* Bottom tagline */}
          <p className="text-sm text-muted-foreground/60 pt-8">
            Built for students, by students
          </p>
        </div>
      </div>
    </div>
  );
}