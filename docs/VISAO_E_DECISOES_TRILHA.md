# Trilha — Visão do Produto e Registro de Decisões
**Versão:** 1.0 · **Atualizado em:** 23/10/2026 · **Estado:** documento vivo

> **Princípio central:** o Trilha não apenas estima a compatibilidade com uma vaga: explica **por quê**, mostra evidências e lacunas e ajuda a pessoa a decidir seus próximos passos.

## 1. Propósito e problema
Ajudar pessoas em recolocação ou transição profissional a compreender sua trajetória, avaliar oportunidades com critério, adaptar candidaturas e acompanhar sua busca por trabalho em um só lugar.

**Público inicial:** pessoas buscando recolocação ou transição de carreira no Brasil. Não restringir o produto a uma profissão específica. Comunicação, Content Design e áreas correlatas são bons cenários de teste, não uma limitação do público.

**Proposta de valor (frase de trabalho):** “Mais do que saber se você combina com a vaga. Entenda por quê.”

**Hipótese a validar:** explicações ancoradas em evidências do currículo, combinadas com recomendações práticas e gestão de candidaturas, oferecem mais valor que um indicador isolado de aderência.

## 2. Princípios de experiência e confiança
1. **Controle humano:** a IA sugere; a pessoa revisa, corrige, aprova e decide.
2. **Sem invenções:** não criar competências, cargos, resultados ou experiências ausentes do perfil. Diferenciar “não identificado no currículo” de “não possui”.
3. **Explicabilidade:** toda análise deve informar critérios, evidências, lacunas e próximos passos.
4. **Transparência:** o percentual é estimativa heurística da IA, **não** probabilidade de contratação nem garantia de desempenho.
5. **Escolha:** analisar uma vaga com IA é opcional; cadastrar e acompanhar vagas não pode depender disso.
6. **Privacidade:** currículo e histórico vinculados à conta, com controle de acesso. Avisar antes de enviar dados ao Gemini; a modalidade gratuita pode ter condições de uso de dados específicas.
7. **Economia de chamadas:** reabrir análise salva sem consultar a IA novamente.
8. **Acessibilidade e linguagem clara:** estados compreensíveis, feedback de ações e interface legível.

## 3. Jornada-alvo
1. Acessar conta e enviar currículo em PDF (ou reutilizar PDF salvo).
2. Extrair informações com IA e **editar/validar** perfil profissional.
3. Informar preferências de carreira: cargos, localização, senioridade, modalidade, contratação e pretensão.
4. **Cadastrar uma oportunidade** com cargo, empresa e descrição; opcionalmente registrar fonte/link e classificação recebida em plataforma externa (campos ainda a implementar).
5. Escolher entre **“Registrar sem analisar”** e **“Quero entender minha compatibilidade”**.
6. Se analisar: apresentar percentual, faixa qualitativa, justificativa, critérios, evidências, lacunas, recomendações e alertas; salvar resultado.
7. Reabrir resultados do histórico sem nova chamada à IA; permitir análise posterior de uma vaga já registrada.
8. Opcionalmente criar currículo direcionado à vaga, **revisar/editar a prévia** e só então aprovar e gerar PDF.
9. Acompanhar candidatura com etapas, datas, notas e mudanças de status, incluindo “Vaga cancelada”.

## 4. Regras de negócio e decisões

| ID | Decisão | Situação |
|---|---|---|
| D-01 | Currículo PDF alimenta perfil estruturado, sempre editável pela pessoa. | Implementado parcialmente; validação explícita pendente |
| D-02 | Rascunho de perfil salvo automaticamente na conta. | Implementado |
| D-03 | Preferências de senioridade, modalidade e contratação aceitam múltiplas escolhas. | Implementado |
| D-04 | Análise de vaga usa perfil salvo + descrição fornecida e apresenta justificativas com evidências e lacunas. | Implementado; testado manualmente |
| D-05 | Percentual é heurístico e não representa chance de contratação. | Implementado |
| D-06 | Faixas de aderência: 0–39 baixa; 40–59 média; 60–79 alta; 80–100 muito alta. | Implementado; limiares provisórios |
| D-07 | Histórico deve salvar anúncio e resultado e permitir reabertura sem nova chamada à IA. | Implementado em código; validação ponta a ponta pendente |
| D-08 | Análise por IA **não será obrigatória** para cadastrar/mapear uma vaga. | Decidido; **a implementar** |
| D-09 | Pessoa poderá informar classificação recebida em plataforma externa, como LinkedIn, com **origem explícita**. | Decidido; **a implementar** |
| D-10 | Se houver avaliações externa e Trilha, preservar ambas; não sobrescrever uma pela outra. | Decidido; **a implementar** |
| D-11 | Separar **compatibilidade**, **interesse pessoal** e **etapa da candidatura**. | Decidido; **a implementar** |
| D-12 | Currículo direcionado terá prévia editável e aprovação antes da exportação em PDF. | Decidido; **a implementar** |
| D-13 | Acompanhamento aceitará vagas adicionadas manualmente e status como “Vaga cancelada”. | Decidido; **a implementar** |

**Importante sobre avaliações externas:** registrar apenas o que a pessoa efetivamente informou. Não apresentar uma classificação externa como se fosse calculada pelo Trilha. Recursos de compatibilidade do LinkedIn podem variar; evitar afirmações absolutas sobre o que a plataforma oferece.

### 4.1 Apresentação da compatibilidade
- Exemplo: **87% · Aderência muito alta**.
- Exibir **“Estimativa de aderência por IA — não é chance de contratação”**.
- Na lista de oportunidades, indicar a origem: **Trilha**, **LinkedIn (informado pela pessoa)** ou **Não avaliada**.
- Percentual e faixa são conceitos diferentes; uma plataforma externa pode oferecer só a faixa.
- O histórico deve registrar quando a análise foi feita, porque o perfil e o anúncio podem mudar depois.

## 5. Estado atual do protótipo (em 23/10/2026)
**Infraestrutura**
- Repositório: `evanadorio-collab/Eva`, branch `app_recolocacao_profissional`.
- Frontend estático: `index.html`, publicado em GitHub Pages.
- Backend: Supabase (autenticação por link de e-mail, PostgreSQL com RLS, Storage privado e Edge Functions).
- IA: Gemini via Edge Functions; chave mantida em segredo no backend, não no navegador.

**Funcionalidades presentes**
- Login por e-mail; upload e armazenamento de currículo PDF.
- Extração assistida por Gemini; perfil editável, experiências, competências, formação, cursos e idiomas.
- Preferências profissionais com multisseleção e salvamento automático.
- Análise real de vaga com explicação, pontos fortes, lacunas, recomendações e avisos.
- Exibição da faixa de aderência ao lado do percentual.
- Código de persistência de vagas/análises e histórico com reabertura; **teste completo em conta real ainda pendente**.

**Limitações conhecidas**
- O fluxo atual ainda conduz à análise com IA; a alternativa “registrar sem analisar” não está implementada.
- O mapeamento/kanban de candidaturas ainda não existe.
- Ainda não há campo para classificação externa nem comparação entre fontes.
- Não existe geração de currículo direcionado com edição e exportação em PDF.
- Análises feitas antes da implementação do histórico não foram retroativamente salvas.
- O perfil pode estar em rascunho; falta um fluxo claro de validação explícita.

## 6. Roadmap priorizado

### P0 — Consolidar o MVP
- [ ] Testar salvamento, reabertura e isolamento do histórico por conta.
- [ ] Implementar **registro de vaga sem IA**, sem impedir análise futura.
- [ ] Criar **Minhas oportunidades** como lista/mapa de vagas, com status básico.
- [ ] Registrar avaliação externa opcional com origem; manter separadas as avaliações.
- [ ] Definir e testar validação explícita do perfil.
- [ ] Criar currículo direcionado à vaga com prévia editável, aprovação e PDF.

### P1 — Gestão da busca
- [ ] Pipeline de candidaturas com etapas flexíveis, inclusive “Vaga cancelada”.
- [ ] Notas, datas, histórico de mudanças e filtros.
- [ ] Exportação de dados e melhorias de acessibilidade.

### P2 — Inteligência e evolução
- [ ] Indicadores de candidaturas e padrões de lacunas recorrentes.
- [ ] Recomendações de desenvolvimento profissional, sem prometer contratação.
- [ ] Validar valor e usabilidade com pessoas de perfis diversos.

## 7. Questões em aberto
1. Quais campos mínimos uma vaga precisa ter para ser cadastrada **sem** análise? Sugestão: título e descrição ou link; empresa opcional.
2. Como representar “interesse na vaga” (favorita, prioridade alta/média/baixa, ou outro)?
3. Quais etapas iniciais de candidatura e quais personalizações oferecer?
4. É melhor oferecer **faixa externa**, **percentual externo**, ou ambos, conforme a informação que a pessoa tiver?
5. Quais critérios e testes sustentariam uma eventual revisão dos limiares 40/60/80?
6. Como indicar que uma análise ficou desatualizada após mudanças no perfil ou na vaga?
7. Qual é o mínimo de dados pessoais necessário para cada função?

## 8. Registro cronológico de decisões
| Data | Registro |
|---|---|
| Até 20/10/2026 | Definidos currículo com extração assistida, perfil editável, Gemini no backend e fluxo inicial de análise. |
| 20–23/10/2026 | Análise real de vaga testada; justificativas, evidências e lacunas consideradas centrais ao valor do produto. |
| 23/10/2026 | Histórico implementado em código para recuperar análises sem chamar novamente o Gemini; teste completo pendente. |
| 23/10/2026 | Acrescentada classificação baixa/média/alta/muito alta ao percentual. |
| 23/10/2026 | Definido que análise é opcional, avaliações externas podem ser registradas e devem manter origem distinta. |
| 23/10/2026 | Formalizada a proposta de valor: **explicar o porquê da compatibilidade**. |

## 9. Como manter este documento
- Registrar decisões relevantes com **data, motivação, estado e implicações**.
- Atualizar estados após testes reais; **não confundir “implementado em código” com “validado em produção”**.
- Não transformar hipóteses em fatos sem evidência.
- Revisar o roadmap ao concluir cada funcionalidade.
