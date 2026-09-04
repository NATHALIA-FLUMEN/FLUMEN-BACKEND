import { getSupabaseAdmin } from '../config/supabase.js';

const TABLE = 'profiles';

export const UserModel = {
  async findByEmail(email) {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByGoogleId(googleId) {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .select('*')
      .eq('google_id', googleId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create({ email, name, role = 'client', passwordHash = null, googleId = null, avatarUrl = null }) {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .insert({
        email: email.toLowerCase().trim(),
        name,
        role,
        password_hash: passwordHash,
        google_id: googleId,
        avatar_url: avatarUrl
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findAll({ search, role } = {}) {
    let query = getSupabaseAdmin()
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await getSupabaseAdmin().from(TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  toSafeUser(user) {
    if (!user) return user;
    const { password_hash, ...safe } = user;
    return safe;
  }
};
