import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

// Start still until the OS preference has resolved. Never animate in background.
export default function useAmbientMotion() {
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const preference = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      preferenceChanged = true;
      setReduced(value);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted && !preferenceChanged) setReduced(value);
    }).catch(() => {});
    const app = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => { mounted = false; preference.remove(); app.remove(); };
  }, []);
  return active && !reduced;
}
