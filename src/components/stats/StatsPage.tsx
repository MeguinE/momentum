import { useStore } from "@nanostores/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { $habitData } from "../../lib/stores/habitsStore";
import { getDailyCompletionTrend, getHabitStatsTable, getWeeklyTotals } from "../../lib/utils/stats";

interface StatsPageProps {
  /** Inyectable en tests para fijar "hoy"; en producción es `new Date()`. */
  today?: Date;
}

const TREND_DAYS = 30;
const TOTALS_WEEKS = 8;

/**
 * Página de estadísticas: tendencia diaria de cumplimiento, totales
 * semanales y una tabla con racha actual/mejor racha/% de cumplimiento
 * por hábito. Ver docs/design.md.
 */
export default function StatsPage({ today = new Date() }: StatsPageProps) {
  const data = useStore($habitData);

  if (data.habits.length === 0) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">
        Todavía no hay datos.{" "}
        <a href="/habits" className="underline">
          Crea un hábito
        </a>{" "}
        y vuelve aquí en unos días.
      </p>
    );
  }

  const trend = getDailyCompletionTrend(data.habits, data.logs, TREND_DAYS, today);
  const weeklyTotals = getWeeklyTotals(data.habits, data.logs, TOTALS_WEEKS, today);
  const rows = getHabitStatsTable(data.habits, data.logs, today);

  return (
    <div className="space-y-8">
      <section className="glass rounded-xl p-4">
        <h2 className="text-lg font-semibold">Tendencia de cumplimiento (últimos {TREND_DAYS} días)</h2>
        <div className="mt-2 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={4} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, "Cumplimiento"]} />
              <Line type="monotone" dataKey="rate" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Alternativa textual para lectores de pantalla, ver skill de buenas prácticas. */}
        <p className="sr-only">
          Cumplimiento diario de los últimos {TREND_DAYS} días:{" "}
          {trend.map((point) => `${point.label}: ${point.rate}%`).join(", ")}.
        </p>
      </section>

      <section className="glass rounded-xl p-4">
        <h2 className="text-lg font-semibold">Total semanal (últimas {TOTALS_WEEKS} semanas)</h2>
        <div className="mt-2 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTotals}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="sr-only">
          Hábitos cumplidos por semana:{" "}
          {weeklyTotals.map((point) => `semana del ${point.weekLabel}: ${point.total}`).join(", ")}.
        </p>
      </section>

      <section className="glass rounded-xl p-4">
        <h2 className="text-lg font-semibold">Por hábito</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-300 dark:border-zinc-600">
                <th scope="col" className="py-2">
                  Hábito
                </th>
                <th scope="col" className="py-2">
                  Racha actual
                </th>
                <th scope="col" className="py-2">
                  Mejor racha
                </th>
                <th scope="col" className="py-2">
                  % cumplimiento
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.habitId} className="border-b border-zinc-300/40 last:border-b-0 dark:border-zinc-600/40">
                  <td className="py-2">
                    {row.name}
                    {row.archived && (
                      <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">(archivado)</span>
                    )}
                  </td>
                  <td className="py-2">{row.currentStreak}</td>
                  <td className="py-2">{row.bestStreak}</td>
                  <td className="py-2">{row.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
