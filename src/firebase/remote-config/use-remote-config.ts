
'use client';
import { useState, useEffect } from 'react';
import { useRemoteConfig as useFirebaseRemoteConfig } from '@/firebase/provider';
import { fetchAndActivate, getValue, Value } from 'firebase/remote-config';

/**
 * Hook to get a specific value from Firebase Remote Config.
 * It handles fetching, activating, and providing the config value.
 *
 * @param key The key for the Remote Config value you want to retrieve.
 * @returns An object containing the value, loading state, and any error.
 */
export function useRemoteConfigValue(key: string) {
  const remoteConfig = useFirebaseRemoteConfig();
  const [value, setValue] = useState<Value | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!remoteConfig) {
      setLoading(false);
      setError(new Error("Remote Config is not initialized."));
      return;
    }

    const fetchConfig = async () => {
      try {
        setLoading(true);
        // Set minimum fetch interval for development.
        // In production, you'll want a higher value to avoid throttling.
        remoteConfig.settings.minimumFetchIntervalMillis = process.env.NODE_ENV === 'development' ? 10000 : 3600000;
        
        // Set default value
        remoteConfig.defaultConfig = {
            ...remoteConfig.defaultConfig,
            [key]: "Organize your life, achieve your goals."
        };

        // Fetch and activate the latest config
        await fetchAndActivate(remoteConfig);
        
        // Get the value for the specific key
        const fetchedValue = getValue(remoteConfig, key);
        setValue(fetchedValue);
      } catch (err) {
        console.error("Error fetching remote config:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [remoteConfig, key]);

  return { value, loading, error };
}
