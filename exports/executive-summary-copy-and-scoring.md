# Exportação do Sumário Executivo

Este arquivo documenta todos os textos exibidos no Sumário Executivo e as regras de score que determinam cada variante.

## Estrutura exibida

- **Situação atual:** `currentSituation`
- **Principais riscos:** `risks`
- **Maior oportunidade:** `opportunity`
- **Solução recomendada:** `recommendationTitle`, `recommendationAction`, `recommendationContext` e `immediateRecommendation`

## Modelo de score

### Score total

`calculateOverallScore(answers)` percorre todas as perguntas visíveis, ignora perguntas de texto, soma o score da opção selecionada, arredonda o resultado e limita o valor ao intervalo `0-100`.

Perguntas condicionais só entram no cálculo quando estão visíveis para as respostas atuais.

### Scores por pilar

`calculatePillarScores(answers)` calcula cada pilar como:

`round(score alcançado pelas perguntas visíveis / score máximo das perguntas visíveis * 100)`

O pilar usado é `question.scorePillar ?? question.pillar`. Portanto, algumas perguntas aparecem em uma seção, mas pontuam outro pilar.

| Pilar | Peso configurado | Perguntas que alimentam o score |
|---|---:|---|
| Dados | 25% | `dados_q1`, `dados_q2`, `dados_q3`, `dados_q4`, `dados_q5`, `dados_q6`, `dados_q7` |
| Estratégia | 20% | `est_q1`, `est_q1a`, `est_q1a1`, `est_q1a1a`, `est_q1b`, `est_q2`, `est_q3`, `pess_q1`, `pess_q2`, `pess_q2a` |
| Pessoas e Cultura | 15% | `pess_q3`, `pess_q4`, `pess_q5`, `pess_q5a`, `pess_q6` |
| Governança e Processo | 15% | `est_q3a`, `gov_q1`, `gov_q2` |
| Tecnologia | 25% | `tec_q1`, `tec_q1b`, `tec_q1c`, `tec_q1d`, `tec_q1e`, `tec_q1f`, `tec_q1g`, `tec_q2a`, `tec_q2b`, `tec_q2c`, `tec_q2d`, `tec_q2e`, `tec_q2f` |

Os pesos são metadados do modelo e usados para interpretar os pilares. O score total é calculado pela soma dos scores das perguntas, não por uma média aritmética dos cinco percentuais.

### Faixas de prontidão

| Score total | Nível |
|---:|---|
| `0-39` | Prontidão Baixa |
| `40-59` | Prontidão Emergente |
| `60-74` | Prontidão Moderada |
| `75-89` | Prontidão Alta |
| `90-100` | Prontidão Avançada |

### Regras de bloqueio que podem limitar o nível

As regras abaixo podem reduzir o `result.level` mesmo quando o score total é maior:

| Condição | Efeito |
|---|---|
| Tecnologia `< 40%` | Limita o nível máximo a Prontidão Moderada |
| Dados `< 40%` | Limita o nível máximo a Prontidão Emergente |
| Governança e Processo `< 40%` | Limita o nível máximo a Prontidão Emergente |

O texto do Sumário usa `result.score` para decidir as faixas baixa e alta, mas usa `result.level` para escolher a frase de posicionamento da empresa.

## Regras de seleção do Sumário

| Nome interno | Regra |
|---|---|
| `lowReadiness` | Score total `< 60` |
| `strongReadiness` | Score total `>= 75` |
| `balancedStrongReadiness` | Score total `>= 75` e maior score igual ao menor score |
| `scoreGap` | Maior score do pilar menos menor score do pilar |
| `provenPortfolio` | Score total `>= 75`, `tec_q1 = 3` e `tec_q2e = 2` |
| `predictiveExpansion` | `provenPortfolio`, `dados_q1 = 3`, `dados_q2 >= 3`, `dados_q4 >= 3`, Dados `>= 60%` e Tecnologia `>= 40%` |

Os riscos do sumário selecionam até três pilares com insights de prioridade `1-2` e score abaixo de `75%`, priorizando o pilar mais fraco. Se nenhum risco for encontrado, é usado o texto de preservação de maturidade.

## Catálogo completo de textos

### Rótulos da interface

| Campo | Texto |
|---|---|
| Situação atual | Situação atual |
| Riscos | Principais riscos |
| Oportunidade | Maior oportunidade |
| Recomendação | Solução recomendada |

### Frases de posicionamento por nível

| Nível | Texto |
|---|---|
| Prontidão Baixa | A empresa ainda tem uma base frágil para usar dados e IA em decisões relevantes. |
| Prontidão Emergente | A empresa já iniciou sua jornada, mas a base ainda é inconsistente para sustentar IA em escala. |
| Prontidão Moderada | A empresa tem uma base intermediária: consegue avançar em iniciativas selecionadas, mas ainda depende de pontos frágeis. |
| Prontidão Alta | A empresa está bem posicionada para ampliar o uso de dados e IA de forma consistente. |
| Prontidão Avançada | A empresa apresenta maturidade alta para usar dados e IA de forma mais ampla. |

### Situação atual: score baixo

Condição: `score total < 60`.

1. `A pontuação geral de {total}/100 indica que há espaço significativo de evolução.`
2. `O principal limitador hoje é {weakest_pillar} ({weakest_score}%).`
3. `Sem avançar aqui, qualquer iniciativa de IA tende a ficar restrita a pilotos isolados.`

### Situação atual: score moderado

Condição: `60 <= score total < 75`.

1. Frase de posicionamento correspondente ao `result.level`.
2. `A pontuação geral foi {total}/100; o ponto mais forte é {strongest_pillar} ({strongest_score}%) e o principal limitador é {weakest_pillar} ({weakest_score}%).`
3. Se `scoreGap >= 25`: `Na prática, a capacidade em {strongest_pillar} pode acelerar os primeiros movimentos, enquanto a limitação em {weakest_pillar} tende a gerar retrabalho, lentidão ou risco nas iniciativas que dependerem dela.`
4. Se `scoreGap < 25`: `Como os pilares estão relativamente próximos, o ganho virá menos de corrigir um único ponto e mais de coordenar prioridades, responsáveis e métricas durante a execução.`

### Situação atual: score alto, pilares equilibrados

Condição: `score total >= 75` e `strongest_score === weakest_score`.

1. Frase de posicionamento correspondente ao `result.level`.
2. `A pontuação geral foi {total}/100 e os cinco pilares estão no mesmo nível de maturidade ({strongest_score}%). Não há uma dimensão isolada que funcione como limitador.`
3. `A prioridade agora é ampliar soluções comprovadas, aumentar reutilização e acompanhar valor, risco e desempenho como um portfólio.`

### Situação atual: score alto, pilares não equilibrados

Condição: `score total >= 75` e `strongest_score !== weakest_score`.

1. Frase de posicionamento correspondente ao `result.level`.
2. `A pontuação geral foi {total}/100, com destaque para {strongest_pillar} ({strongest_score}%). {weakest_pillar} é a dimensão com maior espaço relativo para evoluir ({weakest_score}%), não um ponto de partida.`
3. `A prioridade agora é ampliar soluções comprovadas, aumentar reutilização e acompanhar valor, risco e desempenho como um portfólio.`

### Principais riscos

Os textos abaixo são selecionados conforme os pilares que precisam de atenção. Podem aparecer até três por relatório.

| Pilar | Texto |
|---|---|
| Dados | Decisões podem continuar sendo tomadas com informações incompletas, lentas ou contraditórias |
| Estratégia | Investimentos em IA podem virar testes isolados, sem prioridade executiva ou retorno claro |
| Pessoas e Cultura | As equipes podem não adotar as soluções, mesmo quando a tecnologia funcionar |
| Processos e responsabilidades | A empresa pode ampliar IA sem regras claras de responsabilidade, aumentando exposição e retrabalho |
| Tecnologia | Projetos podem ficar presos em pilotos, sem chegar à operação do dia a dia |
| Sem risco prioritário | Nenhum pilar apresenta uma fragilidade crítica no momento. O foco deve ser preservar a consistência e ampliar o valor das capacidades já construídas. |

### Maior oportunidade: score abaixo de 75

O pilar da oportunidade é o insight prioritário ou, na ausência dele, o pilar mais fraco.

| Pilar | Primeira linha | Segunda linha |
|---|---|---|
| Dados | A maior oportunidade está em Dados ({pillar_score}%). | Melhorar esse pilar aumenta a confiança nas decisões e reduz o tempo perdido conciliando informações antes de agir. |
| Estratégia | A maior oportunidade está em Estratégia ({pillar_score}%). | Melhorar esse pilar ajuda a concentrar investimento nos casos de uso com maior retorno, em vez de dispersar energia em testes soltos. |
| Pessoas e Cultura | A maior oportunidade está em Pessoas e Cultura ({pillar_score}%). | Melhorar esse pilar transforma IA em mudança real de trabalho, não apenas em ferramenta disponível para poucos usuários. |
| Processos e responsabilidades | A maior oportunidade está em Processos e responsabilidades ({pillar_score}%). | Melhorar esse pilar dá segurança para avançar com IA sem criar riscos desnecessários para clientes, equipes e liderança. |
| Tecnologia | A maior oportunidade está em Tecnologia ({pillar_score}%). | Melhorar esse pilar aumenta a chance de transformar pilotos em soluções usadas na rotina da empresa. |

### Maior oportunidade: score alto, pilares não equilibrados

Condição: `score total >= 75` e não é um perfil equilibrado.

| Pilar | Primeira linha | Segunda linha |
|---|---|---|
| Dados | A próxima frente de expansão está em Dados ({pillar_score}%). | Expanda a cobertura da base para novos domínios e aumente a reutilização dos mesmos dados entre agentes, modelos e decisões. |
| Estratégia | A próxima frente de expansão está em Estratégia ({pillar_score}%). | Use a maturidade da liderança para gerir IA como portfólio, realocando investimento conforme valor capturado e potencial de escala. |
| Pessoas e Cultura | A próxima frente de expansão está em Pessoas e Cultura ({pillar_score}%). | Transforme a experiência acumulada em um playbook de adoção que permita levar soluções comprovadas a novas áreas com menos atrito. |
| Processos e responsabilidades | A próxima frente de expansão está em Processos e responsabilidades ({pillar_score}%). | Leve os controles já consolidados a novos casos de uso sem criar um processo diferente para cada solução ou área. |
| Tecnologia | A próxima frente de expansão está em Tecnologia ({pillar_score}%). | Padronize integrações, monitoramento, custos e componentes para expandir soluções sem reconstruir a operação a cada novo caso. |

### Maior oportunidade: score alto, pilares equilibrados

Condição: `score total >= 75` e `strongest_score === weakest_score`.

1. `A próxima frente de expansão está no portfólio, não na correção de um único pilar.`
2. `Priorize os casos com valor comprovado, reutilize o que já funciona e expanda para novas decisões, fluxos e áreas.`

## Solução recomendada

### Predictive Agents

Condição: `predictiveExpansion`.

- **Ação:** `Expandir agora`
- **Contexto:** `Base e histórico prontos`
- **Texto 1:** `Amplie o portfólio de Predictive Agents para novas decisões recorrentes, aproveitando a base de dados, o histórico e a experiência de entrega já existentes.`
- **Texto 2:** `Reutilize variáveis, monitoramento e retreinamento e associe cada expansão a uma meta incremental de valor.`

### Automation Agents

Condição: `provenPortfolio` e não `predictiveExpansion`.

- **Ação:** `Escalar agora`
- **Contexto:** `Experiência comprovada`
- **Texto 1:** `Escale os Automation Agents que já provaram valor para fluxos adjacentes, reaproveitando conhecimento, integrações, avaliações e controles.`
- **Texto 2:** `Opere adoção, qualidade e custo como um portfólio, em vez de iniciar novos testes isolados.`

### Data Foundation madura

Condição: score total `>= 75`, Dados `>= 75%`, sem `provenPortfolio`.

- **Ação:** `Expandir agora`
- **Contexto:** `Base já madura`
- **Texto 1:** `Mantenha e expanda a Data Foundation existente, levando qualidade, catálogo, acesso e governança a novos domínios sem reconstruir a base.`
- **Texto 2:** `Use essa fundação para ampliar agentes e modelos que já provaram valor, com componentes reutilizáveis e acompanhamento comum de desempenho.`

### Data Foundation como primeiro movimento

Condição: qualquer cenário restante.

- **Ação:** `Começar agora`
- **Contexto:** `Sem pré-requisitos`
- **Texto 1:** `Adote Data Foundation como a primeira solução: uma base reutilizável de lake ou warehouse, qualidade, catálogo, acesso e governança para sustentar decisões e produtos de IA.`
- **Texto 2:** `Ela pode começar imediatamente, sem pré-requisito de maturidade, a partir de um único domínio de negócio com fontes e responsáveis claramente identificados.`

## Observação sobre casos de teste

Os testes de copy usam vetores de score controlados para validar a lógica de cada faixa. Esses vetores não representam uma empresa real: o score total é calculado a partir das respostas visíveis do questionário, enquanto os testes passam o total e os scores dos pilares diretamente para a função.
