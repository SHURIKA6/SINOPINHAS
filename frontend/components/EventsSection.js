import { useState, useEffect, useMemo } from 'react';
import { fetchEvents } from '../services/api';
import { useFavorites } from '../hooks/useFavorites';

const MOCK_EVENTS = [
    {
        id: 1,
        title: "Show Nacional em Sinop",
        date: "2025-01-20",
        time: "22:00",
        location: "Centro de Eventos Dante de Oliveira",
        description: "Um show imperdível com os maiores sucessos do momento. Garanta seu ingresso!",
        category: "Música",
        image: "https://images.unsplash.com/photo-1459749411177-042180ce673b?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        title: "Feira de Gastronomia Local",
        date: "2025-01-15",
        time: "18:00",
        location: "Praça da Bíblia",
        description: "Venha saborear o melhor da culinária de Sinop. Entrada gratuita!",
        category: "Gastronomia",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"
    }
];

export default function EventsSection() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { toggleFavorite, isFavorite } = useFavorites();

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const data = await fetchEvents();
                if (data && data.length > 0) {
                    setEvents(data);
                } else {
                    setEvents(MOCK_EVENTS);
                }
            } catch (err) {
                setEvents(MOCK_EVENTS);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        if (!searchQuery.trim()) return events;
        const q = searchQuery.toLowerCase();
        return events.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q)
        );
    }, [events, searchQuery]);

    const handleToggleFavorite = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite('events', item);
        if ('vibrate' in navigator) navigator.vibrate(30);
    };

    return (
        <div style={{ padding: '0px 0px 48px', animation: 'fadeIn 0.5s ease' }}>

            {/* Search Header */}
            <div style={{
                background: 'var(--card-bg)',
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                marginBottom: '40px'
            }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-color)' }}>
                    📅 Agenda Sinop
                </h2>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    <input
                        type="text"
                        placeholder="O que está acontecendo em Sinop?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 20px 14px 45px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            color: 'var(--text-color)',
                            fontSize: '16px',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} style={{ background: 'var(--card-bg)', borderRadius: 24, border: '1px solid var(--border-color)', overflow: 'hidden', height: 420 }}>
                            <div className="skeleton" style={{ height: 220, width: '100%', borderRadius: 0 }} />
                            <div style={{ padding: 24 }}>
                                <div className="skeleton" style={{ height: 24, width: '70%', marginBottom: 12 }} />
                                <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 16 }} />
                                <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 24 }} />
                                <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 12 }} />
                            </div>
                        </div>
                    ))
                ) : filteredEvents.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--secondary-text)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗓️</div>
                        <p>Nenhum evento encontrado para sua busca.</p>
                    </div>
                ) : (
                    filteredEvents.map((event) => (
                        <div key={event.id} style={{ background: 'var(--card-bg)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', position: 'relative' }} className="card-hover">
                            <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                                <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                    onClick={(e) => handleToggleFavorite(e, event)}
                                    style={{
                                        position: 'absolute', top: 16, left: 16,
                                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                        border: 'none', borderRadius: '50%', width: 40, height: 40,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', fontSize: 18, zIndex: 10
                                    }}
                                >
                                    {isFavorite('events', event) ? '⭐' : '☆'}
                                </button>
                                <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255, 255, 255, 0.9)', color: '#1a1a1a', padding: '8px 16px', borderRadius: 12, textAlign: 'center', fontWeight: 800, backdropFilter: 'blur(4px)' }}>
                                    <div style={{ fontSize: 18, lineHeight: 1 }}>{event.date ? event.date.split('-')[2] : '??'}</div>
                                    <div style={{ fontSize: 10, textTransform: 'uppercase' }}>
                                        {event.date ? new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' }) : '...'}
                                    </div>
                                </div>
                                <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'var(--accent-color)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                                    {event.category}
                                </div>
                            </div>
                            <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: 'var(--text-color)' }}>{event.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary-text)', fontSize: 13, marginBottom: 12 }}>
                                    <span>📍 {event.location}</span>
                                    <span>•</span>
                                    <span>🕒 {event.time}</span>
                                </div>
                                <p style={{ margin: 0, color: 'var(--secondary-text)', fontSize: 14, lineHeight: 1.6, flex: 1 }}>{event.description}</p>
                                <button onClick={() => setSelectedEvent(event)} style={{ marginTop: 20, padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', fontWeight: 700, cursor: 'pointer' }}>Ver Detalhes</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedEvent(null)}>
                    <div style={{ background: 'var(--card-bg)', borderRadius: 32, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', color: 'var(--text-color)', border: '1px solid var(--border-color)', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}>✕</button>
                        <div style={{ height: 260, position: 'relative' }}>
                            <img src={selectedEvent.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, var(--card-bg), transparent)' }} />
                        </div>
                        <div style={{ padding: 40, marginTop: -60, position: 'relative' }}>
                            <div style={{ background: 'var(--accent-color)', color: '#fff', padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 800, display: 'inline-block', marginBottom: 16 }}>{selectedEvent.category}</div>
                            <h2 style={{ fontSize: 32, fontWeight: 1000, margin: '0 0 16px' }}>{selectedEvent.title}</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                                <div style={{ background: 'var(--input-bg)', padding: 16, borderRadius: 20, border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: 12, color: 'var(--secondary-text)', fontWeight: 700, marginBottom: 4 }}>Data</div>
                                    <div style={{ fontWeight: 800 }}>{selectedEvent.date} às {selectedEvent.time}</div>
                                </div>
                                <div style={{ background: 'var(--input-bg)', padding: 16, borderRadius: 20, border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: 12, color: 'var(--secondary-text)', fontWeight: 700, marginBottom: 4 }}>Local</div>
                                    <div style={{ fontWeight: 800 }}>{selectedEvent.location}</div>
                                </div>
                            </div>
                            <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.9 }}>{selectedEvent.description}</p>
                            <button onClick={() => setSelectedEvent(null)} style={{ width: '100%', padding: '18px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: 20, fontSize: 18, fontWeight: 800, marginTop: 32 }}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
