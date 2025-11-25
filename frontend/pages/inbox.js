import { useState } from "react";
export default function Inbox() {
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");
  const [to, setTo] = useState("");
  return (
    <div style={{maxWidth:500,margin:"60px auto",background:"#26245c",borderRadius:18,padding:30}}>
      <h2 style={{color:"#ff6f4e"}}>Mensagens Privadas</h2>
      <input placeholder="Para quem?" value={to} onChange={e=>setTo(e.target.value)} />
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} style={{width:"100%"}}/>
      <button onClick={()=>{
        /* Aqui faria fetch("/api/send-message"... no seu backend */
        setChat([...chat, {to, msg, ts: Date.now() }]);
      }}>Enviar</button>
      <div>
        {chat.map((m,ix)=>(<div key={ix}><b>{m.to}</b>: {m.msg}</div>))}
      </div>
    </div>
  );
}
