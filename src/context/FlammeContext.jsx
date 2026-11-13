import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {experiments, investigations, display} from '../data.js';
import {initialScenario, rank, explain} from '../science.js';
import {parsePrompt, hasAnyField} from '../prompt.js';
import {useDebouncedValue} from '../hooks/useDebouncedValue.js';

export const value = f => f?.status === 'ambiguous' ? `${display(f)} · verify` : display(f);

const Ctx = createContext(null);

/* Shared app state used to live inside one giant App() component, with the
   sidebar just swapping which JSX block rendered. Now each sidebar item is
   its own routed page (see main.jsx), so the shared scenario/search
   state has to live above the router in a context instead — pages read and
   write it with useFlamme() without needing to be siblings in one file. */
export function FlammeProvider({children}) {
  const labRef = useRef(null);
  const [scenario, setScenario] = useState({...initialScenario});
  const [mode, setMode] = useState('Illustrative visualization');
  const [selected, setSelected] = useState('2-5');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [drawer, setDrawer] = useState(null);
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [searched, setSearched] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [recognized, setRecognized] = useState(null);

  // throttle: the evidence list only re-filters ~180ms after typing pauses,
  // instead of re-ranking/re-filtering the whole table on every keystroke.
  const debouncedQuery = useDebouncedValue(query, 180);

  const ranked = useMemo(() => rank(experiments, scenario), [scenario]);
  const results = useMemo(() => ranked.filter(({record}) =>
    (!scenario.material || record.sample.material === scenario.material) &&
    (filter === 'All' || record.investigationId === filter) &&
    `${record.sample.material} ${record.id}`.toLowerCase().includes(debouncedQuery.toLowerCase())
  ), [ranked, filter, debouncedQuery, scenario.material]);

  const record = experiments.find(e => e.id === selected) || experiments[0];
  const source = investigations.find(i => i.id === record.investigationId);
  const brief = explain(record);

  const update = (key, v) => { setScenario(s => ({...s, [key]: v})); setSearched(false); };
  const openSource = id => { if (id) setSelected(id); setDrawer('source'); };
  const applyParsed = parsed => {
    setRecognized(parsed);
    const merged = {...scenario, ...(parsed.material && {material: parsed.material}), ...(parsed.oxygen && {oxygen: parsed.oxygen}), ...(parsed.airflow && {airflow: parsed.airflow}), ...(parsed.direction && {direction: parsed.direction})};
    setScenario(merged);
  };
  const askFlame = () => applyParsed(parsePrompt(prompt));
  const clearRecognized = key => { setRecognized(r => r && ({...r, [key]: ''})); update(key, ''); };

  const ctx = useMemo(() => ({
    labRef, scenario, setScenario, mode, setMode, selected, setSelected,
    query, setQuery, filter, setFilter, drawer, setDrawer, reduced, setReduced,
    searched, setSearched, prompt, setPrompt, recognized, setRecognized,
    ranked, results, record, source, brief, update, openSource, askFlame, applyParsed, scenarioNow: scenario, clearRecognized,
    experiments, investigations, hasAnyField,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [scenario, mode, selected, query, filter, drawer, reduced, searched, prompt, recognized, ranked, results, record, source, brief]);

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export const useFlamme = () => useContext(Ctx);
