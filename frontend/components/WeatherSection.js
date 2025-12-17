import React from 'react';

export default function WeatherSection() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            color: '#fff',
            textAlign: 'center'
        }}>
            <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>⛅ Clima em Sinop - MT</h2>
            <p style={{ color: '#aaa', marginBottom: '30px' }}>
                Confira a previsão atualizada em tempo real.
            </p>

            <div style={{
                background: '#212121',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                marginBottom: '30px',
                maxWidth: '600px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {/* 
                   Usando wttr.in para gerar a imagem do clima sem precisar de API Key 
                   Parâmetros:
                   Sinop = Cidade
                   lang=pt = Português
                   m = Métrico
                   0 = Apenas dia atual (simplificado) ou remover para ver mais dias
                   Q = Super silencioso (remove textos extras)
                */}
                <img
                    src="https://wttr.in/Sinop?lang=pt&m"
                    alt="Previsão do Tempo Sinop"
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px'
                    }}
                />
            </div>

            <a
                href="https://weather.com/pt-BR/clima/hoje/l/Sinop+Mato+Grosso"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    padding: '14px 28px',
                    background: '#0066cc',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '50px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(0,102,204,0.4)',
                    transition: 'transform 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                🌍 Ver detalhes no Weather.com
            </a>
        </div>
    );
}
