import { useState } from 'react';

const RECOMMENDATIONS = [
    {
        title: "Parque Florestal de Sinop",
        category: "Natureza",
        description: "Um dos principais atrativos naturais da cidade, com mata nativa, animais silvestres e um grande lago.",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=500&q=80",
        link: "https://www.tripadvisor.com.br/Attraction_Review-g1162319-d4508492-Reviews-Parque_Florestal_de_Sinop-Sinop_State_of_Mato_Grosso.html"
    },
    {
        title: "Catedral Sagrado Coração de Jesus",
        category: "Cultura",
        description: "Imponente estrutura religiosa com estilo moderno, ponto de contemplação e arquitetura.",
        image: "https://images.unsplash.com/photo-1548625361-195fe6115887?auto=format&fit=crop&w=500&q=80",
        link: "https://www.tripadvisor.com.br/Attraction_Review-g1162319-d4508491-Reviews-Catedral_Sagrado_Coracao_de_Jesus-Sinop_State_of_Mato_Grosso.html"
    },
    {
        title: "Curupy Acqua Park",
        category: "Lazer",
        description: "Parque aquático completo com rampas, piscina de ondas e Eco Park com atividades de aventura.",
        image: "https://images.unsplash.com/photo-1533727937480-da3a97967e95?auto=format&fit=crop&w=500&q=80",
        link: "https://www.curupyacquapark.com.br/"
    },
    {
        title: "Restaurantes no TripAdvisor",
        category: "Gastronomia",
        description: "Confira a lista dos melhores restaurantes e onde comer bem em Sinop.",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80",
        link: "https://www.tripadvisor.com.br/Restaurants-g1162319-Sinop_State_of_Mato_Grosso.html"
    },
    {
        title: "Só Notícias - Guia Local",
        category: "Notícias",
        description: "Fique por dentro do que acontece na cidade e descubra novos eventos.",
        image: "https://images.unsplash.com/photo-1504711432863-7448ca19767c?auto=format&fit=crop&w=500&q=80",
        link: "https://www.sonoticias.com.br/"
    },
    {
        title: "Shopping Sinop",
        category: "Compras",
        description: "O maior centro de compras, lazer e gastronomia do Nortão, com cinema Moviecom e as melhores lojas.",
        image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=500&q=80",
        link: "https://shoppingsinop.com"
    }
];

export default function PlacesSection() {
    return (
        <div style={{ padding: '20px 0', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, background: 'linear-gradient(90deg, #8d6aff, #fe7d45)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Guia Local Sinop
                </h2>
                <p style={{ color: 'var(--secondary-text)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
                    Descubra os melhores lugares, passeios e recomendações selecionadas para você aproveitar o máximo da nossa cidade.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 24
            }}>
                {RECOMMENDATIONS.map((place, index) => (
                    <a
                        key={index}
                        href={place.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'var(--card-bg)',
                            borderRadius: 20,
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                        }}
                        className="place-card"
                    >
                        <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                            <img
                                src={place.image}
                                alt={place.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                className="place-img"
                            />
                            <div style={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                background: 'rgba(141, 106, 255, 0.9)',
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: 99,
                                fontSize: 12,
                                fontWeight: 600,
                                backdropFilter: 'blur(4px)'
                            }}>
                                {place.category}
                            </div>
                        </div>

                        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: 'var(--text-color)' }}>
                                {place.title}
                            </h3>
                            <p style={{ margin: 0, color: 'var(--secondary-text)', fontSize: 14, lineHeight: 1.6, flex: 1 }}>
                                {place.description}
                            </p>
                            <div style={{
                                marginTop: 20,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                color: 'var(--accent-color)',
                                fontSize: 14,
                                fontWeight: 600
                            }}>
                                Visitar Site ↗
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            <style jsx>{`
        .place-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-color);
          box-shadow: 0 12px 30px rgba(141, 106, 255, 0.2);
        }
        .place-card:hover .place-img {
          transform: scale(1.1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
