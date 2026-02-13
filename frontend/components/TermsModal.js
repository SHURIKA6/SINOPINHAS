import { useState } from 'react';

export default function TermsModal({ onAccept, onDecline }) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreedToAll, setAgreedToAll] = useState(false);
  const [readPercentage, setReadPercentage] = useState(0);

  const handleScroll = (e) => {
    const element = e.target;

    // Calcular progresso de leitura
    const winScroll = element.scrollTop;
    const height = element.scrollHeight - element.clientHeight;
    const scrolled = Math.min(100, Math.ceil((winScroll / height) * 100));
    setReadPercentage(scrolled);

    const bottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 40; // Mais permissivo para mobile
    if (bottom || scrolled > 98) {
      setHasScrolled(true);
    }
  };

  const canAccept = hasScrolled && agreedToAll;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.98)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px',
      overflow: 'hidden'
    }} className="modal-overlay">
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: 20,
        padding: '24px 20px',
        maxWidth: 750,
        width: '100%',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid var(--accent-color)',
        boxShadow: '0 0 40px rgba(141, 106, 255, 0.3)',
        transition: 'all 0.3s ease',
        position: 'relative'
      }} className="modal-container">

        {/* Barra de Progresso de Leitura */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${readPercentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8d6aff, #fe7d45)',
            transition: 'width 0.2s ease'
          }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16, marginTop: 8 }}>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            background: 'linear-gradient(90deg,#8d6aff,#fe7d45)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 4
          }}>
            SINOPINHAS
          </h1>
          <h2 style={{ margin: 0, fontSize: 16, color: 'var(--text-color)', fontWeight: 600 }}>
            Termos e Responsabilidade
          </h2>
          <div style={{
            fontSize: 11,
            color: hasScrolled ? '#10b981' : '#fe7d45',
            marginTop: 4,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
            {hasScrolled ? '✅ LEITURA CONCLUÍDA' : `📖 LEITURA: ${readPercentage}%`}
          </div>
        </div>

        <div
          onScroll={handleScroll}
          className="scroll-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 16px',
            color: 'var(--text-color)',
            lineHeight: 1.6,
            fontSize: 14,
            marginBottom: 16,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Instrução Inicial para Celular */}
          {!hasScrolled && readPercentage < 10 && (
            <div style={{
              background: 'rgba(141, 106, 255, 0.1)',
              padding: '12px',
              borderRadius: 8,
              border: '1px dashed var(--accent-color)',
              textAlign: 'center',
              marginBottom: 20
            }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--accent-color)', fontWeight: 600 }}>
                📱 Role para baixo para ler e habilitar o botão
              </p>
            </div>
          )}

          <div style={{ marginBottom: 24, background: 'rgba(239, 68, 68, 0.15)', padding: 16, borderRadius: 8, border: '2px solid #ef4444' }}>
            <h3 style={{ color: '#ff6b6b', fontSize: 18, marginBottom: 12, marginTop: 0 }}>
              🚨 AVISO LEGAL IMPORTANTE
            </h3>
            <p style={{ color: '#fff', fontWeight: 700, margin: 0 }}>
              AO ACEITAR ESTES TERMOS, VOCÊ ESTÁ CELEBRANDO UM CONTRATO JURIDICAMENTE VINCULANTE COM O SINOPINHAS.
              VOCÊ SERÁ LEGALMENTE RESPONSÁVEL POR TODAS AS AÇÕES REALIZADAS ATRAVÉS DA SUA CONTA.
              LEIA ATENTAMENTE CADA SEÇÃO ANTES DE CONTINUAR.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              1. ACEITAÇÃO E CONCORDÂNCIA TOTAL
            </h3>
            <p>
              Este documento constitui um <strong>ACORDO LEGAL VINCULANTE</strong> entre você (doravante "Usuário") e a plataforma SINOPINHAS (doravante "Plataforma" ou "Nós").
            </p>
            <p>
              Ao clicar em "Aceito", você declara sob as penas da lei que:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>É <strong>maior de 18 anos</strong> ou tem autorização legal de responsável</li>
              <li>Leu, compreendeu e concorda com <strong>TODOS</strong> os termos aqui apresentados</li>
              <li>Está em <strong>pleno gozo de suas faculdades mentais</strong> para celebrar este contrato</li>
              <li>Não está sob coação, influência ou impedimento legal para aceitar estes termos</li>
              <li>Assume <strong>total responsabilidade civil e criminal</strong> por suas ações na plataforma</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              2. PROIBIÇÕES ABSOLUTAS E CONSEQUÊNCIAS LEGAIS
            </h3>
            <p style={{ color: '#ff6b6b', fontWeight: 700 }}>
              São TERMINANTEMENTE PROIBIDOS os seguintes atos, sob pena de responsabilização CIVIL e CRIMINAL:
            </p>
            <ul style={{ paddingLeft: 20, color: '#ff6b6b' }}>
              <li><strong>PORNOGRAFIA INFANTIL</strong> - Crime previsto no Art. 241-A do ECA (pena de 3 a 6 anos de reclusão)</li>
              <li><strong>APOLOGIA AO CRIME</strong> - Art. 287 do Código Penal (pena de 3 a 6 meses ou multa)</li>
              <li><strong>RACISMO E DISCRIMINAÇÃO</strong> - Lei 7.716/89 (pena de 2 a 5 anos de reclusão)</li>
              <li><strong>DIFAMAÇÃO E CALÚNIA</strong> - Arts. 138-140 do Código Penal</li>
              <li><strong>AMEAÇA E EXTORSÃO</strong> - Arts. 147 e 158 do Código Penal</li>
              <li><strong>VIOLAÇÃO DE DIREITOS AUTORAIS</strong> - Lei 9.610/98 (pena de 3 meses a 4 anos)</li>
              <li><strong>INVASÃO DE DISPOSITIVO</strong> - Art. 154-A do Código Penal (pena de 3 meses a 1 ano)</li>
              <li><strong>FRAUDE E ESTELIONATO</strong> - Art. 171 do Código Penal (pena de 1 a 5 anos)</li>
              <li><strong>DIVULGAÇÃO DE FAKE NEWS</strong> - Conforme Lei 14.155/2021</li>
            </ul>
            <p style={{ color: '#fff', fontWeight: 700, background: 'rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: 8, marginTop: 12 }}>
              ⚠️ VOCÊ SERÁ BANIDO IMEDIATAMENTE E TODOS OS SEUS DADOS SERÃO ENTREGUES ÀS AUTORIDADES COMPETENTES (POLÍCIA FEDERAL, POLÍCIA CIVIL, MINISTÉRIO PÚBLICO).
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              3. PROPRIEDADE INTELECTUAL E DIREITOS AUTORAIS
            </h3>
            <p>
              Você <strong>DECLARA SOB AS PENAS DA LEI</strong> que:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Possui <strong>TODOS os direitos autorais</strong> sobre o conteúdo que envia</li>
              <li><strong>NÃO está violando</strong> direitos de terceiros (imagem, voz, criação intelectual)</li>
              <li>Obteve <strong>autorização expressa</strong> de todas as pessoas que aparecem em seus vídeos</li>
              <li>Concede à Plataforma licença não-exclusiva, mundial e gratuita para hospedar e exibir seu conteúdo</li>
            </ul>
            <p style={{ color: '#fbbf24', fontWeight: 600, marginTop: 12 }}>
              📢 <strong>AVISO DE DMCA:</strong> Respeitamos a Lei de Direitos Autorais. Se você acredita que seu conteúdo foi usado indevidamente, envie notificação formal com identificação clara do material.
            </p>
            <p style={{ color: '#ff6b6b', fontWeight: 600 }}>
              ⚠️ <strong>FALSA DECLARAÇÃO DE AUTORIA:</strong> Constitui crime de falsidade ideológica (Art. 299 do Código Penal).
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              4. RASTREAMENTO FORENSE E COLETA DE DADOS (LGPD)
            </h3>
            <p>
              Em conformidade com a <strong>Lei nº 13.709/2018 (LGPD)</strong> e o <strong>Marco Civil da Internet (Lei 12.965/2014)</strong>, informamos que coletamos e armazenamos:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li><strong>Endereço IP real</strong> (IPv4/IPv6, não mascarado por VPN/Proxy/Tor)</li>
              <li><strong>Geolocalização precisa</strong> (latitude/longitude, cidade, estado, país)</li>
              <li><strong>Fingerprint digital único</strong> (Canvas, WebGL, renderizador GPU, extensões gráficas)</li>
              <li><strong>Fingerprint de áudio</strong> (compressão dinâmica do driver de som para identificação de hardware)</li>
              <li><strong>Provedor de Internet (ISP)</strong> e número ASN</li>
              <li><strong>Informações de hardware</strong> (modelo do dispositivo, CPU, memória, sistema operacional, navegador)</li>
              <li><strong>Status da bateria</strong> (nível de carga, carregamento, tempo restante)</li>
              <li><strong>Fontes instaladas</strong> no dispositivo (detecção por medição de renderização)</li>
              <li><strong>Permissões do navegador</strong> (câmera, microfone, geolocalização, notificações)</li>
              <li><strong>Sensores do dispositivo</strong> (touch, acelerômetro, giroscópio, bluetooth, USB)</li>
              <li><strong>Histórico completo de atividades</strong> (uploads, downloads, comentários, mensagens, visualizações)</li>
              <li><strong>Metadados de arquivos</strong> (EXIF, data de criação, geolocalização de fotos/vídeos)</li>
              <li><strong>Logs de acesso</strong> com timestamps precisos em UTC</li>
              <li><strong>Dados de tela e display</strong> (resolução, densidade de pixels, profundidade de cor, timezone)</li>
            </ul>
            <p style={{ color: '#10b981', fontWeight: 600, marginTop: 12 }}>
              ✅ <strong>FINALIDADE:</strong> Segurança, prevenção de fraudes, cumprimento legal, investigação de crimes.
            </p>
            <p style={{ color: '#8d6aff', fontWeight: 600 }}>
              🔒 <strong>RETENÇÃO:</strong> Os dados são armazenados por até 6 meses após exclusão da conta (conforme Marco Civil Art. 15).
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              5. COOPERAÇÃO TOTAL COM AUTORIDADES
            </h3>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
              O SINOPINHAS <strong>COLABORA INTEGRALMENTE E IMEDIATAMENTE</strong> com:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li><strong>Polícia Federal</strong></li>
              <li><strong>Polícia Civil</strong></li>
              <li><strong>Ministério Público</strong></li>
              <li><strong>Poder Judiciário</strong></li>
              <li><strong>Safernet Brasil</strong></li>
              <li><strong>Interpol</strong> (em casos internacionais)</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              <strong>FORNECEREMOS TODOS OS DADOS COLETADOS</strong> mediante:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Ordem judicial</li>
              <li>Requisição do Ministério Público</li>
              <li>Investigação policial formal</li>
              <li>Denúncia de crime previsto na legislação brasileira</li>
            </ul>
            <p style={{ color: '#ff6b6b', fontWeight: 700, background: 'rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: 8, marginTop: 12 }}>
              🚨 <strong>IMPORTANTE:</strong> NÃO há "anonimato" ou "privacidade absoluta" quando se trata de crimes.
              VOCÊ SERÁ IDENTIFICADO, LOCALIZADO E RESPONSABILIZADO.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              6. LIMITAÇÃO DE RESPONSABILIDADE E ISENÇÕES
            </h3>
            <p>
              A Plataforma <strong>NÃO SE RESPONSABILIZA</strong> por:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Conteúdo gerado por usuários (artigo 19 do Marco Civil da Internet)</li>
              <li>Danos diretos, indiretos, lucros cessantes ou danos morais</li>
              <li>Interrupções de serviço por manutenção, falhas técnicas ou ataques DDoS</li>
              <li>Perda de dados por problemas técnicos ou exclusão voluntária</li>
              <li>Uso indevido da plataforma por terceiros</li>
              <li>Vírus, malware ou ataques cibernéticos originados de conteúdo de usuários</li>
            </ul>
            <p style={{ fontWeight: 600, marginTop: 12 }}>
              A plataforma é fornecida <strong>"NO ESTADO EM QUE SE ENCONTRA"</strong> (AS IS), sem garantias expressas ou implícitas.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              7. DIREITOS DA PLATAFORMA
            </h3>
            <p>
              Reservamo-nos o direito de, <strong>A QUALQUER MOMENTO E SEM AVISO PRÉVIO:</strong>
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Remover, editar ou moderar qualquer conteúdo</li>
              <li>Suspender ou banir permanentemente qualquer usuário</li>
              <li>Encerrar contas que violem estes termos</li>
              <li>Modificar ou descontinuar funcionalidades do serviço</li>
              <li>Compartilhar informações com autoridades mesmo sem ordem judicial (em casos urgentes)</li>
              <li>Bloquear acesso de determinados países ou regiões</li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              8. RESPONSABILIDADE CIVIL E CRIMINAL DO USUÁRIO
            </h3>
            <p style={{ fontWeight: 700, color: '#fff' }}>
              Você é INTEGRALMENTE RESPONSÁVEL por:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Todo conteúdo que enviar, publicar ou compartilhar</li>
              <li>Comentários, mensagens e interações com outros usuários</li>
              <li>Uso da sua conta (mesmo que terceiros tenham acesso)</li>
              <li>Danos causados a terceiros através da plataforma</li>
              <li>Violações de leis brasileiras ou internacionais</li>
            </ul>
            <p style={{ color: '#ff6b6b', fontWeight: 700, marginTop: 12 }}>
              ⚖️ Você concorda em <strong>INDENIZAR E ISENTAR</strong> a Plataforma de qualquer reclamação, ação judicial ou prejuízo decorrente do seu uso inadequado do serviço.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              9. DENÚNCIAS E CANAL DE COMUNICAÇÃO
            </h3>
            <p>
              Para denunciar conteúdo ilegal, abusivo ou que viole direitos:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Use o sistema de denúncia interno da plataforma</li>
              <li>Entre em contato através dos canais oficiais</li>
              <li>Em casos graves, reporte diretamente à Safernet: <strong>www.safernet.org.br</strong></li>
            </ul>
            <p style={{ fontWeight: 600, marginTop: 12 }}>
              ⚡ Respondemos a denúncias em até <strong>48 horas úteis</strong>. Conteúdo ilegal é removido imediatamente.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              10. ALTERAÇÕES NOS TERMOS
            </h3>
            <p>
              Podemos modificar estes termos a qualquer momento. Alterações substanciais serão notificadas através da plataforma.
            </p>
            <p style={{ fontWeight: 600 }}>
              O uso continuado após modificações constitui <strong>ACEITAÇÃO TÁCITA</strong> dos novos termos.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              11. LEGISLAÇÃO APLICÁVEL E FORO
            </h3>
            <p>
              Estes termos são regidos pelas <strong>leis da República Federativa do Brasil</strong>, especialmente:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li><strong>Constituição Federal de 1988</strong></li>
              <li><strong>Código Civil Brasileiro (Lei 10.406/2002)</strong></li>
              <li><strong>Código Penal Brasileiro (Decreto-Lei 2.848/1940)</strong></li>
              <li><strong>Lei nº 12.965/2014</strong> - Marco Civil da Internet</li>
              <li><strong>Lei nº 13.709/2018</strong> - LGPD (Lei Geral de Proteo de Dados)</li>
              <li><strong>Lei nº 8.069/1990</strong> - Estatuto da Criança e do Adolescente (ECA)</li>
              <li><strong>Lei nº 9.610/1998</strong> - Lei de Direitos Autorais</li>
              <li><strong>Lei nº 12.737/2012</strong> - Lei Carolina Dieckmann (crimes cibernéticos)</li>
            </ul>
            <p style={{ fontWeight: 600, marginTop: 12 }}>
              <strong>FORO:</strong> Fica eleito o foro da Comarca de [SUA CIDADE], Estado de [SEU ESTADO], para dirimir quaisquer controvérsias oriundas deste contrato.
            </p>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '3px solid #ef4444',
            borderRadius: 12,
            padding: 20,
            marginTop: 30
          }}>
            <h3 style={{ color: '#ff6b6b', margin: '0 0 12px', textAlign: 'center' }}>
              ⚠️ DECLARAÇÃO FINAL DE RESPONSABILIDADE
            </h3>
            <p style={{ color: '#fff', fontWeight: 700, textAlign: 'center', margin: 0, fontSize: 15 }}>
              AO ACEITAR ESTES TERMOS, VOCÊ DECLARA EXPRESSAMENTE QUE:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#fff' }}>
              <li>Leu INTEGRALMENTE todos os 11 itens acima</li>
              <li>Compreendeu COMPLETAMENTE todas as cláusulas e suas implicações legais</li>
              <li>Concorda VOLUNTARIAMENTE e sem ressalvas com todos os termos</li>
              <li>Assume TOTAL responsabilidade civil e criminal por suas ações</li>
              <li>Está ciente de que PODE SER RASTREADO e responsabilizado legalmente</li>
              <li>Autoriza a coleta e uso dos dados conforme descrito</li>
            </ul>
          </div>

          <div style={{ height: 50 }}></div>
        </div>

        <div style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--accent-color)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreedToAll}
              onChange={(e) => setAgreedToAll(e.target.checked)}
              style={{ marginTop: 4, width: 18, height: 18, cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--text-color)', fontSize: 14, lineHeight: 1.6 }}>
              <strong>CONFIRMO</strong> que li e compreendi TODOS os 11 itens dos Termos de Uso acima,
              e concordo integralmente com todas as cláusulas apresentadas, assumindo total responsabilidade
              por minhas ações na plataforma.
            </span>
          </label>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <button
            onClick={onDecline}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '14px 24px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#dc2626'}
            onMouseLeave={(e) => e.target.style.background = '#ef4444'}
          >
            ❌ Recusar e Sair
          </button>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '14px 24px',
              background: canAccept ? '#10b981' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: canAccept ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: canAccept ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (canAccept) e.target.style.background = '#059669';
            }}
            onMouseLeave={(e) => {
              if (canAccept) e.target.style.background = '#10b981';
            }}
          >
            ✅ Concordo e Aceito os Termos
          </button>
        </div>

        {!hasScrolled && (
          <div style={{
            textAlign: 'center',
            color: '#fbbf24',
            fontSize: 14,
            marginTop: 8,
            fontWeight: 'bold',
            animation: 'pulse 1.5s infinite',
            background: 'rgba(251, 191, 36, 0.1)',
            padding: '8px',
            borderRadius: '8px'
          }}>
            ⚠️ Continue lendo para habilitar o botão ({readPercentage}%)
          </div>
        )}

        {hasScrolled && !agreedToAll && (
          <p style={{
            textAlign: 'center',
            color: '#fbbf24',
            fontSize: 14,
            marginTop: 8,
            fontWeight: 'bold'
          }}>
            ☑️ Agora marque a caixa de confirmação
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
        }
        
        @media (max-width: 768px) {
          .modal-container {
            padding: 16px !important;
            margin: 0 !important;
            border-radius: 0 !important;
            height: 100vh !important;
            max-height: 100vh !important;
          }
          
          .scroll-content {
            padding: 0 10px !important;
          }

          h1 { font-size: 22px !important; }
          h2 { font-size: 14px !important; }
          
          button {
            padding: 12px 16px !important;
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
