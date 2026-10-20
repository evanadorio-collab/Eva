# Trilha — Supabase

Projeto: `fdxutgmzqbmsxbczbzfh`.

A migração `trilha_initial_schema_rls` foi aplicada diretamente no projeto em 20/10/2026. As tabelas são `perfis`, `experiencias`, `competencias`, `perfil_competencias`, `correspondencias`, `vagas`, `analises` e `curriculos`.

## Segurança
- RLS ativado em todas as tabelas; dados pessoais acessíveis apenas por usuários autenticados proprietários.
- Catálogos de competências e correspondências: leitura para usuários autenticados; edição somente administrativa.
- Bucket privado `curriculos`; caminho de upload deve começar com o UUID do usuário autenticado.
- Nunca versionar `service_role`, secret keys, tokens ou currículos pessoais.

## Integração
`src/supabase-client.js` oferece cliente Supabase e funções iniciais de autenticação, leitura de competências e gravação de perfil. A interface atual ainda é demonstrativa e **não chama** essas funções. Integração visual e processamento real de PDF/LLM são etapas futuras.

## Dados
30 competências de curadoria inicial e cinco correspondências hipotéticas, todas pendentes de validação. Não são registros oficiais ESCO, CBO ou O*NET; IDs oficiais ainda precisam ser importados e verificados.
