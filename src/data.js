// Curated verbatim excerpts, not synthetic experimental results.
export const investigations = [
 {id:'PSI-99',name:'Saffire II',title:'Spacecraft Fire Experiment-II',platform:'Cygnus spacecraft',doi:'10.60555/2chp-m469'},
 {id:'PSI-25',name:'BASS II',title:'Burning and Suppression of Solids - II',platform:'International Space Station',doi:'10.60555/4qc4-de67'}
].map(i=>({...i,url:`https://psi.nasa.gov/physci/repo/data/investigations/${i.id}`}));
const field=(source,unit,value=null,status=source==null?'not reported':'reported')=>({source,unit,normalized:value,status});
const saffire=(id,material,thickness,oxygen,burn,spread,row,direction='Concurrent')=>({id,investigationId:'PSI-99',sample:{material,composition:field(null,''),thickness:field(thickness,'mm',thickness==='037 mm'?null:parseFloat(thickness),thickness==='037 mm'?'ambiguous':'reported'),length:field('29 cm','cm',29),width:field('5 cm','cm',5),orientation:field(null,'')},environment:{gravity:field('Microgravity','', 'Microgravity'),oxygen:field(`~ ${oxygen}`,'vol %',oxygen,'approximate'),pressure:field(null,'kPa'),gas:field(null,'')},flow:{speed:field('20 cm/s','cm/s',20),direction:field(direction,'',direction)},ignition:{method:field(null,''),power:field('80 W','W',80),duration:field('9.2 s','s',9.2)},measurements:{burn:field(burn,'s',Number.isFinite(Number.parseFloat(burn))?parseFloat(burn):null,burn==='Insignificant'?'qualitative':'reported'),spread:field(spread,'mm/s',spread==='n/a'?null:parseFloat(spread),spread==='n/a'?'not applicable':'ambiguous label'),burnLength:field(material==='Silicone'?'~ 0':'29 cm','cm',material==='Silicone'?0:29),heat:field(null,'W'),smoke:field(null,'')},media:[],source:{file:'PSI-99_Experimental table_SAFFIRE-2.csv',row,notes:'Oxygen derived from measured CO₂ production and referenced to initial ISS O₂. Source column is labelled microgravity spread length, but uses mm/s; the metric name needs verification. “037 mm” is an ambiguous thickness string.'}});
export const experiments=[
 saffire('2-5','Cotton–fiberglass (SIBAL)','037 mm',22.1,'145 s','2.1 mm/s',6),
 saffire('2-1','Silicone','0.27 mm',21.5,'Insignificant','n/a',2),
 saffire('2-2','Silicone','0.61 mm',22.1,'Insignificant','n/a',3),
 saffire('2-3','Silicone','1.03 mm',22.1,'Insignificant','n/a',4),
 {id:'B1',investigationId:'PSI-25',sample:{material:'PMMA',composition:field(null,''),thickness:field('100 micron','µm',0.1),length:field(null,'cm'),width:field('2 cm','cm',2),orientation:field(null,'')},environment:{gravity:field('Microgravity','','Microgravity'),oxygen:field('22.2','vol %',22.2),pressure:field(null,'kPa'),gas:field(null,'')},flow:{speed:field(null,'cm/s'),direction:field(null,'')},ignition:{method:field(null,''),power:field(null,'W'),duration:field(null,'s')},measurements:{burn:field(null,'s'),spread:field(null,'mm/s'),burnLength:field(null,'cm'),heat:field(null,'W'),smoke:field(null,''),co:field('0 → 6','ppm')},media:[],source:{file:'PSI-25_Experimental table_BASS-II.csv',row:2,notes:'Sample 147; test B1; 19 February 2014. Fan display 62 and air display 5 are instrument readings, not calibrated airflow speeds. Thickness normalized to mm.'}}
];
export const display=f=>{
 if(f?.source==null)return 'Not reported';
 const raw=String(f.source);
 if(['n/a','Insignificant','Complete','Acceleratory'].includes(raw))return raw;
 if(!f.unit||raw.toLowerCase().includes(f.unit.toLowerCase())||(f.unit==='µm'&&raw.includes('micron')))return raw;
 return `${raw} ${f.unit}`;
};
