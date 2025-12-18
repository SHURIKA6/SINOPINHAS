import Head from 'next/head';
import { useEffect } from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
    useEffect(() => {
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
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
