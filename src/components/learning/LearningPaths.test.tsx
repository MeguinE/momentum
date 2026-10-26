import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import LearningPaths from './LearningPaths';
import { $habitData } from '../../lib/stores/habitsStore';
import { createEmptyData, loadData } from '../../lib/storage/storage';
import { initializeLearning, learningPaths, requiredSteps, lessonKey } from '../../lib/learning';
beforeEach(()=>{localStorage.clear(); history.replaceState(null,'','/learning'); $habitData.set(initializeLearning(createEmptyData()));});
afterEach(cleanup);
describe('guided study plan',()=>{
  it('shows real material, solutions and a disabled checkpoint until evidence is supplied',()=>{
    render(<LearningPaths/>);
    const article = screen.getByRole('article');
    expect(within(article).getByRole('link',{name:/Meeting new people/})).toHaveAttribute('href',expect.stringContaining('meeting-new-people'));
    expect(within(article).getByText('Ver explicación de la respuesta')).toBeInTheDocument();
    const finish = within(article).getByRole('button',{name:/Cerrar módulo/});
    expect(finish).toBeDisabled();
    for(const checkbox of within(article).getAllByRole('checkbox')) fireEvent.click(checkbox);
    expect(finish).toBeDisabled();
    fireEvent.change(within(article).getByRole('textbox'),{target:{value:'Practiqué el diálogo en dos sesiones. Me cuesta pedir repetición y corregí el saludo.'}});
    expect(finish).toBeEnabled();
    fireEvent.click(finish);
    expect(within(article).getByRole('button',{name:/Reabrir módulo/})).toBeInTheDocument();
    expect(loadData().learning!.english.notes?.['en-first-words']).toContain('Practiqué');
    expect($habitData.get().logs).toHaveLength(0);
  });
  it('guides the next activity without adding habit minutes',()=>{
    render(<LearningPaths/>);
    expect(screen.getByRole('link',{name:/TU SIGUIENTE PASO/})).toHaveAttribute('href','#en-first-words-material');
    fireEvent.click(screen.getByRole('checkbox',{name:/Trabajé el material/}));
    expect(screen.getByRole('link',{name:/TU SIGUIENTE PASO/})).toHaveAttribute('href','#en-first-words-practice');
    expect($habitData.get().logs).toHaveLength(0);
  });
  it('keeps the syllabus collapsed and closes it after selecting a lesson',()=>{
    vi.stubGlobal('requestAnimationFrame',()=>0);
    render(<LearningPaths/>);
    const summary = screen.getByText(/Ver temario completo/);
    const details = summary.closest('details')!;
    expect(details.open).toBe(false);
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    fireEvent.click(screen.getByRole('button',{name:/Sonidos, deletreo y números/}));
    expect(details.open).toBe(false);
    expect(screen.getByRole('heading',{name:'Sonidos, deletreo y números'})).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
  it('opens the path from the URL and keeps notes separate across paths',()=>{
    history.replaceState(null,'','/learning?path=java');
    render(<LearningPaths/>);
    expect(screen.getByRole('heading',{name:'Entorno, ejecución y depuración'})).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'),{target:{value:'Ejecuté Main.java, corregí el nombre del archivo y revisé las variables.'}});
    fireEvent.click(screen.getByRole('button',{name:/Aa Desde cero/}));
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(loadData().learning!.java.notes?.['java-setup']).toContain('Main.java');
  });
  it('resumes the first unfinished module after reload and shows legacy notice',()=>{
    const data = $habitData.get(); const lesson = learningPaths[0].stages[0];
    data.learning!.english = {...data.learning!.english,completed:['0-0',...requiredSteps(lesson),lessonKey(lesson,'checkpoint')],notes:{[lesson.id]:'Una evidencia concreta de más de treinta caracteres, con errores y resultados.'}};
    $habitData.set({...data});
    render(<LearningPaths/>);
    expect(screen.getByRole('heading',{name:'Sonidos, deletreo y números'})).toBeInTheDocument();
    expect(screen.getByText(/Conservamos 1 marcas/)).toBeInTheDocument();
  });
});
