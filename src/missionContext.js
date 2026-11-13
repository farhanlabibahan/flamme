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
