import streamlit as st

# ── HEADER ──
def render_header():
    st.markdown("""
<div class="edu-header">
    <div class="edu-avatar">💰</div>
    <div>
        <div class="edu-title">Edu</div>
        <div class="edu-status">Educador Financeiro • Online</div>
    </div>
</div>
""", unsafe_allow_html=True)

# ── MENSAGEM USUÁRIO ──
def render_user_message(msg):
    st.markdown(f"""
<div class="msg-row user">
    <div class="bubble user">{msg}</div>
    <div class="msg-icon user-icon">👤</div>
</div>
""", unsafe_allow_html=True)

# ── MENSAGEM BOT ──
def render_bot_message(msg):
    st.markdown(f"""
<div class="msg-row">
    <div class="msg-icon bot">💰</div>
    <div class="bubble bot">{msg}</div>
</div>
""", unsafe_allow_html=True)

# ── ESTADO VAZIO (CHIPS CLICÁVEIS) ──
def render_empty_state():
    st.markdown("""
<div class="empty-state">
    <div class="empty-icon">✦</div>
    <div class="empty-text">Como posso te ajudar hoje?</div>
    <div class="empty-sub"> 
        Pergunte sobre investimentos, orçamento, reserva de emergência...
    </div>
</div>
""", unsafe_allow_html=True)

    chips = [
        "O que é reserva de emergência?",
        "Como investir meu dinheiro?",
        "O que é Tesouro Direto?",
        "Como sair das dívidas?",
        "Como organizar meu orçamento mensal?"
    ]

    # ── LINHA 1 (2 BOTÕES) ──
    _, col1, col2, _ = st.columns([1, 6, 6, 1])

    with col1:
        if st.button(chips[0], key="chip_0", use_container_width=False):
            st.session_state.chat_input_value = chips[0]
            st.rerun()

    with col2:
        if st.button(chips[1], key="chip_1", use_container_width=False):
            st.session_state.chat_input_value = chips[1]
            st.rerun()

    # ── LINHA 2 (2 BOTÕES) ──
    _, col3, col4, _ = st.columns([0.5, 2, 2, 0.5])

    with col3:
        if st.button(chips[2], key="chip_2", use_container_width=False):
            st.session_state.chat_input_value = chips[2]
            st.rerun()

    with col4:
        if st.button(chips[3], key="chip_3", use_container_width=False):
            st.session_state.chat_input_value = chips[3]
            st.rerun()

    # ── LINHA 3 (1 BOTÃO CENTRALIZADO) ──
    _, col_center, _ = st.columns([1.5, 2, 1.5])

    with col_center:
        if st.button(chips[4], key="chip_4", use_container_width=False):
            st.session_state.chat_input_value = chips[4]
            st.rerun()


# ── HISTÓRICO DE CHAT ──
def render_chat(messages):
    for msg in messages:
        if msg["role"] == "user":
            render_user_message(msg["content"])
        else:
            render_bot_message(msg["content"])

# ── FOOTER ──
def render_footer():
    st.markdown("""
<hr>
<div class="edu-footer">
    Desenvolvido por Agatha · Projeto Edu ✦
</div>
""", unsafe_allow_html=True)