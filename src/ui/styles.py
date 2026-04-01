import streamlit as st

def aplicar_css(st):
    st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

/* ── BASE ── */
html, body, [class*="css"] {
    font-family: 'DM Sans', sans-serif;
    background-color: #0d0d0d;
    color: #f0ede8;
}

/* container principal */
.block-container {
    padding-top: 2rem !important;
    padding-bottom: 2rem !important;
    max-width: 780px !important;
}

/* ── HEADER ── */
.edu-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 36px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
}

/* 🔥 CORREÇÃO DO CORTE */
.edu-avatar {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: linear-gradient(135deg, #c8a96e 0%, #e8c987 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
    box-shadow: 0 4px 20px rgba(200, 169, 110, 0.35);
    
    /* FIX REAL */
    overflow: visible !important;
}

/* texto header */
.edu-title {
    font-family: 'DM Serif Display', serif;
    font-size: 24px;
    margin: 0;
}

.edu-status {
    font-size: 12px;
    color: #c8a96e;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

/* ── EMPTY STATE ── */
.empty-state {
    text-align: center;

}

.empty-icon {
    font-size: 32px;
    margin-bottom: 12px;
    opacity: 0.5;
}

.empty-text {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    margin-bottom: 6px;
}

.empty-sub {
    font-size: 14px;
    color: #5a5550;
    margin-bottom: 28px;
}
                
/* ── CHIPS ── */
.chips-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-top: 8px;
}

.chips-row {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    width: 100%;
}

/* botão */
div.stButton > button {
    background-color: #1a1a1a !important;
    color: #c8a96e !important;
    border: 1px solid rgba(200, 169, 110, 0.2) !important;
    border-radius: 999px !importan;
    font-size: 13px !important;
    white-space: nowrap !important;
    display: inline-block !important;
}

/* hover */
div.stButton > button:hover {
    background-color: rgba(200, 169, 110, 0.1) !important;
    border-color: rgba(200, 169, 110, 0.6) !important;
}

/* ── CHAT ── */
.msg-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin-bottom: 15px;
}

.msg-row.user {
    flex-direction: row-reverse;
}

.bubble {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    max-width: 75%;
}

.bubble.bot {
    background: #1a1a1a;
    border: 1px solid rgba(255,255,255,0.07);
}

.bubble.user {
    background: linear-gradient(135deg, #c8a96e, #d4b87a);
    color: #1a1208;
}

/* ── INPUT ── */
div[data-testid="stChatInput"] textarea {
    background-color: #1a1a1a !important;
    border: 1px solid rgba(200, 169, 110, 0.3) !important;
    border-radius: 14px !important;
}

/* ── FOOTER ── */
.edu-footer {
    text-align: center;
    font-size: 12px;
    color: #3d3830;
    margin-top: 20px;
}

</style>
""", unsafe_allow_html=True)
