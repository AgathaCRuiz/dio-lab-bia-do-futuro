import streamlit as st

# ── IMPORTS DO PROJETO ──
from services.chat_service import responder
from ui.styles import aplicar_css
from ui.components import (
    render_header,
    render_chat,
    render_empty_state,
    render_footer,
    render_user_message,
    render_bot_message
)

# ── CONFIGURAÇÃO DA PÁGINA ──
st.set_page_config(
    page_title="Edu - Educador Financeiro",
    page_icon="💰",
    layout="centered"
)

# ── APLICAR ESTILO ──
aplicar_css(st)

# ── INICIALIZAÇÃO DO ESTADO ──
if "messages" not in st.session_state:
    st.session_state["messages"] = []

# Criamos uma chave para capturar o clique dos chips
if "chat_input_value" not in st.session_state:
    st.session_state["chat_input_value"] = None

# ── RENDERIZAÇÃO DA UI ──
render_header()

# Se não houver mensagens, mostra os chips e o texto inicial
if not st.session_state["messages"]:
    render_empty_state()
else:
    # Se houver mensagens, renderiza o histórico
    render_chat(st.session_state["messages"])

# ── LÓGICA DE ENTRADA (INPUT OU CHIP) ──
prompt = st.chat_input("Escreva sua pergunta...")

# A mágica acontece aqui: 
# A pergunta será o que foi digitado OU o que foi clicado no chip
pergunta = prompt or st.session_state["chat_input_value"]

if pergunta:
    # 1. Limpa o valor do chip para a próxima interação
    st.session_state["chat_input_value"] = None

    # 2. Salva e mostra a mensagem do usuário
    st.session_state["messages"].append({"role": "user", "content": pergunta})
    
    # Renderiza na hora para dar feedback visual
    render_user_message(pergunta)

    # 3. Resposta do agente
    with st.spinner(""):
        resposta = responder(pergunta)

    # 4. Salva e mostra a resposta do bot
    st.session_state["messages"].append({"role": "assistant", "content": resposta})
    render_bot_message(resposta)

    # 5. Atualiza a tela para limpar o estado inicial e mostrar o chat novo
    st.rerun()

# ── FOOTER ──
render_footer()