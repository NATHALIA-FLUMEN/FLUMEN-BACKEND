import { getSupabaseAdmin } from '../config/supabase.js';

const TABLE = 'orders';

export const OrderModel = {
  async create({ userId, videoId, amount, status = 'completed', paymentMethod = 'card' }) {
    const { data: existing, error: checkError } = await getSupabaseAdmin()
      .from(TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle();
    if (checkError) throw checkError;
    if (existing) {
      return { ...existing, duplicate: true };
    }

    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .insert({
        user_id: userId,
        video_id: videoId,
        amount,
        status,
        payment_method: paymentMethod
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findByUser(userId) {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .select('*, videos(title, price, thumbnail_path)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async findAll() {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .select('*, profiles(name, email), videos(title, price)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async hasAccess(userId, videoId) {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },

  async stats() {
    const { data, error } = await getSupabaseAdmin().from(TABLE).select('amount, status');
    if (error) throw error;
    const orders = data || [];
    const total = orders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const completed = orders.filter((o) => o.status === 'completed');
    return {
      totalOrders: orders.length,
      completedOrders: completed.length,
      totalRevenue: completed.reduce((s, o) => s + Number(o.amount || 0), 0)
    };
  }
};
