"use client";

import { useProfile } from "@/hooks/useProfile";
import Icon from "@/components/Icon";
import Link from "next/link";

const steps = [
  { key: "personal", label: "Dados pessoais" },
  { key: "document", label: "Documento" },
  { key: "address", label: "Comprovante" },
  { key: "verified", label: "Verificado" },
];

function getCompletedSteps(profile: { full_name?: string | null; cpf?: string | null; kyc_status?: string }) {
  const done: string[] = [];
  if (profile.full_name && profile.cpf) done.push("personal");
  if (profile.kyc_status === "pending" || profile.kyc_status === "verified") {
    done.push("document");
    done.push("address");
  }
  if (profile.kyc_status === "verified") done.push("verified");
  return done;
}

export default function OnboardingBanner() {
  const { data: profile } = useProfile();

  if (!profile) return null;
  if (profile.kyc_status === "verified") return null;

  const completed = getCompletedSteps(profile);
  const progress = Math.round((completed.length / steps.length) * 100);

  return (
    <div className="mb-4 p-4 rounded-lg border border-accent/20 bg-accent/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="shield" className="w-4 h-4 text-accent" />
          <p className="text-sm font-medium text-text">Complete sua verificacao</p>
        </div>
        <Link href="/config" className="text-xs text-accent hover:underline font-medium">
          Completar
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-border mb-3">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const isDone = completed.includes(step.key);
          return (
            <div key={step.key} className="flex items-center gap-1">
              {i > 0 && <div className={`w-4 h-px ${isDone ? "bg-accent" : "bg-border-strong"}`} />}
              <div className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  isDone ? "bg-accent text-white" : "bg-border-strong text-text-tertiary"
                }`}>
                  {isDone ? (
                    <Icon name="check" className="w-2.5 h-2.5" />
                  ) : (
                    <span className="text-[8px] font-bold">{i + 1}</span>
                  )}
                </div>
                <span className={`text-[10px] hidden sm:inline ${isDone ? "text-accent font-medium" : "text-text-tertiary"}`}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
