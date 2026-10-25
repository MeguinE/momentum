import { useStore } from "@nanostores/react";
import { $habitData } from "../../lib/stores/habitsStore";
import { computeDashboardSummary } from "../../lib/utils/dashboard";

interface SummaryCardsProps {
  /** Inyectable en tests para fijar "hoy"; en producción es `new Date()`. */
  today?: Date;
}

interface CardProps {
  label: string;
  value: string;
}

function Card({ label, value }: CardProps) {
  return (
    <div
      role="group"
      aria-label={`${label}: ${value}`}
      className="glass rounded-xl p-4"
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

/**
 * Tarjetas resumen del dashboard + refuerzo positivo: cuando se completan
 * todos los hábitos activos del día, se muestra un mensaje de felicitación
 * en vez de limitarse a los números (principio de refuerzo positivo sin
 * culpa, docs/design.md).
 */
export default function SummaryCards({ today = new Date() }: SummaryCardsProps) {
  const data = useStore($habitData);
  const summary = computeDashboardSummary(data.habits, data.logs, today);
  const allDoneToday = summary.totalActive > 0 && summary.completedToday === summary.totalActive;

  return (
    <div className="space-y-4">
      {allDoneToday && (
        <div
          role="status"
          className="animate-bounce rounded-xl bg-habit-success-light/20 p-4 text-center font-medium text-habit-success-light dark:bg-habit-success-dark/20 dark:text-habit-success-dark"
        >
          ¡Completaste todos tus hábitos de hoy! 🎉
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Completados hoy" value={`${summary.completedToday} / ${summary.totalActive}`} />
        <Card label="Racha más larga" value={String(summary.longestCurrentStreak)} />
        <Card
          label="Siguiendo tus hábitos"
          value={summary.daysSinceStart === null ? "—" : `Día ${summary.daysSinceStart + 1}`}
        />
      </div>
    </div>
  );
}
