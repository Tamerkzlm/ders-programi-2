// frontend/src/services/supabaseClient.js
// 🛡️ Sıfır Harici Bağımlılıklı (Zero-Dependency) Native Fetch Supabase Auth & PostgREST İstemcisi
// Hem yerel çevrimdışı modda hem de Netlify/Vercel bulut dağıtımında ek paket kurulumu gerektirmeden çalışır.

const DEFAULT_SUPABASE_URL = 'https://xjwgqqjlblvliljurozc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_97Kb-DZXLI5GCmdK7o3Eww_ZCG9Jc3d';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, '');
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();
const AUTH_STORAGE_KEY = 'okul_planlama_supabase_auth_v1';

const isValidSupabaseUrl = (url) => {
  if (!url || url.includes('YOUR_') || url.includes('example')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(rawUrl) && rawAnonKey && rawAnonKey.length > 20 && !rawAnonKey.includes('YOUR_')
);

// 🔔 Auth State Abonelik Yönetimi
type AuthListener = (event: string, session: any) => void;
const authListeners = new Set<AuthListener>();
const notifyAuthListeners = (event: string, session: any) => {
  authListeners.forEach((cb) => {
    try {
      cb(event, session);
    } catch (e) {
      console.error('[SupabaseAuth] Listener hatası:', e);
    }
  });
};

const readStoredSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.access_token || !parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeStoredSession = (session) => {
  try {
    if (!session) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      const expiresAt = session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...session, expires_at: expiresAt }));
    }
  } catch {
    // ignore storage quota errors
  }
};

// Geçerli erişim jetonunu getir (Süresi dolmuşsa refresh_token ile yenile)
const getValidAccessToken = async () => {
  const session = readStoredSession();
  if (!session) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at - nowSec < 60 && session.refresh_token) {
    try {
      const res = await fetch(`${rawUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          apikey: rawAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      if (res.ok) {
        const refreshed = await res.json();
        writeStoredSession(refreshed);
        notifyAuthListeners('TOKEN_REFRESHED', refreshed);
        return refreshed.access_token;
      } else {
        writeStoredSession(null);
        notifyAuthListeners('SIGNED_OUT', null);
        return null;
      }
    } catch {
      return session.access_token;
    }
  }

  return session.access_token;
};

const buildHeaders = async (extraHeaders: Record<string, string> = {}) => {
  const token = await getValidAccessToken();
  const headers: Record<string, string> = {
    apikey: rawAnonKey,
    'Content-Type': 'application/json',
    'x-application-name': 'okul-planlama-platformu',
    ...extraHeaders,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (rawAnonKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${rawAnonKey}`;
  }
  return headers;
};

const createNativeSupabaseClient = () => {
  const auth = {
    getSession: async () => {
      const session = readStoredSession();
      if (!session) return { data: { session: null }, error: null };
      await getValidAccessToken();
      return { data: { session: readStoredSession() }, error: null };
    },

    signInWithPassword: async ({ email, password }) => {
      try {
        const res = await fetch(`${rawUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            apikey: rawAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            data: { user: null, session: null },
            error: new Error(body.error_description || body.msg || body.message || 'Giriş yapılamadı.'),
          };
        }
        writeStoredSession(body);
        notifyAuthListeners('SIGNED_IN', body);
        return { data: { user: body.user, session: body }, error: null };
      } catch (err) {
        return { data: { user: null, session: null }, error: err };
      }
    },

    signUp: async ({ email, password, options }) => {
      try {
        const res = await fetch(`${rawUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            apikey: rawAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            data: options?.data || {},
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            data: { user: null, session: null },
            error: new Error(body.error_description || body.msg || body.message || 'Kayıt oluşturulamadı.'),
          };
        }
        // Otomatik onay açıksa doğrudan session döner
        if (body.access_token && body.user) {
          writeStoredSession(body);
          notifyAuthListeners('SIGNED_IN', body);
          return { data: { user: body.user, session: body }, error: null };
        }
        const userObj = body.user || (body.id ? body : null);
        return { data: { user: userObj, session: null }, error: null };
      } catch (err) {
        return { data: { user: null, session: null }, error: err };
      }
    },

    signOut: async () => {
      const token = await getValidAccessToken();
      writeStoredSession(null);
      notifyAuthListeners('SIGNED_OUT', null);
      if (token) {
        fetch(`${rawUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            apikey: rawAnonKey,
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
      return { error: null };
    },

    onAuthStateChange: (callback) => {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => authListeners.delete(callback),
          },
        },
      };
    },
  };

  const from = (table) => ({
    select: (columns = '*') => {
      const filters = [];
      const builder = {
        eq: (col, val) => {
          filters.push(`${encodeURIComponent(col)}=eq.${encodeURIComponent(val)}`);
          return builder;
        },
        maybeSingle: async () => {
          try {
            const headers = await buildHeaders();
            const qs = [`select=${encodeURIComponent(columns)}`, ...filters, 'limit=1'].join('&');
            const res = await fetch(`${rawUrl}/rest/v1/${table}?${qs}`, {
              method: 'GET',
              headers,
            });
            const body = await res.json().catch(() => []);
            if (!res.ok) {
              return { data: null, error: new Error(body.message || body.details || 'Sorgu hatası') };
            }
            const row = Array.isArray(body) ? body[0] || null : body;
            return { data: row, error: null };
          } catch (err) {
            return { data: null, error: err };
          }
        },
      };
      return builder;
    },

    upsert: (payload: any, { onConflict }: { onConflict?: string } = {}) => ({
      select: (columns = '*') => ({
        single: async () => {
          try {
            const headers = await buildHeaders({
              Prefer: 'resolution=merge-duplicates,return=representation',
            });
            const qsParts = [`select=${encodeURIComponent(columns)}`];
            if (onConflict) qsParts.push(`on_conflict=${encodeURIComponent(onConflict)}`);
            const res = await fetch(`${rawUrl}/rest/v1/${table}?${qsParts.join('&')}`, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
              return { data: null, error: new Error(body.message || body.details || 'Kayıt güncellenemedi') };
            }
            const row = Array.isArray(body) ? body[0] || null : body;
            return { data: row, error: null };
          } catch (err) {
            return { data: null, error: err };
          }
        },
      }),
    }),
  });

  const rpc = async (fnName, params = {}) => {
    try {
      const headers = await buildHeaders();
      const res = await fetch(`${rawUrl}/rest/v1/rpc/${encodeURIComponent(fnName)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        return { data: null, error: new Error(body?.message || body?.details || 'RPC çağrısı başarısız') };
      }
      return { data: body, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  return { auth, from, rpc };
};

export const supabase = isSupabaseConfigured ? createNativeSupabaseClient() : null;

// 🛡️ Render Cold-Start Önleyici Arka Plan Uyandırıcı (Pre-Warm) & Yerel Motor Kontrolü
const DEFAULT_API_URL = import.meta.env.PROD ? 'https://ders-programi-api.onrender.com' : 'http://127.0.0.1:8000';
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
let lastWarmPingAt = 0;

export const preWarmSolverBackend = async () => {
  const now = Date.now();
  // 4 dakikada birden sık ping atma
  if (now - lastWarmPingAt < 4 * 60 * 1000) return;
  lastWarmPingAt = now;

  // Önce yerel tam güç motoru (127.0.0.1:8000) açık mı kontrol et; açıksa Render'ı uyandırmaya gerek yok
  try {
    const localCtrl = new AbortController();
    const localTimer = setTimeout(() => localCtrl.abort(), 800);
    const localRes = await fetch('http://127.0.0.1:8000/health', {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: localCtrl.signal,
    });
    clearTimeout(localTimer);
    if (localRes.ok) return;
  } catch {
    // Yerel motor kapalı, bulutu uyandır
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    await fetch(`${API_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // Render uyanıyor olabilir, sessizce yut (UI bloklanmaz)
  }
};
