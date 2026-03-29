"use client";

import { useState, useEffect } from "react";

function getTimeRemaining(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes, expired: false };
}

function formatRemaining(hours: number, minutes: number) {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export default function CountdownBadge({ resolutionDate }: { resolutionDate: string }) {
  const [time, setTime] = useState(getTimeRemaining(resolutionDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(resolutionDate));
    }, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [resolutionDate]);

  if (time.expired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-down/10 text-down text-[10px] font-semibold">
        Encerrado
      </span>
    );
  }

  const isUrgent = time.hours < 1;
  const isSoon = time.hours < 6;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
      isUrgent
        ? "bg-down/10 text-down"
        : isSoon
        ? "bg-neutral-warn/10 text-neutral-warn"
        : "bg-accent/10 text-accent"
    }`}>
      {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-live" />}
      {formatRemaining(time.hours, time.minutes)}
    </span>
  );
}
