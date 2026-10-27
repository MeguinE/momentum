import { describe, it, expect } from 'vitest';
import { mergeProgress, same } from './merge';
import { createEmptyData } from '../storage/storage';
const habit = {id:'a',name:'Leer',unit:'count' as const,color:'progress',createdAt:'2026-10-26T00:00:00Z',archived:false};
const base = {...createEmptyData(),habits:[habit]};
describe('three-way cloud merge',()=>{
  it('ignores JSONB object property ordering',()=>expect(same({a:1,b:2},{b:2,a:1})).toBe(true));
  it('combines different days without adding the same total twice',()=>{
    const local={...base,logs:[{habitId:'a',date:'2026-10-25',value:5}]};
    const remote={...base,logs:[{habitId:'a',date:'2026-10-26',value:8}]};
    const merged=mergeProgress(base,local,remote);
    expect(merged.conflicts).toEqual([]);
    expect(merged.data.logs).toHaveLength(2);
    expect(mergeProgress(base,local,local).data.logs[0].value).toBe(5);
  });
  it('requires a choice for different totals on the same day',()=>{
    const local={...base,logs:[{habitId:'a',date:'2026-10-26',value:5}]};
    const remote={...base,logs:[{habitId:'a',date:'2026-10-26',value:8}]};
    expect(mergeProgress(base,local,remote).conflicts).toHaveLength(1);
    expect(mergeProgress(base,local,remote,'remote').data.logs[0].value).toBe(8);
  });
  it('preserves a deletion instead of resurrecting an unchanged habit',()=>{
    expect(mergeProgress(base,createEmptyData(),base).data.habits).toEqual([]);
  });
  it('detects deletion versus new work on the deleted habit',()=>{
    const local=createEmptyData();
    const remote={...base,logs:[{habitId:'a',date:'2026-10-26',value:8}]};
    expect(mergeProgress(base,local,remote).conflicts).toContain('habit:a');
    expect(mergeProgress(base,local,remote,'remote').data.logs).toHaveLength(1);
    expect(mergeProgress(base,local,remote,'local').data.logs).toHaveLength(0);
  });
  it('does not union incompatible learning evidence silently',()=>{
    const seed={...base,learning:{english:{habitId:'a',completed:[],notes:{}}}};
    const local={...seed,learning:{english:{habitId:'a',completed:['material'],notes:{intro:'local'}}}};
    const remote={...seed,learning:{english:{habitId:'a',completed:['practice'],notes:{intro:'remote'}}}};
    expect(mergeProgress(seed,local,remote).conflicts).toContain('learning:english');
  });
});
