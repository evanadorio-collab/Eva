# Trilha — protótipos da fase 1

Protótipos navegáveis para a ferramenta de recolocação profissional com IA.

## Abrir

Abra `prototipos/fase-1/index.html` no navegador. Não é necessário instalar dependências.

## Telas

1. Início — proposta de valor e início do fluxo.
2. Meu currículo — seleção de PDF e revisão manual dos campos.
3. Analisar vaga — descrição colada manualmente.
4. Resultado — demonstração visual de aderência, forças, lacunas e recomendação.

## Limitações intencionais

- **Não há IA integrada**; 87% é um dado fictício e fixo, explicitamente identificado.
- O PDF é apenas selecionado localmente; não há extração automática.
- Não há backend, login, banco de dados, scraping nem envio de dados.
- Dados de exemplo devem ser substituídos na implementação real.
- A fase 3 do roadmap incluirá currículo adaptado e exportação em PDF.

## Próximos passos

Validar textos e navegação com a usuária; definir contrato JSON do currículo; projetar avaliação fundamentada em evidências e requisitos obrigatórios; integrar extração PDF e LLM com chave protegida no servidor.
