import { useStore } from "@nanostores/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import TodayWidget from "../habits/TodayWidget";
import { $habitData } from "../../lib/stores/habitsStore";
import { getMonthGrid, type CalendarDay } from "../../lib/utils/calendarGrid";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface MonthCalendarProps {
  /** Inyectable en tests para fijar "hoy"; en producción es `new Date()`. */
  today?: Date;
}

function dayCellClass(day: CalendarDay): string {
  if (day.isFuture) {
    return "bg-transparent border border-dashed border-zinc-300/60 text-zinc-400 dark:border-zinc-600/40 dark:text-zinc-600";
  }
  if (!day.inCurrentMonth) {
    return "bg-transparent text-zinc-400 dark:text-zinc-600";
  }
  if (day.completionRatio === null) {
    return "bg-zinc-100 dark:bg-zinc-800/60";
  }
  if (day.completionRatio === 0) {
    return "bg-habit-missed-light dark:bg-habit-missed-dark";
  }
  if (day.completionRatio === 1) {
    return "bg-habit-success-light text-white dark:bg-habit-success-dark";
  }
  return "bg-habit-success-light/40 dark:bg-habit-success-dark/40";
}

const ARROW_KEY_STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowLeft: -1,
  ArrowDown: 7,
  ArrowUp: -7,
};

function dayAriaLabel(day: CalendarDay): string {
  const dateLabel = format(day.date, "d 'de' MMMM", { locale: es });
  if (day.isFuture) {
    return `${dateLabel}, todavía no llega`;
  }
  if (day.completionRatio === null) {
    return `${dateLabel}, sin hábitos registrados`;
  }
  return `${dateLabel}, ${day.completedCount} de ${day.totalCount} hábitos cumplidos`;
}

/**
 * Calendario mensual con heatmap de cumplimiento (principio "don't break
 * the chain", docs/design.md). Click en un día pasado o de hoy abre un
 * panel para registrar/editar ese día; los días futuros no son
 * seleccionables.
 */
export default function MonthCalendar({ today = new Date() }: MonthCalendarProps) {
  const data = useStore($habitData);
  const [viewedDate, setViewedDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dayButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const weeks = useMemo(
    () => getMonthGrid(viewedDate.getFullYear(), viewedDate.getMonth(), data.habits, data.logs, today),
    [viewedDate, data.habits, data.logs, today],
  );
  const allDays = useMemo(() => weeks.flat(), [weeks]);

  // Al cambiar de mes (no en cada actualización de datos), la celda con
  // tabIndex=0 vuelve a ser "hoy" si está visible, o la primera del mes.
  useEffect(() => {
    const todayIndex = allDays.findIndex((day) => day.isToday);
    setFocusedIndex(todayIndex >= 0 ? todayIndex : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedDate]);

  const selectedDay = allDays.find((day) => day.dateKey === selectedDateKey);

  function handleDayKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = ARROW_KEY_STEPS[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();

    let targetIndex = index + step;
    let attempts = 0;
    while (
      targetIndex >= 0 &&
      targetIndex < allDays.length &&
      allDays[targetIndex].isFuture &&
      attempts < 7
    ) {
      targetIndex += step;
      attempts += 1;
    }

    if (targetIndex < 0 || targetIndex >= allDays.length || allDays[targetIndex].isFuture) {
      return;
    }

    setFocusedIndex(targetIndex);
    dayButtonRefs.current[targetIndex]?.focus();
  }

  function goToPreviousMonth() {
    setViewedDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewedDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="Mes anterior"
          className="rounded-md px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ←
        </button>
        <p className="font-semibold capitalize">
          {format(viewedDate, "MMMM yyyy", { locale: es })}
        </p>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Mes siguiente"
          className="rounded-md px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          →
        </button>
      </div>

      <div role="grid" aria-label="Calendario de hábitos" className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} role="columnheader" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </div>
        ))}

        {allDays.map((day, index) => (
          <button
            key={day.dateKey}
            ref={(el) => {
              dayButtonRefs.current[index] = el;
            }}
            type="button"
            role="gridcell"
            tabIndex={index === focusedIndex ? 0 : -1}
            disabled={day.isFuture}
            aria-disabled={day.isFuture}
            aria-pressed={day.dateKey === selectedDateKey}
            aria-label={dayAriaLabel(day)}
            onClick={() => {
              setSelectedDateKey(day.dateKey);
              setFocusedIndex(index);
            }}
            onKeyDown={(event) => handleDayKeyDown(event, index)}
            className={`aspect-square rounded-md text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-40 ${dayCellClass(day)} ${
              day.dateKey === selectedDateKey ? "ring-2 ring-sky-500" : ""
            } ${day.isToday ? "font-bold" : ""}`}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>

      {selectedDay && (
        <div className="glass rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold capitalize">
              {format(selectedDay.date, "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <button
              type="button"
              onClick={() => setSelectedDateKey(null)}
              aria-label="Cerrar edición del día"
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              Cerrar
            </button>
          </div>
          <TodayWidget today={selectedDay.date} />
        </div>
      )}
    </div>
  );
}
