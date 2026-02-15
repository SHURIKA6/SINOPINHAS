import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Newspaper, Calendar, MapPin, Cloud, ChevronRight, Star } from 'lucide-react';
import EmptyState from './common/EmptyState';
import ErrorState from './common/ErrorState';

/**
 * ExploreSection — Tela unificada "Explorar" que agrega:
 * Notícias, Eventos, Lugares, Clima — em uma visão resumida com cards
 */
export default function ExploreSection({
    news = [],
    events = [],
    places = [],
    weather = null,
    onOpenTab,
    loading = false,
    error = null,
    onRetry,
}) {
    const [searchQuery, setSearchQuery] = useState('');

    // Skeleton loader genérico
    const SkeletonCard = () => (
        <div style={{
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '14px',
            padding: '16px',
            animation: 'pulse 1.5s ease-in-out infinite',
        }}>
            <div style={{ width: '60%', height: '14px', background: 'rgba(0,0,0,0.08)', borderRadius: '6px', marginBottom: '8px' }} />
            <div style={{ width: '90%', height: '11px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }} />
        </div>
    );

    if (error) {
        return <ErrorState message={error} onRetry={onRetry} />;
    }

    const filteredNews = news.filter(n =>
        n.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 4);

    const filteredEvents = events.filter(e =>
        e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3);

    const filteredPlaces = places.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 4);

    return (
        <div style={{ padding: '4px 8px 80px' }}>
            {/* Barra de busca */}
            <div style={{
                position: 'relative',
                marginBottom: '16px',
            }}>
                <Search
                    size={18}
                    color="#999"
                    style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }}
                />
                <input
                    type="text"
                    placeholder="Buscar em tudo..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 12px 12px 42px',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(10px)',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                />
            </div>

            {/* Card de Clima */}
            {weather && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(77, 166, 255, 0.15) 0%, rgba(0, 198, 255, 0.1) 100%)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        marginBottom: '16px',
                        border: '1px solid rgba(77, 166, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                    }}
                    onClick={() => onOpenTab?.('weather')}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Cloud size={16} color="#4DA6FF" />
                            <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Clima em Sinop</span>
                        </div>
                        <span style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            color: '#1a1a2e',
                        }}>
                            {weather.temp || '—'}°C
                        </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#555', textTransform: 'capitalize' }}>
                            {weather.description || 'Carregando...'}
                        </p>
                        <ChevronRight size={16} color="#999" style={{ marginTop: '4px' }} />
                    </div>
                </motion.div>
            )}

            {/* Seção: Notícias */}
            <SectionHeader
                icon={<Newspaper size={16} />}
                title="Notícias"
                onSeeAll={() => onOpenTab?.('news')}
            />
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    <SkeletonCard /><SkeletonCard />
                </div>
            ) : filteredNews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {filteredNews.map((item, i) => (
                        <motion.a
                            key={i}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '12px 14px',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                            }}
                        >
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt=""
                                    style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '10px',
                                        objectFit: 'cover',
                                        flexShrink: 0,
                                    }}
                                    onError={e => e.target.style.display = 'none'}
                                />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{
                                    margin: 0,
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#1a1a2e',
                                    lineHeight: 1.3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                }}>
                                    {item.title}
                                </h4>
                                <span style={{ fontSize: '11px', color: '#999' }}>
                                    {item.date || ''}
                                </span>
                            </div>
                        </motion.a>
                    ))}
                </div>
            ) : (
                <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginBottom: '20px' }}>
                    Nenhuma notícia encontrada
                </p>
            )}

            {/* Seção: Eventos */}
            <SectionHeader
                icon={<Calendar size={16} />}
                title="Eventos"
                onSeeAll={() => onOpenTab?.('events')}
            />
            {loading ? (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }}>
                    <SkeletonCard /><SkeletonCard />
                </div>
            ) : filteredEvents.length > 0 ? (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px' }}>
                    {filteredEvents.map((event, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            style={{
                                minWidth: '200px',
                                background: 'rgba(255,255,255,0.8)',
                                borderRadius: '14px',
                                padding: '14px',
                                border: '1px solid rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                flexShrink: 0,
                            }}
                            onClick={() => onOpenTab?.('events')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <Calendar size={14} color="#FF9500" />
                                <span style={{ fontSize: '11px', color: '#FF9500', fontWeight: 600 }}>
                                    {event.date || event.data || ''}
                                </span>
                            </div>
                            <h4 style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#1a1a2e',
                                lineHeight: 1.3,
                            }}>
                                {event.name || event.title || event.nome || ''}
                            </h4>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginBottom: '20px' }}>
                    Nenhum evento encontrado
                </p>
            )}

            {/* Seção: Lugares */}
            <SectionHeader
                icon={<MapPin size={16} />}
                title="Lugares"
                onSeeAll={() => onOpenTab?.('places')}
            />
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    <SkeletonCard /><SkeletonCard />
                </div>
            ) : filteredPlaces.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    {filteredPlaces.map((place, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.06 }}
                            style={{
                                background: 'rgba(255,255,255,0.8)',
                                borderRadius: '14px',
                                padding: '14px',
                                border: '1px solid rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                            }}
                            onClick={() => onOpenTab?.('places')}
                        >
                            <MapPin size={18} color="#34C759" style={{ marginBottom: '6px' }} />
                            <h4 style={{
                                margin: 0,
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#1a1a2e',
                            }}>
                                {place.name || place.nome || ''}
                            </h4>
                            {(place.category || place.categoria) && (
                                <span style={{ fontSize: '11px', color: '#999' }}>
                                    {place.category || place.categoria}
                                </span>
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : (
                <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginBottom: '20px' }}>
                    Nenhum lugar encontrado
                </p>
            )}
        </div>
    );
}

// Sub-componente: Header de seção
function SectionHeader({ icon, title, onSeeAll }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#0047AB' }}>{icon}</span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>{title}</h3>
            </div>
            <button
                onClick={onSeeAll}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    background: 'none',
                    border: 'none',
                    color: '#4DA6FF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                Ver tudo <ChevronRight size={14} />
            </button>
        </div>
    );
}
