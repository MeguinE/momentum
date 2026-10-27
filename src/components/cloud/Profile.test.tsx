import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { atom } from 'nanostores';
const mocks=vi.hoisted(()=>({sync:vi.fn(),logout:vi.fn()}));
vi.mock('../../lib/cloud/sync',()=>({
  $cloud:atom<{phase:string;email?:string}>({phase:'local'}),
  synchronize:mocks.sync,signOut:mocks.logout,retryConnection:vi.fn(),
}));
vi.mock('../../lib/cloud/client',()=>({cloudConfigured:true,getCloudClient:vi.fn()}));
import { $cloud } from '../../lib/cloud/sync';
import { $habitData } from '../../lib/stores/habitsStore';
import { createEmptyData } from '../../lib/storage/storage';
import ProfileLink from './ProfileLink';
import ProfileOverview from './ProfileOverview';
import AccountPanel from './AccountPanel';
beforeEach(()=>{vi.clearAllMocks();$cloud.set({phase:'local'});$habitData.set(createEmptyData());});
afterEach(cleanup);
it('offers a profile entry point without inventing a signed-in identity',()=>{
  render(<ProfileLink/>);
  expect(screen.getByRole('link',{name:'Mi perfil e iniciar sesión'})).toHaveAttribute('href','/profile');
  expect(screen.getByText('Conectar mis dispositivos')).toBeInTheDocument();
});
it('shows the signed-in identity and the active workspace counts',()=>{
  $cloud.set({phase:'ready',email:'guillermo@example.com'});
  $habitData.set({...createEmptyData(),habits:[{id:'a',name:'Leer',unit:'boolean',color:'progress',archived:false,createdAt:'2026-10-26'}],logs:[{habitId:'a',date:'2026-10-26',value:1}]});
  render(<><ProfileLink compact/><ProfileOverview/></>);
  expect(screen.getByRole('link',{name:'Mi perfil: guillermo@example.com'})).toHaveAttribute('href','/profile');
  expect(screen.getByRole('heading',{name:'guillermo'})).toBeInTheDocument();
  expect(screen.getByText('hábitos activos').textContent).toBe('1 hábitos activos');
  expect(screen.getByText('registros guardados').textContent).toBe('1 registros guardados');
});
it('loads and synchronizes through the existing safe sync operation',()=>{
  $cloud.set({phase:'ready',email:'guillermo@example.com'});
  render(<AccountPanel/>);
  fireEvent.click(screen.getByRole('button',{name:'Cargar y sincronizar'}));
  expect(mocks.sync).toHaveBeenCalledOnce();
});
it('prevents another manual sync while one is running',()=>{
  $cloud.set({phase:'syncing',email:'guillermo@example.com'});
  render(<AccountPanel/>);
  expect(screen.getByRole('button',{name:'Cargar y sincronizar'})).toBeDisabled();
});
