import { useStore } from "@nanostores/react";
import { useId, useRef, useState, type ChangeEvent } from "react";
import { parseBackup, serializeBackup } from "../../lib/storage/backup";
import { $habitData, replaceAllData } from "../../lib/stores/habitsStore";
import { formatDateKey } from "../../lib/utils/streak";

/**
 * Exportar/importar un respaldo JSON (docs/design.md: mitigación del
 * riesgo real de pérdida de datos, que es borrado accidental de
 * localStorage, no corrupción espontánea).
 */
export default function BackupControls() {
  const data = useStore($habitData);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  function handleExport() {
    const json = serializeBackup(data);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `habit-tracker-backup-${formatDateKey(new Date())}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      const result = parseBackup(raw);

      if (!result.ok) {
        setError(result.error);
      } else {
        const confirmed = window.confirm(
          "Esto reemplaza todos tus hábitos y tu historial actual con los del archivo. ¿Continuar?",
        );
        if (confirmed) {
          replaceAllData(result.data);
          setError(null);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-4">
        <h2 className="text-lg font-semibold">Exportar</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Descarga un respaldo de todos tus hábitos y tu historial, por si borras
          los datos del navegador por accidente.
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="mt-2 rounded-lg bg-habit-progress-light px-4 py-2 font-medium text-white hover:opacity-90 dark:bg-habit-progress-dark"
        >
          Exportar datos
        </button>
      </div>

      <div className="glass rounded-xl p-4">
        <h2 className="text-lg font-semibold">Importar</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Restaura un respaldo. Esto reemplaza por completo tus datos actuales,
          así que se pide confirmación antes de aplicarlo.
        </p>
        <label htmlFor={fileInputId} className="mt-2 block text-sm font-medium">
          Importar datos
        </label>
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept="application/json"
          onChange={handleImport}
          className="mt-1 block text-sm text-zinc-700 dark:text-zinc-300"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
