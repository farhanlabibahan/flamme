import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, Search, ShieldCheck, Sparkles, X} from 'lucide-react';
import {siParse, siInterpret, citeLabel, citeUrl} from '../ai.js';
import {DETECTOR_SPINOFF} from '../missionContext.js';
import {parsePrompt} from '../prompt.js';
import {useFlamme} from '../context/FlammeContext.jsx';

/* Real route: /ask. */
export default function AskPage() {
  const {prompt, setPrompt, askFlame, applyParsed, scenarioNow, recognized, clearRecognized, results, hasAnyField, setSearched, setSelected, ranked, reduced} = useFlamme();
  const navigate = useNavigate();
  const [si, setSi] = useState(null);       // {status:'loading'|'done'|'fallback', data?}
  const askSI = async () => {
    if (!prompt.trim()) return;
    setSi({status: 'loading'});
    try {
      const parsed = await siParse(prompt);
      applyParsed(parsed);
      if (!parsed.in_scope) { setSi({status: 'done', data: {summary: 'This question is outside what the NASA PSI microgravity combustion data covers (for example rocket engines or propellants), so Flamme has no evidence to report.', points: [], limits: ''}}); return; }
      setSi({status: 'done', data: await siInterpret(prompt, parsed, scenarioNow)});
    } catch (e) {
      applyParsed(parsePrompt(prompt));
      setSi({status: 'fallback', limited: e?.status === 429});
    }
  };

  const viewMatches = () => {
    setSearched(true);
    setSelected(ranked[0].record.id);
    navigate('/evidence');
    requestAnimationFrame(() => window.scrollTo({top: 0, behavior: reduced ? 'instant' : 'smooth'}));
  };

  return <section className="surface ask-panel ask-page reveal" id="ask">
    <div className="section-top"><h2><Sparkles size={18}/> Ask Flame</h2></div>
    <div className="ask-row">
      <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') askSI(); }} placeholder="e.g. cotton-fiberglass at 22% oxygen with 20 cm/s opposed airflow" aria-label="Ask Flame a question"/>
      <button className="accent-btn" onClick={askFlame}><Search size={16}/> Ask Flame</button>
      <button className="outline-btn" onClick={askSI} disabled={si?.status === 'loading'}><Sparkles size={16}/> {si?.status === 'loading' ? 'Analyzing…' : 'Interpret with SI'}</button>
    </div>
    {si?.status === 'fallback' && <p className="ask-note">{si.limited ? 'Too many SI requests from this connection just now — showing keyword matching instead. Try again in a few minutes.' : 'SI layer unavailable — showing keyword matching instead.'}</p>}
    {si?.status === 'done' && <div className="si-answer">
      {si.data.scenario && <p className="si-scope">Evidence ranked for: {si.data.scenario.o2_pct}% O₂ · {si.data.scenario.pressure_atm} atm · {si.data.scenario.gravity_g === 0 ? 'microgravity' : `${si.data.scenario.gravity_g} g`}</p>}
      <p><strong>{si.data.summary}</strong></p>
      {si.data.points.length > 0 && <ul>{si.data.points.map((p, i) => <li key={i}>{p.text} {[...new Map(p.sources.map(f => [citeLabel(f), f])).values()].map(f => citeUrl(f)
        ? <a key={f.finding_id} href={citeUrl(f)} target="_blank" rel="noreferrer">[{citeLabel(f)}]</a>
        : <span key={f.finding_id}>[{citeLabel(f)}]</span>)}</li>)}</ul>}
      {si.data.limits && <p className="ask-note">Limits: {si.data.limits}</p>}
      {si.data.detectorGap && /detector|smoke|aerosol/i.test(`${si.data.summary} ${si.data.limits} ${si.data.points.map(p => p.text).join(' ')}`) && <p className="ask-note">Detector response is a documented evidence gap. Earth application: <a href={DETECTOR_SPINOFF.url} target="_blank" rel="noreferrer">NASA’s shuttle-derived smoke detector</a>.</p>}
      <p className="ask-note"><ShieldCheck size={12}/> Written by an LLM using only the NASA findings listed above; citations are checked against the retrieved rows.</p>
    </div>}
    {recognized && <div className="ask-chips">
      <span>Flame read:</span>
      {recognized.material && <em className="chip">material: {recognized.material}<button aria-label="Clear material" onClick={() => clearRecognized('material')}><X size={11}/></button></em>}
      {recognized.oxygen && <em className="chip">oxygen ≈ {recognized.oxygen}%<button aria-label="Clear oxygen" onClick={() => clearRecognized('oxygen')}><X size={11}/></button></em>}
      {recognized.airflow && <em className="chip">airflow ≈ {recognized.airflow} cm/s<button aria-label="Clear airflow" onClick={() => clearRecognized('airflow')}><X size={11}/></button></em>}
      {recognized.direction && <em className="chip">flow: {recognized.direction}<button aria-label="Clear direction" onClick={() => clearRecognized('direction')}><X size={11}/></button></em>}
      {!hasAnyField(recognized) && <em className="chip unmatched">No recognized conditions in that question — showing the current scenario.</em>}
      <span className="ask-note"><ShieldCheck size={12}/> Chips: deterministic keyword parsing. “Interpret with SI” uses an LLM grounded in the findings.</span>
    </div>}
    {recognized && <div className="ask-result-cta">
      <span>{results.length} record{results.length === 1 ? '' : 's'} currently match this scenario</span>
      <button className="outline-btn" onClick={viewMatches}>View matching evidence <ArrowRight size={15}/></button>
    </div>}
  </section>;
}
