import { useState, useEffect, useMemo } from 'react';
import { fetchPlaces } from '../services/api';
import { useFavorites } from '../hooks/useFavorites';
import { Search, MapPin, ExternalLink, Star } from 'lucide-react';

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
        const q = searchQuery.toLowerCase();
        return places.filter(p =>
            (p.title?.toLowerCase() || '').includes(q) ||
            (p.description?.toLowerCase() || '').includes(q) ||
            (p.category?.toLowerCase() || '').includes(q)
        );
    }, [places, searchQuery]);

    const handleToggleFavorite = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite('places', item);
        if ('vibrate' in navigator) navigator.vibrate(30);
    };

    return (
        <div className="places-container">
            <div className="places-header vista-glass-widget" style={{ padding: '20px' }}>
                <div className="p-header-top">
                    <div className="p-header-icon"><MapPin size={24} color="#FFF" style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.7))' }} /></div>
                    <h2 className="p-header-title" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontFamily: 'Segoe UI, Tahoma', letterSpacing: '0.5px' }}>Guia Sinop</h2>
                </div>
                <div className="p-search-wrapper">
                    <Search size={18} className="p-search-icon" color="white" />
                    <input
                        type="text"
                        placeholder="Onde vamos hoje em Sinop?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="p-search-input"
                    />
                </div>
            </div>

            <div className="places-grid">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-place-card vista-glass-widget" />
                    ))
                ) : filteredPlaces.length === 0 ? (
                    <div className="p-empty vista-glass-widget">
                        <MapPin size={48} strokeWidth={1.5} opacity={0.6} color="white" />
                        <p style={{ color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Nenhum lugar encontrado.</p>
                    </div>
                ) : (
                    filteredPlaces.map((place, index) => (
                        <a
                            key={index}
                            href={place.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="place-card card-hover vista-glass-widget"
                            style={{ border: '1px solid rgba(255,255,255,0.3)', padding: 0 }}
                        >
                            <div className="p-img-box">
                                <img src={place.image} alt={place.title} loading="lazy" />
                                <button
                                    onClick={(e) => handleToggleFavorite(e, place)}
                                    className={`p-fav-btn ${isFavorite('places', place) ? 'active' : ''}`}
                                >
                                    <Star size={18} fill={isFavorite('places', place) ? "#FFD700" : "none"} color={isFavorite('places', place) ? "#FFD700" : "white"} />
                                </button>
                                <div className="p-cat-tag backdrop-blur">{place.category}</div>
                            </div>
                            <div className="p-info">
                                <h3 className="p-title vista-card-title">{place.title}</h3>
                                <p className="p-desc">{place.description}</p>
                                <div className="p-action">
                                    <span>Ver Local</span>
                                    <ExternalLink size={14} />
                                </div>
                            </div>
                        </a>
                    ))
                )}
            </div>

            <style jsx>{`
                .places-container { padding: 8px 0 100px; max-width: 1160px; margin: 0 auto; }

                .places-header {
                    margin-bottom: 32px;
                }

                .p-header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
                .p-header-icon { width: 44px; height: 44px; background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
                .p-header-title { font-size: 26px; font-weight: 900; margin: 0; color: white; }

                .p-search-wrapper { position: relative; width: 100%; }
                .p-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); opacity: 0.8; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
                .p-search-input { width: 100%; padding: 14px 20px 14px 48px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px; color: white; font-size: 15px; outline: none; box-shadow: inset 0 2px 5px rgba(0,0,0,0.2); backdrop-filter: blur(4px); transition: all 0.2s; }
                .p-search-input::placeholder { color: rgba(255,255,255,0.6); }
                .p-search-input:focus { background: rgba(0, 0, 0, 0.3); border-color: rgba(255, 255, 255, 0.5); box-shadow: inset 0 2px 5px rgba(0,0,0,0.3), 0 0 10px rgba(255,255,255,0.1); }

                .places-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

                .place-card { text-decoration: none; display: flex; flex-direction: column; transition: all 0.3s ease; }
                .place-card:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.4) !important; }
                
                .p-img-box { position: relative; height: 200px; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,0.1); }
                .p-img-box img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
                .place-card:hover .p-img-box img { transform: scale(1.08); }

                .p-fav-btn { position: absolute; top: 12px; right: 12px; font-size: 16px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: all 0.2s; }
                .p-fav-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
                .p-fav-btn.active { background: rgba(255,255,255,0.9); }
                
                .p-cat-tag { position: absolute; top: 12px; left: 12px; background: rgba(20, 30, 48, 0.8); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }

                .p-info { padding: 20px; flex: 1; display: flex; flex-direction: column; background: transparent; }
                .p-title { margin: 0 0 10px; font-size: 20px; }
                .p-desc { margin: 0; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.8); flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
                
                .p-action { margin-top: 20px; display: flex; align-items: center; gap: 8px; color: #89CFF0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
                .place-card:hover .p-action { color: #FFF; text-shadow: 0 0 5px #89CFF0; }

                @media (max-width: 768px) {
                    .places-grid { grid-template-columns: 1fr; gap: 16px; }
                    .place-card { flex-direction: row; height: 140px; }
                    .p-img-box { width: 120px; height: 100%; flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.1); border-bottom: none; }
                    .p-info { padding: 16px; justify-content: center; }
                    .p-title { font-size: 16px; margin-bottom: 4px; -webkit-line-clamp: 2; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; }
                    .p-desc { font-size: 12px; -webkit-line-clamp: 2; }
                    .p-action { display: none; }
                }

                .skeleton-place-card { height: 350px; animation: pulse 1.5s infinite; background: rgba(255,255,255,0.1); }
                .p-empty { padding: 80px 20px; text-align: center; }
            `}</style>
        </div>
    );
}
