import React from 'react';
import './Skeleton.css';

/* Skeleton placeholders shaped like the real page, shown while a route's code
   loads. Content then fades in over them, instead of a spinner followed by
   everything appearing at once. */

export function Bar({w = '100%', h = 12, className = ''}) {
  return <span className={`sk ${className}`} style={{width: w, height: h}} aria-hidden="true"/>;
}

export function SkeletonPage({label, children}) {
  return <div className="sk-page" role="status" aria-busy="true" aria-label={label}>
    <span className="sr-only">{label}</span>
    {children}
  </div>;
}

export function AskSkeleton() {
  return <SkeletonPage label="Loading Ask">
    <section className="surface sk-panel">
      <Bar w="150px" h={18}/>
      <div className="sk-row">
        <Bar h={44} className="sk-input"/>
        <Bar w="150px" h={44}/>
      </div>
      <div className="sk-chips">
        <Bar w="140px" h={24}/><Bar w="120px" h={24}/><Bar w="100px" h={24}/>
      </div>
    </section>
  </SkeletonPage>;
}

export function EvidenceSkeleton() {
  return <SkeletonPage label="Loading evidence">
    <section className="sk-mission"><Bar w="62%" h={34}/><Bar w="40%" h={34}/></section>
    <section className="sk-panel">
      <div className="sk-row"><Bar w="180px" h={14}/><Bar w="80px" h={14}/></div>
      <div className="sk-filters">
        <Bar h={40}/><Bar h={40}/><Bar h={40}/><Bar w="160px" h={40}/>
      </div>
    </section>
    <div className="sk-split">
      <section className="surface sk-list">
        <Bar h={38} className="sk-search"/>
        {[0, 1, 2, 3, 4].map(i => <div className="sk-item" key={i}>
          <Bar w="28px" h={28}/>
          <div className="sk-item-text"><Bar w={`${60 + (i * 7) % 30}%`} h={12}/><Bar w="40%" h={10}/></div>
        </div>)}
      </section>
      <section className="surface sk-detail">
        <Bar w="55%" h={20}/>
        <Bar h={12}/><Bar w="90%" h={12}/><Bar w="75%" h={12}/>
        <div className="sk-stats">{[0, 1, 2].map(i => <div key={i}><Bar w="60%" h={10}/><Bar w="80%" h={22}/></div>)}</div>
      </section>
    </div>
  </SkeletonPage>;
}

export function CompareSkeleton() {
  return <SkeletonPage label="Loading comparison">
    <section className="sk-mission"><Bar w="55%" h={34}/><Bar w="35%" h={18}/></section>
    <div className="sk-compare">
      {[0, 1].map(i => <section className="surface sk-compare-card" key={i}>
        <Bar w="40%" h={10}/><Bar w="60%" h={22}/>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(r => <div className="sk-line" key={r}><Bar w="45%" h={11}/><Bar w="25%" h={11}/></div>)}
      </section>)}
    </div>
  </SkeletonPage>;
}

export function SourcesSkeleton() {
  return <SkeletonPage label="Loading sources">
    <div className="sk-sources">
      {[0, 1, 2].map(i => <div className="sk-source" key={i}>
        <Bar w="50%" h={14}/><Bar w="80%" h={11}/><Bar w="35%" h={11}/>
      </div>)}
    </div>
  </SkeletonPage>;
}
