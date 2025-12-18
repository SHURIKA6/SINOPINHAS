import { useState } from 'react';

const RECOMMENDATIONS = [
    {
        title: "Parque Florestal de Sinop",
        category: "Natureza",
        description: "Um dos principais atrativos naturais da cidade, com mata nativa preservada, diversas espécies de animais silvestres, lago de 30 mil m² e trilhas ecológicas.",
        image: "https://conhecasinop.com.br/storage/uploads/6475024773822-parque-florestal-sinop-mt.jpg",
        link: "https://www.sinop.mt.gov.br/Conteudo/2/236/secretaria-de-meio-ambiente-e-desenvolvimento-sustentavel/parque-florestal-de-sinop"
    },
    {
        title: "Catedral Sagrado Coração de Jesus",
        category: "Cultura",
        description: "Obra monumental com arquitetura moderna e vitrais artísticos, sendo o centro religioso e cultural mais importante da região.",
        image: "https://conhecasinop.com.br/storage/uploads/6474f6760a0fb-catedral-sagrado-coracao-de-jesus-sinop-mt.jpg",
        link: "https://conhecasinop.com.br/turismo/catedral-sagrado-coracao-de-jesus"
    },
    {
        title: "Curupy Acqua Park",
        category: "Lazer",
        description: "O maior parque aquático do Norte de Mato Grosso, oferecendo praia artificial, piscina de ondas, toboáguas e Eco Park.",
        image: "https://conhecasinop.com.br/storage/uploads/6471165a6e2e9-curupy-acqua-park-sinop-mt.jpg",
        link: "https://curupyacquapark.com.br/"
    },
    {
        title: "Gastronomia em Sinop",
        category: "Gastronomia",
        description: "Experimente pratos típicos como Matrinxã Assada e o melhor churrasco mato-grossense nos melhores restaurantes da cidade.",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80",
        link: "https://www.tripadvisor.com.br/Restaurants-g1162319-Sinop_State_of_Mato_Grosso.html"
    },
    {
        title: "Só Notícias - Guia Local",
        category: "Notícias",
        description: "O portal de notícias mais acessado da região, com guias, eventos e tudo o que acontece em Sinop e no Nortão.",
        image: "https://www.sonoticias.com.br/wp-content/uploads/2021/04/sonoticias-destaque.jpg",
        link: "https://www.sonoticias.com.br/"
    },
    {
        title: "Shopping Sinop",
        category: "Compras",
        description: "O maior e mais moderno shopping center da região, com dezenas de lojas nacionais, praça de alimentação completa e cinema.",
        image: "https://shoppingsinop.com.br/wp-content/uploads/2021/10/fachada-shopping-sinop.jpg",
        link: "https://shoppingsinop.com.br/"
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
