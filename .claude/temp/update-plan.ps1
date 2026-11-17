# Carregar o conteúdo do arquivo

$content = Get-Content "c:\repos\passagens-citadas\docs\superpowers\plans\2026-11-17-fase1-dados-e-detector.md" -Raw

# Ajuste 3/5: separar counts.ts de loader.ts
$content = $content -replace 'src/lib/bible/index\.ts.*loadBible\(\).*stub para agora', 'src/lib/bible/counts.ts — compatibilidade (verseCount, chapterCount sem fetch)'
$content = $content -replace 'src/lib/bible/index\.ts.*loadBible\(\).*Funções verseCount, chapterCount, getVerse, loadBible \(stub que faz fetch de', 'src/lib/bible/loader.ts — loadBible(), getVerse() (fetch real)'
$content = $content -replace 'src/lib/bible/index\.ts.* função verseCount, chapterCount, getVerse, loadBible \(stub que faz fetch de', ''
$content = $content -replace 'src/lib/bible/index\.ts.*Funções verseCount, chapterCount, getVerse, loadBible \(', 'src/lib/bible/loader.ts (\n  - loadBible(): Promise<Bible> — carrega JSON\n  - getVerse(bible: Bible, bookId: number, ch: number, v: number): string | undefined\n)'

# Ajuste 3/5:versículo inexistente → vazio
$content = $content -replace 'it.*"Números 2:88".*→ vazio \(versículo inexistente\)', 'it(''"Números 2:88" → vazio (versículo inexistente)'', () => { expect(detect(''Números 2:88'')).toHaveLength(0); });'

# Ajuste 3/5: intervalo condicional → expectativas exatas
$content = $content -replace '// 1 Coríntios 13 tem 13 versículos: 4-99 deve rejeitar o verseEnd', '// 1 Coríntios 13 tem 13 versículos: 4-13 retorna corretamente, 4-99 retorna só 4-13 (foundation end inválido)'
$content = $content -replace '// Pode retornar só 13:4 sem end, ou rejeitar totalmente — depende da impl', '// Implementation: if verseEnd > chapterMax, return range[endStart..chapterMax] or stop at start'
$content = $content -replace '// O importante: nunca retornar verseEnd: 99', '// If validation catches invalid end, return empty array instead of malformed passage or slice'

# Escrever o conteúdo de volta

Set-Content -Path "c:\repos\passagens-citadas\docs\superpowers\plans\2026-11-17-fase1-dados-e-detector.md" -Value $content -NoNewline

Write-Host "Conteúdo atualizado com sucesso"