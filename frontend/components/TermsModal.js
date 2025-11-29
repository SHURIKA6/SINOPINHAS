import { useState } from 'react';

export default function TermsModal({ onAccept, onDecline }) {
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom) {
      setHasScrolled(true);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1a40 100%)',
        borderRadius: 16,
        padding: 32,
        maxWidth: 700,
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #8d6aff',
        boxShadow: '0 20px 60px rgba(141, 106, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            background: 'linear-gradient(90deg,#8d6aff,#fe7d45)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>
            SINOPINHAS
          </h1>
          <h2 style={{ margin: 0, fontSize: 18, color: '#aaa' }}>
            Termos de Uso e Política de Privacidade
          </h2>
        </div>

        <div
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 20px',
            color: '#ccc',
            lineHeight: 1.8,
            fontSize: 14
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#8d6aff', fontSize: 16, marginBottom: 12 }}>
              ⚠️ ATENÇÃO - LEIA COM ATENÇÃO ANTES DE USAR
            </h3>
            <p style={{ color: '#fff', fontWeight: 600 }}>
              Ao aceitar estes termos, você confirma que leu, compreendeu e concorda integralmente com todas as disposições abaixo.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              1. ACEITAÇÃO DOS TERMOS
            </h3>
            <p>
              Este site é operado por <strong>SINOPINHAS</strong>. Ao acessar e usar esta plataforma, você concorda em cumprir e estar vinculado aos seguintes termos e condições. Se você não concordar com qualquer parte destes termos, <strong>NÃO USE ESTE SITE</strong>.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              2. USO PERMITIDO E PROIBIDO
            </h3>
            <p><strong>É ESTRITAMENTE PROIBIDO:</strong></p>
            <ul style={{ paddingLeft: 20, color: '#ff6b6b' }}>
              <li>Fazer upload de conteúdo <strong>pornográfico infantil</strong></li>
              <li>Compartilhar conteúdo que incite <strong>violência, ódio, racismo ou discriminação</strong></li>
              <li>Publicar material protegido por <strong>direitos autorais</strong> sem autorização</li>
              <li>Divulgar conteúdo <strong>ilegal, difamatório ou que viole leis brasileiras</strong></li>
              <li>Fazer upload de vírus, malware ou qualquer código malicioso</li>
              <li>Praticar <strong>cyberbullying, assédio ou intimidação</strong></li>
              <li>Usar a plataforma para <strong>golpes, fraudes ou spam</strong></li>
              <li>Tentar hackear, invadir ou comprometer a segurança do sistema</li>
            </ul>
            <p style={{ color: '#ff6b6b', fontWeight: 600, marginTop: 12 }}>
              ⚠️ QUALQUER VIOLAÇÃO DESTES TERMOS RESULTARÁ EM BANIMENTO IMEDIATO E COMUNICAÇÃO ÀS AUTORIDADES COMPETENTES.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              3. DIREITOS AUTORAIS E PROPRIEDADE INTELECTUAL
            </h3>
            <p>
              Você <strong>declara e garante</strong> que possui todos os direitos, licenças e permissões necessárias sobre o conteúdo que envia. Ao fazer upload de vídeos, você concede ao SINOPINHAS uma licença não exclusiva, mundial e gratuita para hospedar, armazenar e exibir seu conteúdo na plataforma.
            </p>
            <p style={{ color: '#fbbf24', fontWeight: 600 }}>
              📢 Se você acredita que seu conteúdo foi usado sem autorização, entre em contato conosco imediatamente para remoção.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              4. RASTREAMENTO E COLETA DE DADOS
            </h3>
            <p>
              Para garantir a segurança da plataforma e cumprir com a legislação brasileira, coletamos e armazenamos as seguintes informações:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li><strong>Endereço IP real</strong> (não mascarado por VPN/proxy)</li>
              <li><strong>Geolocalização</strong> (cidade, estado, país, coordenadas GPS)</li>
              <li><strong>Fingerprint digital único</strong> do dispositivo (GPU, CPU, resolução, fontes, hardware)</li>
              <li><strong>Histórico completo de ações</strong> (uploads, comentários, visualizações)</li>
              <li><strong>Informações do navegador</strong> (User-Agent, idioma, timezone)</li>
              <li><strong>Provedor de internet (ISP)</strong> e ASN</li>
              <li><strong>Tipo de dispositivo</strong> (sistema operacional, modelo, resolução)</li>
            </ul>
            <p style={{ color: '#10b981', fontWeight: 600, marginTop: 12 }}>
              ✅ Estes dados são usados exclusivamente para segurança, prevenção de fraudes e cumprimento legal.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              5. COOPERAÇÃO COM AUTORIDADES
            </h3>
            <p style={{ color: '#fff', fontWeight: 600 }}>
              O SINOPINHAS <strong>COLABORA INTEGRALMENTE</strong> com autoridades policiais e judiciais brasileiras.
            </p>
            <p>
              Em caso de requisição legal (mandado judicial, intimação, investigação policial), forneceremos <strong>TODOS OS DADOS</strong> coletados, incluindo:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Logs completos de acesso e atividade</li>
              <li>Endereço IP, localização geográfica e provedor de internet</li>
              <li>Fingerprint digital do dispositivo</li>
              <li>Histórico de uploads, comentários e mensagens</li>
              <li>Metadados de arquivos enviados</li>
            </ul>
            <p style={{ color: '#ff6b6b', fontWeight: 700, marginTop: 12 }}>
              🚨 NÃO TOLERAMOS CRIMES. SE VOCÊ COMETER ILEGALIDADES, SERÁ RASTREADO E RESPONSABILIZADO.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              6. LIMITAÇÃO DE RESPONSABILIDADE
            </h3>
            <p>
              O SINOPINHAS <strong>NÃO SE RESPONSABILIZA</strong> por:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>Conteúdo publicado por usuários</li>
              <li>Danos diretos ou indiretos causados pelo uso da plataforma</li>
              <li>Perda de dados, lucros ou qualquer prejuízo consequente</li>
              <li>Disponibilidade contínua do serviço (podemos ter manutenções e interrupções)</li>
            </ul>
            <p>
              A plataforma é fornecida <strong>"NO ESTADO EM QUE SE ENCONTRA"</strong>, sem garantias de qualquer tipo.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              7. MODERAÇÃO E REMOÇÃO DE CONTEÚDO
            </h3>
            <p>
              Reservamos o direito de <strong>remover qualquer conteúdo</strong> e <strong>banir qualquer usuário</strong> que viole estes termos, a nosso exclusivo critério, sem aviso prévio.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              8. ALTERAÇÕES NOS TERMOS
            </h3>
            <p>
              Podemos atualizar estes termos a qualquer momento. O uso continuado da plataforma após alterações constitui aceitação dos novos termos.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              9. LEI APLICÁVEL
            </h3>
            <p>
              Estes termos são regidos pelas <strong>leis brasileiras</strong>, especialmente:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li><strong>Lei nº 12.965/2014</strong> (Marco Civil da Internet)</li>
              <li><strong>Lei nº 13.709/2018</strong> (LGPD - Lei Geral de Proteção de Dados)</li>
              <li><strong>Código Penal Brasileiro</strong> (crimes cibernéticos)</li>
              <li><strong>Estatuto da Criança e do Adolescente (ECA)</strong></li>
            </ul>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#fe7d45', fontSize: 16, marginBottom: 10 }}>
              10. CONTATO
            </h3>
            <p>
              Para dúvidas, denúncias ou solicitações relacionadas a estes termos, entre em contato através do email da plataforma.
            </p>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444',
            borderRadius: 8,
            padding: 16,
            marginTop: 24
          }}>
            <p style={{ color: '#fff', fontWeight: 700, textAlign: 'center', margin: 0 }}>
              ⚠️ AO ACEITAR, VOCÊ DECLARA TER LIDO E COMPREENDIDO TODOS OS TERMOS ACIMA
            </p>
          </div>
        </div>

        <div style={{
          marginTop: 24,
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
          >
            ❌ Recusar e Sair
          </button>
          <button
            onClick={onAccept}
            disabled={!hasScrolled}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '14px 24px',
              background: hasScrolled ? '#10b981' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: hasScrolled ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: hasScrolled ? 1 : 0.5
            }}
          >
            ✅ Li e Aceito os Termos
          </button>
        </div>
        
        {!hasScrolled && (
          <p style={{
            textAlign: 'center',
            color: '#fbbf24',
            fontSize: 13,
            marginTop: 12,
            marginBottom: 0
          }}>
            ⬆️ Role até o final para aceitar
          </p>
        )}
      </div>
    </div>
  );
}
// =====================================================================