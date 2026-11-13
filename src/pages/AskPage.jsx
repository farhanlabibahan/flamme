import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, Search, ShieldCheck, Sparkles, X} from 'lucide-react';
import {siParse, siInterpret} from '../ai.js';
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
    } catch {
      applyParsed(parsePrompt(prompt));
      setSi({status: 'fallback'});
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
      <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') askFlame(); }} placeholder="e.g. cotton-fiberglass at 22% oxygen with 20 cm/s opposed airflow" aria-label="Ask Flame a question"/>
      <button className="accent-btn" onClick={askFlame}><Search size={16}/> Ask Flame</button>
      <button className="outline-btn" onClick={askSI} disabled={si?.status === 'loading'}><Sparkles size={16}/> {si?.status === 'loading' ? 'Analyzing…' : 'Interpret with SI'}</button>
    </div>
    {si?.status === 'fallback' && <p className="ask-note">SI layer unavailable — showing keyword matching instead.</p>}
    {si?.status === 'done' && <div className="si-answer">
      <p><strong>{si.data.summary}</strong></p>
      {si.data.points.length > 0 && <ul>{si.data.points.map((p, i) => <li key={i}>{p.text} {p.sources.map(f => <a key={f.finding_id} href={`https://psi.nasa.gov/physci/repo/search?q=${encodeURIComponent(f.psi_id)}`} target="_blank" rel="noreferrer">[{f.psi_id} · {f.experiment}]</a>)}</li>)}</ul>}
      {si.data.limits && <p className="ask-note">Limits: {si.data.limits}</p>}
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
