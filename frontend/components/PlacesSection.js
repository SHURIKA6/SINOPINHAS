import { useState, useEffect, useMemo } from 'react';
import { fetchPlaces } from '../services/api';
import { useFavorites } from '../hooks/useFavorites';

const RECOMMENDATIONS = [
    {
        title: "Parque Florestal de Sinop",
        category: "Natureza",
        description: "Um dos principais atrativos naturais da cidade, com mata nativa preservada, diversas espécies de animais silvestres, lago de 30 mil m² e trilhas ecológicas.",
        image: "https://www.sinop.mt.gov.br/fotos/8b73bd49749cc14626b6631d945a90c2.jpg",
        link: "https://www.sinop.mt.gov.br/Conteudo/2/236/secretaria-de-meio-ambiente-e-desenvolvimento-sustentavel/parque-florestal-de-sinop"
    },
    {
        title: "Catedral Sagrado Coração de Jesus",
        category: "Cultura",
        description: "Obra monumental com arquitetura moderna e vitrais artísticos, localizada no coração da cidade, com detalhes em pedras naturais.",
        image: "https://static.wixstatic.com/media/eef14d_88a921473671452f9bd1ef5fc4668ed8~mv2.jpg/v1/fill/w_774,h_370,al_c,lg_1,q_80,enc_avif,quality_auto/catedralsinop.jpg",
        link: "https://conhecasinop.com.br/turismo/catedral-sagrado-coracao-de-jesus"
    },
    {
        title: "Curupy Acqua Park",
        category: "Lazer",
        description: "O maior parque aquático do Mato Grosso, oferecendo praia artificial, piscina de ondas, toboáguas e Eco Park completo.",
        image: "https://curupy.com.br/gallery/190056422.Atracoes/1067063056.jpg",
        link: "https://curupyacquapark.com.br/"
    }
];

export default function PlacesSection() {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toggleFavorite, isFavorite } = useFavorites();

    useEffect(() => {
        const loadPlaces = async () => {
            try {
                const data = await fetchPlaces();
                if (data && data.length > 0) {
                    setPlaces(data);
                } else {
                    setPlaces(RECOMMENDATIONS);
                }
            } catch (err) {
                setPlaces(RECOMMENDATIONS);
            } finally {
                setLoading(false);
            }
        };
        loadPlaces();
    }, []);

    const filteredPlaces = useMemo(() => {
        if (!searchQuery.trim()) return places;
        const q = searchQuery.toLowerCase();
        return places.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
    }, [places, searchQuery]);

    const handleToggleFavorite = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite('places', item);
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
                    📍 Guia Sinop
                </h2>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Onde vamos hoje em Sinop?"
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} style={{ background: 'var(--card-bg)', borderRadius: 24, border: '1px solid var(--border-color)', overflow: 'hidden', height: 400 }}>
                            <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 0 }} />
                            <div style={{ padding: 24 }}>
                                <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12 }} />
                                <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 20 }} />
                                <div className="skeleton" style={{ height: 20, width: '30%' }} />
                            </div>
                        </div>
                    ))
                ) : filteredPlaces.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--secondary-text)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                        <p>Nenhum lugar encontrado para sua busca.</p>
                    </div>
                ) : (
                    filteredPlaces.map((place, index) => (
                        <a key={index} href={place.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', cursor: 'pointer', position: 'relative' }} className="card-hover">
                            <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                                <img src={place.image} alt={place.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} className="place-img" />
                                <button
                                    onClick={(e) => handleToggleFavorite(e, place)}
                                    style={{
                                        position: 'absolute', top: 12, right: 12,
                                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                        border: 'none', borderRadius: '50%', width: 36, height: 36,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', fontSize: 16, zIndex: 10
                                    }}
                                >
                                    {isFavorite('places', place) ? '⭐' : '☆'}
                                </button>
                                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(141, 106, 255, 0.9)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                                    {place.category}
                                </div>
                            </div>
                            <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: 'var(--text-color)' }}>{place.title}</h3>
                                <p style={{ margin: 0, color: 'var(--secondary-text)', fontSize: 14, lineHeight: 1.6, flex: 1 }}>{place.description}</p>
                                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-color)', fontSize: 14, fontWeight: 600 }}>Visitar Site ↗</div>
                            </div>
                        </a>
                    ))
                )}
            </div>
        </div>
    );
}
