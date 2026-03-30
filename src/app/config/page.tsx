"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { useProfile } from "@/hooks/useProfile";
import { useKyc, type KycDocument } from "@/hooks/useKyc";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Toggle ────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-accent" : "bg-border-strong"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Section wrapper ───────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
        {title}
      </h2>
      <div className="p-5 rounded-lg border border-border bg-surface space-y-5">
        {children}
      </div>
    </section>
  );
}

// ─── Input field ───────────────────────────────────────────────
function Field({ label, id, children, hint }: { label: string; id: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-tertiary mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full max-w-md px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:border-accent focus:outline-none transition-colors";
const selectCls = "px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:border-accent focus:outline-none transition-colors";

// ─── KYC Status Badge ──────────────────────────────────────────
function KycBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    none: { label: "Nao verificado", cls: "bg-border-strong/50 text-text-tertiary" },
    pending: { label: "Em analise", cls: "bg-warn/10 text-warn" },
    verified: { label: "Verificado", cls: "bg-up/10 text-up" },
    rejected: { label: "Rejeitado", cls: "bg-down/10 text-down" },
  };
  const badge = map[status] || map.none;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
      {status === "verified" && <Icon name="check-circle" className="w-3.5 h-3.5" />}
      {status === "pending" && <Icon name="clock" className="w-3.5 h-3.5" />}
      {status === "rejected" && <Icon name="x-circle" className="w-3.5 h-3.5" />}
      {badge.label}
    </span>
  );
}

// ─── Document Upload Component ─────────────────────────────────
function DocumentUpload({
  label,
  docType,
  existingDoc,
  onUploaded,
}: {
  label: string;
  docType: "id_front" | "proof_address";
  existingDoc?: KycDocument;
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (max 5MB)");
      return;
    }

    // Preview
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", docType);

      const res = await fetch("/api/kyc/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao enviar documento");
        return;
      }
      toast.success("Documento enviado com sucesso!");
      onUploaded();
    } catch {
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const statusColor: Record<string, string> = {
    pending: "border-warn/50 bg-warn/5",
    approved: "border-up/50 bg-up/5",
    rejected: "border-down/50 bg-down/5",
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text">{label}</p>

      {existingDoc && (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${statusColor[existingDoc.status] || "border-border"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="file-text" className="w-4 h-4 text-text-tertiary shrink-0" />
            <span className="text-sm text-text truncate">{existingDoc.original_filename}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <KycBadge status={existingDoc.status} />
            {existingDoc.status === "rejected" && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs text-accent hover:underline font-medium"
              >
                Reenviar
              </button>
            )}
          </div>
        </div>
      )}

      {existingDoc?.rejection_reason && (
        <p className="text-xs text-down flex items-center gap-1">
          <Icon name="alert-circle" className="w-3.5 h-3.5" />
          Motivo: {existingDoc.rejection_reason}
        </p>
      )}

      {(!existingDoc || existingDoc.status === "rejected") && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
          ) : (
            <Icon name="upload" className="w-8 h-8 text-text-tertiary" />
          )}
          <p className="text-sm text-text-tertiary">
            {uploading ? "Enviando..." : "Clique ou arraste o arquivo aqui"}
          </p>
          <p className="text-xs text-text-tertiary">JPG, PNG ou PDF — max 5MB</p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Masks ─────────────────────────────────────────────────────
function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function unmask(value: string): string {
  return value.replace(/\D/g, "");
}

// ─── Notification Preferences ──────────────────────────────────
interface NotificationPref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultNotifications: NotificationPref[] = [
  { key: "trade_filled", label: "Ordens executadas", description: "Receba um aviso quando sua ordem for executada.", enabled: true },
  { key: "market_resolved", label: "Mercados resolvidos", description: "Notificacao quando um mercado da sua watchlist for resolvido.", enabled: true },
  { key: "price_alert", label: "Alertas de preco", description: "Avisos quando precos atingirem seus limites definidos.", enabled: false },
  { key: "new_follower", label: "Novos seguidores", description: "Alguem comecou a seguir voce.", enabled: true },
  { key: "comment_reply", label: "Respostas a comentarios", description: "Alguem respondeu ao seu comentario.", enabled: true },
  { key: "newsletter", label: "Newsletter semanal", description: "Resumo semanal dos principais mercados e movimentos.", enabled: false },
];

// ─── Main Page ─────────────────────────────────────────────────
export default function ConfigPage() {
  const { data: profile, isLoading } = useProfile();
  const { data: kyc, refetch: refetchKyc } = useKyc();
  const queryClient = useQueryClient();

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");

  // Personal data fields
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");

  // PIX fields
  const [pixKeyType, setPixKeyType] = useState<string>("cpf");
  const [pixKey, setPixKey] = useState("");
  const [pixSaved, setPixSaved] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState(defaultNotifications);

  // Saving states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPix, setSavingPix] = useState(false);

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setHandle(profile.handle || "");
      setBio(profile.bio || "");
      setFullName(profile.full_name || "");
      setCpf(profile.cpf ? maskCpf(profile.cpf) : "");
      setDateOfBirth(profile.date_of_birth || "");
      setPhone(profile.phone ? maskPhone(profile.phone) : "");
      if (profile.pix_key) {
        setPixKey(profile.pix_key);
        setPixKeyType(profile.pix_key_type || "cpf");
        setPixSaved(true);
      }
    }
  }, [profile]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName || undefined,
          handle: handle || undefined,
          bio: bio || undefined,
          full_name: fullName || undefined,
          cpf: unmask(cpf) || undefined,
          date_of_birth: dateOfBirth || undefined,
          phone: unmask(phone) || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || err.details?.fieldErrors?.handle?.[0] || "Erro ao salvar perfil");
        return;
      }

      toast.success("Perfil salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      toast.error("Erro ao salvar perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePix() {
    if (!pixKey.trim()) {
      toast.error("Informe a chave PIX");
      return;
    }
    setSavingPix(true);
    try {
      const res = await fetch("/api/auth/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pix_key: pixKey, pix_key_type: pixKeyType }),
      });

      if (!res.ok) {
        toast.error("Erro ao salvar chave PIX");
        return;
      }

      toast.success("Chave PIX salva!");
      setPixSaved(true);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      toast.error("Erro ao salvar chave PIX");
    } finally {
      setSavingPix(false);
    }
  }

  function toggleNotification(key: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
    );
  }

  if (isLoading) {
    return (
      <div className="flex max-w-[1440px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-40 bg-border rounded" />
            <div className="h-48 bg-border/50 rounded-lg" />
            <div className="h-48 bg-border/50 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  const idDoc = kyc?.documents?.find((d: KycDocument) => d.type === "id_front");
  const addressDoc = kyc?.documents?.find((d: KycDocument) => d.type === "proof_address");

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <h1 className="text-xl font-bold text-text mb-6">Configuracoes</h1>

        {/* ── Perfil ──────────────────────────────────── */}
        <Section title="Perfil">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-xl font-bold text-accent">
              {(displayName || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-text">{displayName || "Seu nome"}</p>
              <p className="text-xs text-text-tertiary">@{handle || "handle"}</p>
            </div>
          </div>

          <Field label="Nome de exibicao" id="displayName">
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputCls}
              placeholder="Como voce quer ser chamado"
            />
          </Field>

          <Field label="Handle" id="handle" hint={`oddbr.com/u/${handle}`}>
            <div className="flex items-center max-w-md">
              <span className="px-3 py-2 rounded-l-lg border border-r-0 border-border bg-surface-raised text-sm text-text-tertiary">@</span>
              <input
                id="handle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="flex-1 px-3 py-2 rounded-r-lg border border-border bg-surface text-sm text-text focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </Field>

          <Field label="Bio" id="bio" hint={`${bio.length}/200`}>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              className={`${inputCls} resize-none`}
              placeholder="Conte sobre voce..."
            />
          </Field>
        </Section>

        {/* ── Dados Pessoais ──────────────────────────── */}
        <Section title="Dados Pessoais">
          <Field label="Nome completo" id="fullName">
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
              placeholder="Nome como consta no documento"
            />
          </Field>

          <Field label="CPF" id="cpf">
            <input
              id="cpf"
              type="text"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              className={inputCls}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </Field>

          <Field label="Data de nascimento" id="dateOfBirth">
            <input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={`${inputCls} max-w-[200px]`}
            />
          </Field>

          <Field label="Telefone" id="phone">
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              className={inputCls}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </Field>
        </Section>

        {/* Save profile button */}
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {savingProfile ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>

        {/* ── Chave PIX ──────────────────────────────── */}
        <Section title="Chave PIX para saques">
          {pixSaved && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-up/30 bg-up/5">
              <Icon name="check-circle" className="w-4 h-4 text-up" />
              <span className="text-sm text-up font-medium">Chave PIX cadastrada</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <Field label="Tipo" id="pixKeyType">
              <select
                id="pixKeyType"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value)}
                className={selectCls}
              >
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave aleatoria</option>
              </select>
            </Field>
          </div>

          <Field label="Chave PIX" id="pixKey" hint="Essa chave sera usada automaticamente nos saques">
            <input
              id="pixKey"
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className={inputCls}
              placeholder={
                pixKeyType === "cpf" ? "00000000000" :
                pixKeyType === "email" ? "seu@email.com" :
                pixKeyType === "phone" ? "11999999999" :
                "Chave aleatoria"
              }
            />
          </Field>

          <button
            type="button"
            onClick={handleSavePix}
            disabled={savingPix}
            className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-50 w-fit"
          >
            {savingPix ? "Salvando..." : "Salvar chave PIX"}
          </button>
        </Section>

        {/* ── Verificacao KYC ────────────────────────── */}
        <Section title="Verificacao de identidade (KYC)">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text">Status da verificacao</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {kyc?.kyc_status === "verified"
                  ? "Sua identidade foi verificada. Voce pode sacar sem restricoes."
                  : kyc?.kyc_status === "pending"
                  ? "Seus documentos estao sendo analisados. Aguarde ate 48h."
                  : kyc?.kyc_status === "rejected"
                  ? "Um ou mais documentos foram rejeitados. Reenvie abaixo."
                  : "Complete a verificacao para poder realizar saques."}
              </p>
            </div>
            <KycBadge status={kyc?.kyc_status || "none"} />
          </div>

          <div className="border-t border-border pt-5 space-y-6">
            <DocumentUpload
              label="Documento de identidade (RG ou CNH — frente)"
              docType="id_front"
              existingDoc={idDoc}
              onUploaded={() => {
                refetchKyc();
                queryClient.invalidateQueries({ queryKey: ["profile"] });
              }}
            />

            <DocumentUpload
              label="Comprovante de endereco (conta de luz, agua ou extrato bancario)"
              docType="proof_address"
              existingDoc={addressDoc}
              onUploaded={() => {
                refetchKyc();
                queryClient.invalidateQueries({ queryKey: ["profile"] });
              }}
            />
          </div>
        </Section>

        {/* ── Notificacoes ───────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Notificacoes
          </h2>
          <div className="rounded-lg border border-border bg-surface divide-y divide-border">
            {notifications.map((notif) => (
              <div key={notif.key} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-text">{notif.label}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{notif.description}</p>
                </div>
                <Toggle enabled={notif.enabled} onChange={() => toggleNotification(notif.key)} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Aparencia ──────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Aparencia
          </h2>
          <div className="p-5 rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-accent bg-accent/5">
                <div className="w-5 h-5 rounded-full bg-white border border-border" />
                <span className="text-sm font-medium text-text">Claro</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border opacity-50 cursor-not-allowed">
                <div className="w-5 h-5 rounded-full bg-gray-800 border border-gray-600" />
                <span className="text-sm font-medium text-text-tertiary">Escuro</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-text-tertiary bg-surface-raised px-1.5 py-0.5 rounded">
                  Em breve
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
