import React, { useEffect } from 'react';

export default function WeatherSection() {
    useEffect(() => {
        // Inject script for weatherwidget.io
        !function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (!d.getElementById(id)) {
                js = d.createElement(s);
                js.id = id;
                js.src = 'https://weatherwidget.io/js/widget.min.js';
                fjs.parentNode.insertBefore(js, fjs);
            }
        }(document, 'script', 'weatherwidget-io-js');
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            color: '#fff',
            textAlign: 'center',
            width: '100%'
        }}>
            <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>⛅ Clima em Sinop</h2>

            <div style={{ width: '100%', maxWidth: '800px' }}>
                <a
                    className="weatherwidget-io"
                    href="https://forecast7.com/pt/n11d86n55d51/sinop/"
                    data-label_1="SINOP"
                    data-label_2="WEATHER"
                    data-icons="Climacons Animated"
                    data-days="5"
                    data-theme="original"
                >
                    SINOP WEATHER
                </a>
            </div>
        </div>
    );
}
