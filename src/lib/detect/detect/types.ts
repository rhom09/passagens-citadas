export type { Passage, BookInfo, RawMatch } from '../types';

export type Bible = {
  version: 'ARC';
  books: { id: number; name: string; chapters: string[][] }[];
};