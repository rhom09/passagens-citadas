// Re-exports from the detect module
export type { Passage, BookInfo, AmbiguousMatch } from './types';
export { detect, detectWithAmbiguous, validatePassage } from './validate';
export { parseReferences, parseReferencesWithAmbiguous, detectVerseOnly } from './parse';
export { normalize } from './normalize';
export { numWords } from './numbers';
export { BOOKS, buildBookLookup } from './books';