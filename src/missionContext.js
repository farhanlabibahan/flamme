/* NASA background & context resources (challenge-provided). Not data sources —
   they frame why microgravity fire safety matters. */
export const RESOURCES = [
  {group: 'Data & research', items: [
    ['PSI Data Repository: Combustion Science', 'https://psi.nasa.gov/physci/repo/search?q=combustion', 'Source of the data Flamme is built on.'],
    ['NASA Combustion Science', 'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/', 'Overview of the investigations found in PSI.'],
    ['ScienceCasts: The Power of Studying Combustion on the ISS', 'https://www.youtube.com/watch?v=W1oXykoz9zg', '3.6-minute introduction video (2018).'],
    ['A Researcher\u2019s Guide to ISS Combustion Science', 'https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/', '2015 review of ISS combustion research.'],
  ]},
  {group: 'Fire incidents & lessons learned', items: [
    ['Apollo 1', 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-1', 'Pre-launch test fire that killed the crew; investigation and lessons.'],
    ['Apollo 13', 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-13', 'Oxygen tank explosion en route to the Moon; investigation and lessons.'],
    ['Fire aboard space station Mir (1997)', 'https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/', 'Fire caused by an oxygen generator failure.'],
  ]},
  {group: 'Fire-safety spinoffs', items: [
    ['Fireman\u2019s Air Tanks', 'https://spinoff.nasa.gov/node/9582', '1970s spacesuit tech adapted for firefighter breathing gear.'],
    ['Fire Detector', 'https://spinoff.nasa.gov/node/9407', 'Shuttle smoke detector that tells smoke from dust.'],
    ['New Technology for the Fire Attire', 'https://spinoff.nasa.gov/node/9918', '1980s spacesuit tech applied to firefighter clothing.'],
  ]},
];

// Real incidents shown on the landing page ("why this matters"). Wording
// stays within what NASA's linked pages state; see the URLs for detail.
export const INCIDENTS = [
  {name: 'Apollo 1', year: '1967', d: 'A fire during a pre-launch test killed the crew.', url: 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-1'},
  {name: 'Apollo 13', year: '1970', d: 'An oxygen tank explosion en route to the Moon.', url: 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-13'},
  {name: 'Mir', year: '1997', d: 'An oxygen generator failure started a fire aboard the station.', url: 'https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/'},
];

// Earth applications of NASA fire-safety technology (challenge: "potential
// applications ... to fire safety on Earth"). `link` says how it relates to the
// PSI data; where no PSI investigation covers it directly, it says so.
export const SPINOFFS = [
  {name: 'Fire detector', era: '1970s', d: 'A shuttle smoke detector that tells smoke from dust, giving fewer nuisance alarms; used in industries such as mining.', link: 'Related data: SAME / SAME-R (smoke) and DAFT (dust) in PSI.', url: 'https://spinoff.nasa.gov/node/9407'},
  {name: 'Firefighter air tanks', era: '1970s', d: 'Spacesuit technology adapted to improve firefighters\u2019 air tanks and breathing gear.', link: 'Not covered by a PSI investigation; shown for context.', url: 'https://spinoff.nasa.gov/node/9582'},
  {name: 'Firefighter clothing', era: '1980s', d: 'Spacesuit technology applied to improve firefighter protective clothing.', link: 'Not covered by a PSI investigation; shown for context.', url: 'https://spinoff.nasa.gov/node/9918'},
];

export const BACKGROUND = {
  combustion: 'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/',
  guide: 'https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/',
  video: 'https://www.youtube.com/watch?v=W1oXykoz9zg',
};

export const CREDIT = 'Data: NASA Physical Sciences Informatics (PSI) combustion science repository. Background: NASA Glenn Combustion Science, the ISS Combustion Science researcher\u2019s guide, NASA Safety & Mission Assurance and NASA Spinoff pages.';

// Used wherever the detector-response evidence gap (GAP-DETECTOR-RESPONSE) is shown.
export const DETECTOR_SPINOFF = SPINOFFS.find(x => x.name === 'Fire detector');
