export type Bible = {
  version: 'ARC';
  books: { id: number; name: string; chapters: string[][] }[];
};
