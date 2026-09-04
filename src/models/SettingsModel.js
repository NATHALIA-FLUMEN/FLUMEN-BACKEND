import { getSupabaseAdmin } from '../config/supabase.js';

const TABLE = 'settings';

const DEFAULT_SETTINGS = {
  siteName: 'Flumen',
  tagline: 'Premium Videos',
  heroTitle: 'Flumen Originals',
  heroSubtitle: 'Experiencia visual en 4K Ultra HD',
  heroDescription: 'Descubre contenido exclusivo, documentales y series premium solo para suscriptores de Flumen.',
  heroButton: 'Reproducir ahora',
  heroButtonSecondary: 'Más información',
  footerText: 'Tu plataforma de referencia para contenido de video de alta calidad.',
  accentColor: '#00e5ff',
  supportEmail: 'soporte@flumen.com',
  enableRegistration: 'true',
  enablePayments: 'true',
  maintenanceMode: 'false'
};

export const SettingsModel = {
  async getAll() {
    const { data, error } = await getSupabaseAdmin().from(TABLE).select('key, value, id');
    if (error) {
      console.error('Error leyendo settings:', error.message);
      return { ...DEFAULT_SETTINGS };
    }
    const settings = { ...DEFAULT_SETTINGS };
    for (const row of data || []) {
      settings[row.key] = row.value;
    }
    return settings;
  },

  async getPublic() {
    const all = await this.getAll();
    const { DATA } = all;
    return {
      siteName: all.siteName,
      tagline: all.tagline,
      heroTitle: all.heroTitle,
      heroSubtitle: all.heroSubtitle,
      heroDescription: all.heroDescription,
      heroButton: all.heroButton,
      heroButtonSecondary: all.heroButtonSecondary,
      footerText: all.footerText,
      accentColor: all.accentColor,
      supportEmail: all.supportEmail,
      maintenanceMode: all.maintenanceMode === 'true'
    };
  },

  async updateMany(updates) {
    const allowed = Object.keys(DEFAULT_SETTINGS);
    let updated = 0;
    for (const [key, value] of Object.entries(updates)) {
      if (!allowed.includes(key)) continue;
      const valueStr = String(value);
      const { error } = await getSupabaseAdmin()
        .from(TABLE)
        .upsert({ key, value: valueStr, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) {
        console.error('Error actualizando setting', key, error.message);
        continue;
      }
      updated++;
    }
    return updated;
  },

  getDefaults() {
    return { ...DEFAULT_SETTINGS };
  }
};
