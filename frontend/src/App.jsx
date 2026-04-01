import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";
import "./App.css"

const API_URL = "http://localhost:8000";

const CHIPS = [
  "O que é reserva de emergência?",
  "Como investir meu dinheiro?",
  "O que é Tesouro Direto?",
  "Como sair das dívidas?",
  "Como organizar meu orçamento mensal?",
];

const COLORS = ["#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534"];

// ── helpers ──────────────────────────────────────────────────────────────────
const brl = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ── Markdown renderer simples ─────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return [];
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading ## ou ###
    if (/^###\s/.test(line)) {
      elements.push(<h4 key={i} className="md-h4">{line.replace(/^###\s/, "")}</h4>);
      i++; continue;
    }
    if (/^##\s/.test(line)) {
      elements.push(<h3 key={i} className="md-h3">{line.replace(/^##\s/, "")}</h3>);
      i++; continue;
    }
    if (/^#\s/.test(line)) {
      elements.push(<h2 key={i} className="md-h2">{line.replace(/^#\s/, "")}</h2>);
      i++; continue;
    }

    // Lista com * ou -
    if (/^[\*\-]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\*\-]\s/.test(lines[i])) {
        items.push(
          <li key={i}>{inlineFormat(lines[i].replace(/^[\*\-]\s/, ""))}</li>
        );
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="md-ul">{items}</ul>);
      continue;
    }

    // Lista numerada
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i}>{inlineFormat(lines[i].replace(/^\d+\.\s/, ""))}</li>
        );
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="md-ol">{items}</ol>);
      continue;
    }

    // Linha em branco
    if (line.trim() === "") {
      elements.push(<div key={i} className="md-br" />);
      i++; continue;
    }

    // Parágrafo normal
    elements.push(<p key={i} className="md-p">{inlineFormat(line)}</p>);
    i++;
  }

  return elements;
}

function inlineFormat(text) {
  // Divide texto pelos marcadores inline e retorna array de spans
  const parts = [];
  // Regex para bold (**texto** ou __texto__), italic (*texto* ou _texto_), code `text`
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|`([^`]+)`/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Texto antes do match
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }

    if (match[1]) {
      // Bold
      parts.push(<strong key={match.index} className="md-bold">{match[2]}</strong>);
    } else if (match[3]) {
      // Italic
      parts.push(<em key={match.index} className="md-italic">{match[4]}</em>);
    } else if (match[5]) {
      // Inline code
      parts.push(<code key={match.index} className="md-code">{match[5]}</code>);
    }

    last = regex.lastIndex;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length > 0 ? parts : text;
}

// ── Streaming hook ────────────────────────────────────────────────────────────
function useChat() {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);

  const send = useCallback(async (text) => {
    if (!text.trim() || streaming) return;
    setMessages((p) => [...p, { role: "user", content: text }]);
    setStreaming(true);
    setMessages((p) => [...p, { role: "assistant", content: "", done: false }]);

    try {
      const evtSource = new EventSource(
        `${API_URL}/chat/stream?mensagem=${encodeURIComponent(text)}`
      );
      evtSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.done) {
          evtSource.close();
          setMessages((p) => { const u=[...p]; u[u.length-1].done=true; return u; });
          setStreaming(false);
          return;
        }
        setMessages((p) => {
          const u = [...p];
          u[u.length-1] = { ...u[u.length-1], content: u[u.length-1].content + data.token };
          return u;
        });
      };
      evtSource.onerror = () => {
        evtSource.close(); setStreaming(false);
        setMessages((p) => {
          const u=[...p];
          if (!u[u.length-1].done) {
            u[u.length-1].done = true;
            if (!u[u.length-1].content)
              u[u.length-1].content = "Erro ao conectar. Verifique se o backend está rodando.";
          }
          return u;
        });
      };
    } catch { setStreaming(false); }
  }, [streaming]);

  return { messages, streaming, send };
}

// ── useDados — busca dados reais da API ───────────────────────────────────────
function useDados() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/dados`)
      .then((r) => r.json())
      .then((d) => { setDados(d); setLoading(false); })
      .catch(() => { setErro("Não foi possível carregar os dados."); setLoading(false); });
  }, []);

  return { dados, loading, erro };
}

// ── Animated number hook ──────────────────────────────────────────────────────
function useCountUp(target, duration = 1200, decimals = 2) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return value;
}

// ── Sub-components ────────────────────────────────────────────────────────────
const StarIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z"/>
  </svg>
);

const TypingDots = () => (
  <span className="typing-dots"><span /><span /><span /></span>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
    <span className="nav-icon">{icon}</span>
    <span>{label}</span>
  </button>
);

// Metric card com número animado
const MetricCard = ({ label, value, rawValue, sub, trend }) => {
  const isMonetary = typeof rawValue === "number" && rawValue > 99;
  const isPct = typeof rawValue === "number" && rawValue <= 100 && String(value).includes("%");
  const animated = useCountUp(rawValue || 0, 1400, isPct ? 1 : 2);

  const displayValue = rawValue !== undefined
    ? (isMonetary ? brl(animated) : isPct ? `${animated}%` : value)
    : value;

  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{displayValue}</p>
      {sub && <p className={`metric-sub ${trend === "up" ? "t-up" : trend === "down" ? "t-down" : ""}`}>{sub}</p>}
    </div>
  );
};

// Tooltip customizado
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="chart-tip">
      <p className="tip-label">{label}</p>
      <p className="tip-value">{typeof v === "number" && v > 99 ? brl(v) : `${v}%`}</p>
    </div>
  );
};

// Barra animada customizada para o BarChart
const AnimatedBar = (props) => {
  const { x, y, width, height, fill } = props;
  const [h, setH] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setH(height), 100);
    return () => clearTimeout(t);
  }, [height]);
  return (
    <rect
      x={x}
      y={y + height - h}
      width={width}
      height={h}
      fill={fill}
      rx={5}
      ry={5}
      style={{ transition: "height 0.8s cubic-bezier(0.34,1.56,0.64,1), y 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
    />
  );
};

// ── Chat Panel ────────────────────────────────────────────────────────────────
function ChatPanel() {
  const { messages, streaming, send } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    send(input.trim()); setInput("");
  };

  return (
    <div className="chat-panel">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-glow" />
          <div className="empty-icon"><StarIcon size={26} /></div>
          <h2 className="empty-title">Como posso te ajudar hoje?</h2>
          <p className="empty-sub">Pergunte sobre investimentos, orçamento, reserva de emergência…</p>
          <div className="chips">
            {CHIPS.map((c) => (
              <button key={c} className="chip"
                onClick={() => { send(c); inputRef.current?.focus(); }}>{c}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.role === "assistant" && (
                <div className="msg-av bot-av"><StarIcon size={14} /></div>
              )}
              <div className="bubble">
                {msg.role === "assistant" ? (
                  (!msg.done && msg.content === "")
                    ? <TypingDots />
                    : <div className="md-body">{renderMarkdown(msg.content)}</div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && <div className="msg-av user-av">J</div>}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="input-area">
        <div className="input-row">
          <textarea
            ref={inputRef} className="chat-input"
            placeholder="Escreva sua pergunta..." value={input} rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button className="send-btn" onClick={handleSend} disabled={streaming || !input.trim()}>↑</button>
        </div>
        <p className="input-hint">Enter para enviar · Shift+Enter para nova linha</p>
      </div>
    </div>
  );
}

// ── Dashboard Panel ───────────────────────────────────────────────────────────
function DashboardPanel() {
  const { dados, loading, erro } = useDados();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dados) {
      // pequeno delay para triggerar as animações após mount
      const t = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, [dados]);

  if (loading) return (
    <div className="dash-loading">
      <div className="loading-spinner" />
      <p>Carregando dados reais…</p>
    </div>
  );

  if (erro) return <div className="dash-loading" style={{color:"#f87171"}}>{erro}</div>;

  const { perfil, metricas, gastos_categoria, metas, reserva } = dados;

  const fluxoPie = [
    { name: "Gastos",  value: metricas.total_gastos  },
    { name: "Poupado", value: metricas.saldo_mes     },
  ];

  const reservaBar = [{ name: "Reserva", value: reserva.percentual, fill: "#4ade80" }];

  return (
    <div className={`dash-panel ${visible ? "dash-visible" : ""}`}>

      {/* ── Métricas ── */}
      <div className="metrics-row">
        <MetricCard
          label="PATRIMÔNIO TOTAL"
          value={brl(perfil.patrimonio_total)}
          rawValue={perfil.patrimonio_total}
          sub={`Objetivo: ${perfil.objetivo}`}
        />
        <MetricCard
          label="RENDA MENSAL"
          value={brl(metricas.total_receita)}
          rawValue={metricas.total_receita}
          sub="Salário outubro"
        />
        <MetricCard
          label="GASTOS DO MÊS"
          value={brl(metricas.total_gastos)}
          rawValue={metricas.total_gastos}
          sub={`Saldo: ${brl(metricas.saldo_mes)}`}
          trend={metricas.saldo_mes >= 0 ? "up" : "down"}
        />
        <MetricCard
          label="TAXA DE POUPANÇA"
          value={`${metricas.taxa_poupanca}%`}
          rawValue={metricas.taxa_poupanca}
          sub={metricas.taxa_poupanca >= 20 ? "▲ Acima da meta" : "▼ Abaixo da meta"}
          trend={metricas.taxa_poupanca >= 20 ? "up" : "down"}
        />
      </div>

      <div className="charts-grid">

        {/* Gastos por categoria */}
        <div className="chart-card span2">
          <p className="chart-title">GASTOS POR CATEGORIA — OUTUBRO</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gastos_categoria} margin={{ top:4, right:4, left:-10, bottom:0 }}>
              <CartesianGrid stroke="#1c2e20" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="cat" tick={{ fill:"#5a7a62", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#5a7a62", fontSize:11 }} axisLine={false} tickLine={false}
                     tickFormatter={(v) => `R$${v}`} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "#4ade8010" }} />
              <Bar dataKey="valor" shape={<AnimatedBar />} isAnimationActive={true}
                   animationBegin={0} animationDuration={1200} animationEasing="ease-out">
                {gastos_categoria.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Receita vs Gastos pie */}
        <div className="chart-card">
          <p className="chart-title">FLUXO DO MÊS</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={fluxoPie} cx="50%" cy="50%" innerRadius={36} outerRadius={58}
                   paddingAngle={3} dataKey="value" stroke="none"
                   isAnimationActive={true} animationBegin={200} animationDuration={1000}
                   animationEasing="ease-out">
                <Cell fill="#f87171" />
                <Cell fill="#4ade80" />
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {fluxoPie.map((item, i) => (
              <div key={i} className="pie-row">
                <div className="pie-left">
                  <span className="pie-dot" style={{ background: i === 0 ? "#f87171" : "#4ade80" }} />
                  {item.name}
                </div>
                <span className="pie-pct">{brl(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reserva de emergência */}
        <div className="chart-card">
          <p className="chart-title">RESERVA DE EMERGÊNCIA</p>
          <ResponsiveContainer width="100%" height={130}>
            <RadialBarChart cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                            data={reservaBar} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#1c2e20" }}
                         isAnimationActive={true} animationBegin={300} animationDuration={1400}
                         animationEasing="ease-out" />
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{ textAlign:"center", marginTop: 6 }}>
            <AnimatedPercent value={reserva.percentual} />
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>
              {brl(reserva.atual)} de {brl(reserva.necessaria)}
            </p>
            <p style={{ fontSize:11, color:"var(--gold)", marginTop:4 }}>
              ⚠ Cobre {reserva.meses_cobertos} mês(es) de gastos
            </p>
          </div>
        </div>

        {/* Metas */}
        <div className="chart-card span2">
          <p className="chart-title">METAS FINANCEIRAS</p>
          <div className="metas-list">
            {metas.map((m, i) => (
              <MetaItem key={i} m={m} delay={i * 150} />
            ))}
          </div>
        </div>

        {/* Resumo perfil */}
        <div className="chart-card">
          <p className="chart-title">PERFIL DO INVESTIDOR</p>
          <div className="summary-list">
            {[
              { label: "Nome",    val: perfil.nome },
              { label: "Perfil",  val: perfil.perfil_investidor },
              { label: "Renda",   val: brl(perfil.renda_mensal) },
              { label: "Objetivo",val: perfil.objetivo, small: true },
            ].map(({ label, val, small }) => (
              <div key={label} className="summary-row">
                <span className="summary-label">{label}</span>
                <span className="summary-val" style={small ? { fontSize:11 } : {}}>{val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// Percentual animado para reserva
function AnimatedPercent({ value }) {
  const animated = useCountUp(value, 1400, 1);
  return (
    <p style={{ fontSize:22, fontWeight:600, color:"var(--acc)" }}>{animated}%</p>
  );
}

// Meta item com barra animada
function MetaItem({ m, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(m.progresso ?? 20, 100)), delay + 400);
    return () => clearTimeout(t);
  }, [m, delay]);

  return (
    <div className="meta-item">
      <div className="meta-top">
        <span className="meta-name">{m.meta}</span>
        <span className="meta-prazo">Prazo: {m.prazo}</span>
      </div>
      <div className="meta-bar-bg">
        <div className="meta-bar-fill" style={{ width: `${width}%` }} />
      </div>
      <div className="meta-bottom">
        <span className="meta-pct">{m.progresso ? `${m.progresso}%` : "Em andamento"}</span>
        <span className="meta-valor">{brl(m.necessario)}</span>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("chat");

  return (
    <>
     

      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-head">
            <div className="logo">
              <div className="logo-icon"><StarIcon size={18} /></div>
              <span className="logo-name">Edu</span>
            </div>
            <p className="logo-sub">Educador Financeiro</p>
          </div>
          <nav className="sidebar-nav">
            <NavItem icon="💬" label="Conversa"  active={tab==="chat"}      onClick={() => setTab("chat")} />
            <NavItem icon="📊" label="Dashboard" active={tab==="dashboard"} onClick={() => setTab("dashboard")} />
            <div className="sidebar-div" />
            <NavItem icon="🎯" label="Metas"        active={false} onClick={() => {}} />
            <NavItem icon="📁" label="Histórico"     active={false} onClick={() => {}} />
            <NavItem icon="⚙️" label="Configurações" active={false} onClick={() => {}} />
          </nav>
          <div className="sidebar-footer">
            <div className="user-av2">👤</div>
            <div>
              <p className="user-name">João Silva</p>
              <p className="user-badge"><span className="badge-dot" /> Perfil Moderado</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="topbar">
            <span className="topbar-title">
              {tab === "chat" ? "Conversa com Edu" : "Dashboard Financeiro"}
            </span>
            <div className="online-badge">
              <span className="online-dot" />
              Edu online · IA Generativa
            </div>
          </div>
          {tab === "chat"      && <ChatPanel />}
          {tab === "dashboard" && <DashboardPanel />}
        </main>
      </div>
    </>
  );
}