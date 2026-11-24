export interface IdentifyCandidate {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface IdentifyRequest {
  text: string;
  candidates: IdentifyCandidate[];
}

export interface IdentifyResult {
  identified: boolean;
  reference?: {
    bookName: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
  };
  reasoning?: string;
  provider?: string;
}

export interface IdentifyProvider {
  name: string;
  identify(req: IdentifyRequest): Promise<IdentifyResult>;
}
