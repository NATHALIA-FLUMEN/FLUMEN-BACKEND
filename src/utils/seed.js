import { getDB, commit } from '../data/store.js';

const defaultVideos = [
  {
    title: 'El Amanecer del Día',
    description: 'Un documental visual impresionante sobre los amaneceres más hermosos del planeta. Experiencia audiovisual inmersiva con imágenes en 4K.',
    thumbnailUrl: 'https://picsum.photos/seed/amanecer/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 62,
    category: 'Documental',
    tags: ['naturaleza', '4k', 'relajante'],
    price: 0,
    rating: 4.8,
    views: 12840,
    featured: true,
    isPublished: true,
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    title: 'Danza Moderna Vol. 1',
    description: 'Coreografías urbanas y contemporáneas filmadas en escenarios únicos. Perfecto para amantes del baile y la expresión corporal.',
    thumbnailUrl: 'https://picsum.photos/seed/danza/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 85,
    category: 'Entretenimiento',
    tags: ['danza', 'baile', 'música'],
    price: 4.99,
    rating: 4.5,
    views: 8420,
    featured: true,
    isPublished: true,
    createdAt: '2026-02-03T10:00:00Z'
  },
  {
    title: 'Recetas de Flumen: Pastas',
    description: 'Curso de cocina profesional con 10 recetas de pastas italianas auténticas. Enseñan secretos de chefs reconocidos.',
    thumbnailUrl: 'https://picsum.photos/seed/pasta/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 345,
    category: 'Cocina',
    tags: ['gastronomía', 'italiana', 'curso'],
    price: 9.99,
    rating: 4.9,
    views: 15430,
    featured: true,
    isPublished: true,
    createdAt: '2026-02-20T10:00:00Z'
  },
  {
    title: 'Tour Virtual: Tokio Nocturno',
    description: 'Recorrido guiado por las calles más icónicas de Tokio de noche. Descubre la ciudad desde una perspectiva única.',
    thumbnailUrl: 'https://picsum.photos/seed/tokio/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 120,
    category: 'Viajes',
    tags: ['japón', 'tokio', 'viajes'],
    price: 0,
    rating: 4.7,
    views: 9875,
    featured: false,
    isPublished: true,
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    title: 'Fitness en Casa: Nivel Inicial',
    description: 'Programa de ejercicios de 30 minutos por día para mantenerse en forma sin salir de casa. Con rutinas guiadas.',
    thumbnailUrl: 'https://picsum.photos/seed/fitness/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 180,
    category: 'Deportes',
    tags: ['fitness', 'salud', 'ejercicio'],
    price: 6.99,
    rating: 4.6,
    views: 11200,
    featured: false,
    isPublished: true,
    createdAt: '2026-03-14T10:00:00Z'
  },
  {
    title: 'Música Ambiental para Estudiar',
    description: 'Colección de pistas ambientales y lo-fi para concentración, estudio y meditación. Sin interrupciones.',
    thumbnailUrl: 'https://picsum.photos/seed/musica/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 3600,
    category: 'Música',
    tags: ['lo-fi', 'estudio', 'relajación'],
    price: 0,
    rating: 4.4,
    views: 45670,
    featured: false,
    isPublished: true,
    createdAt: '2026-04-02T10:00:00Z'
  },
  {
    title: 'Masterclass de Fotografía: Retrato',
    description: 'Aprende a tomar retratos profesionales con luz natural y artificial. Incluye edición con Lightroom.',
    thumbnailUrl: 'https://picsum.photos/seed/foto/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 420,
    category: 'Educación',
    tags: ['fotografía', 'retrato', 'curso'],
    price: 12.99,
    rating: 5.0,
    views: 6890,
    featured: true,
    isPublished: true,
    createdAt: '2026-04-18T10:00:00Z'
  },
  {
    title: 'Mindfulness y Meditación Guiada',
    description: 'Sesiones de meditación guiada para reducir el estrés y mejorar tu bienestar mental. Ideal para principiantes.',
    thumbnailUrl: 'https://picsum.photos/seed/meditacion/640/360',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 45,
    category: 'Salud',
    tags: ['meditación', 'bienestar', 'relajación'],
    price: 0,
    rating: 4.9,
    views: 23890,
    featured: false,
    isPublished: true,
    createdAt: '2026-05-05T10:00:00Z'
  }
];

const defaultSettings = {
  siteName: 'Flumen',
  tagline: 'Premium Videos',
  heroTitle: 'Flumen Originals',
  heroSubtitle: 'Experiencia visual en 4K Ultra HD',
  heroDescription: 'Descubre contenido exclusivo, documentales y series premium solo para suscriptores de Flumen.',
  heroButton: 'Reproducir ahora',
  heroButtonSecondary: 'Más información',
  footerText: 'Tu plataforma de referencia para contenido de video de alta calidad.',
  accentColor: '#00e5ff',
  fontsTitle: 'Poppins',
  fontsBody: 'Inter',
  supportEmail: 'soporte@flumen.com',
  enableRegistration: true,
  enablePayments: true,
  maintenanceMode: false
};

export function runSeed() {
  const db = getDB();

  if (!db.seedInitialized) {
    const now = new Date().toISOString();
    db.videos = defaultVideos.map((v, i) => ({ ...v, id: i + 1, createdAt: v.createdAt || now }));
    db.settings = { ...defaultSettings };
    db.seedInitialized = true;
    commit();
    console.log('✅ Base de datos sembrada con videos y configuración por defecto');
  } else {
    console.log('ℹ️  Base de datos ya inicializada, no se re-sembró');
  }
}
