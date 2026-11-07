import React from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, Search, ShieldCheck, Sparkles, X} from 'lucide-react';
import {useFlamme} from '../context/FlammeContext.jsx';

/* Real route: /ask. */
export default function AskPage() {
  const {prompt, setPrompt, askFlame, recognized, clearRecognized, results, hasAnyField, setSearched, setSelected, ranked, reduced} = useFlamme();
  const navigate = useNavigate();

  const viewMatches = () => {
    setSearched(true);
    setSelected(ranked[0].record.id);
    navigate('/evidence');
    requestAnimationFrame(() => window.scrollTo({top: 0, behavior: reduced ? 'instant' : 'smooth'}));
  };

  return <section className="surface ask-panel ask-page" id="ask">
    <div className="section-top"><h2><Sparkles size={18}/> Ask Flame</h2></div>
    <div className="ask-row">
      <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') askFlame(); }} placeholder="e.g. cotton-fiberglass at 22% oxygen with 20 cm/s opposed airflow" aria-label="Ask Flame a question"/>
      <button className="accent-btn" onClick={askFlame}><Search size={16}/> Ask Flame</button>
    </div>
    {recognized && <div className="ask-chips">
      <span>Flame read:</span>
      {recognized.material && <em className="chip">material: {recognized.material}<button aria-label="Clear material" onClick={() => clearRecognized('material')}><X size={11}/></button></em>}
      {recognized.oxygen && <em className="chip">oxygen ≈ {recognized.oxygen}%<button aria-label="Clear oxygen" onClick={() => clearRecognized('oxygen')}><X size={11}/></button></em>}
      {recognized.airflow && <em className="chip">airflow ≈ {recognized.airflow} cm/s<button aria-label="Clear airflow" onClick={() => clearRecognized('airflow')}><X size={11}/></button></em>}
      {recognized.direction && <em className="chip">flow: {recognized.direction}<button aria-label="Clear direction" onClick={() => clearRecognized('direction')}><X size={11}/></button></em>}
      {!hasAnyField(recognized) && <em className="chip unmatched">No recognized conditions in that question — showing the current scenario.</em>}
      <span className="ask-note"><ShieldCheck size={12}/> Deterministic keyword parsing, not an AI model.</span>
    </div>}
    {recognized && <div className="ask-result-cta">
      <span>{results.length} record{results.length === 1 ? '' : 's'} currently match this scenario</span>
      <button className="outline-btn" onClick={viewMatches}>View matching evidence <ArrowRight size={15}/></button>
    </div>}
  </section>;
}
