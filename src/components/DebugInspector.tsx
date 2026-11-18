'use client';
import { explainDetection } from '../lib/detect/validate';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DebugContent({ segments }: { segments: { id: string, text: string, completedByContext?: boolean }[] }) {
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
            {s.completedByContext && (
              <p className="text-cyan-400 font-bold">⟳ Completado por contexto (RF-09)</p>
            )}
            <div className="flex gap-4">
                <span>Matches: {explanation.rawMatches.length}</span>
                <span>Accepted: {explanation.acceptedPassages.length}</span>
                <span>Rejected: {explanation.rejectedPassages.length}</span>
            </div>
            {explanation.rejectedPassages.length > 0 && (
                <div className="text-red-400">
                    Rejections: {explanation.rejectedPassages.map(p => p.reason).join(', ')}
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DebugInspector({ segments }: { segments: { id: string, text: string, completedByContext?: boolean }[] }) {
  return (
    <Suspense fallback={null}>
      <DebugContent segments={segments} />
    </Suspense>
  );
}
