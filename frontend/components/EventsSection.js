import { useState, useEffect } from 'react';
import { fetchEvents } from '../services/api';

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
    },
    {
        id: 3,
        title: "Torneio de Beach Tennis",
        date: "2025-01-25",
        time: "08:00",
        location: "Arena Sinop",
        description: "O maior torneio da região. Inscrições abertas para todas as categorias.",
        category: "Esporte",
        image: "https://images.unsplash.com/photo-1626225341354-32934659a9f9?auto=format&fit=crop&w=800&q=80"
    }
];

export default function EventsSection() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

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
                console.error("Failed to fetch events", err);
                setEvents(MOCK_EVENTS);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, []);

    return (
        <div style={{ padding: '20px 0', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h2 style={{
                    fontSize: 32,
                    fontWeight: 1000,
                    marginBottom: 12,
                    background: 'linear-gradient(90deg, #8d6aff, #fe7d45)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textTransform: 'uppercase',
                    letterSpacing: '-1px'
                }}>
                    Eventos em Sinop
                </h2>
                <p style={{ color: 'var(--secondary-text)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
                    Fique por dentro do que acontece na cidade. Shows, feiras, esportes e muito mais.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 24
            }}>
                {events.map((event) => (
                    <div
                        key={event.id}
                        style={{
                            background: 'var(--card-bg)',
                            borderRadius: 24,
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative'
                        }}
                        className="card-hover"
                    >
                        <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                            <img
                                src={event.image}
                                alt={event.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                background: 'rgba(255, 255, 255, 0.9)',
                                color: '#1a1a1a',
                                padding: '8px 16px',
                                borderRadius: 12,
                                textAlign: 'center',
                                fontWeight: 800,
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ fontSize: 18, lineHeight: 1 }}>{event.date.split('-')[2]}</div>
                                <div style={{ fontSize: 10, textTransform: 'uppercase' }}>
                                    {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}
                                </div>
                            </div>
                            <div style={{
                                position: 'absolute',
                                bottom: 12,
                                left: 12,
                                background: 'var(--accent-color)',
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: 99,
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase'
                            }}>
                                {event.category}
                            </div>
                        </div>

                        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: 'var(--text-color)' }}>
                                {event.title}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary-text)', fontSize: 13, marginBottom: 12 }}>
                                <span>📍 {event.location}</span>
                                <span>•</span>
                                <span>🕒 {event.time}</span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--secondary-text)', fontSize: 14, lineHeight: 1.6, flex: 1 }}>
                                {event.description}
                            </p>
                            <button
                                onClick={() => setSelectedEvent(event)}
                                style={{
                                    marginTop: 20,
                                    padding: '12px',
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 12,
                                    color: 'var(--text-color)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }} className="details-btn">
                                Ver Detalhes
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedEvent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '20px',
                    backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease'
                }} onClick={() => setSelectedEvent(null)}>
                    <div
                        style={{
                            background: 'var(--card-bg)',
                            borderRadius: 32,
                            padding: 0,
                            maxWidth: 600,
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            color: 'var(--text-color)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            border: '1px solid var(--border-color)',
                            position: 'relative',
                            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedEvent(null)}
                            style={{
                                position: 'absolute', top: 20, right: 20,
                                background: 'rgba(255,255,255,0.1)', border: 'none',
                                color: '#fff', width: 36, height: 36, borderRadius: '50%',
                                cursor: 'pointer', zIndex: 10, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(10px)'
                            }}
                        >✕</button>

                        <div style={{ height: 300, position: 'relative' }}>
                            <img
                                src={selectedEvent.image}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt={selectedEvent.title}
                            />
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                height: '50%', background: 'linear-gradient(to top, var(--card-bg), transparent)'
                            }} />
                        </div>

                        <div style={{ padding: 40, marginTop: -60, position: 'relative' }}>
                            <div style={{
                                background: 'var(--accent-color)', color: '#fff',
                                padding: '6px 16px', borderRadius: 99, fontSize: 13,
                                fontWeight: 800, display: 'inline-block', marginBottom: 16,
                                textTransform: 'uppercase', letterSpacing: '1px'
                            }}>
                                {selectedEvent.category}
                            </div>
                            <h2 style={{ fontSize: 32, fontWeight: 1000, margin: '0 0 16px', lineHeight: 1.2 }}>
                                {selectedEvent.title}
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                                <div style={{ background: 'var(--input-bg)', padding: 16, borderRadius: 20, border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: 12, color: 'var(--secondary-text)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>📅 Data e Hora</div>
                                    <div style={{ fontWeight: 800, fontSize: 16 }}>
                                        {new Date(selectedEvent.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        <br />
                                        às {selectedEvent.time}
                                    </div>
                                </div>
                                <div style={{ background: 'var(--input-bg)', padding: 16, borderRadius: 20, border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: 12, color: 'var(--secondary-text)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>📍 Localização</div>
                                    <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedEvent.location}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <h4 style={{ fontSize: 14, color: 'var(--secondary-text)', fontWeight: 800, margin: '0 0 12px', textTransform: 'uppercase' }}>Sobre o Evento</h4>
                                <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-color)', opacity: 0.9 }}>
                                    {selectedEvent.description}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedEvent(null)}
                                style={{
                                    width: '100%', padding: '18px',
                                    background: 'linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%)',
                                    color: '#fff', border: 'none', borderRadius: 20,
                                    fontSize: 18, fontWeight: 800, cursor: 'pointer',
                                    boxShadow: '0 10px 30px rgba(141, 106, 255, 0.4)'
                                }}
                            >
                                Adicionar à Agenda
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .event-card:hover {
                    transform: translateY(-8px);
                    border-color: var(--accent-color);
                    box-shadow: 0 12px 40px rgba(141, 106, 255, 0.2);
                }
                .details-btn:hover {
                    background: var(--accent-color);
                    color: #fff;
                    border-color: transparent;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px) scale(0.9); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
