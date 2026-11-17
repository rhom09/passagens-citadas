import type { BookInfo } from './detect/types';

// Base data from prototype: 66 books in canonical order
// Each entry: [id, name, normalizedRootKey, maxVolumes, singleChapter, isNumbered]
// IDs are 1-indexed. id 43 = João (Evangelho, maxVolumes 0)
// Non-numbered books: 0-indexed volume concept, numbered books: 1-2 or 1-3 volumes
const BOOKS: BookInfo[] = [
  // Livros numerados (prefixo necessário)
  { id: 1, name: 'Gênesis', normalizedRootKey: 'genesis', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 2, name: 'Êxodo', normalizedRootKey: 'exodo', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 3, name: 'Levítico', normalizedRootKey: 'levitico', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 4, name: 'Números', normalizedRootKey: 'numeros', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 5, name: 'Deuteronômio', normalizedRootKey: 'deuteronomio', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 6, name: 'Josué', normalizedRootKey: 'josue', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 7, name: 'Juízes', normalizedRootKey: 'juizes', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 8, name: 'Rute', normalizedRootKey: 'rute', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 9, name: '1 Samuel', normalizedRootKey: '1_samuel', maxVolumes: 2, singleChapter: false, isNumbered: true },
  { id: 10, name: '2 Samuel', normalizedRootKey: '2_samuel', maxVolumes: 2, singleChapter: false, isNumbered: true },
  { id: 11, name: '1 Reis', normalizedRootKey: '1_reis', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 12, name: '2 Reis', normalizedRootKey: '2_reis', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 13, name: '1 Crônicas', normalizedRootKey: '1_cronicas', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 14, name: '2 Crônicas', normalizedRootKey: '2_cronicas', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 15, name: 'Esdras', normalizedRootKey: 'esdras', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 16, name: 'Neemias', normalizedRootKey: 'neemias', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 17, name: 'Ester', normalizedRootKey: 'ester', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 18, name: 'Jó', normalizedRootKey: 'jo', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 19, name: 'Salmos', normalizedRootKey: 'salmos', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 20, name: 'Provérbios', normalizedRootKey: 'provindios', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 21, name: 'Eclesiastes', normalizedRootKey: 'eclesiastes', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 22, name: 'Cantares', normalizedRootKey: 'cantares', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 23, name: 'Isaías', normalizedRootKey: 'isaias', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 24, name: 'Jeremias', normalizedRootKey: 'jeremias', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 25, name: 'Lamentações', normalizedRootKey: 'lamentacoes', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 26, name: 'Ezequiel', normalizedRootKey: 'ezequiel', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 27, name: 'Daniel', normalizedRootKey: 'daniel', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 28, name: 'Oséias', normalizedRootKey: 'oseias', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 29, name: 'Joel', normalizedRootKey: 'joel', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 30, name: 'Amós', normalizedRootKey: 'amos', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 31, name: 'Oba', normalizedRootKey: 'oba', maxVolumes: 0, singleChapter: true, isNumbered: false },
  { id: 32, name: 'Jonas', normalizedRootKey: 'jonas', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 33, name: 'Naum', normalizedRootKey: 'naum', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 34, name: 'Habacuque', normalizedRootKey: 'habacuque', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 35, name: 'Sofonias', normalizedRootKey: 'sofnias', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 36, name: 'Ageu', normalizedRootKey: 'ageu', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 37, name: ' Zacarias', normalizedRootKey: 'zacarias', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 38, name: 'Malaquias', normalizedRootKey: 'malaquias', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 39, name: 'Mateus', normalizedRootKey: 'mateus', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 40, name: 'Marcos', normalizedRootKey: 'marcos', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 41, name: 'Lucas', normalizedRootKey: 'lucas', maxVolumes: 0, singleChapter: false, isNumbered: false },
  // id 42: João sem prefixo = Evangelho (maxVolumes 0) -- the "plain" key
  { id: 42, name: 'João', normalizedRootKey: 'joao', maxVolumes: 0, singleChapter: false, isNumbered: false },
  // id 43: Atos (shifted from original position)
  { id: 43, name: 'Atos', normalizedRootKey: 'atos', maxVolumes: 0, singleChapter: false, isNumbered: false },
  // Continue with remaining books shifted down by 1 from original
  { id: 44, name: '1 Coríntios', normalizedRootKey: '1_corintios', maxVolumes: 0, singleChapter: false, isNumbered: true },
  { id: 45, name: '2 Coríntios', normalizedRootKey: '2_corintios', maxVolumes: 0, singleChapter: false, isNumbered: true },
  { id: 46, name: 'Gálatas', normalizedRootKey: 'galatas', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 47, name: 'Efésios', normalizedRootKey: 'efesos', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 48, name: 'Filipenses', normalizedRootKey: 'filipenses', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 49, name: 'Colossenses', normalizedRootKey: 'colossenses', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 50, name: '1 Tessalonicenses', normalizedRootKey: '1_tessalonicenses', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 51, name: '2 Tessalonicenses', normalizedRootKey: '2_tessalonicenses', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 52, name: '1 Timóteo', normalizedRootKey: '1_timoteo', maxVolumes: 0, singleChapter: false, isNumbered: true },
  { id: 53, name: '2 Timóteo', normalizedRootKey: '2_timoteo', maxVolumes: 0, singleChapter: false, isNumbered: true },
  { id: 54, name: 'Tito', normalizedRootKey: 'tito', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 55, name: 'Filemom', normalizedRootKey: 'filemom', maxVolumes: 0, singleChapter: true, isNumbered: false },
  { id: 56, name: 'Hebreus', normalizedRootKey: 'hebreus', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 57, name: 'Tiago', normalizedRootKey: 'tiago', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 58, name: '1 Pedro', normalizedRootKey: '1_pedro', maxVolumes: 0, singleChapter: false, isNumbered: false },
  { id: 59, name: '2 Pedro', normalizedRootKey: '2_pedro', maxVolumes: 0, singleChapter: false, isNumbered: false },
  // id 60: 1 João (original position ~61)
  { id: 60, name: '1 João', normalizedRootKey: '1_joao', maxVolumes: 3, singleChapter: true, isNumbered: false },
  // id 61: 2 João (original position ~62)
  { id: 61, name: '2 João', normalizedRootKey: '2_joao', maxVolumes: 3, singleChapter: true, isNumbered: false },
  // id 62: 3 João (original position ~63)
  { id: 62, name: '3 João', normalizedRootKey: '3_joao', maxVolumes: 3, singleChapter: true, isNumbered: false },
  // id 63: Judas (original position ~64)
  { id: 63, name: 'Judas', normalizedRootKey: 'judas', maxVolumes: 0, singleChapter: true, isNumbered: false },
  // id 64: Apocalipse (original position ~65)
  { id: 64, name: 'Apocalipse', normalizedRootKey: 'apocalipse', maxVolumes: 0, singleChapter: false, isNumbered: false },
  // id 65: (was missing/placeholder, now filled)
  { id: 65, name: 'Sabá', normalizedRootKey: 'saba', maxVolumes: 0, singleChapter: false, isNumbered: false },
  // id 66: (was missing/placeholder, now filled)
  { id: 66, name: '', normalizedRootKey: '', maxVolumes: 0, singleChapter: false, isNumbered: false },
];

// Export typed list
export { BOOKS };

// Build lookup map: normalizedRootKey -> { bookInfo, isNumbered }
export function buildBookLookup(): Map<string, { bookInfo: BookInfo; isNumbered: boolean }> {
  const lookup = new Map<string, { bookInfo: BookInfo; isNumbered: boolean }>();

  for (const book of BOOKS) {
    // Map the root key (e.g., "joao", "genesis", "samuel")
    if (!lookup.has(book.normalizedRootKey)) {
      lookup.set(book.normalizedRootKey, { bookInfo: book, isNumbered: book.isNumbered });
    }
    // Para livros numerados, também mapear a key "plain" (sem prefixo numérico)
    // Ex: "1_samuel" -> livro numerado, "samuel" -> também mapeia para o mesmo livro
    // A rejeição de "Samuel 3" sem prefixo será feita no parseReferences
    if (book.isNumbered) {
      const plainKey = book.normalizedRootKey.replace(/_/g, '');
      if (!lookup.has(plainKey)) {
        lookup.set(plainKey, { bookInfo: book, isNumbered: true });
      }
    }
  }

  // Special: "joao" should map to Gospel (id 42, maxVolumes 0) when used without prefix
  // The entry for id 42 (John) already maps to Gospel; we need to make sure
  // that "joao" (without number prefix) maps to Evangelho (id 42)
  lookup.set('joao', { bookInfo: BOOKS.find(b => b.id === 42)!, isNumbered: false });

  return lookup;
}