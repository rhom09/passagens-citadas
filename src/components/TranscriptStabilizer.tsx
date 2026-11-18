'use client';

import { useAppStore } from '@/lib/store/app-context';
import { useStabilizedPassages } from '@/hooks/useStabilizedPassages';
import { useEffect } from 'react';

export function TranscriptStabilizer() {
  const { state, dispatch } = useAppStore();
  const stabilizedPassages = useStabilizedPassages(
    state.currentTranscript,
    state.currentSegmentId || '',
    state.isCurrentFinal
  );

  useEffect(() => {
    if (state.currentSegmentId && !state.isCurrentFinal && stabilizedPassages.length > 0) {
       const existingEntry = state.history.find(e => e.segmentId === state.currentSegmentId);

       // Só despachar se mudou ou se é a primeira vez
       const isNew = !existingEntry || JSON.stringify(existingEntry.passages) !== JSON.stringify(stabilizedPassages);

       if (isNew) {
         dispatch({
            type: 'TRANSCRIPT',
            segmentId: state.currentSegmentId,
            text: state.currentTranscript,
            passages: stabilizedPassages,
            isFinal: false,
         });
       }
    }
  }, [stabilizedPassages, state.currentSegmentId, state.isCurrentFinal, state.currentTranscript, dispatch, state.history]);

  return null;
}
