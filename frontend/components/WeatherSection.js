import React, { useEffect } from 'react';

export default function WeatherSection() {
    useEffect(() => {
        // Remove script if it already exists to force reload/re-execution if needed, 
        // or just ensure it's added.
        const existingScript = document.getElementById('weather-widget-script');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'weather-widget-script';
            script.src = "https://app3.weatherwidget.org/js/?id=ww_a20925b9a387d";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

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
            <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>⛅ Clima</h2>

            <div
                id="ww_a20925b9a387d"
                v='1.3'
                loc='id'
                a='{"t":"horizontal","lang":"pt","sl_lpl":1,"ids":["wl5044"],"font":"Times","sl_ics":"one_a","sl_sot":"celsius","cl_bkg":"image","cl_font":"#FFFFFF","cl_cloud":"#FFFFFF","cl_persp":"#81D4FA","cl_sun":"#FFC107","cl_moon":"#FFC107","cl_thund":"#FF5722","el_nme":3,"el_cwt":3}'
                style={{ maxWidth: '100%', overflow: 'hidden' }}
            >
                Mais previsões:
                <a href="https://tempolongo.com/rio_de_janeiro_tempo_25_dias/" id="ww_a20925b9a387d_u" target="_blank">
                    Previsão do Tempo
                </a>
            </div>
        </div>
    );
}
