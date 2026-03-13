import os
import glob

docs_dir = r"c:\Users\renan\Desktop\projetos-git\venda-mobile\docs"
files_to_check = glob.glob(os.path.join(docs_dir, "**/*.md"), recursive=True)

old_name_full = "Loja Inteligente — Vendas & Estoque"
new_name_full = "Vendas, Estoque e Fiado (PDV)"

old_name_short = "Loja Inteligente"
new_name_short = "Vendas, Estoque e Fiado (PDV)"

for filepath in files_to_check:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace occurrences
        if old_name_full in content or old_name_short in content:
            new_content = content.replace(old_name_full, new_name_full)
            new_content = new_content.replace(old_name_short, new_name_short)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print("Update complete.")
