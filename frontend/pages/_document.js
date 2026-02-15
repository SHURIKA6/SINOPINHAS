import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="pt-BR">
            <Head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#0E2A47" />
                <link rel="apple-touch-icon" href="/favicon.ico" />
                {/* Google Fonts — preload para não bloquear renderização */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                <script dangerouslySetInnerHTML={{
                    __html: `
/*
          
          ███████╗██╗   ██╗     █████╗ ███╗   ███╗ ██████╗     ███╗   ███╗██╗   ██╗██╗████████╗ ██████╗      █████╗      █████╗ ███╗   ██╗███╗   ██╗ █████╗      ██╗██╗   ██╗██╗     ██╗ █████╗ 
          ██╔════╝██║   ██║    ██╔══██╗████╗ ████║██╔═══██╗    ████╗ ████║██║   ██║██║╚══██╔══╝██╔═══██╗    ██╔══██╗    ██╔══██╗████╗  ██║████╗  ██║██╔══██╗     ██║██║   ██║██║     ██║██╔══██╗
          █████╗  ██║   ██║    ███████║██╔████╔██║██║   ██║    ██╔████╔██║██║   ██║██║   ██║   ██║   ██║    ███████║    ███████║██╔██╗ ██║██╔██╗ ██║███████║     ██║██║   ██║██║     ██║███████║
          ██╔══╝  ██║   ██║    ██╔══██║██║╚██╔╝██║██║   ██║    ██║╚██╔╝██║██║   ██║██║   ██║   ██║   ██║    ██╔══██║    ██╔══██║██║╚██╗██║██║╚██╗██║██╔══██║██   ██║██║   ██║██║     ██║██╔══██║
          ███████╗╚██████╔╝    ██║  ██║██║ ╚═╝ ██║╚██████╔╝    ██║ ╚═╝ ██║╚██████╔╝██║   ██║   ╚██████╔╝    ██║  ██║    ██║  ██║██║ ╚████║██║ ╚████║██║  ██║╚█████╔╝╚██████╔╝███████╗██║██║  ██║
          ╚══════╝ ╚═════╝     ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝     ╚═╝     ╚═╝ ╚═════╝ ╚═╝   ╚═╝    ╚═════╝     ╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚════╝  ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═╝
                                                                                                                                                                                                 
          ASSINADO: _Riad777
          
*/
        `}} />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
