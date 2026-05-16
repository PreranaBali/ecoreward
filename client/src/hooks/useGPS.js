/**
 * useGPS – Custom hook for browser geolocation.
 * Returns { coords, loading, error, fetch }
 */

import { useState, useCallback } from 'react';

export function useGPS() {
  const [coords,  setCoords]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Could not fetch location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, []);

  return { coords, loading, error, fetchLocation };
}
