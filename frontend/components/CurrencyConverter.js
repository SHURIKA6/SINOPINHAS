import React, { useState, useEffect } from 'react';

export default function CurrencyConverter() {
    const [amount, setAmount] = useState(1);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('BRL');
    const [rate, setRate] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currencies = ['USD', 'BRL', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

    useEffect(() => {
        const fetchRate = async () => {
            setLoading(true);
            setError(null);
            try {
                // Using a free API
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
                const data = await res.json();
                const currentRate = data.rates[toCurrency];
                setRate(currentRate);
                setResult(amount * currentRate);
            } catch (err) {
                setError('Erro ao buscar cotação.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRate();
    }, [amount, fromCurrency, toCurrency]);

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
            <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>💱 Conversor de Moedas</h2>
            <p style={{ color: '#aaa', marginBottom: '30px' }}>
                Cotações atualizadas em tempo real.
            </p>

            <div style={{
                background: '#212121',
                padding: '32px',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                maxWidth: '400px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>

                {/* Input Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                    <label style={{ fontSize: '14px', color: '#aaa' }}>Valor</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #333',
                            background: '#1a1a1a',
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* From / To Selects */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        <label style={{ fontSize: '14px', color: '#aaa' }}>De</label>
                        <select
                            value={fromCurrency}
                            onChange={(e) => setFromCurrency(e.target.value)}
                            style={{
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#1a1a1a',
                                color: '#fff',
                                fontSize: '16px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '12px', color: '#aaa' }}>
                        ➡️
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        <label style={{ fontSize: '14px', color: '#aaa' }}>Para</label>
                        <select
                            value={toCurrency}
                            onChange={(e) => setToCurrency(e.target.value)}
                            style={{
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#1a1a1a',
                                color: '#fff',
                                fontSize: '16px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Result Display */}
                <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: '#2a2a2a',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    {loading ? (
                        <span style={{ color: '#aaa' }}>Carregando...</span>
                    ) : error ? (
                        <span style={{ color: '#ef4444' }}>{error}</span>
                    ) : (
                        <>
                            <div style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>
                                1 {fromCurrency} = {rate} {toCurrency}
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                                {result ? result.toLocaleString('pt-BR', { style: 'currency', currency: toCurrency }) : '...'}
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
