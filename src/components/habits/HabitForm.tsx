import HabitIcon, { habitIcons } from './HabitIcon';
import { Save, X } from 'lucide-react';
import { useId, useState, useEffect, useRef, type SubmitEvent } from "react";
import type { HabitUnit } from "../../lib/types";
import type { NewHabitInput } from "../../lib/stores/habitsStore";

const COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: "progress", label: "Progreso (bosque)" },
  { value: "success", label: "Cumplido (verde)" },
  { value: "achievement", label: "Logro (ámbar)" },
];

const UNIT_OPTIONS: { value: HabitUnit; label: string; helpText: string }[] = [
  {
    value: "boolean",
    label: "Marcar como hecho",
    helpText: "Un simple sí/no cada día. Ej. meditar, no fumar, tender la cama.",
  },
  {
    value: "count",
    label: "Contar una cantidad",
    helpText: "Registras un número cada día. Ej. 10 páginas leídas, 8 vasos de agua.",
  },
  {
    value: "duration",
    label: "Medir minutos",
    helpText: "Registras cuánto tiempo le dedicaste. Ej. 30 minutos de ejercicio.",
  },
];

interface HabitFormProps {
  initialValue?: NewHabitInput;
  onSubmit: (value: NewHabitInput) => void;
  onCancel: () => void;
}

/**
 * Formulario de alta/edición de un hábito. Se usa tanto para crear uno
 * nuevo como, con `initialValue`, para editar uno existente.
 */
export default function HabitForm({ initialValue, onSubmit, onCancel }: HabitFormProps) {
  const nameInput = useRef<HTMLInputElement>(null);
  const goalInput = useRef<HTMLInputElement>(null);
  useEffect(() => { nameInput.current?.focus(); }, []);
  const [icon, setIcon] = useState(initialValue?.icon ?? '');
  const [goalError, setGoalError] = useState<string | null>(null);
  const [name, setName] = useState(initialValue?.name ?? "");
  const [unit, setUnit] = useState<HabitUnit>(initialValue?.unit ?? "boolean");
  const [unitLabel, setUnitLabel] = useState(initialValue?.unitLabel ?? "");
  const [dailyGoal, setDailyGoal] = useState(
    initialValue?.dailyGoal !== undefined ? String(initialValue.dailyGoal) : "",
  );
  const [color, setColor] = useState(initialValue?.color ?? "progress");
  const [why, setWhy] = useState(initialValue?.why ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  const nameId = useId();
  const unitId = useId();
  const unitLabelId = useId();
  const dailyGoalId = useId();
  const colorId = useId();
  const whyId = useId();

  const needsQuantity = unit !== "boolean";

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim() === "") {
      setNameError("El nombre es obligatorio.");
      nameInput.current?.focus();
      return;
    }

    if (needsQuantity && dailyGoal !== '' && (!Number.isFinite(Number(dailyGoal)) || Number(dailyGoal) < 1 || !Number.isInteger(Number(dailyGoal)))) {
      setGoalError('La meta debe ser un número entero mayor que cero.');
      goalInput.current?.focus();
      return;
    }
    const value: NewHabitInput = {
      name: name.trim(),
      unit,
      color,
      icon: icon || undefined,
      why: why.trim() || undefined,
      unitLabel: needsQuantity ? unitLabel.trim() || (unit === 'duration' ? 'minutos' : undefined) : undefined,
      dailyGoal: needsQuantity && dailyGoal !== '' ? Number(dailyGoal) : undefined,
    };

    onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 habit-form" noValidate>
      <div className="habit-form-preview"><HabitIcon habit={{name,unit,color,icon:icon || undefined}}/><div><strong>{name || 'Tu próximo hábito'}</strong><p>{initialValue ? 'Edita los detalles y guarda tus cambios.' : 'Dale forma a tu siguiente pequeño paso.'}</p></div></div>
      <div>
        <label htmlFor={nameId} className="block text-sm font-medium">
          Nombre
        </label>
        <input
          ref={nameInput}
          id={nameId}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? `${nameId}-error` : undefined}
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(null);
          }}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
        {nameError && (
          <p id={`${nameId}-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {nameError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={unitId} className="block text-sm font-medium">
          ¿Cómo quieres registrarlo cada día?
        </label>
        <select
          id={unitId}
          value={unit}
          onChange={(event) => {
            const next = event.target.value as HabitUnit;
            setUnit(next);
            if (next === 'duration') setUnitLabel('minutos');
            setGoalError(null);
          }}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        >
          {UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {UNIT_OPTIONS.find((option) => option.value === unit)?.helpText}
        </p>
      </div>

      {needsQuantity && (
        <>
          <div>
            <label htmlFor={unitLabelId} className="block text-sm font-medium">
              ¿Qué unidad usas? (ej. páginas, vasos, minutos)
            </label>
            <input
              id={unitLabelId}
              type="text"
              value={unitLabel}
              onChange={(event) => setUnitLabel(event.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label htmlFor={dailyGoalId} className="block text-sm font-medium">
              Meta diaria
            </label>
            <input
              id={dailyGoalId}
              ref={goalInput}
              aria-invalid={!!goalError}
              aria-describedby={`${dailyGoalId}-help`}
              placeholder="1"
              type="number"
              min={1}
              value={dailyGoal}
              onChange={(event) => { setDailyGoal(event.target.value); setGoalError(null); }}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
        </>
      )}

      <p id={`${dailyGoalId}-help`} role={goalError ? "alert" : undefined} className="form-hint">{goalError || (needsQuantity ? "Si dejas la meta vacía, se considera 1 al día." : "")}</p>
      <details className="habit-personalization"><summary>Personalizar icono, color y motivación</summary><div className="space-y-4">
      <fieldset className="icon-picker"><legend>Icono del hábito</legend><div><button type="button" aria-pressed={icon===''} onClick={()=>setIcon('')}>Auto</button>{habitIcons.map(option=><button key={option.id} type="button" aria-label={`Icono: ${option.label}`} title={option.label} aria-pressed={icon===option.id} onClick={()=>setIcon(option.id)}><option.icon size={20}/></button>)}</div></fieldset>
      <div>
        <label htmlFor={colorId} className="block text-sm font-medium">
          Color
        </label>
        <select
          id={colorId}
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        >
          {COLOR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={whyId} className="block text-sm font-medium">
          ¿Por qué? (opcional)
        </label>
        <textarea
          id={whyId}
          value={why}
          onChange={(event) => setWhy(event.target.value)}
          placeholder="Ej. porque quiero ser alguien que lee todos los días"
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      </div></details>
      <div className="flex gap-2 habit-form-actions">
        <button
          type="submit"
          className="rounded-lg bg-habit-progress-light px-4 py-2 font-medium text-white hover:opacity-90 dark:bg-habit-progress-dark"
        >
          <Save size={16} aria-hidden="true"/> Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          <X size={16} aria-hidden="true"/> Cancelar
        </button>
      </div>
    </form>
  );
}
