// The only file that reads import.meta.env. Everything else imports from here.
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseImageMode: import.meta.env.VITE_SUPABASE_IMAGE_MODE,
  isDev: import.meta.env.DEV,
};
