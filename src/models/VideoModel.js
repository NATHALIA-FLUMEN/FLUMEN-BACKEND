import { getSupabaseAdmin, publicVideoUrl } from '../config/supabase.js';

const TABLE = 'videos';
const BUCKET = process.env.SUPABASE_BUCKET || 'videos';

export const VideoModel = {
  async findAll({ category, term, free, paid, featured, publishedOnly = true } = {}) {
    let query = getSupabaseAdmin().from(TABLE).select('*').order('created_at', { ascending: false });

    if (publishedOnly) query = query.eq('is_published', true);
    if (category && category !== 'all') query = query.ilike('category', `%${category}%`);
    if (featured === 'true') query = query.eq('featured', true);
    if (free === 'true') query = query.eq('price', 0);
    if (paid === 'true') query = query.gt('price', 0);

    const { data, error } = await query;
    if (error) throw error;

    let result = data || [];
    if (term) {
      const t = term.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(t) ||
          (v.description || '').toLowerCase().includes(t) ||
          (v.tags || []).some((tag) => tag.toLowerCase().includes(t)) ||
          (v.category || '').toLowerCase().includes(t)
      );
    }

    return result.map((v) => this.decorate(v));
  },

  async findFeatured() {
    return this.findAll({ featured: 'true' });
  },

  async findById(id, { publishedOnly = true } = {}) {
    let query = getSupabaseAdmin().from(TABLE).select('*').eq('id', id);
    if (publishedOnly) query = query.eq('is_published', true);
    query = query.maybeSingle();
    const { data, error } = await query;
    if (error) throw error;
    return data ? this.decorate(data) : null;
  },

  async create(videoData) {
    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .insert({
        title: videoData.title,
        description: videoData.description || null,
        thumbnail_path: videoData.thumbnailPath || null,
        video_path: videoData.videoPath || null,
        video_bucket: videoData.videoBucket || null,
        duration: Number(videoData.duration) || 0,
        category: videoData.category || 'General',
        tags: videoData.tags || [],
        price: Number(videoData.price) || 0,
        featured: Boolean(videoData.featured),
        is_published: videoData.isPublished !== false,
        created_by: videoData.createdBy || null,
        rating: videoData.rating || 4.5
      })
      .select()
      .single();
    if (error) throw error;
    return this.decorate(data);
  },

  async update(id, fields) {
    const allowed = [
      'title', 'description', 'thumbnail_path', 'video_path', 'video_bucket', 'duration',
      'category', 'tags', 'price', 'featured', 'is_published', 'rating'
    ];
    const update = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) update[key] = fields[key];
    }
    update.updated_at = new Date().toISOString();

    const { data, error } = await getSupabaseAdmin()
      .from(TABLE)
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.decorate(data);
  },

  async incrementViews(id) {
    const { data: current } = await getSupabaseAdmin()
      .from(TABLE)
      .select('views')
      .eq('id', id)
      .maybeSingle();
    const views = (current?.views || 0) + 1;
    await getSupabaseAdmin().from(TABLE).update({ views }).eq('id', id);
    return views;
  },

  async delete(id) {
    const { error } = await getSupabaseAdmin().from(TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async categories() {
    const { data, error } = await getSupabaseAdmin().from(TABLE).select('category');
    if (error) throw error;
    const map = new Map();
    for (const row of data || []) {
      if (row.category) {
        map.set(row.category, (map.get(row.category) || 0) + 1);
      }
    }
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#22c55e', '#ef4444', '#3b82f6', '#10b981', '#f97316', '#14b8a6'];
    return [...map.entries()].map(([name, count], i) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      color: colors[i % colors.length],
      count
    }));
  },

  decorate(video) {
    const isPaid = Number(video.price) > 0;
    return {
      ...video,
      thumbnail: video.thumbnail_path ? publicVideoUrl(video.thumbnail_path) : null,
      // Los videos gratis exponen URL pública; los premium se sirven SOLO vía URL firmada
      // (bucket privado) para evitar que se filtre el contenido sin compra.
      videoUrl: video.video_path && !isPaid ? publicVideoUrl(video.video_path) : null
    };
  },

  getBucket() {
    return BUCKET;
  }
};
