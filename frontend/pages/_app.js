import Head from 'next/head';
import { useEffect } from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        const bio = `
[ SINOPINHAS_OS // DEV_PROFILE ]
================================

> ESTUDANTE: Sistemas de Informação (3º Semestre)
> CONTEXTO:  Saúde & Tecnologia (Biomedicina Integrativa)
> STATUS:    Sempre aprendendo...

--------------------------------------------------

Sou um estudante de Sistemas de Informação, atualmente no terceiro semestre, começando a construir minha base na área de tecnologia. Ainda não me considero experiente, mas tenho curiosidade, vontade de aprender e gosto de usar a prática para evoluir, testando, errando e ajustando meus projetos.

Trabalho em uma clínica de biomedicina integrativa, o que me aproxima da área da saúde e me faz enxergar como tecnologia e bem-estar podem caminhar juntos. Esse ambiente também me inspira a pensar em soluções digitais que facilitem o dia a dia de pacientes, profissionais e da própria clínica.

Na faculdade de Sistemas de Informação, estou construindo os fundamentos de programação, lógica, bancos de dados e desenvolvimento de sistemas. Mesmo no início do curso, já busco aprender além da sala de aula, explorando ferramentas, tutoriais e projetos pessoais para ganhar confiança na área.

Gosto de experimentar com desenvolvimento web e mobile, mexendo em layouts, scripts e pequenos sistemas, sempre tentando entender como tudo se conecta do front ao backend. Vejo cada desafio técnico como uma oportunidade de aprender algo novo que pode ser útil tanto para futuros trabalhos quanto para projetos pessoais.

Mesmo não sendo experiente, tenho uma postura de crescimento: vou atrás de informação, estudo por conta própria, peço exemplos completos de código e procuro transformar teoria em prática sempre que possível. Meu objetivo é, com o tempo, unir o que aprendo na faculdade, o contato com a área de saúde na clínica e a tecnologia para construir soluções que façam diferença na vida das pessoas.

--------------------------------------------------
PRESS ENTER TO FINALIZE...
        `;

        let i = 0;
        let currentText = "";
        const speed = 20;
        console.log("%c [SISTEMA V4.0] Iniciando descriptografia...", "color: #00ff41; font-weight: bold;");

        const typingInterval = setInterval(() => {
            if (i < bio.length) {
                i++;
            } else {
                clearInterval(typingInterval);
                console.log("%c" + bio, "color: #00ff41; font-family: 'Courier New', monospace;");

                console.log(
                    "%c Ei curioso! %c Tem nada de especial aqui... ou será que tem? %c \n\n Digite acessarLogs() para ver a verdade ou explore os arquivos <3",
                    "background: #00ff41; color: #000; font-weight: bold; font-size: 14px; padding: 4px; border-radius: 4px;",
                    "color: #00ff41; font-weight: bold;",
                    "color: #888; font-style: italic;"
                );
            }
        }, speed);

        window.acessarLogs = () => {
            console.log("%c [ACESSO_AUTORIZADO] Redirecionando...", "color: #00ff41");
            window.location.href = '/shura-logs';
        };

        return () => clearInterval(typingInterval);
    }, []);

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
                <title>SINOPINHAS by SHURA</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
