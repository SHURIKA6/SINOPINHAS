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
                {/* Google AdSense — verificação e carregamento de anúncios */}
                <script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3444303701607983"
                    crossOrigin="anonymous"
                />
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
                {/* Conteúdo visível para crawlers (Google AdSense) quando JS não executa */}
                <noscript>
                    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
                        <h1>SINOPINHAS — A Maior Comunidade Digital de Sinop-MT</h1>
                        <p>Bem-vindo ao SINOPINHAS, a plataforma comunitária de Sinop, Mato Grosso. Compartilhe vídeos, fotos, notícias locais, eventos e descubra os melhores lugares da cidade.</p>
                        <h2>Funcionalidades</h2>
                        <ul>
                            <li>📹 Feed de vídeos e fotos da comunidade</li>
                            <li>📰 Notícias locais atualizadas de Sinop-MT</li>
                            <li>📅 Agenda de eventos da região</li>
                            <li>📍 Guia de lugares e estabelecimentos</li>
                            <li>🌤️ Previsão do tempo em tempo real</li>
                            <li>💬 Comentários e interação entre usuários</li>
                        </ul>
                        <p>Para a melhor experiência, habilite o JavaScript no seu navegador.</p>
                    </div>
                </noscript>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
