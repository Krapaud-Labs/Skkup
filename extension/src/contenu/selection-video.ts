interface CandidatVideo {
  paused: boolean;
  ended: boolean;
  muted?: boolean;
  getClientRects?: () => { length: number };
}

function estVisible(video: CandidatVideo): boolean {
  return video.getClientRects === undefined || video.getClientRects().length > 0;
}

/** Choisit d'abord un média actif, visible et non muet, sans supposer l'ordre du DOM. */
export function selectionnerVideo<T extends CandidatVideo>(videos: Iterable<T>): T | null {
  const liste = Array.from(videos);
  const actifs = liste.filter((video) => !video.paused && !video.ended);
  return (
    actifs.find((video) => estVisible(video) && !video.muted) ??
    actifs.find(estVisible) ??
    actifs[0] ??
    liste[0] ??
    null
  );
}
