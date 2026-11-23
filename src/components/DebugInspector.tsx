'use client';
import { explainDetection } from '../lib/detect/validate';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { SearchSuggestion } from '../lib/search/types';

function DebugContent({
  segments,
}: {
  segments: {
    id: string;
    text: string;
    completedByContext?: boolean;
    passages: any[];
    textSuggestions?: SearchSuggestion[];
  }[];
}) {
  const searchParams = useSearchParams();
  const isDebug = searchParams.get('debug') === '1';

  if (!isDebug) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 text-white p-4 max-h-60 overflow-auto text-xs z-50 font-mono">
      <h3 className="font-bold border-b border-slate-700 pb-2 mb-2">Debug Inspector</h3>
      {segments.slice(-30).map((s) => {
        const explanation = explainDetection(s.text);
        return (
          <div key={s.id} className="border-b border-slate-700 py-2">
            <p className="text-yellow-400">Raw: &quot;{explanation.rawText}&quot;</p>
            <p className="text-green-400">Normalized: &quot;{explanation.normalized}&quot;</p>
            {s.completedByContext && s.passages.length > 0 && (
              <p className="text-cyan-400 font-bold">
                ⟳ Completado por contexto → {s.passages[0].bookName} {s.passages[0].chapter}:{s.passages[0].verseStart}
              </p>
            )}
            <div className="flex gap-4">
              <span>Matches: {explanation.rawMatches.length}</span>
              <span>Accepted: {explanation.acceptedPassages.length}</span>
              <span>Rejected: {explanation.rejectedPassages.length}</span>
              {explanation.ambiguousMatches.length > 0 && (
                <span className="text-orange-400">Ambíguos: {explanation.ambiguousMatches.length}</span>
              )}
              {s.textSuggestions && s.textSuggestions.length > 0 && (
                <span className="text-emerald-400 font-bold">Sugestões de Texto: {s.textSuggestions.length}</span>
              )}
            </div>
            {explanation.rejectedPassages.length > 0 && (
              <div className="text-red-400">
                Rejections: {explanation.rejectedPassages.map((p) => p.reason).join(', ')}
              </div>
            )}
            {explanation.validatedAmbiguous.length > 0 && (
              <div className="text-orange-400 mt-1">
                Sugestões ambíguas (livro numerado sem ordinal):
                {explanation.validatedAmbiguous.map((group) => (
                  <div key={group.baseBookName} className="pl-2">
                    {group.baseBookName}: {group.validCandidates.map((p) =>
                      `${p.bookName} ${p.chapter}${p.verseStart ? ':' + p.verseStart : ''}`
                    ).join(' | ')}
                  </div>
                ))}
              </div>
            )}
            {s.textSuggestions && s.textSuggestions.length > 0 && (
              <div className="text-emerald-400 mt-1">
                Sugestões por trecho falado (BM25):
                {s.textSuggestions.map((sug) => (
                  <div key={`${sug.passage.bookId}-${sug.passage.chapter}-${sug.passage.verseStart}`} className="pl-2">
                    → {sug.passage.bookName} {sug.passage.chapter}:{sug.passage.verseStart} | score: {sug.score} | confiança: {sug.confidence} | &ldquo;{sug.snippet}&rdquo;
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DebugInspector({
  segments,
}: {
  segments: {
    id: string;
    text: string;
    completedByContext?: boolean;
    passages: any[];
    textSuggestions?: SearchSuggestion[];
  }[];
}) {
  return (
    <Suspense fallback={null}>
      <DebugContent segments={segments} />
    </Suspense>
  );
}
