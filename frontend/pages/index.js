import { useEffect, useState } from "react";
import Head from "next/head";

/* MOCK DATA - Troque por sua API no futuro */
const MOCK_STATS = [
  {
    id: "1",
    title: "Noite dos Memes",
    thumb: "/thumb1.jpg",
    avatar: "/user1.png",
    user: "Lulinha",
    comments: 13,
    likes: 55,
    views: 181,
    trending: true,
    lastComments: [
      { user: "Ana", avatar: "/user2.png", comment: "Kkkkkkk ri alto!" },
      { user: "Rogério", avatar: "/user3.png", comment: "Melhor vídeo" }
    ]
  },
  {
    id: "2",
    title: "Gato VS Pepino",
    thumb: "/thumb2.jpg",
    avatar: "/user4.png",
    user: "MariCat",
    comments: 8,
    likes: 33,
    views: 100,
    trending: false,
    lastComments: [
      { user: "Gui", avatar: "/user5.png", comment: "Tadinho, rs" }
    ]
  }
  // ...adicione mais vídeos se quiser
];

export default function Home() {
  // Simples gerenciamento de estado
  const [videos, setVideos] = useState(MOCK_STATS);
  const [tab, setTab] = useState("feed");
  const [logged, setLogged] = useState(true);
  const [msg, setMsg] = useState("");
  const [noti, setNoti] = useState(null);

  // Microinteração de notificação
  const notify = txt => {
    setNoti(txt);
    setTimeout(() => setNoti(null), 3000);
  };

  return (
    <>
      <Head>
        <title>SINOPINHAS - Social Vídeos</title>
        <meta name="theme-color" content="#8D6AFF" />
      </Head>
      {/* Fundo gradiente animado */}
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(120deg, #18142a 70%, #8d6aff 100%)",
          backgroundAttachment: "fixed"
        }}
      >
        {noti && (
          <div style={{
            position: "fixed", top: 36, right: 32, zIndex: 999,
            background: "#8d6aff", color: "#fff", padding: "16px 30px", fontWeight: 600, borderRadius: 16, boxShadow: "0 2px 12px #4443"
          }}>
            {noti}
          </div>
        )}

        {/* Header topo */}
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 40px",
          borderBottom: "2.5px solid #312672",
          background: "rgba(22, 17, 36, 0.93)",
          position: "sticky", top: 0, zIndex: 11
        }}>
          <h1 style={{
            fontFamily: "'Rubik', Arial, sans-serif",
            fontSize: 34,
            background: "linear-gradient(90deg, #8d6aff, #ff6f4e 70%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "bold",
            letterSpacing: "4px"
          }}>SINOPINHAS</h1>
          <nav style={{ display: "flex", gap: 18, alignItems: "center" }}>
            {["feed", "trend", "mural", "perfil"].map(tabName =>
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                style={{
                  fontSize: 18,
                  background: tab === tabName
                    ? "linear-gradient(90deg, #8d6aff 60%, #ff6f4e 140%)"
                    : "transparent",
                  color: tab === tabName ? "#fff" : "#c2bcf7",
                  border: "none",
                  outline: "none",
                  borderRadius: 24,
                  fontWeight: 600,
                  padding: "10px 28px",
                  cursor: "pointer",
                  boxShadow: tab === tabName ? "0 2px 24px #6c48ff80" : "none",
                  transition: "all .20s"
                }}
              >
                {tabName === "feed" && "Vídeos"}
                {tabName === "trend" && "🔥 Trending"}
                {tabName === "mural" && "Mural"}
                {tabName === "perfil" && "Meu Perfil"}
              </button>
            )}
            <div style={{
              width: 50, height: 50, background: "#25204a",
              alignItems: "center", justifyContent: "center", display: "flex",
              border: "3px solid #8d6aff", marginLeft: 30, borderRadius: 18
            }}>
              <img src="/user1.png" alt="avatar" width={40} style={{ borderRadius: 12 }} />
            </div>
          </nav>
        </header>

        <div style={{ padding: "44px 0 0" }}>
          {/* Trending */}
          {tab === "trend" && (
            <div style={{
              maxWidth: 1080,
              margin: "0 auto",
              padding: "14px 0 18px"
            }}>
              <h2 style={{
                color: "#fff", fontWeight: 700, fontSize: 30, letterSpacing: 1,
                marginBottom: 12
              }}>🔥 Destaques em alta</h2>
              <div style={{
                display: "flex", gap: 36, overflowX: "auto", paddingBottom: 10
              }}>
                {videos.filter(v=>v.trending).map(v => (
                  <div key={v.id} style={{
                    background: "#272052",
                    borderRadius: 16, minWidth: 380, boxShadow: "0 0 18px #0004",
                    position: "relative", padding: 18
                  }}>
                    <span style={{
                      position: "absolute",
                      right: 18, top: 7, background: "#ff6f4e",
                      color: "#fff", fontWeight: 700, fontSize: 13, borderRadius: 8,
                      padding: "4px 12px"
                    }}>
                      TRENDING
                    </span>
                    <img src={v.thumb} width="100%" height={190} alt={v.title}
                      style={{ borderRadius: 10, objectFit: "cover", marginBottom: 9 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <img src={v.avatar} width={38} height={38}
                        style={{ borderRadius: 14, border: "2px solid #fae4fe" }} />
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{v.user}</span>
                    </div>
                    <div style={{ color: "#e1d2ff", fontWeight: 700, margin: "7px 0" }}>{v.title}</div>
                    <div style={{ display: "flex", gap: 16, color: "#ff6f4e" }}>
                      <span>💬 {v.comments}</span>
                      <span>💜 {v.likes}</span>
                      <span>👁️ {v.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mural de recados */}
          {tab === "mural" && (
            <div style={{
              maxWidth: 760,
              margin: "0 auto",
              padding: "16px 0"
            }}>
              <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 28, marginBottom: 10 }}>📢 Mural de Recados</h2>
              <div style={{
                background: "#24204a", borderRadius: 16, padding: 20,
                boxShadow: "0 0 18px #8d6aff33"
              }}>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!msg.trim()) return;
                    notify("Recado postado!");
                  }}
                  style={{ display: "flex", gap: 12, marginBottom: 12 }}
                >
                  <input
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    style={{
                      flex: 1, fontSize: 18, padding: "12px 18px", borderRadius: 10,
                      border: "3px solid #373979", background: "#191731", color: "#fff"
                    }}
                    placeholder="[translate:Deixe seu recado para a galera!]"
                  />
                  <button
                    type="submit"
                    style={{
                      background: "linear-gradient(90deg, #8d6aff, #ff6f4e)",
                      color: "#fff", fontWeight: "bold", fontSize: 20,
                      border: "none", borderRadius: 10, padding: "0 28px", cursor: "pointer"
                    }}
                  >Postar</button>
                </form>
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 14
                  }}>
                    <img src="/user2.png" width={34} style={{ borderRadius: 13 }} />
                    <div>
                      <b style={{ color: "#ff6f4e" }}>Ana</b>
                      <span style={{
                        marginLeft: 8, background: "#312672", color: "#fff",
                        borderRadius: 6, fontSize: 13, padding: "1px 10px"
                      }}>🔥 “O vídeo do meme tá surreal!”</span>
                    </div>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 6
                  }}>
                    <img src="/user3.png" width={34} style={{ borderRadius: 13 }} />
                    <div>
                      <b style={{ color: "#ff6f4e" }}>Rogério</b>
                      <span style={{
                        marginLeft: 8, background: "#312672", color: "#fff",
                        borderRadius: 6, fontSize: 13, padding: "1px 10px"
                      }}>🚀 “Estou curtindo muito! Viva o SINOPINHAS!”</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feed social de vídeos */}
          {(tab === "feed" || tab === "trend") && (
            <div style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "30px 0 16px"
            }}>
              <h2 style={{
                color: "#fff", fontWeight: 700, fontSize: 29, letterSpacing: 2, marginBottom: 18
              }}>Grade de vídeos SOCIAIS</h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
                gap: 32
              }}>
                {videos.map(v => (
                  <div key={v.id} style={{
                    background: "#231d43", borderRadius: 15, boxShadow: "0 0 10px #8d6aff50",
                    padding: 18, position: "relative", transition: ".15s", overflow: "hidden"
                  }}>
                    <div style={{
                      width: "100%", aspectRatio: "16/9", background: "#130c23", borderRadius: 9,
                      marginBottom: 10, overflow: "hidden", position: "relative"
                    }}>
                      <img
                        src={v.thumb}
                        alt={v.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: ".2s", borderRadius: 8 }}
                        onMouseOver={e => e.currentTarget.style.filter = "brightness(1.2)"}
                        onMouseOut={e => e.currentTarget.style.filter = "none"}
                      />
                      {v.trending && (
                        <span style={{
                          position: "absolute", top: 9, left: 12, background: "#ff6f4e",
                          color: "#fff", borderRadius: 7, fontWeight: 700, fontSize: 13, padding: "3px 12px"
                        }}>🔥 Popular</span>
                      )}
                    </div>
                    <div style={{ margin: "3px 0", color: "#fff", fontWeight: 700, fontSize: 18 }}>{v.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <img src={v.avatar} width={31} height={31} style={{ borderRadius: 13 }} />
                      <span style={{ color: "#a496ef", fontWeight: 600 }}>{v.user}</span>
                    </div>
                    <div style={{
                      display: "flex", gap: 15, alignItems: "center", color: "#c5a0fd", fontWeight: 600, fontSize: 17,
                      marginBottom: 6
                    }}>
                      <span>💬 {v.comments}</span>
                      <span>💜 {v.likes}</span>
                      <span>👁️ {v.views}</span>
                    </div>
                    <div style={{ marginTop: 4, marginBottom: 8, color: "#ff6f4e", fontSize: 15 }}>
                      {[...v.lastComments].slice(0, 2).map(c => (
                        <div key={c.comment}>
                          <img src={c.avatar} width={18} style={{ borderRadius: 14, verticalAlign: "middle" }} />
                          <span style={{ marginLeft: 7, fontWeight: 700 }}>{c.user}:</span> {c.comment}
                        </div>
                      ))}
                    </div>

                    {/* Microinterações / botões de engajamento */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, marginTop: 6
                    }}>
                      <button onClick={() => notify("Você curtiu! 💜")} style={{
                        background: "#8d6aff", color: "#fff", border: "none", borderRadius: 8,
                        padding: "7px 18px", fontWeight: 700, boxShadow: "0 1px 4px #8d6aff55",
                        cursor: "pointer", fontSize: 16, transition: ".1s"
                      }}>👍 Curtir</button>
                      <button onClick={() => notify("Você não curtiu 😢")} style={{
                        background: "#332a3a", color: "#fff", border: "none", borderRadius: 8,
                        padding: "7px 18px", fontWeight: 700, cursor: "pointer", fontSize: 16,
                        borderLeft: "3px solid #ff6f4e", transition: ".1s"
                      }}>👎 Não curt</button>
                      <button onClick={() => notify("Comentário enviado!")}>
                        💬 Comentar
                      </button>
                      <button onClick={() => notify("Vídeo denunciado ao staff!")}>
                        🚨 Denunciar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Perfil avançado */}
          {tab === "perfil" && (
            <section style={{ maxWidth: 940, margin: "0 auto", padding: "18px 0" }}>
              <div style={{
                background: "linear-gradient(100deg, #231d43 72%, #8d6aff55 100%)",
                borderRadius: 30,
                boxShadow: "0 7px 32px #8d6aff50", padding: 32,
                display: "flex", gap: 32, alignItems: "flex-start"
              }}>
                <div>
                  <img src="/user1.png" width={124} style={{
                    borderRadius: 22,
                    border: "5px solid #ff6f4e",
                    background: "#201034"
                  }} />
                  <div style={{
                    color: "#fff", fontSize: 23, fontWeight: 700, margin: "17px 0 7px"
                  }}>Lulinha</div>
                  <span style={{
                    background: "#8d6aff", color: "#fff", borderRadius: 9, fontWeight: 700,
                    padding: "3px 10px", fontSize: 14
                  }}>🏆 Social Star</span>
                  <p style={{ color: "#cfc9ff", fontWeight: 400, margin: "12px 0", maxWidth: 180 }}>
                    [translate:Amo memes, gatos e subir trend do sinopinhas. Vem me seguir!]
                  </p>
                  <span style={{
                    background: "#25204a", color: "#ff6f4e", fontWeight: 600,
                    borderRadius: 7, fontSize: 14, padding: "3px 10px"
                  }}>506 seguidores</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: "#ff6f4e", margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: 1
                  }}>Vídeos postados</h3>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "10px 0 23px" }}>
                    {videos.map(v => (
                      <div key={v.id} style={{
                        background: "#1e1740", borderRadius: 13, width: 180, padding: 10
                      }}>
                        <img src={v.thumb} width={158} style={{ borderRadius: 10 }} />
                        <div style={{ color: "#fff", fontWeight: 700 }}>{v.title}</div>
                        <span style={{ color: "#8d6aff" }}>💜 {v.likes}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    background: "#291d44", color: "#fff", borderRadius: 13,
                    padding: "19px 27px", margin: "7px 0",
                    boxShadow: "0 2px 16px #ff425f23"
                  }}>
                    <b>🏆 Conquistas sociais:</b>
                    <ul style={{ color: "#ff6f4e", margin: "6px 0 0 0", fontSize: 15, fontWeight: 600 }}>
                      <li>💎 3212 likes totais</li>
                      <li>👑 8 topo dos trending</li>
                      <li>🔥 43 comentários marcantes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Banner compliance */}
          <div style={{
            maxWidth: 1180,
            margin: "43px auto 0",
            background: "#20153d",
            color: "#ff6f4e",
            fontWeight: 700,
            padding: "14px 14px",
            borderRadius: "11px",
            marginBottom: 14,
            textAlign: "center"
          }}>
            Toda atividade é rastreada. Postagens ilegais ou ofensivas podem ser auditadas e repassadas para autoridades, conforme a Lei 12.965/14. 
          </div>
        </div>

        {/* Footer social */}
        <footer style={{
          background: "linear-gradient(90deg, #18142a 70%, #3b2ba4 100%)",
          color: "#fff",
          fontSize: 15,
          padding: "26px 0",
          borderTop: "2px solid #ff6f4e",
          marginTop: 40
        }}>
          <div style={{
            maxWidth: 1140, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 44, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ color: "#ff6f4e", fontWeight: 900 }}>SINOPINHAS 💜</h3>
              <p>
                Rede social de vídeos para todos.<br />
                Participe dos desafios semanais, mural e trilhe sua história.
              </p>
            </div>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li>
                <a href="/faq" style={{ color: "#fff" }}>FAQ</a>
              </li>
              <li>
                <a href="/regras" style={{ color: "#fff" }}>Regras</a>
              </li>
              <li>
                <a href="/perfil" style={{ color: "#fff" }}>Meu Perfil</a>
              </li>
              <li>
                <a href="/contato" style={{ color: "#fff" }}>Canal de sugestões</a>
              </li>
            </ul>
            <div>
              <p><b>Aviso:</b> Atividade rastreada. Não colaboramos com crimes. Denúncias apuradas (Lei 12.965/2014).</p>
              <p style={{ fontSize: 13, color: "#aaa" }}>SINOPINHAS® 2025</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
