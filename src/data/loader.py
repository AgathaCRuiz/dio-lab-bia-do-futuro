import json
import pandas as pd

def carregar_dados():
    perfil = json.load(open('./data/perfil_investidor.json'))
    transacoes = pd.read_csv('./data/transacoes.csv')
    historico = pd.read_csv('./data/historico_atendimento.csv')
    produtos = json.load(open('./data/produtos_financeiros.json'))

    return perfil, transacoes, historico, produtos
