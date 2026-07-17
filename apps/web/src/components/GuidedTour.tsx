'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import Button from '@/components/ui/Button';

const TOUR_STEPS = [
  {
    target: 'nav-dashboard',
    title: 'Dashboard',
    content: 'Your daily overview. See your stats, streak, and start today’s workout directly from here.',
  },
  {
    target: 'nav-plans',
    title: 'Training Plans',
    content: 'Browse our catalog of expert-designed plans and find the perfect program for your goals.',
  },
  {
    target: 'nav-progress',
    title: 'Track Progress',
    content: 'Watch yourself grow. We track your volume, adherence, and personal records automatically.',
  },
  {
    target: 'nav-library',
    title: 'Exercise Library',
    content: 'Explore 300+ exercises with high-quality video tutorials and form cues.',
  },
  {
    target: 'nav-feedback',
    title: 'Feedback',
    content: 'Found a bug or have an idea? Let us know using the feedback button at the top right!',
  },
];

export function GuidedTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Only show if not seen before
    const hasSeen = localStorage.getItem('hasSeenTour');
    if (!hasSeen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    const targetEl = document.querySelector(`[data-tour="${step.target}"]`);
    
    if (targetEl) {
      setTargetRect(targetEl.getBoundingClientRect());
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // If target not found (e.g. mobile view differences), just show in center
      setTargetRect(null);
    }

    const handleResize = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) setTargetRect(el.getBoundingClientRect());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep, isVisible]);

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const completeTour = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setIsVisible(false);
  };

  const nextStep = () => {
    if (isLast) {
      completeTour();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Calculate tooltip position (right of the target if sidebar, or bottom if top nav)
  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        position: 'fixed',
        top: Math.max(20, Math.min(targetRect.top, window.innerHeight - 200)),
        left: targetRect.right + 20 > window.innerWidth - 300 ? 20 : targetRect.right + 20, // Fallback if too far right
        zIndex: 1000,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
      };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] transition-opacity duration-300" 
        onClick={completeTour}
      />
      
      {/* Spotlight cutout approximation via border/box-shadow on the target could be complex, 
          so we use a simple glowing ring over the target */}
      {targetRect && (
        <div 
          className="fixed z-[999] pointer-events-none rounded-xl border-2 border-brand-orange shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] animate-pulse"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)',
          }}
        />
      )}

      {/* Tooltip Card */}
      <div 
        className="bg-bg-surface border border-white/10 p-5 rounded-2xl shadow-2xl w-[320px] max-w-[90vw]"
        style={tooltipStyle}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </span>
          <button onClick={completeTour} className="text-text-secondary hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <h3 className="text-lg font-bold mb-2">{step.title}</h3>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
          {step.content}
        </p>

        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? 'bg-brand-orange' : 'bg-white/20'}`} 
              />
            ))}
          </div>
          <Button onClick={nextStep} className="py-2 px-4 h-auto text-sm">
            {isLast ? (
              <>Done <Check className="w-4 h-4 ml-1" /></>
            ) : (
              <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
