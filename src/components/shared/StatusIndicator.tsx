import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, XCircle } from 'lucide-react';

export type SemanticTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';

interface StatusBadgeProps {
  tone: SemanticTone;
  label: string;
  mono?: boolean;
}

const TONE_CLASSES: Record<SemanticTone, string> = {
  emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  amber: 'text-amber-700 bg-amber-50 border-amber-200',
  rose: 'text-rose-700 bg-rose-50 border-rose-200',
  sky: 'text-sky-700 bg-sky-50 border-sky-200',
  slate: 'text-slate-700 bg-slate-100 border-slate-200',
};

export const StatusLabel: React.FC<StatusBadgeProps> = ({ tone, label, mono }) => {
  const Icon =
    tone === 'emerald'
      ? CheckCircle2
      : tone === 'amber'
      ? Clock
      : tone === 'rose'
      ? XCircle
      : tone === 'sky'
      ? CreditCard
      : AlertTriangle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded ${
        TONE_CLASSES[tone]
      } ${mono ? 'font-mono' : ''} whitespace-nowrap shrink-0`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
