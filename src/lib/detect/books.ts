import type { BookInfo } from './types';

/**
 * 66 livros canônicos protestantes em ordem canônica.
 * normalizedRootKey: forma normalizada (sem acentos, minúsculas) usada para lookup.
 * maxVolumes: 0 = não numerado; 2 = existe 1º e 2º; 3 = existe 1º, 2º e 3º.
 * isNumbered: true = exige prefixo ordinal ("1 Samuel", "2 Coríntios").
 * singleChapter: true = livro com apenas 1 capítulo.
 */
export const BOOKS: BookInfo[] = [
  // ── Antigo Testamento ─────────────────────────────────────────────
  // Pentateuco
  { id: 1,  name: 'Gênesis',       normalizedRootKey: 'genesis',         maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 2,  name: 'Êxodo',         normalizedRootKey: 'exodo',           maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 3,  name: 'Levítico',      normalizedRootKey: 'levitico',        maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 4,  name: 'Números',       normalizedRootKey: 'numeros',         maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 5,  name: 'Deuteronômio',  normalizedRootKey: 'deuteronomio',    maxVolumes: 0, singleChapter: false, isNumbered: false },
  // Históricos
  { id: 6,  name: 'Josué',         normalizedRootKey: 'josue',           maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 7,  name: 'Juízes',        normalizedRootKey: 'juizes',          maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 8,  name: 'Rute',          normalizedRootKey: 'rute',            maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 9,  name: '1 Samuel',      normalizedRootKey: '1_samuel',        maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 10, name: '2 Samuel',      normalizedRootKey: '2_samuel',        maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 11, name: '1 Reis',        normalizedRootKey: '1_reis',          maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 12, name: '2 Reis',        normalizedRootKey: '2_reis',          maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 13, name: '1 Crônicas',    normalizedRootKey: '1_cronicas',      maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 14, name: '2 Crônicas',    normalizedRootKey: '2_cronicas',      maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 15, name: 'Esdras',        normalizedRootKey: 'esdras',          maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 16, name: 'Neemias',       normalizedRootKey: 'neemias',         maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 17, name: 'Ester',         normalizedRootKey: 'ester',           maxVolumes: 0, singleChapter: false, isNumbered: false },
  // Poéticos
  { id: 18, name: 'Jó',            normalizedRootKey: 'jo',              maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 19, name: 'Salmos',        normalizedRootKey: 'salmos',          maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 20, name: 'Provérbios',    normalizedRootKey: 'proverbios',      maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 21, name: 'Eclesiastes',   normalizedRootKey: 'eclesiastes',     maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 22, name: 'Cantares',      normalizedRootKey: 'cantares',        maxVolumes: 0, singleChapter: false, isNumbered: false },
  // Profetas maiores
  { id: 23, name: 'Isaías',        normalizedRootKey: 'isaias',          maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 24, name: 'Jeremias',      normalizedRootKey: 'jeremias',        maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 25, name: 'Lamentações',   normalizedRootKey: 'lamentacoes',     maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 26, name: 'Ezequiel',      normalizedRootKey: 'ezequiel',        maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 27, name: 'Daniel',        normalizedRootKey: 'daniel',          maxVolumes: 0, singleChapter: false, isNumbered: false },
  // Profetas menores
  { id: 28, name: 'Oséias',        normalizedRootKey: 'oseias',          maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 29, name: 'Joel',          normalizedRootKey: 'joel',            maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 30, name: 'Amós',          normalizedRootKey: 'amos',            maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 31, name: 'Obadias',       normalizedRootKey: 'obadias',         maxVolumes: 0, singleChapter: true,  isNumbered: false },
  { id: 32, name: 'Jonas',         normalizedRootKey: 'jonas',           maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 33, name: 'Miquéias',      normalizedRootKey: 'miqueias',        maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 34, name: 'Naum',          normalizedRootKey: 'naum',            maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 35, name: 'Habacuque',     normalizedRootKey: 'habacuque',       maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 36, name: 'Sofonias',      normalizedRootKey: 'sofonias',        maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 37, name: 'Ageu',          normalizedRootKey: 'ageu',            maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 38, name: 'Zacarias',      normalizedRootKey: 'zacarias',        maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 39, name: 'Malaquias',     normalizedRootKey: 'malaquias',       maxVolumes: 0, singleChapter: false, isNumbered: false },

  // ── Novo Testamento ───────────────────────────────────────────────
  // Evangelhos
  { id: 40, name: 'Mateus',        normalizedRootKey: 'mateus',          maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 41, name: 'Marcos',        normalizedRootKey: 'marcos',          maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 42, name: 'Lucas',         normalizedRootKey: 'lucas',           maxVolumes: 0, singleChapter: false, isNumbered: false },
  // id 43: João (Evangelho) — "joao" sem prefixo mapeia aqui
  { id: 43, name: 'João',          normalizedRootKey: 'joao',            maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 44, name: 'Atos',          normalizedRootKey: 'atos',            maxVolumes: 0, singleChapter: false, isNumbered: false },
  // Epístolas paulinas
  { id: 45, name: 'Romanos',       normalizedRootKey: 'romanos',         maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 46, name: '1 Coríntios',   normalizedRootKey: '1_corintios',     maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 47, name: '2 Coríntios',   normalizedRootKey: '2_corintios',     maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 48, name: 'Gálatas',       normalizedRootKey: 'galatas',         maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 49, name: 'Efésios',       normalizedRootKey: 'efesios',         maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 50, name: 'Filipenses',    normalizedRootKey: 'filipenses',      maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 51, name: 'Colossenses',   normalizedRootKey: 'colossenses',     maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 52, name: '1 Tessalonicenses', normalizedRootKey: '1_tessalonicenses', maxVolumes: 2, singleChapter: false, isNumbered: true },
  { id: 53, name: '2 Tessalonicenses', normalizedRootKey: '2_tessalonicenses', maxVolumes: 2, singleChapter: false, isNumbered: true },
  { id: 54, name: '1 Timóteo',     normalizedRootKey: '1_timoteo',       maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 55, name: '2 Timóteo',     normalizedRootKey: '2_timoteo',       maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 56, name: 'Tito',          normalizedRootKey: 'tito',            maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 57, name: 'Filemom',       normalizedRootKey: 'filemom',         maxVolumes: 0, singleChapter: true,  isNumbered: false },
  // Epístola aos Hebreus
  { id: 58, name: 'Hebreus',       normalizedRootKey: 'hebreus',         maxVolumes: 0, singleChapter: false, isNumbered: false },
  // Epístolas gerais
  { id: 59, name: 'Tiago',         normalizedRootKey: 'tiago',           maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 60, name: '1 Pedro',       normalizedRootKey: '1_pedro',         maxVolumes: 2, singleChapter: false, isNumbered: true  },
  { id: 61, name: '2 Pedro',       normalizedRootKey: '2_pedro',         maxVolumes: 2, singleChapter: false, isNumbered: true  },
  // Epístolas de João — name='João', maxVolumes 3; lookup por "1_joao"/"2_joao"/"3_joao"
  { id: 62, name: 'João',          normalizedRootKey: '1_joao',          maxVolumes: 3, singleChapter: true,  isNumbered: false },
  { id: 63, name: 'João',          normalizedRootKey: '2_joao',          maxVolumes: 3, singleChapter: true,  isNumbered: false },
  { id: 64, name: 'João',          normalizedRootKey: '3_joao',          maxVolumes: 3, singleChapter: true,  isNumbered: false },
  // Judas
  { id: 65, name: 'Judas',         normalizedRootKey: 'judas',           maxVolumes: 0, singleChapter: true,  isNumbered: false },
  // Apocalipse
  { id: 66, name: 'Apocalipse',    normalizedRootKey: 'apocalipse',      maxVolumes: 0, singleChapter: false, isNumbered: false },
];

/**
 * Constrói o mapa de lookup: normalizedRootKey → { bookInfo, isNumbered }.
 * "joao" (sem prefixo) → Evangelho de João (id 43).
 * "1_joao" → 1 João (id 62), etc.
 */
export function buildBookLookup(): Map<string, { bookInfo: BookInfo; isNumbered: boolean }> {
  const lookup = new Map<string, { bookInfo: BookInfo; isNumbered: boolean }>();

  for (const book of BOOKS) {
    if (!book.normalizedRootKey) continue;
    if (!lookup.has(book.normalizedRootKey)) {
      lookup.set(book.normalizedRootKey, { bookInfo: book, isNumbered: book.isNumbered });
    }

    // Para livros com prefixo numérico ("1_corintios"), também mapear sem prefixo ("corintios")
    // como isNumbered=true, para que o parser saiba que exige prefixo
    if (book.normalizedRootKey.match(/^\d+_/)) {
      const plainKey = book.normalizedRootKey.replace(/^\d+_/, '');
      if (!lookup.has(plainKey)) {
        lookup.set(plainKey, { bookInfo: book, isNumbered: true });
      }
    }
  }

  // Garantir que "joao" (sem prefixo) → Evangelho (id 43)
  const gospel = BOOKS.find((b) => b.id === 43)!;
  lookup.set('joao', { bookInfo: gospel, isNumbered: false });

  // Alias: "salmo" → Salmos (id 19)
  const salmos = BOOKS.find((b) => b.id === 19)!;
  lookup.set('salmo', { bookInfo: salmos, isNumbered: false });

  // Alias: "obadias" → id 31 (já está via normalizedRootKey)
  // Alias: "oba" (como no protótipo)
  const obadias = BOOKS.find((b) => b.id === 31)!;
  lookup.set('oba', { bookInfo: obadias, isNumbered: false });

  // ── Aliases de transcrição ──────────────────────────────────────────────
  // Para adicionar novas variantes encontradas no DebugInspector:
  //   1. Normalize a variante (minúsculas, sem acentos): ex. "habacuc" → "habacuc"
  //   2. Adicione uma linha: TRANSCRIPTION_ALIASES['habacuc'] = 'habacuque';
  //   3. O loop abaixo copia automaticamente a entrada canônica para a variante.
  const TRANSCRIPTION_ALIASES: Record<string, string> = {
    habacuc:                'habacuque',  // Habacuque / Habacuc
    oseas:                  'oseias',     // Oséias / Oseas
    filemon:                'filemom',    // Filemom / Filemon
    canticos:               'cantares',   // Cânticos / Cantares
    'cantares de salomao':  'cantares',   // Cantares de Salomão
    'cantico dos canticos': 'cantares',   // Cântico dos Cânticos
    'atos dos apostolos':   'atos',       // Atos dos Apóstolos
  };

  for (const [alias, canonical] of Object.entries(TRANSCRIPTION_ALIASES)) {
    if (!lookup.has(alias)) {
      const entry = lookup.get(canonical);
      if (entry) lookup.set(alias, entry);
    }
  }

  return lookup;
}
