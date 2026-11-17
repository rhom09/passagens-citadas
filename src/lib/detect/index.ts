// Re-exports from the detect module
export type { Passage, BookInfo } from './detect/types';
export { detect, validatePassage } from './validate';
export { parseReferences } from './parse';
export { normalize } from './normalize';
export { numWords } from './numbers';
export { BOOKS, buildBookLookup } from './books';