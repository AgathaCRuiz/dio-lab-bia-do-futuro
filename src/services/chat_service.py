from data.loader import carregar_dados
from agent.context import montar_contexto
from agent.llm import perguntar

def responder(pergunta):
    perfil, transacoes, historico, produtos = carregar_dados()

    contexto = montar_contexto(perfil, transacoes, historico, produtos)

    resposta = perguntar(pergunta, contexto)

    return resposta
