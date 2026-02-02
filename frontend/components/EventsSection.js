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
        image: "https://images.unsplash.com/photo-1459749411177-042180ce673b?auto=format&fit=crop&w=800&q=80",
        url: "https://www.ingressos.com.br"
    },
    {
        id: 2,
        title: "Feira de Gastronomia Local",
        date: "2025-01-15",
        time: "18:00",
        location: "Praça da Bíblia",
        description: "Venha saborear o melhor da culinária de Sinop. Entrada gratuita!",
        category: "Gastronomia",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
        url: "https://www.sinop.mt.gov.br"
    }
];

export default function EventsSection() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'Todos' },
        { id: 'musica', label: 'Música' },
        { id: 'gastronomia', label: 'Gastronomia' },
        { id: 'esporte', label: 'Esporte' },
        { id: 'arte', label: 'Arte & Cultura' }
    ];

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
        return events.filter(e => {
            const matchesSearch = (e.title?.toLowerCase() || '').includes(q) ||
                (e.description?.toLowerCase() || '').includes(q) ||
                (e.category?.toLowerCase() || '').includes(q);

            const matchesCategory = selectedCategory === 'all' ||
                (e.category?.toLowerCase() || '') === selectedCategory ||
                (e.category?.toLowerCase() || '').includes(selectedCategory);

            return matchesSearch && matchesCategory;
        });
    }, [events, searchQuery, selectedCategory]);

    const handleToggleFavorite = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite('events', item);
        if ('vibrate' in navigator) navigator.vibrate(30);
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    const closeModal = () => {
        setSelectedEvent(null);
    };

    return (
        <div className="events-container">
            <div className="events-header vista-glass-widget" style={{ padding: '24px' }}>
                <div className="e-header-content">
                    <div className="e-icon-box">
                        <Calendar size={28} color="#0047AB" style={{ filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.8))' }} />
                    </div>
                    <div className="e-title-box">
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#003366', textShadow: '0 1px 0 rgba(255,255,255,0.8)', fontFamily: 'Segoe UI, Tahoma' }}>Agenda Cultural</h2>
                        <p style={{ margin: '4px 0 0', color: '#556677', fontSize: 13, fontWeight: 600 }}>O que está rolando em Sinop</p>
                    </div>
                </div>

                <div className="e-search-row">
                    <div className="e-search-wrapper">
                        <Search size={16} className="e-search-icon" color="#0047AB" />
                        <input
                            type="text"
                            placeholder="Buscar eventos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="e-search-input"
                        />
                    </div>
                    <div className="e-tabs">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`e-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="events-grid">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton-event-card vista-glass-widget" />
                    ))
                ) : filteredEvents.length === 0 ? (
                    <div className="e-empty vista-glass-widget" style={{ color: '#444' }}>
                        <Calendar size={48} strokeWidth={1.5} opacity={0.6} color="#444" />
                        <p>Nenhum evento encontrado.</p>
                    </div>
                ) : (
                    filteredEvents.map((event) => (
                        <div key={event.id} className="event-card vista-glass-widget card-hover" onClick={() => handleEventClick(event)}>
                            <div className="e-date-badge">
                                <span className="e-day">{event.date.day}</span>
                                <span className="e-month">{event.date.month}</span>
                            </div>
                            <div className="e-card-content">
                                <h3 className="e-title vista-card-title">{event.title}</h3>
                                <div className="e-meta">
                                    <div className="e-meta-item">
                                        <Clock size={14} /> <span>{event.time}</span>
                                    </div>
                                    <div className="e-meta-item">
                                        <MapPin size={14} /> <span>{event.location}</span>
                                    </div>
                                </div>
                                <div className="e-tags">
                                    <span className="e-tag">{event.category}</span>
                                    {event.isFree && <span className="e-tag free">Gratuito</span>}
                                </div>
                            </div>
                            <div className="e-arrow">
                                <ChevronRight size={20} color="#0047AB" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Detalhes (Estilo Aero Glass Light) */}
            {selectedEvent && (
                <div className="e-modal-overlay" onClick={closeModal}>
                    <div className="e-modal vista-glass-widget" onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.95)' }}>
                        <button className="e-close-btn" onClick={closeModal}><X size={20} color="#0047AB" /></button>
                        <div className="e-modal-header">
                            <span className="e-modal-date">{selectedEvent.date.day} de {selectedEvent.date.month}</span>
                            <h2 className="e-modal-title" style={{ color: '#003366' }}>{selectedEvent.title}</h2>
                        </div>
                        <div className="e-modal-body">
                            <div className="e-modal-info">
                                <div className="e-info-row">
                                    <Clock size={18} color="#0047AB" />
                                    <span>{selectedEvent.time}</span>
                                </div>
                                <div className="e-info-row">
                                    <MapPin size={18} color="#0047AB" />
                                    <span>{selectedEvent.location}</span>
                                </div>
                            </div>
                            <p className="e-modal-desc" style={{ color: '#333' }}>{selectedEvent.description}</p>
                            <button className="e-modal-action shiny-button">Confirmar Presença</button>
                        </div>
                    </div>
                </div>
            )}


            <style jsx>{`
                .events-section { margin-bottom: 80px; }
                
                .events-header { margin-bottom: 24px; display: flex; flex-direction: column; gap: 20px; }
                .e-header-content { display: flex; align-items: center; gap: 16px; }
                .e-icon-box { width: 50px; height: 50px; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4)); border: 1px solid white; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                
                .e-search-row { display: flex; gap: 12px; flex-wrap: wrap; }
                .e-search-wrapper { position: relative; flex: 1; min-width: 200px; }
                .e-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); opacity: 0.7; }
                .e-search-input { width: 100%; padding: 12px 16px 12px 40px; background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(255, 255, 255, 0.6); border-radius: 12px; font-size: 14px; color: #002244; outline: none; transition: all 0.2s; font-weight: 600; }
                .e-search-input:focus { background: rgba(255, 255, 255, 0.8); border-color: #0078D4; box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2); }
                .e-search-input::placeholder { color: #667788; }

                .e-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
                .e-tab-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid transparent; background: rgba(255, 255, 255, 0.3); color: #0047AB; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
                .e-tab-btn:hover { background: rgba(255, 255, 255, 0.6); }
                .e-tab-btn.active { background: #0078D4; color: white; box-shadow: 0 2px 5px rgba(0, 120, 212, 0.3); border: 1px solid #005A9E; }

                .events-grid { display: flex; flex-direction: column; gap: 12px; }
                
                .event-card { display: flex; align-items: center; padding: 16px; gap: 16px; cursor: pointer; border: 1px solid rgba(255,255,255,0.6); transition: all 0.2s; background: rgba(255, 255, 255, 0.5); }
                .event-card:hover { transform: translateX(4px); background: rgba(255, 255, 255, 0.8); border-color: #00C6FF; }

                .e-date-badge { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 50px; height: 50px; background: linear-gradient(135deg, #0078D4, #005A9E); border-radius: 10px; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.3); }
                .e-day { font-size: 18px; font-weight: 800; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
                .e-month { font-size: 10px; text-transform: uppercase; font-weight: 700; opacity: 0.9; }

                .e-card-content { flex: 1; }
                .e-title { margin: 0 0 6px; font-size: 16px; }
                .e-meta { display: flex; gap: 12px; font-size: 12px; color: #445566; margin-bottom: 8px; font-weight: 600; }
                .e-meta-item { display: flex; align-items: center; gap: 4px; }
                
                .e-tags { display: flex; gap: 6px; }
                .e-tag { font-size: 10px; padding: 2px 8px; background: rgba(0, 71, 171, 0.1); color: #0047AB; border-radius: 4px; font-weight: 700; border: 1px solid rgba(0, 71, 171, 0.2); }
                .e-tag.free { background: rgba(46, 204, 113, 0.2); color: #218c53; border-color: rgba(46, 204, 113, 0.3); }

                .e-arrow { opacity: 0.5; transition: 0.2s; }
                .event-card:hover .e-arrow { opacity: 1; transform: translateX(2px); }

                .e-empty { padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; font-weight: 600; background: rgba(255,255,255,0.3); }

                /* Modal */
                .e-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s; }
                .e-modal { width: 100%; max-width: 500px; padding: 0; border-radius: 20px; border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 20px 50px rgba(0,0,0,0.3); animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .e-close-btn { position: absolute; top: 12px; right: 12px; background: transparent; border: none; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; z-index: 10; }
                .e-close-btn:hover { background: rgba(0,0,0,0.1); }
                
                .e-modal-header { padding: 24px; background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4)); border-bottom: 1px solid rgba(0,0,0,0.05); border-top-left-radius: 20px; border-top-right-radius: 20px; }
                .e-modal-date { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0047AB; letter-spacing: 1px; }
                .e-modal-title { margin: 8px 0 0; font-size: 24px; font-weight: 800; font-family: 'Segoe UI', sans-serif; }
                
                .e-modal-body { padding: 24px; }
                .e-modal-info { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; background: rgba(255,255,255,0.5); padding: 16px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); }
                .e-info-row { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #444; font-weight: 600; }
                .e-modal-desc { line-height: 1.6; color: #333; margin-bottom: 24px; font-size: 15px; }
                
                .e-modal-action { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 700; font-size: 15px; cursor: pointer; background: linear-gradient(180deg, #0078D4 0%, #005A9E 100%); color: white; box-shadow: 0 4px 10px rgba(0, 120, 212, 0.3); text-shadow: 0 1px 1px rgba(0,0,0,0.2); transition: all 0.2s; }
                .e-modal-action:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0, 120, 212, 0.4); filter: brightness(1.1); }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

                .skeleton-event-card { height: 80px; margin-bottom: 12px; animation: pulse 1.5s infinite; background: rgba(255,255,255,0.4); border-radius: 12px; }

                @media (max-width: 768px) {
                    .event-title { font-size: 16px; margin-bottom: 6px; -webkit-line-clamp: 2; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; }
                    .event-desc, .details-btn { display: none; }
                    .event-meta { font-size: 11px; margin-bottom: 0; gap: 10px; }
                    .event-date-badge { padding: 4px 10px; top: 10px; right: 10px; }
                    .event-date-badge .day { font-size: 14px; }
                }

                .event-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(8px); }
                .event-modal { border-radius: 32px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                .modal-header-img { height: 240px; position: relative; }
                .modal-header-img img { width: 100%; height: 100%; object-fit: cover; }
                .modal-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(255,255,255,0.9) 0%, transparent 100%); }
                .modal-body { padding: 32px; margin-top: -60px; position: relative; z-index: 2; }
                .modal-tag { display: inline-block; background: #0047AB; color: white; padding: 4px 14px; border-radius: 99px; font-size: 12px; font-weight: 800; margin-bottom: 16px; box-shadow: 0 4px 10px rgba(0, 71, 171, 0.4); }
                .modal-title { font-size: 28px; font-weight: 900; margin-bottom: 24px; }
                .modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding: 20px; background: rgba(255,255,255,0.5); border-radius: 16px; border: 1px solid white; }
                .info-item label { display: block; font-size: 10px; text-transform: uppercase; color: #555; font-weight: 800; margin-bottom: 4px; }
                .info-item p { margin: 0; font-size: 14px; font-weight: 700; }
                .modal-description { font-size: 15px; line-height: 1.7; margin-bottom: 32px; }
                .confirm-btn { width: 100%; padding: 18px; background: linear-gradient(135deg, #0047AB 0%, #00C6FF 100%); color: white; border: none; border-radius: 20px; font-size: 16px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 25px rgba(0, 71, 171, 0.4); transition: transform 0.2s; }
                .confirm-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0, 71, 171, 0.5); }
                .close-btn { position: absolute; top: 20px; right: 20px; width: 36px; height: 36px; border-radius: 50%; background: white; border: none; color: #333; z-index: 100; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-weight: bold; }
            `}</style>
        </div >
    );
}
