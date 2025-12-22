import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="pt-BR">
            <Head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#8d6aff" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="SINOPINHAS by SHURA" />
                <title>SINOPINHAS by SHURA</title>
                <link rel="apple-touch-icon" href="/favicon.ico" />
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
