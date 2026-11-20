import type { CarComponent, Source } from "./types";

/**
 * Utopia Roadster: component-by-component content for the 3D experience.
 *
 * Rules (Design.md §8):
 *  - Published facts only. Each one traces to SOURCES below.
 *  - Values we could not confirm stay as [TBC].
 *  - "Science" paragraphs explain general engineering. Worked numbers are
 *    computed from the published figures, and the text says so.
 */

const SPEC: Source = {
  label: "Pagani — Utopia Roadster technical specifications (2024)",
  url: "https://pagani.com/app/uploads/2024/07/Pagani-Utopia-Roadster-Technical-Specifications-ENG.pdf",
};
const PRESS: Source = {
  label: "Pagani — Utopia Roadster press release (2024)",
  url: "https://pagani.com/app/uploads/2024/07/Pagani-Utopia-Roadster-Press-Release-ENG.pdf",
};
const UCP: Source = {
  label: "Ultimatecarpage — Utopia Roadster",
  url: "https://www.ultimatecarpage.com/car/8680/Pagani-Utopia-Roadster.html",
};

export const ROADSTER_COMPONENTS: CarComponent[] = [
  {
    id: "monocoque",
    index: "01",
    name: "Carbo-titanium monocoque",
    kicker: "Structure",
    summary: "The tub everything else bolts to. Redesigned so the roof could go without heavy reinforcement.",
    specs: [
      { label: "Materials", value: "Carbo-Titanium HP62-G2 · Carbo-Triax HP62" },
      { label: "Composite formulas", value: "40+" },
      { label: "Dry weight (car)", value: "1,280 kg" },
      { label: "Wheelbase", value: "2,796 mm" },
    ],
    science: {
      title: "Why a roof matters, and how to live without one",
      paragraphs: [
        "A closed tube resists twisting far better than an open channel. For a thin-walled closed section, torsional stiffness grows with the square of the area the walls enclose. Take the roof off a car and that closed section opens, so the structure loses most of its resistance to twist.",
        "Carbon fibre is anisotropic: it is strong along the fibre and much weaker across it. A composite engineer chooses the direction of every ply so the fibres follow the load paths. Carbo-titanium weaves titanium filaments into the carbon cloth, so a damaged panel is held together by ductile metal instead of splintering.",
        "On the Roadster, Pagani redesigned the monocoque to get its rigidity back without the heavy reinforcement an open car usually needs. That is why the Roadster's published dry weight matches the Coupé's: 1,280 kg.",
      ],
    },
    legacy: {
      title: "From the Countach Evoluzione to forty formulas",
      paragraphs: [
        "In the 1980s, at Lamborghini, Horacio Pagani pushed for carbon fibre and worked on the 1987 Countach Evoluzione, a prototype with a composite chassis. He then founded Pagani Composite Research and, later, Modena Design to build in composites for others.",
        "Every Pagani since has been a study in materials. The Utopia family uses more than forty composite formulas. Roadster and Coupé were developed together under code C10, unlike the Zonda and Huayra roadsters, which followed their coupés.",
      ],
    },
    sources: [SPEC, UCP],
    explode: [0, 0, 0],
  },
  {
    id: "subframes",
    index: "02",
    name: "Steel subframes",
    kicker: "Structure",
    summary: "Alloy-steel frames front and rear carry the suspension and the powertrain into the tub.",
    specs: [
      { label: "Front", value: "Alloy steel" },
      { label: "Rear", value: "Alloy steel" },
      { label: "Joins to", value: "Monocoque" },
      { label: "Tube spec", value: "[TBC]" },
    ],
    science: {
      title: "Metal where loads arrive",
      paragraphs: [
        "Suspension and engine mounts put large point loads into the structure, and those loads keep repeating. Alloy steel tolerates that kind of concentrated, cyclic load well and deforms before it breaks, which is a good property for a part that sits close to the crash zones.",
        "A triangulated tube frame carries load mostly as tension and compression along each tube, which uses very little material. Because the frames bolt to the carbon tub, the tub carries the overall stiffness while the frames give the mounting points the shape they need.",
      ],
    },
    legacy: {
      title: "A recipe since the Zonda",
      paragraphs: [
        "A carbon centre with metal frames front and rear has been the Pagani layout since the Zonda. Each generation refines the joints between the two materials rather than replacing the idea.",
      ],
    },
    sources: [SPEC, UCP],
    explode: [0, -0.35, 0],
  },
  {
    id: "bodywork",
    index: "03",
    name: "Carbon bodywork",
    kicker: "Form",
    summary: "Front and rear clamshells and doors, shaped without fixed wings or protruding appendages.",
    specs: [
      { label: "Length", value: "4,673 mm" },
      { label: "Width", value: "2,060 mm" },
      { label: "Height", value: "1,165 mm" },
      { label: "Roof", value: "Hard-top · soft-top" },
    ],
    science: {
      title: "A shape that does the work quietly",
      paragraphs: [
        "Pagani developed the Utopia's shape in the wind tunnel and kept it free of protruding appendages. Most of the airflow management happens in the surfaces themselves, and the only moving parts are the rear flaps.",
        "Large clamshells that hinge open give access to the engine and front corners. They also cut the number of panel joints, and every joint adds weight and turbulence.",
      ],
    },
    legacy: {
      title: "Three ways to wear it",
      paragraphs: [
        "The Roadster comes with a removable carbon hard-top, which can rest on its own stand like a sculpture, and a soft-top that packs into a suitcase behind the seats. With the hard-top fitted, a single large window still opens the cabin to the sky.",
      ],
    },
    sources: [SPEC, UCP],
    explode: [0, 0.55, 0],
  },
  {
    id: "engine",
    index: "04",
    name: "Twin-turbo V12",
    kicker: "Power",
    summary: "Mercedes-AMG M158 60° V12, built for Pagani. 5,980 cc, no hybrid, no batteries.",
    specs: [
      { label: "Displacement", value: "5,980 cc" },
      { label: "Power", value: "864 CV @ 6,000 rpm" },
      { label: "Torque", value: "1,100 Nm @ 2,800–5,900" },
      { label: "Lubrication", value: "Dry sump" },
    ],
    science: {
      title: "Twelve beats per cycle, perfectly balanced",
      paragraphs: [
        "A four-stroke engine fires each cylinder once every two crank revolutions. With twelve cylinders, that is one firing every 60° of crank rotation. A 60° V angle lets the two banks share that rhythm evenly.",
        "Each bank of a V12 is a straight-six, and a straight-six cancels its own primary and secondary forces and rocking couples. Two of them together make an engine with no inherent shake. What you hear is combustion, not vibration.",
        "The pitch of the note is the firing frequency: rpm × 12 ÷ 120, which is simply rpm ÷ 10. Idling at 900 rpm, the V12 beats at 90 Hz. At 6,000 rpm, where peak power arrives, it sings at 600 Hz. The console below lets you hear it rise.",
        "Dry-sump lubrication keeps the oil in a separate tank. The engine can sit lower in the car, and the oil supply holds steady under hard cornering.",
      ],
    },
    legacy: {
      title: "A friendship with Mercedes, begun by Fangio",
      paragraphs: [
        "Juan Manuel Fangio, a fellow Argentine, introduced the young Horacio Pagani to Mercedes-Benz. Every Pagani since the 1999 Zonda C12 has carried a Mercedes-AMG V12.",
        "The Utopia's V12 is developed with AMG engineers, and each engine is assembled by a single craftsman. Pagani kept it free of hybrid systems and batteries, for lightness and for the sound.",
      ],
    },
    sources: [SPEC, UCP],
    explode: [0, 0.95, 0],
  },
  {
    id: "turbos",
    index: "05",
    name: "Twin turbochargers",
    kicker: "Power",
    summary: "One turbo per bank turns exhaust energy into denser intake air.",
    specs: [
      { label: "Layout", value: "Twin turbo, one per bank" },
      { label: "Torque plateau", value: "2,800–5,900 rpm" },
      { label: "Specific output", value: "142 bhp / litre" },
      { label: "Boost pressure", value: "[TBC]" },
    ],
    science: {
      title: "Recycling heat into breath",
      paragraphs: [
        "Exhaust gas leaves the cylinders hot and under pressure. A turbine in that flow spins a compressor on the same shaft, and the compressor packs more air into each cylinder. More air allows more fuel, and more fuel gives more torque, using energy that would otherwise leave through the tailpipes.",
        "Compression heats the air, and hot air is less dense. In any turbocharged engine, cooling the charge after the compressor recovers that density. The engine's management then holds peak torque flat across a wide band. In the Utopia, that band runs from 2,800 to 5,900 rpm.",
        "Listen for the whistle as you rev, and the sigh as the throttle closes. In the synthesis, that sound is the compressor wheel and the air released when you lift.",
      ],
    },
    legacy: {
      title: "From atmospheric to forced",
      paragraphs: [
        "The Zonda breathed naturally. The Huayra of 2011 moved Pagani to twin turbos, and the Utopia refines that path rather than turning to electrification.",
      ],
    },
    sources: [SPEC, UCP],
    explode: [0, 1.25, 0.55],
  },
  {
    id: "gearbox",
    index: "06",
    name: "Xtrac 7-speed transverse",
    kicker: "Drivetrain",
    summary: "A seven-speed manual developed with Xtrac, mounted across the car behind the engine.",
    specs: [
      { label: "Gears", value: "7, manual" },
      { label: "Option", value: "AMT, paddle-shifted" },
      { label: "Clutch", value: "Triple-disc" },
      { label: "Drive", value: "Rear-wheel" },
    ],
    science: {
      title: "Small clutch, big torque",
      paragraphs: [
        "A clutch's torque capacity scales with the number of friction faces, the clamping force, the friction coefficient and the effective radius. Three discs give six faces, so the clutch can hold 1,100 Nm at a smaller diameter. A smaller clutch has less rotating inertia, and the engine responds faster.",
        "Mounting the gearbox across the car shortens the drivetrain. More of the mass then sits inside the wheelbase, which lowers the car's polar moment of inertia, so it turns in more willingly.",
      ],
    },
    legacy: {
      title: "The return of the third pedal",
      paragraphs: [
        "The Huayra used an automated single-clutch gearbox. With the Utopia, Pagani brought back a true manual for drivers who want to shift their own gears, with an automated option for those who prefer paddles.",
      ],
    },
    sources: [SPEC, UCP],
    explode: [-0.55, 0.7, 0],
  },
  {
    id: "exhaust",
    index: "07",
    name: "Central quad exhaust",
    kicker: "Sound",
    summary: "Four exits gathered at the centre of the tail: the Pagani signature.",
    specs: [
      { label: "Exits", value: "4, central" },
      { label: "Material", value: "[TBC]" },
      { label: "Mass", value: "[TBC]" },
      { label: "Valves", value: "[TBC]" },
    ],
    science: {
      title: "Tuning the pulses",
      paragraphs: [
        "Every firing sends a pressure pulse down the exhaust. The length and diameter of each pipe decide when reflected pulses come back to the valves. Timed well, a returning low-pressure wave helps pull the next charge of spent gas out of the cylinder.",
        "Exhaust parts on hypercars are often titanium. Its density is roughly 4.5 g/cm³, against about 7.8 for steel, so a part of the same volume weighs a little over half as much, and it tolerates heat well. Pagani's figures for the Utopia's exhaust are still [TBC] here.",
      ],
    },
    legacy: {
      title: "The four circles",
      paragraphs: [
        "Since the Zonda, four round exits clustered at the centre of the tail have marked a Pagani from behind. The Roadster even repeats the motif on the feet of its luggage.",
      ],
    },
    sources: [UCP],
    explode: [-0.9, 0.15, 0],
  },
  {
    id: "suspension",
    index: "08",
    name: "Double-wishbone suspension",
    kicker: "Chassis",
    summary: "Eight forged aluminium triangles, coil springs and electronically controlled dampers.",
    specs: [
      { label: "Type", value: "Double wishbone, F/R" },
      { label: "Arms", value: "8 × forged aluminium" },
      { label: "Springs", value: "Coil" },
      { label: "Dampers", value: "Electronic control" },
    ],
    science: {
      title: "Keeping the tyre flat on the road",
      paragraphs: [
        "Two wishbones of different lengths make the wheel tilt slightly inward as the body rolls. That keeps the tread flatter on the road through a corner than a simple strut can.",
        "Everything between the spring and the road is unsprung mass, which the springs and dampers must control directly. Forged aluminium arms reduce that mass, so the tyre follows the surface instead of skipping over it. Electronically controlled dampers adjust their resistance continuously.",
      ],
    },
    legacy: {
      title: "Milled in Modena",
      paragraphs: [
        "Modena Design, Pagani's own company, makes aluminium, titanium and special-metal parts. Many of them are milled from solid, and Pagani finishes them as carefully as the parts you can see.",
      ],
    },
    sources: [SPEC, UCP],
    explode: [0, -0.15, 0.55],
  },
  {
    id: "brakes",
    index: "09",
    name: "Carbon-ceramic brakes",
    kicker: "Chassis",
    summary: "Ventilated carbon-ceramic discs: 410 mm front with six pistons, 390 mm rear with four.",
    specs: [
      { label: "Front disc", value: "410 mm · 6-piston" },
      { label: "Rear disc", value: "390 mm · 4-piston" },
      { label: "Type", value: "Ventilated carbon-ceramic" },
      { label: "Assist", value: "ABS" },
    ],
    science: {
      title: "Six megajoules, gone in seconds",
      paragraphs: [
        "Kinetic energy is ½mv². At 350 km/h, about 97 m/s, a car at its 1,280 kg dry weight carries roughly 6 MJ (our calculation from the published figures). Stopping it converts all of that energy into heat in the discs.",
        "Carbon-ceramic discs hold a steady friction level at temperatures that make iron discs fade. They also weigh much less, which reduces unsprung and rotating mass, the hardest mass to control.",
      ],
    },
    legacy: {
      title: "Sized to the car's speed",
      paragraphs: [
        "Disc diameter sets the leverage a caliper has over the wheel. The front discs are larger because braking shifts weight onto the front axle. The rear discs are slightly smaller, with four pistons to the front's six.",
      ],
    },
    sources: [SPEC, UCP],
    explode: [0, -0.1, 0.95],
  },
  {
    id: "wheels",
    index: "10",
    name: "Wheels and Pirelli tyres",
    kicker: "Contact",
    summary: "21-inch front and 22-inch rear, on Pirelli P Zero Corsa tyres developed for the car.",
    specs: [
      { label: "Front", value: "265/35 R21" },
      { label: "Rear", value: "325/30 R22" },
      { label: "Tyres", value: "Pirelli P Zero Corsa" },
      { label: "Optional", value: "P Zero Trofeo RS" },
    ],
    science: {
      title: "Four palm-sized patches",
      paragraphs: [
        "Every force the car makes passes through four contact patches, each about the size of a hand. The rear tyres are 60 mm wider because they must deliver 1,100 Nm of torque without spinning.",
        "Sensors inside the tyres report to the ABS, stability and traction systems. The electronics react to what the rubber is actually doing, rather than estimating it from wheel speeds.",
      ],
    },
    legacy: {
      title: "Developed alongside the car",
      paragraphs: [
        "Pirelli worked on the Utopia from the prototype and simulation stage. P Zero Corsa and P Zero Winter tyres are standard, and Trofeo RS tyres are available for the track.",
      ],
    },
    sources: [SPEC, UCP],
    explode: [0, 0, 1.45],
  },
  {
    id: "aero",
    index: "11",
    name: "Active rear flaps",
    kicker: "Air",
    summary: "Two movable flaps at the elliptical trailing edge adapt to how the car is being driven.",
    specs: [
      { label: "Moving parts", value: "2 rear flaps" },
      { label: "Fixed wings", value: "None" },
      { label: "Developed in", value: "Wind tunnel" },
      { label: "Top speed", value: "350 km/h (limited)" },
    ],
    science: {
      title: "Downforce rises with the square of speed",
      paragraphs: [
        "Aerodynamic force is ½ρv² × coefficient × area. Double the speed and the force quadruples. A flap angle that is useful at 250 km/h creates needless drag at 100 km/h, so the angle has to change with speed.",
        "Moving flaps let one fixed shape behave differently: low drag when cruising, more load on the rear axle under braking and through fast corners.",
      ],
    },
    legacy: {
      title: "Simplicity as a rule",
      paragraphs: [
        "The Huayra used four active flaps, two at each end. The Utopia keeps only the two at the tail and lets the body shape do the rest. Use the button below to see them move.",
      ],
    },
    sources: [UCP],
    explode: [-0.35, 0.45, 0],
  },
  {
    id: "cockpit",
    index: "12",
    name: "Cockpit and controls",
    kicker: "Craft",
    summary: "A steering wheel milled from one block of metal, and a gear lever behind a titanium grille.",
    specs: [
      { label: "Wheel billet", value: "43 kg" },
      { label: "Machining", value: "28 h, five-axis" },
      { label: "Finished wheel", value: "1.6 kg" },
      { label: "Gear gate", value: "Titanium grille" },
    ],
    science: {
      title: "Ninety-six per cent removed",
      paragraphs: [
        "The steering wheel's rim, spokes and hub are one piece. A five-axis machine spends 28 hours cutting a 43 kg block down to 1.6 kg. That is 96% of the metal removed (our calculation from the published figures).",
        "Milling from solid leaves no joints, welds or fasteners, so there is nothing to work loose. The metal's grain runs continuously through the part, and the finished wheel is both stiff and light.",
      ],
    },
    legacy: {
      title: "Arte e Scienza",
      paragraphs: [
        "Horacio Pagani took his guiding idea from Leonardo da Vinci: art and science should work together. In the cabin you can see both, in every visible mechanism and every polished surface.",
      ],
    },
    sources: [UCP],
    explode: [0.35, 1.2, 0],
  },
];

export const ROADSTER_SOURCES: Source[] = [SPEC, PRESS, UCP];
