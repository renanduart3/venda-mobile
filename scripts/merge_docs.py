import os
import shutil

docs_dir = r"c:\Users\renan\Desktop\projetos-git\venda-mobile\docs"

# 1. Mover POLITICA_PRIVACIDADE
legal_dir = os.path.join(docs_dir, "legal")
os.makedirs(legal_dir, exist_ok=True)
source_privacy = os.path.join(docs_dir, "PRIVACY_POLICY_TEMPLATE.md")
target_privacy = os.path.join(legal_dir, "POLITICA_PRIVACIDADE.md")
if os.path.exists(source_privacy):
    shutil.move(source_privacy, target_privacy)

# 2. Arquivos para mesclar
files_to_merge = {
    "01_ESPECIFICACAO_TECNICA.md": [
        "DATABASE_MANAGEMENT.md",
        "acesso-premium-manual.md",
        "NOTIFICATION_SYSTEM.md",
        "REPORTS_IMPLEMENTATION.md",
        "DATEPICKER_SOLUTION.md",
        "EXPENSE_IMPROVEMENTS.md"
    ],
    "02_VISAO_COMERCIAL.md": [
        "APRESENTACAO_APP.md",
        "QUICK_START_GUIDE.md"
    ],
    "03_GESTAO_LOJAS.md": [
        "publicacao/CONFIGURACAO_PRODUTOS_IAP.md",
        "publicacao/TEXTOS_GOOGLE_PLAY.md",
        "IAP_TEST_PLAN.md"
    ]
}

# Realizar o merge e deletar os arquivos originais
for target, sources in files_to_merge.items():
    target_path = os.path.join(docs_dir, target)
    with open(target_path, "w", encoding="utf-8") as outfile:
        outfile.write(f"# {target.replace('.md', '')}\n\n")
        
        for source in sources:
            source_path = os.path.join(docs_dir, source.replace('/', '\\'))
            if os.path.exists(source_path):
                with open(source_path, "r", encoding="utf-8") as infile:
                    outfile.write(infile.read() + "\n\n")
                os.remove(source_path)

# Criar 00_MASTER_CONFIG vazio se não existir
config_path = os.path.join(docs_dir, "00_MASTER_CONFIG.md")
if not os.path.exists(config_path):
    with open(config_path, "w", encoding="utf-8") as outfile:
        outfile.write("# 00_MASTER_CONFIG\n\n- App ID: com.smartstore.app\n- Nome: Loja Inteligente\n- Banco de Dados: Supabase / SQLite\n\nAdicione aqui as chaves e URLs de repositório.\n")

# Limpar diretório publicacao
pub_dir = os.path.join(docs_dir, "publicacao")
if os.path.exists(pub_dir):
    try:
        os.rmdir(pub_dir)
    except OSError:
        pass # Ignora caso ainda haja arquivos
