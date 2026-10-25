import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $habitData, $saveError, replaceAllData } from '../../lib/stores/habitsStore';
import { initializeLearning } from '../../lib/learning';
import { initializeWellness } from '../../lib/wellness';
export default function LearningInit() {
  const data = useStore($habitData);
  const error = useStore($saveError);
  useEffect(() => { const next = initializeWellness(initializeLearning(data)); if (next !== data) replaceAllData(next); }, [data]);
  return error ? <p role="alert" className="save-notice">No se pudieron guardar los cambios. Exporta un respaldo desde Ajustes antes de cerrar.</p> : null;
}
