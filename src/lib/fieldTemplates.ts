/**
 * Nothing on the job sheet should start as a blank box.
 * These are the words a worker would actually use, per kind of job,
 * offered as one-tap chips above every text field.
 */

export interface FieldTemplate {
  /** Words that appear in the job's service name. */
  match: string[];
  workDone: string[];
  parts: string[];
  measurements: { label: string; value: string }[];
  extraWork: string[];
}

const GENERAL: FieldTemplate = {
  match: [],
  workDone: [
    "Carried out the work as quoted",
    "Tested everything and it's working",
    "Cleared up and took the waste away",
    "Customer happy with the job",
    "Talked the customer through what was done",
  ],
  parts: ["Own stock used", "Sealant", "Fixings", "Nothing used"],
  measurements: [{ label: "Time on site", value: "" }],
  extraWork: ["Customer asked about more work", "Something else needs looking at"],
};

const TEMPLATES: FieldTemplate[] = [
  {
    match: ["boiler", "heating", "radiator", "plumb", "tap", "leak", "bathroom"],
    workDone: [
      "Serviced the boiler and checked the flue",
      "Bled and balanced the radiators",
      "Replaced the faulty valve",
      "Checked for leaks — all dry",
      "Pressure tested the system",
      "Cleared up and took the waste away",
    ],
    parts: ["2 x TRV", "15 mm pipe", "Compression fittings", "PTFE tape", "Boiler filter", "Own stock used"],
    measurements: [
      { label: "System pressure (bar)", value: "" },
      { label: "Flow temperature (°C)", value: "" },
      { label: "Gas rate", value: "" },
    ],
    extraWork: [
      "Outside tap is dripping",
      "Radiator in the back room needs replacing",
      "Old pipework wants upgrading",
      "Customer asked about a smart thermostat",
    ],
  },
  {
    match: ["electric", "rewire", "socket", "light", "consumer unit", "ev charger"],
    workDone: [
      "Fitted and tested the new circuit",
      "Replaced the faulty socket",
      "Tested and certified the work",
      "Labelled the consumer unit",
      "Cleared up and took the waste away",
    ],
    parts: ["Twin & earth cable", "Double socket", "LED downlights", "RCBO", "Back boxes"],
    measurements: [
      { label: "Loop impedance", value: "" },
      { label: "Insulation resistance", value: "" },
      { label: "Circuits tested", value: "" },
    ],
    extraWork: ["Consumer unit is out of date", "Outside lighting wanted", "EV charger enquiry"],
  },
  {
    match: ["fence", "fencing", "garden", "landscap", "decking", "patio", "clearance", "tree"],
    workDone: [
      "Took down the old fence and cleared the line",
      "Set the posts in postcrete",
      "Fitted the panels and gravel boards",
      "Levelled and finished the ground",
      "Cleared up and took the waste away",
    ],
    parts: ["Fence panels", "Concrete posts", "Gravel boards", "Postcrete", "Decking boards", "Membrane"],
    measurements: [
      { label: "Run length (m)", value: "" },
      { label: "Panels fitted", value: "" },
      { label: "Area cleared (m²)", value: "" },
    ],
    extraWork: ["Gate needs replacing", "Other side of the garden wants doing", "Old shed to remove"],
  },
  {
    match: ["roof", "gutter", "fascia", "chimney"],
    workDone: [
      "Cleared the gutters and flushed them through",
      "Replaced the broken tiles",
      "Sealed and made watertight",
      "Checked the whole roof from the ladder",
      "Cleared up and took the waste away",
    ],
    parts: ["Roof tiles", "Gutter brackets", "Sealant", "Lead flashing"],
    measurements: [
      { label: "Metres of gutter", value: "" },
      { label: "Tiles replaced", value: "" },
    ],
    extraWork: ["Flashing needs redoing", "Fascia boards are rotten", "Moss build-up on the north side"],
  },
  {
    match: ["clean", "window", "wash"],
    workDone: [
      "Cleaned all windows inside and out",
      "Wiped down the frames and sills",
      "Pressure washed the area",
      "Left everything dry and streak free",
    ],
    parts: ["Cleaning solution", "Own stock used"],
    measurements: [{ label: "Windows done", value: "" }],
    extraWork: ["Conservatory roof needs doing", "Driveway could do with a wash"],
  },
];

export function templateFor(service: string | undefined): FieldTemplate {
  const s = (service ?? "").toLowerCase();
  const hit = TEMPLATES.find((t) => t.match.some((m) => s.includes(m)));
  if (!hit) return GENERAL;
  return {
    ...hit,
    workDone: [...hit.workDone, ...GENERAL.workDone.slice(-2)],
    extraWork: [...hit.extraWork, ...GENERAL.extraWork],
  };
}
