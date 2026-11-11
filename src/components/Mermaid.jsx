import React, {useEffect, useId, useRef} from 'react';
import mermaid from 'mermaid';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  configured = true;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif',
    theme: 'base',
    themeVariables: {
      primaryColor: '#f5f6f8', primaryBorderColor: 'rgba(11,11,13,.28)', primaryTextColor: '#0b0b0d',
      lineColor: 'rgba(11,11,13,.45)', secondaryColor: '#eceef2', tertiaryColor: '#e4e7ec',
      fontSize: '16px', clusterBkg: '#eceef2', clusterBorder: 'rgba(11,11,13,.18)',
      edgeLabelBackground: '#f5f6f8', nodeTextColor: '#0b0b0d',
    },
    flowchart: {curve: 'basis', htmlLabels: true, padding: 12},
  });
}

/* Renders a Mermaid diagram from a chart-definition string. Each instance
   gets a stable-but-unique id (useId) since mermaid.render needs one. */
export default function Mermaid({chart, className}) {
  const ref = useRef(null);
  const rawId = useId().replace(/[:]/g, '');
  const id = `mmd-${rawId}`;

  useEffect(() => {
    let cancelled = false;
    ensureConfigured();
    mermaid.render(id, chart).then(({svg}) => {
      if (!cancelled && ref.current) ref.current.innerHTML = svg;
    }).catch(err => {
      if (!cancelled && ref.current) ref.current.innerHTML = `<pre style="color:#b32d22;font-size:12px">Diagram error: ${err.message}</pre>`;
    });
    return () => { cancelled = true; };
  }, [chart, id]);

  return <div ref={ref} className={className} aria-hidden="true"/>;
}
