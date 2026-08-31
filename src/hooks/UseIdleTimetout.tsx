'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const IDLE_TIMEOUT_MS = 45 * 60 * 1000; // waktu timeout dalam menit
const WARNING_BEFORE_MS = 60 * 1000; // warning sebelum timeout

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

export function UseIdleTimeout({
  onWarning,
  onTimeout,
}: {
  onWarning?: () => void;
  onTimeout?: () => void;
} = {}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Beri warning sebelum logout
    if (onWarning) {
      warningRef.current = setTimeout(() => {
        onWarning();
      }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);
    }

    timeoutRef.current = setTimeout(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.auth.signOut();
      onTimeout?.();
      // Redirect ke halaman login
      window.location.href = '/masuk?reason=idle_timeout';
    }, IDLE_TIMEOUT_MS);
  }, [onWarning, onTimeout]);

  useEffect(() => {
    resetTimer();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [resetTimer]);
}