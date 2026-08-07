import type { ActionStep, HazardType } from '@/domain/models';

export type ReviewedActionPlanTemplate = {
  hazard: Exclude<HazardType, 'other'>;
  title: string;
  steps: ActionStep[];
  sourceName: string;
  sourceReferences: { label: string; url: string }[];
};

export const reviewedActionPlanTemplates: Partial<Record<HazardType, ReviewedActionPlanTemplate>> = {
  flood: {
    hazard: 'flood',
    title: 'Flood safety plan',
    steps: [
      { id: 'move-higher', title: 'Move to higher ground', detail: 'Leave low-lying areas now. Do not wait for water to rise.', priority: 1 },
      { id: 'avoid-water', title: 'Stay out of floodwater', detail: 'Do not walk, swim, or drive through flooded roads.', priority: 2 },
      { id: 'follow-officials', title: 'Follow local instructions', detail: 'Be ready to evacuate if local officials tell you to leave.', priority: 3 },
      { id: 'preserve-power', title: 'Preserve phone power', detail: 'Charge your phone and keep a power bank nearby if it is safe to do so.', priority: 4 },
      { id: 'share-plan', title: 'Tell someone your plan', detail: 'Share where you are going with a trusted contact.', priority: 5 },
    ],
    sourceName: 'National Weather Service flood safety guidance',
    sourceReferences: [{ label: 'NWS: During a Flood', url: 'https://www.weather.gov/safety/flood-during' }],
  },
  tornado: {
    hazard: 'tornado',
    title: 'Tornado safety plan',
    steps: [
      { id: 'tornado-shelter', title: 'Go to your safest shelter', detail: 'Use a basement, safe room, or small interior room away from windows.', priority: 1 },
      { id: 'tornado-protect', title: 'Protect your head and neck', detail: 'Get low and use your arms or a sturdy covering for protection.', priority: 2 },
      { id: 'tornado-updates', title: 'Keep receiving official updates', detail: 'Continue listening for warnings and do not leave shelter too early.', priority: 3 },
      { id: 'tornado-pets', title: 'Bring pets if time allows', detail: 'Keep pets with you without delaying your move to shelter.', priority: 4 },
    ],
    sourceName: 'National Weather Service tornado safety guidance',
    sourceReferences: [{ label: 'NWS: During a Tornado', url: 'https://www.weather.gov/safety/tornado-during' }],
  },
  hurricane: {
    hazard: 'hurricane',
    title: 'Hurricane safety plan',
    steps: [
      { id: 'hurricane-orders', title: 'Follow evacuation orders', detail: 'Leave immediately when local officials tell your area to evacuate.', priority: 1 },
      { id: 'hurricane-shelter', title: 'Use a safe indoor location', detail: 'Stay away from windows and move to an interior room if sheltering in place.', priority: 2 },
      { id: 'hurricane-updates', title: 'Monitor official updates', detail: 'Keep checking local emergency management and National Weather Service information.', priority: 3 },
      { id: 'hurricane-kit', title: 'Keep essential supplies ready', detail: 'Keep water, medicines, lights, and a charged phone within reach.', priority: 4 },
    ],
    sourceName: 'National Weather Service hurricane safety guidance',
    sourceReferences: [{ label: 'NWS: Hurricane Safety', url: 'https://www.weather.gov/safety/hurricane' }],
  },
  wildfire: {
    hazard: 'wildfire',
    title: 'Wildfire safety plan',
    steps: [
      { id: 'wildfire-orders', title: 'Leave when officials say to evacuate', detail: 'Do not wait for conditions to worsen after an evacuation order.', priority: 1 },
      { id: 'wildfire-route', title: 'Use the directed evacuation route', detail: 'Follow official routes and avoid closed roads.', priority: 2 },
      { id: 'wildfire-smoke', title: 'Reduce smoke exposure', detail: 'Stay indoors with cleaner air when you are not evacuating.', priority: 3 },
      { id: 'wildfire-updates', title: 'Keep checking official updates', detail: 'Conditions and evacuation zones can change quickly.', priority: 4 },
    ],
    sourceName: 'National Weather Service wildfire safety guidance',
    sourceReferences: [{ label: 'NWS: Wildfire Safety', url: 'https://www.weather.gov/safety/wildfire' }],
  },
  'air-quality': {
    hazard: 'air-quality',
    title: 'Air quality safety plan',
    steps: [
      { id: 'air-limit-outdoors', title: 'Limit outdoor exposure', detail: 'Reduce time and strenuous activity outdoors while air quality is poor.', priority: 1 },
      { id: 'air-cleaner-space', title: 'Move to cleaner indoor air', detail: 'Close windows and use filtered air if it is available and safe.', priority: 2 },
      { id: 'air-health', title: 'Watch for health symptoms', detail: 'Follow medical advice and seek help for severe breathing problems.', priority: 3 },
      { id: 'air-updates', title: 'Check official air quality updates', detail: 'Conditions can vary by location and change during the day.', priority: 4 },
    ],
    sourceName: 'AirNow smoke and air-quality guidance',
    sourceReferences: [{ label: 'AirNow: Protect Your Health', url: 'https://www.airnow.gov/wildfires/when-smoke-is-in-the-air/' }],
  },
  'winter-storm': {
    hazard: 'winter-storm',
    title: 'Winter storm safety plan',
    steps: [
      { id: 'winter-shelter', title: 'Stay in a safe, warm place', detail: 'Stay indoors when possible and keep dry.', priority: 1 },
      { id: 'winter-travel', title: 'Avoid unnecessary travel', detail: 'Roads may be icy even when they only look wet.', priority: 2 },
      { id: 'winter-layers', title: 'Wear warm, loose layers', detail: 'Cover exposed skin and avoid overheating or sweating.', priority: 3 },
      { id: 'winter-updates', title: 'Keep receiving official updates', detail: 'Check conditions before leaving shelter or traveling.', priority: 4 },
    ],
    sourceName: 'National Weather Service winter safety guidance',
    sourceReferences: [{ label: 'NWS: During a Winter Storm', url: 'https://www.weather.gov/safety/winter-during' }],
  },
  earthquake: {
    hazard: 'earthquake',
    title: 'Earthquake safety plan',
    steps: [
      { id: 'earthquake-drop', title: 'Drop, cover, and hold on', detail: 'Get low, protect your head and neck, and hold onto sturdy cover.', priority: 1 },
      { id: 'earthquake-windows', title: 'Stay away from windows', detail: 'Avoid glass, exterior walls, and objects that could fall.', priority: 2 },
      { id: 'earthquake-aftershock', title: 'Expect aftershocks', detail: 'Move carefully after shaking stops and check for hazards.', priority: 3 },
      { id: 'earthquake-updates', title: 'Follow official instructions', detail: 'Use trusted local information before entering damaged areas.', priority: 4 },
    ],
    sourceName: 'Ready.gov earthquake safety guidance',
    sourceReferences: [{ label: 'Ready.gov: Earthquakes', url: 'https://www.ready.gov/earthquakes' }],
  },
};
