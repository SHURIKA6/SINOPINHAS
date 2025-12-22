import Head from 'next/head';
import { useEffect } from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        // Mensagem secreta no console para os curiosos
        console.log(
            "%c Ei curioso! %c Tem nada de especial aqui... ou será que tem? %c \n\n Tenta achar o /shura-logs ou só explora os arquivos aí msm <3",
            "background: #00ff41; color: #000; font-weight: bold; font-size: 14px; padding: 4px; border-radius: 4px;",
            "color: #00ff41; font-weight: bold;",
            "color: #888; font-style: italic;"
        );

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').then(
                    function (registration) {
                        console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function (err) {
                        console.log('Service Worker registration failed: ', err);
                    }
                );
            });
        }
    }, []);

    return (
        <>
            <Head>
                <title>SINOPINHAS by SHURA</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
