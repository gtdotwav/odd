const paths: Record<string, string> = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  zap: "M13 10V3L4 14h7v7l9-11h-7z",
  football: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 3.5L14.5 8H9.5L12 5.5zM6.3 9h3.2l-1.6 4.9L6.3 9zm2.4 6.5L12 13l3.3 2.5-1.3 4H10l-1.3-4zm9-6.5l-1.6 4.9L14.5 9h3.2z",
  building: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v.01M12 14v.01M16 14v.01M8 18v.01M12 18v.01M16 18v.01",
  "trend-up": "M2 17l6-6 4 4 8-10M16 5h4v4",
  film: "M7 4v16M17 4v16M3 8h4m6 0h8M3 12h18M3 16h4m6 0h8M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
  bitcoin: "M9.5 2v2M14.5 2v2M9.5 20v2M14.5 20v2M7 4h8.5a3.5 3.5 0 010 7H7V4zm0 7h9.5a3.5 3.5 0 010 7H7v-7z",
  trophy: "M6 9a6 6 0 0012 0V3H6v6zM6 3H2v3a4 4 0 004 4M18 3h4v3a4 4 0 01-4 4M9 18h6M12 15v3M8 21h8",
  globe: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  cpu: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 7h10v10H7z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  "bar-chart": "M12 20V10M18 20V4M6 20v-4",
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  fire: "M12 22c-4.97 0-9-2.69-9-6 0-4 3.5-7.1 3.5-10.5C6.5 2 10 1 12 4c2-3 5.5-2 5.5 1.5C17.5 8.9 21 12 21 16c0 3.31-4.03 6-9 6z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  share: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  "thumbs-up": "M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3",
  check: "M20 6L9 17l-5-5",
  "alert-triangle": "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  sparkle: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.36-6.36l-.71.71M6.34 17.66l-.7.7m12.02.01l-.7-.71M6.34 6.34l-.7-.7",
};

export default function Icon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((segment, i) => (
        <path key={i} d={i === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}

// Category icon map — used by markets data and navigation
export const categoryIcons: Record<string, string> = {
  Economia: "trend-up",
  Futebol: "football",
  "Cultura Pop": "film",
  Política: "building",
  Cripto: "bitcoin",
  Esportes: "trophy",
  Mundo: "globe",
  "Tech / IA": "cpu",
};
