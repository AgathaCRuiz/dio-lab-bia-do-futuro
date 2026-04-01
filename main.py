"""
main.py — Entry point FastAPI
Rode com: uvicorn main:app --reload --port 8000
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
import pandas as pd

from services.chat_service import responder

app = FastAPI(title="Edu - Educador Financeiro", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class MensagemRequest(BaseModel):
    mensagem: str

# ── ROTA: dados reais para o dashboard ──
@app.get("/dados")
async def get_dados():
    base = os.path.dirname(__file__)

    # Perfil
    with open(os.path.join(base, "data", "perfil_investidor.json"), encoding="utf-8") as f:
        perfil = json.load(f)

    # Transações
    df = pd.read_csv(os.path.join(base, "data", "transacoes.csv"))

    # Gastos por categoria (só saídas)
    saidas = df[df["tipo"] == "saida"]
    gastos_cat = (
        saidas.groupby("categoria")["valor"]
        .sum()
        .reset_index()
        .rename(columns={"categoria": "cat", "valor": "valor"})
        .sort_values("valor", ascending=False)
        .to_dict(orient="records")
    )

    # Total receita e total gastos
    total_receita = float(df[df["tipo"] == "entrada"]["valor"].sum())
    total_gastos  = float(saidas["valor"].sum())
    saldo_mes     = total_receita - total_gastos
    taxa_poupanca = round((saldo_mes / total_receita) * 100, 1) if total_receita else 0

    # Progresso das metas
    metas = perfil.get("metas", [])
    reserva_atual    = perfil.get("reserva_emergencia_atual", 0)
    reserva_necessaria = next((m["valor_necessario"] for m in metas if "reserva" in m["meta"].lower()), 15000)
    pct_reserva = round((reserva_atual / reserva_necessaria) * 100, 1)

    return {
        "perfil": {
            "nome":              perfil["nome"],
            "renda_mensal":      perfil["renda_mensal"],
            "patrimonio_total":  perfil["patrimonio_total"],
            "perfil_investidor": perfil["perfil_investidor"],
            "objetivo":          perfil["objetivo_principal"],
        },
        "metricas": {
            "total_receita":  total_receita,
            "total_gastos":   total_gastos,
            "saldo_mes":      saldo_mes,
            "taxa_poupanca":  taxa_poupanca,
        },
        "gastos_categoria": gastos_cat,
        "metas": [
            {
                "meta":       m["meta"],
                "necessario": m["valor_necessario"],
                "prazo":      m["prazo"],
                # progresso aproximado para a reserva de emergência
                "progresso":  pct_reserva if "reserva" in m["meta"].lower() else None,
            }
            for m in metas
        ],
        "reserva": {
            "atual":      reserva_atual,
            "necessaria": reserva_necessaria,
            "meses_cobertos": round(reserva_atual / (total_gastos if total_gastos else 1), 1),
            "percentual": pct_reserva,
        },
    }

# ── ROTA: chat simples ──
@app.post("/chat")
async def chat(req: MensagemRequest):
    return {"resposta": responder(req.mensagem)}

# ── ROTA: streaming SSE ──
@app.get("/chat/stream")
async def chat_stream(mensagem: str):
    async def gerar():
        resposta = responder(mensagem)
        palavras = resposta.split(" ")
        for i, palavra in enumerate(palavras):
            token = palavra + ("" if i == len(palavras) - 1 else " ")
            yield f"data: {json.dumps({'token': token})}\n\n"
            await asyncio.sleep(0.04)
        yield f"data: {json.dumps({'done': True})}\n\n"
    return StreamingResponse(gerar(), media_type="text/event-stream")

# ── Health check ──
@app.get("/")
async def root():
    return {"status": "online", "agente": "Edu - Educador Financeiro"}