import HabitIcon from './HabitIcon';
import { useStore } from "@nanostores/react";
import { $habitData, logHabit } from "../../lib/stores/habitsStore";
import {
  calculateCurrentStreak,
  formatDateKey,
  getLogForDate,
  habitExistedOn,
} from "../../lib/utils/streak";

interface TodayWidgetProps {
  /**
   * Día a mostrar/editar. En el dashboard es siempre `new Date()` (hoy);
   * reutilizado desde el calendario (`MonthCalendar`) puede ser un día
   * pasado, para edición retroactiva.
   */
  today?: Date;
}

/**
 * Widget de un día: lo primero que debe ver el usuario en el dashboard
 * (principio de fricción mínima), y reutilizado por el calendario para
 * editar un día pasado. Registrar un hábito booleano es un tap; uno de
 * cantidad usa un botón "+1" de incremento rápido. Muestra la racha
 * actual al instante tras cada registro ("don't break the chain").
 *
 * Solo muestra hábitos que ya existían ese día: no tiene sentido dejar
 * registrar un hábito en una fecha anterior a su creación.
 */
export default function TodayWidget({ today = new Date() }: TodayWidgetProps) {
  const data = useStore($habitData);
  const activeHabits = data.habits.filter((habit) => !habit.archived && habitExistedOn(habit, today));
  const dateKey = formatDateKey(today);

  if (activeHabits.length === 0) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Todavía no tienes hábitos.{" "}
        <a href="/habits" className="underline">
          Crea el primero
        </a>
        .
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {activeHabits.map((habit) => {
        const todayLog = getLogForDate(data.logs, habit.id, dateKey);
        const todayValue = todayLog?.value ?? 0;
        const streak = calculateCurrentStreak(habit, data.logs, today);
        const goal = habit.unit === "boolean" ? 1 : habit.dailyGoal ?? 1;

        return (
          <li
            key={habit.id}
            className={`glass habit-row ${todayValue >= goal ? "habit-done" : ""}`}
          >
            <div className="habit-info">
              <HabitIcon habit={habit} done={todayValue >= goal}/><div>
              <p className="font-medium">{habit.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Racha: {streak}</p>
              {habit.why && <p className="habit-why">{habit.why}</p>}
            </div></div>

            {habit.unit === "boolean" ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  aria-label={habit.name}
                  checked={todayValue >= 1}
                  onChange={(event) => logHabit(habit.id, dateKey, event.target.checked ? 1 : 0)}
                  className="h-6 w-6 accent-emerald-500"
                />
              </label>
            ) : (
              <div className="habit-controls">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {todayValue} / {goal} {habit.unitLabel ?? ""}
                </span>
                {habit.unit === "duration" && <button className="quick-add" aria-label={`+5 a ${habit.name}`} onClick={() => logHabit(habit.id, dateKey, todayValue + 5)}>+5 min</button>}
                {todayValue > 0 && <button className="quick-add" aria-label={`Restar 1 a ${habit.name}`} onClick={() => logHabit(habit.id, dateKey, todayValue - 1)}>−1</button>}
                <button
                  type="button"
                  aria-label={`+1 a ${habit.name}`}
                  onClick={() => logHabit(habit.id, dateKey, todayValue + 1)}
                  className="rounded-md bg-habit-progress-light px-3 py-1 font-medium text-white hover:opacity-90 dark:bg-habit-progress-dark"
                >
                  +1
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
