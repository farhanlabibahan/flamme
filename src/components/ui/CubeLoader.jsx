import React from 'react';
import './CubeLoader.css';

/* 3D cube loader: a CSS-3D cube with shaded faces, tumbling on its own axes.
   Used as the route fallback and as an overlay over the Lab canvas. */
export default function CubeLoader({message = 'Loading…', fullHeight = false, overlay = false}) {
  return <div
    className={`cb-wrap ${fullHeight ? 'cb-full' : ''} ${overlay ? 'cb-overlay' : ''}`}
    role="status"
    aria-live="polite"
  >
    <div className="cb-stage" aria-hidden="true">
      <div className="cb-cube">
        <span className="cb-face cb-front"/>
        <span className="cb-face cb-back"/>
        <span className="cb-face cb-right"/>
        <span className="cb-face cb-left"/>
        <span className="cb-face cb-top"/>
        <span className="cb-face cb-bottom"/>
      </div>
      <div className="cb-shadow"/>
    </div>
    <div className="cb-msg">{message}</div>
  </div>;
}
