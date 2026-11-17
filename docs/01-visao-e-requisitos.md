# 01 — Visão e requisitos

## Problema
Durante o culto, o pastor pede versículos ou cita trechos e o operador precisa procurá-los manualmente para projetar no Holyrics. Isso é lento e estressante.

## Solução
App que escuta o áudio, detecta a passagem citada e mostra a referência em destaque (e o texto), para o operador confirmar e projetar. **Não substitui o Holyrics.**

## Usuários
- **Operador** (principal): fica no PC da igreja ou com o celular na mão; precisa de leitura rápida e zero fricção.
- Futuro: outros voluntários com o app instalado no próprio celular.

## Contexto de uso
Culto presencial, luz baixa, áudio com eco, pressa. Bíblia usada: **ARC**. Projeção feita no **Holyrics**.

## Requisitos funcionais
| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | Capturar áudio do microfone e transcrever em tempo real (pt-BR) | Must |
| RF-02 | Detectar referências ditas: "João 3:16", "Romanos 8 versículo 28", números por extenso, livros numerados, intervalos | Must |
| RF-03 | Validar livro, capítulo **e versículo** contra a ARC | Must |
| RF-04 | Mostrar a referência atual em destaque + texto do versículo | Must |
| RF-05 | Histórico das últimas detecções; tocar em uma traz de volta ao destaque | Must |
| RF-06 | Busca manual rápida ("jo 3 16", "rm 8 28") | Must |
| RF-07 | Instalável como app (PWA) no celular e no PC | Must |
| RF-08 | Detectar trecho **falado** do texto (sem citar a referência) e sugerir as melhores opções | Should |
| RF-09 | Contexto: "versículo 5" sem capítulo usa o último capítulo citado | Should |
| RF-10 | Botão "copiar referência" | Should |
| RF-11 | Enviar referência ao Holyrics (se a API permitir; ver docs/06 fase 7) | Could |
| RF-12 | Microfone remoto: celular capta, PC exibe | Could |

## Requisitos não funcionais
- **Latência:** referência aparece em até ~2 s após o fim da frase.
- **Precisão:** nenhuma referência inexistente pode ser exibida.
- **Offline:** dados bíblicos e interface funcionam sem internet.
- **Responsivo:** celular (retrato) e desktop.
- **Resiliência:** reconexão automática do reconhecimento de voz; tela do celular não apaga (Wake Lock).
- **Privacidade:** sem gravação de áudio; sem persistir transcrições por padrão.
- **Custo:** operar no plano gratuito/barato; provedor de voz pago só se necessário.

## Fora de escopo (por ora)
Projeção própria na TV, outras versões da Bíblia, múltiplos idiomas, contas de usuário.

## Métricas de sucesso
- ≥ 90% das referências explícitas detectadas em teste real de culto.
- 0 referências inválidas exibidas.
- Operador encontra a passagem em < 3 s.
