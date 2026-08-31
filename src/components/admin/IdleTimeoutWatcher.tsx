'use client';
 
import { UseIdleTimeout } from '@/hooks/UseIdleTimetout';
 
export default function IdleTimeoutWatcher() {
  UseIdleTimeout({
    onWarning: () => {
      // opsional: toast/modal "Sesi akan berakhir dalam 1 menit"
    },
  });
 
  return null;
}
 