import { useStore } from "@nanostores/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { $habitData } from "../../lib/stores/habitsStore";
import { getContributionGrid, type ContributionDay } from "../../lib/utils/contributionGrid";

interface ContributionHeatmapProps {
  /** Inyectable en tests para fijar "hoy"; en producción es `new Date()`. */
  today?: Date;
  /** Cantidad de semanas a mostrar. */
  weeks?: number;
}

const DEFAULT_WEEKS = 20;

function cellClass(day: ContributionDay): string {
  if (day.isFuture) {
    return "bg-transparent border border-dashed border-zinc-300/60 dark:border-zinc-600/40";
  }
  if (day.ratio === null) {
    return "bg-zinc-200/50 dark:bg-zinc-700/40";
  }
  if (day.ratio === 0) {
    return "bg-habit-missed-light dark:bg-habit-missed-dark";
  }
  if (day.ratio === 1) {
    return "bg-habit-success-light dark:bg-habit-success-dark";
  }
  if (day.ratio >= 0.5) {
    return "bg-habit-success-light/60 dark:bg-habit-success-dark/60";
  }
  return "bg-habit-success-light/30 dark:bg-habit-success-dark/30";
}

function cellTitle(day: ContributionDay): string {
  const dateLabel = format(day.date, "d 'de' MMMM", { locale: es });
  if (day.isFuture) {
    return `${dateLabel} (todavía no llega)`;
  }
  if (day.ratio === null) {
    return `${dateLabel}: sin hábitos registrados`;
  }
  return `${dateLabel}: ${day.completedCount} de ${day.totalCount} hábitos cumplidos`;
}

/**
 * Heatmap de contribuciones estilo GitHub: la forma principal de ver el
 * progreso de un vistazo en el dashboard (docs/design.md, principio
 * "don't break the chain"). Es solo visualización; para corregir un día
 * puntual está la página `/calendar`.
 */
export default function ContributionHeatmap({ today = new Date(), weeks = DEFAULT_WEEKS }: ContributionHeatmapProps) {
  const data = useStore($habitData);

  if (data.habits.length === 0) {
    return null;
  }

  const grid = getContributionGrid(data.habits, data.logs, weeks, today);

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div role="img" aria-label={`Mapa de calor de cumplimiento de las últimas ${weeks} semanas`} className="flex gap-1">
          {grid.map((week) => (
            <div key={week[0].dateKey} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.dateKey}
                  title={cellTitle(day)}
                  className={`h-3 w-3 rounded-sm sm:h-3.5 sm:w-3.5 ${cellClass(day)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span>Menos</span>
        <span className="h-3 w-3 rounded-sm bg-habit-missed-light dark:bg-habit-missed-dark" />
        <span className="h-3 w-3 rounded-sm bg-habit-success-light/30 dark:bg-habit-success-dark/30" />
        <span className="h-3 w-3 rounded-sm bg-habit-success-light/60 dark:bg-habit-success-dark/60" />
        <span className="h-3 w-3 rounded-sm bg-habit-success-light dark:bg-habit-success-dark" />
        <span>Más</span>
      </div>
      {/* Alternativa textual para lectores de pantalla (mismo patrón que /stats). */}
      <p className="sr-only">
        {grid
          .flat()
          .filter((day) => !day.isFuture)
          .map((day) => `${format(day.date, "d/MM", { locale: es })}: ${day.ratio === null ? "sin hábitos" : `${day.completedCount} de ${day.totalCount}`}`)
          .join(", ")}
      </p>
    </div>
  );
}
