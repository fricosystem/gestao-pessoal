'use client';

import { useEffect } from 'react';

/**
 * Prevents pull-to-refresh and overscroll bounce on mobile,
 * making the PWA feel like a native Android app.
 */
export default function NativeAppGuard() {
  useEffect(() => {
    // Block pull-to-refresh by preventing overscroll
    // Only block when at the top of the page and pulling down
    let touchStartY = 0;
    let isPreventing = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      isPreventing = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const scrollY = window.scrollY;
      const diff = touchY - touchStartY;

      // If at the top of the page and pulling down → block
      if (scrollY === 0 && diff > 0) {
        isPreventing = true;
        e.preventDefault();
      } else if (isPreventing && diff > 0) {
        // Still pulling down from top
        e.preventDefault();
      } else {
        isPreventing = false;
      }
    };

    const handleTouchEnd = () => {
      isPreventing = false;
    };

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    const handleTouchEndNoZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchend', handleTouchEndNoZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchend', handleTouchEndNoZoom);
    };
  }, []);

  return null;
}
