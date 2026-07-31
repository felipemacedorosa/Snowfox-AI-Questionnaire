# Seção 1: todos os textos possíveis

Esta é a lista plana dos textos que podem aparecer no **Resumo executivo**. Valores entre chaves são preenchidos em tempo de execução a partir do diagnóstico.

## Textos fixos da seção

- **Título:** `Resumo executivo`
- **Apoio:** `Uma leitura para decisão`
- **Bloco 1:** `Situação atual`
- **Bloco 2:** `Principais riscos`
- **Bloco 3:** `Maior oportunidade`
- **Bloco 4:** `Solução recomendada`

## Situação atual

### Score abaixo de 60

- `A pontuação geral de {total}/100 indica que há espaço significativo de evolução.`
- `O principal limitador hoje é {weakest_pillar} ({weakest_score}%).`
- `Sem avançar aqui, qualquer iniciativa de IA tende a ficar restrita a pilotos isolados.`

### Score entre 60 e 74

#### Frase de posicionamento possível

- `A empresa ainda tem uma base frágil para usar dados e IA em decisões relevantes.`
- `A empresa já iniciou sua jornada, mas a base ainda é inconsistente para sustentar IA em escala.`
- `A empresa tem uma base intermediária: consegue avançar em iniciativas selecionadas, mas ainda depende de pontos frágeis.`
- `A empresa está bem posicionada para ampliar o uso de dados e IA de forma consistente.`
- `A empresa apresenta maturidade alta para usar dados e IA de forma mais ampla.`
- Fallback: `A leitura da empresa depende dos pontos fortes e fracos identificados no diagnóstico.`

#### Segunda frase

- `A pontuação geral foi {total}/100; o ponto mais forte é {strongest_pillar} ({strongest_score}%) e o principal limitador é {weakest_pillar} ({weakest_score}%).`

#### Terceira frase quando a diferença entre pilares é 25 pontos ou mais

- `Na prática, a capacidade em {strongest_pillar} pode acelerar os primeiros movimentos, enquanto a limitação em {weakest_pillar} tende a gerar retrabalho, lentidão ou risco nas iniciativas que dependerem dela.`

#### Terceira frase quando a diferença entre pilares é menor que 25 pontos

- `Como os pilares estão relativamente próximos, o ganho virá menos de corrigir um único ponto e mais de coordenar prioridades, responsáveis e métricas durante a execução.`

### Score a partir de 75, com pilares equilibrados

Condição: o maior e o menor score dos pilares são iguais.

#### Frase de posicionamento possível

- `A empresa está bem posicionada para ampliar o uso de dados e IA de forma consistente.`
- `A empresa apresenta maturidade alta para usar dados e IA de forma mais ampla.`
- Fallback: `A empresa já reúne capacidades consistentes para ampliar sua agenda de IA.`

#### Segunda frase

- `A pontuação geral foi {total}/100 e os cinco pilares estão no mesmo nível de maturidade ({strongest_score}%). Não há uma dimensão isolada que funcione como limitador.`

#### Terceira frase

- `A prioridade agora é ampliar soluções comprovadas, aumentar reutilização e acompanhar valor, risco e desempenho como um portfólio.`

### Score a partir de 75, com pilares não equilibrados

#### Frase de posicionamento possível

- `A empresa está bem posicionada para ampliar o uso de dados e IA de forma consistente.`
- `A empresa apresenta maturidade alta para usar dados e IA de forma mais ampla.`
- Fallback: `A empresa já reúne capacidades consistentes para ampliar sua agenda de IA.`

#### Segunda frase

- `A pontuação geral foi {total}/100, com destaque para {strongest_pillar} ({strongest_score}%). {weakest_pillar} é a dimensão com maior espaço relativo para evoluir ({weakest_score}%), não um ponto de partida.`

#### Terceira frase

- `A prioridade agora é ampliar soluções comprovadas, aumentar reutilização e acompanhar valor, risco e desempenho como um portfólio.`

## Principais riscos

Podem aparecer até três textos desta lista, conforme os pilares abaixo de 75% e os insights prioritários selecionados.

- Dados: `Decisões podem continuar sendo tomadas com informações incompletas, lentas ou contraditórias`
- Estratégia: `Investimentos em IA podem virar testes isolados, sem prioridade executiva ou retorno claro`
- Pessoas e Cultura: `As equipes podem não adotar as soluções, mesmo quando a tecnologia funcionar`
- Processos e responsabilidades: `A empresa pode ampliar IA sem regras claras de responsabilidade, aumentando exposição e retrabalho`
- Tecnologia: `Projetos podem ficar presos em pilotos, sem chegar à operação do dia a dia`
- Sem riscos selecionados: `Nenhum pilar apresenta uma fragilidade crítica no momento. O foco deve ser preservar a consistência e ampliar o valor das capacidades já construídas.`

## Maior oportunidade

### Score abaixo de 75

O texto usa o pilar do insight prioritário ou, na ausência dele, o pilar mais fraco.

- Dados:
  - `A maior oportunidade está em Dados ({opportunity_score}%).`
  - `Melhorar esse pilar aumenta a confiança nas decisões e reduz o tempo perdido conciliando informações antes de agir.`
- Estratégia:
  - `A maior oportunidade está em Estratégia ({opportunity_score}%).`
  - `Melhorar esse pilar ajuda a concentrar investimento nos casos de uso com maior retorno, em vez de dispersar energia em testes soltos.`
- Pessoas e Cultura:
  - `A maior oportunidade está em Pessoas e Cultura ({opportunity_score}%).`
  - `Melhorar esse pilar transforma IA em mudança real de trabalho, não apenas em ferramenta disponível para poucos usuários.`
- Processos e responsabilidades:
  - `A maior oportunidade está em Processos e responsabilidades ({opportunity_score}%).`
  - `Melhorar esse pilar dá segurança para avançar com IA sem criar riscos desnecessários para clientes, equipes e liderança.`
- Tecnologia:
  - `A maior oportunidade está em Tecnologia ({opportunity_score}%).`
  - `Melhorar esse pilar aumenta a chance de transformar pilotos em soluções usadas na rotina da empresa.`

### Score a partir de 75, com pilares não equilibrados

- Dados:
  - `A próxima frente de expansão está em Dados ({opportunity_score}%).`
  - `Expanda a cobertura da base para novos domínios e aumente a reutilização dos mesmos dados entre agentes, modelos e decisões.`
- Estratégia:
  - `A próxima frente de expansão está em Estratégia ({opportunity_score}%).`
  - `Use a maturidade da liderança para gerir IA como portfólio, realocando investimento conforme valor capturado e potencial de escala.`
- Pessoas e Cultura:
  - `A próxima frente de expansão está em Pessoas e Cultura ({opportunity_score}%).`
  - `Transforme a experiência acumulada em um playbook de adoção que permita levar soluções comprovadas a novas áreas com menos atrito.`
- Processos e responsabilidades:
  - `A próxima frente de expansão está em Processos e responsabilidades ({opportunity_score}%).`
  - `Leve os controles já consolidados a novos casos de uso sem criar um processo diferente para cada solução ou área.`
- Tecnologia:
  - `A próxima frente de expansão está em Tecnologia ({opportunity_score}%).`
  - `Padronize integrações, monitoramento, custos e componentes para expandir soluções sem reconstruir a operação a cada novo caso.`

### Score a partir de 75, com pilares equilibrados

- `A próxima frente de expansão está no portfólio, não na correção de um único pilar.`
- `Priorize os casos com valor comprovado, reutilize o que já funciona e expanda para novas decisões, fluxos e áreas.`

## Solução recomendada

### Predictive Agents

Condição: score total a partir de 75, experiência comprovada, base e histórico prontos, Dados a partir de 60% e Tecnologia a partir de 40%.

- **Título:** `Predictive Agents`
- **Ação:** `Expandir agora`
- **Contexto:** `Base e histórico prontos`
- `Amplie o portfólio de Predictive Agents para novas decisões recorrentes, aproveitando a base de dados, o histórico e a experiência de entrega já existentes.`
- `Reutilize variáveis, monitoramento e retreinamento e associe cada expansão a uma meta incremental de valor.`

### Automation Agents

Condição: score total a partir de 75, `tec_q1 = 3` e `tec_q2e = 2`, sem atender aos requisitos adicionais de Predictive Agents.

- **Título:** `Automation Agents`
- **Ação:** `Escalar agora`
- **Contexto:** `Experiência comprovada`
- `Escale os Automation Agents que já provaram valor para fluxos adjacentes, reaproveitando conhecimento, integrações, avaliações e controles.`
- `Opere adoção, qualidade e custo como um portfólio, em vez de iniciar novos testes isolados.`

### Data Foundation madura

Condição: score total a partir de 75, Dados a partir de 75% e sem experiência comprovada suficiente para os caminhos de agentes.

- **Título:** `Data Foundation`
- **Ação:** `Expandir agora`
- **Contexto:** `Base já madura`
- `Mantenha e expanda a Data Foundation existente, levando qualidade, catálogo, acesso e governança a novos domínios sem reconstruir a base.`
- `Use essa fundação para ampliar agentes e modelos que já provaram valor, com componentes reutilizáveis e acompanhamento comum de desempenho.`

### Data Foundation como primeiro movimento

Condição: qualquer cenário restante.

- **Título:** `Data Foundation`
- **Ação:** `Começar agora`
- **Contexto:** `Sem pré-requisitos`
- `Adote Data Foundation como a primeira solução: uma base reutilizável de lake ou warehouse, qualidade, catálogo, acesso e governança para sustentar decisões e produtos de IA.`
- `Ela pode começar imediatamente, sem pré-requisito de maturidade, a partir de um único domínio de negócio com fontes e responsáveis claramente identificados.`
