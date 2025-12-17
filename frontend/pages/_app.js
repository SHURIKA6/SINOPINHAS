import Head from 'next/head';
import '../styles/globals.css'; // Assume que existe, se não, remover.

// Wrapper global para capturar erros e garantir estilo base
function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
