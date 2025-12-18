export const SCHEMA_QUERIES = [
    // Tabela de Usuários
    `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de Vídeos/Fotos
    `CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail TEXT,
        user_id INTEGER REFERENCES users(id),
        category TEXT,
        type TEXT DEFAULT 'video',
        is_secret BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de Comentários
    `CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de Curtidas
    `CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(video_id, user_id)
    )`,

    // Tabela de Visualizações
    `CREATE TABLE IF NOT EXISTS views (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
        views INTEGER DEFAULT 0,
        UNIQUE(video_id)
    )`,

    // Tabela de Notificações
    `CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        type TEXT,
        related_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de Mensagens/Chat
    `CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        from_id INTEGER REFERENCES users(id),
        to_id INTEGER REFERENCES users(id),
        msg TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de Suporte
    `CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username TEXT,
        reason TEXT,
        message TEXT,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de Logs de Auditoria
    `CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action TEXT NOT NULL,
        details JSONB,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Índices
    "CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id)",
    "CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_messages_from_to ON messages(from_id, to_id)",
    "CREATE INDEX IF NOT EXISTS idx_likes_video_user ON likes(video_id, user_id)",
    "CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)"
];
