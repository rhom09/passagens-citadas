import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getIdentifyProvider } from '@/lib/identify';
import { BOOKS } from '@/lib/detect/books';
import { normalize } from '@/lib/detect/normalize';
import { validatePassage } from '@/lib/detect/validate';
import type { RawMatch } from '@/lib/detect/types';

// Carregamento lazy dos versículos da ARC no servidor
let cachedArc: any = null;

function getArcData() {
  if (cachedArc) return cachedArc;
  const arcPath = path.resolve(process.cwd(), 'public', 'data', 'arc.v1.json');
  if (fs.existsSync(arcPath)) {
    try {
      cachedArc = JSON.parse(fs.readFileSync(arcPath, 'utf-8'));
    } catch {
      cachedArc = null;
    }
  }
  return cachedArc;
}

function resolveBook(name: string) {
  const norm = normalize(name).replace(/\s+/g, '_');
  const exact = BOOKS.find((b) => normalize(b.name).replace(/\s+/g, '_') === norm || b.normalizedRootKey === norm);
  if (exact) return exact;
  return BOOKS.find((b) => normalize(b.name).includes(normalize(name)));
}

function getVerseText(bookId: number, chapter: number, verseStart: number, verseEnd?: number): string | null {
  const arc = getArcData();
  if (!arc) return null;
  const rawBooks = Array.isArray(arc) ? arc : arc.books ?? [];
  const book = rawBooks[bookId - 1];
  if (!book) return null;
  const ch = book.chapters?.[chapter - 1];
  if (!ch) return null;

  const end = verseEnd && verseEnd > verseStart ? verseEnd : verseStart;
  const parts: string[] = [];
  for (let v = verseStart; v <= end; v++) {
    const text = ch[v - 1];
    if (text) {
      parts.push(end > verseStart ? `${v} ${text}` : text);
    }
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, candidates } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 });
    }

    const provider = getIdentifyProvider();
    const result = await provider.identify({
      text,
      candidates: Array.isArray(candidates) ? candidates : [],
    });

    if (!result.identified || !result.reference) {
      return NextResponse.json({
        identified: false,
        provider: result.provider || provider.name,
      });
    }

    // Validação estrita contra os dados canônicos da Bíblia
    const book = resolveBook(result.reference.bookName);
    if (!book) {
      return NextResponse.json({
        identified: false,
        reason: `Livro desconhecido: ${result.reference.bookName}`,
      });
    }

    const rawMatch: RawMatch = {
      bookId: book.id,
      bookName: book.name,
      chapter: result.reference.chapter,
      verseStart: result.reference.verseStart,
      verseEnd: result.reference.verseEnd,
    };

    const validated = validatePassage(rawMatch);
    if (!validated) {
      return NextResponse.json({
        identified: false,
        reason: 'Referência bíblica inexistente nas contagens canônicas',
      });
    }

    // O texto vem SEMPRE da ARC oficial
    const arcText = getVerseText(
      validated.bookId,
      validated.chapter,
      validated.verseStart || 1,
      validated.verseEnd
    );

    return NextResponse.json({
      identified: true,
      provider: result.provider || provider.name,
      passage: {
        bookId: validated.bookId,
        bookName: validated.bookName,
        chapter: validated.chapter,
        verseStart: validated.verseStart,
        verseEnd: validated.verseEnd,
      },
      text: arcText || '',
      reasoning: result.reasoning,
    });
  } catch (err: any) {
    if (err.status === 429 || err.message?.includes('429')) {
      return NextResponse.json({ error: 'Rate limit', code: 429 }, { status: 429 });
    }
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
