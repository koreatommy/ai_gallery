'use client';

import { useState } from 'react';
import { Menu, X, Upload, Search, Image as ImageIcon, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResponsiveNavigationProps {
  currentView: 'gallery' | 'upload' | 'favorites' | 'search';
  onViewChange: (view: 'gallery' | 'upload' | 'favorites' | 'search') => void;
}

export default function ResponsiveNavigation({
  currentView,
  onViewChange
}: ResponsiveNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'gallery', label: '갤러리', icon: ImageIcon },
    { id: 'upload', label: '업로드', icon: Upload },
    { id: 'search', label: '검색', icon: Search },
    { id: 'favorites', label: '좋아요', icon: Heart },
  ] as const;

  const handleViewChange = (view: typeof currentView) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="nav-desktop bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="responsive-px py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <ImageIcon className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-gray-900">AI Gallery</h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={currentView === id ? 'default' : 'ghost'}
                  onClick={() => handleViewChange(id as typeof currentView)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Header */}
      <nav className="md:hidden bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 safe-area-inset-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold text-gray-900">AI Gallery</h1>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="touch-target"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="nav-mobile bg-white border-t border-gray-200">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={currentView === id ? 'default' : 'ghost'}
                onClick={() => handleViewChange(id as typeof currentView)}
                className={cn(
                  'w-full justify-start touch-target',
                  currentView === id && 'bg-primary text-primary-foreground'
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                {label}
              </Button>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom Navigation for Mobile (Alternative) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              onClick={() => handleViewChange(id as typeof currentView)}
              className={cn(
                'flex flex-col items-center gap-1 h-12 p-1 touch-target',
                currentView === id && 'text-primary bg-primary/10'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}