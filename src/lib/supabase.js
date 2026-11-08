import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    realtime: {
      // Send the connection heartbeat from a background worker so the browser
      // can't throttle it when the tab isn't focused (this caused random disconnects).
      worker: true,
      heartbeatIntervalMs: 15000,
    },
  }
);