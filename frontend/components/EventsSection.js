import { useState, useEffect, useMemo } from 'react';
import { fetchEvents } from '../services/api';
import { useFavorites } from '../hooks/useFavorites';
import { Search, Calendar, MapPin, Clock, Star } from 'lucide-react';

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
        const q = searchQuery.toLowerCase();
        return events.filter(e =>
            (e.title?.toLowerCase() || '').includes(q) ||
            (e.description?.toLowerCase() || '').includes(q) ||
            (e.category?.toLowerCase() || '').includes(q)
        );
    }, [events, searchQuery]);

    const handleToggleFavorite = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite('events', item);
        if ('vibrate' in navigator) navigator.vibrate(30);
    };

    return (
        <div className="events-container">
            {/* Header Premium */}
            <div className="events-header">
                <div className="header-top">
                    <div className="header-icon"><Calendar size={20} color="#a855f7" /></div>
                    <h2 className="header-title">Agenda Sinop</h2>
                </div>
                <div className="e-search-wrapper">
                    <Search size={18} className="e-search-icon" />
                    <input
                        type="text"
                        placeholder="O que está acontecendo em Sinop?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="e-search-input"
                    />
                </div>
            </div>

            <div className="events-grid">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton-event-card" />
                    ))
                ) : filteredEvents.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} strokeWidth={1.5} />
                        <p>Nenhum evento encontrado para sua busca.</p>
                    </div>
                ) : (
                    filteredEvents.map((event) => (
                        <div key={event.id} className="event-card card-hover">
                            <div className="event-img-box">
                                <img src={event.image} alt={event.title} />
                                <button
                                    onClick={(e) => handleToggleFavorite(e, event)}
                                    className={`event-fav-btn ${isFavorite('events', event) ? 'active' : ''}`}
                                >
                                    <Star size={18} fill={isFavorite('events', event) ? "#ffca28" : "none"} />
                                </button>
                                <div className="event-date-badge">
                                    <span className="day">{event.date ? event.date.split('-')[2] : '??'}</span>
                                    <span className="month">
                                        {event.date ? new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' }) : '...'}
                                    </span>
                                </div>
                                <div className="event-category-tag">{event.category}</div>
                            </div>
                            <div className="event-content">
                                <h3 className="event-title">{event.title}</h3>
                                <div className="event-meta">
                                    <div className="meta-item"><MapPin size={14} /> {event.location}</div>
                                    <div className="meta-item"><Clock size={14} /> {event.time}</div>
                                </div>
                                <p className="event-desc">{event.description}</p>
                                <button onClick={() => setSelectedEvent(event)} className="details-btn">Ver Detalhes</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedEvent && (
                <div className="event-modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="event-modal" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedEvent(null)} className="close-btn">✕</button>
                        <div className="modal-header-img">
                            <img src={selectedEvent.image} alt="" />
                            <div className="modal-img-overlay" />
                        </div>
                        <div className="modal-body">
                            <div className="modal-tag">{selectedEvent.category}</div>
                            <h2 className="modal-title">{selectedEvent.title}</h2>
                            <div className="modal-info-grid">
                                <div className="info-item">
                                    <label>Data & Hora</label>
                                    <p>{selectedEvent.date} às {selectedEvent.time}</p>
                                </div>
                                <div className="info-item">
                                    <label>Localização</label>
                                    <p>{selectedEvent.location}</p>
                                </div>
                            </div>
                            <p className="modal-description">{selectedEvent.description}</p>
                            <button onClick={() => setSelectedEvent(null)} className="confirm-btn">Entendi</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .events-container { padding: 8px 0 100px; max-width: 1160px; margin: 0 auto; }
                
                .events-header {
                    background: rgba(25, 20, 40, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 28px;
                    padding: 24px;
                    margin-bottom: 32px;
                }

                .header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
                .header-icon { width: 40px; height: 40px; background: rgba(168, 85, 247, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .header-title { font-size: 24px; font-weight: 900; margin: 0; color: white; }

                .e-search-wrapper { position: relative; width: 100%; }
                .e-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); opacity: 0.3; }
                .e-search-input { width: 100%; padding: 14px 20px 14px 48px; background: rgba(15, 13, 21, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; color: white; font-size: 15px; outline: none; }
                .e-search-input:focus { border-color: #a855f7; box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1); }

                .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }

                .event-card { background: var(--card-bg); border-radius: 24px; overflow: hidden; border: 1px solid var(--border-color); display: flex; flexDirection: column; }
                .event-img-box { position: relative; height: 220px; overflow: hidden; }
                .event-img-box img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
                .event-card:hover .event-img-box img { transform: scale(1.08); }

                .event-fav-btn { position: absolute; top: 16px; left: 16px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; z-index: 10; }
                .event-fav-btn.active { color: #ffca28; }

                .event-date-badge { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.9); color: #1a1a1a; padding: 8px 14px; border-radius: 16px; text-align: center; font-weight: 800; backdrop-filter: blur(4px); display: flex; flex-direction: column; }
                .event-date-badge .day { font-size: 18px; line-height: 1; }
                .event-date-badge .month { font-size: 10px; text-transform: uppercase; }

                .event-category-tag { position: absolute; bottom: 12px; left: 12px; background: #a855f7; color: white; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; }

                .event-content { padding: 24px; flex: 1; display: flex; flex-direction: column; }
                .event-title { margin: 0 0 12px; font-size: 20px; font-weight: 800; color: white; }
                .event-meta { display: flex; align-items: center; gap: 16px; color: var(--secondary-text); font-size: 13px; margin-bottom: 16px; }
                .meta-item { display: flex; align-items: center; gap: 6px; }
                .event-desc { margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                
                .details-btn { margin-top: 20px; width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: white; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
                .details-btn:hover { background: rgba(255,255,255,0.1); border-color: #a855f7; }

                @media (max-width: 768px) {
                    .events-grid { grid-template-columns: 1fr; gap: 16px; }
                    .event-card { flex-direction: row; height: 160px; }
                    .event-img-box { width: 130px; height: 100%; flex-shrink: 0; }
                    .event-content { padding: 16px; justify-content: center; }
                    .event-title { font-size: 16px; margin-bottom: 6px; -webkit-line-clamp: 2; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; }
                    .event-desc, .details-btn { display: none; }
                    .event-meta { font-size: 11px; margin-bottom: 0; gap: 10px; }
                    .event-date-badge { padding: 4px 10px; top: 10px; right: 10px; }
                    .event-date-badge .day { font-size: 14px; }
                }

                .event-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(10px); }
                .event-modal { background: #1a152d; border-radius: 32px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; border: 1px solid rgba(255,255,255,0.1); }
                .modal-header-img { height: 240px; position: relative; }
                .modal-header-img img { width: 100%; height: 100%; object-fit: cover; }
                .modal-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, #1a152d, transparent); }
                .modal-body { padding: 32px; margin-top: -40px; position: relative; }
                .modal-tag { display: inline-block; background: #a855f7; color: white; padding: 4px 14px; border-radius: 99px; font-size: 12px; font-weight: 800; margin-bottom: 16px; }
                .modal-title { font-size: 28px; font-weight: 900; margin-bottom: 24px; color: white; }
                .modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
                .info-item label { display: block; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 800; margin-bottom: 4px; }
                .info-item p { margin: 0; font-size: 14px; font-weight: 700; color: white; }
                .modal-description { font-size: 15px; line-height: 1.7; color: #cbd5e1; margin-bottom: 32px; }
                .confirm-btn { width: 100%; padding: 18px; background: #a855f7; color: white; border: none; border-radius: 20px; font-size: 16px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 25px rgba(168, 85, 247, 0.4); }
                .close-btn { position: absolute; top: 20px; right: 20px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.5); border: none; color: white; z-index: 100; cursor: pointer; }
            `}</style>
        </div>
    );
}
