import requests
from config.settings import GROQ_API_KEY, GROQ_API_URL, MODELO
from agent.prompt import SYSTEM_PROMPT

def perguntar(msg, contexto):

    prompt = f"""
{SYSTEM_PROMPT}

CONTEXTO DO CLIENTE:
{contexto}

Pergunta: {msg}
"""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODELO,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    }

    r = requests.post(GROQ_API_URL, headers=headers, json=payload)
    resposta = r.json()

    if "choices" in resposta:
        return resposta["choices"][0]["message"]["content"]
    else:
        return f"Erro na API: {resposta}"
