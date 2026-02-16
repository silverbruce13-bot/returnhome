
import React, { useMemo } from 'react';
import { useLanguage } from '../i18n';

interface MissionMapSVGProps {
    journeyId: number;
    visitedSteps: number[];
    selectedStepIndex: number | null;
    onStepClick: (index: number) => void;
    steps: { city: { ko: string; en: string } }[];
}

const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 500;

// Coordinate system: 0-800 (x), 0-500 (y) based on Mediterranean map
// Approx: Italy (Left), Greece (Center), Turkey (Right), Israel (Bottom Right)
const CITY_COORDINATES: Record<string, { x: number; y: number }> = {
    // Italy & Malta
    "Rome": { x: 50, y: 80 },
    "Puteoli": { x: 90, y: 95 },
    "Malta": { x: 80, y: 250 },

    // Greece (Macedonia/Achaia) & Crete
    "Philippi": { x: 300, y: 100 },
    "Thessalonica": { x: 270, y: 110 },
    "Berea": { x: 255, y: 125 },
    "Athens": { x: 280, y: 200 },
    "Corinth": { x: 260, y: 195 },
    "Fair Havens": { x: 350, y: 300 }, // Crete

    // Asia Minor (Turkey) - West Coast
    "Troas": { x: 370, y: 130 },
    "Ephesus": { x: 380, y: 200 },
    "Miletus": { x: 385, y: 220 },

    // Asia Minor - South/Inland
    "Perga in Pamphylia": { x: 450, y: 230 },
    "Pisidian Antioch": { x: 450, y: 190 },
    "Iconium": { x: 490, y: 200 },
    "Lystra": { x: 490, y: 220 },
    "Derbe": { x: 520, y: 220 },
    "Tarsus": { x: 560, y: 230 },

    // Syria & East
    "Antioch": { x: 600, y: 240 }, // Syrian Antioch
    "Syrian Antioch": { x: 600, y: 240 },
    "Seleucia": { x: 590, y: 250 },

    // Cyprus
    "Cyprus (Salamis, Paphos)": { x: 500, y: 280 }, // Midpoint
    "Salamis": { x: 520, y: 280 },
    "Paphos": { x: 480, y: 280 },

    // Phoenicia & Judea
    "Tyre": { x: 600, y: 320 },
    "Caesarea": { x: 590, y: 360 },
    "Jerusalem": { x: 600, y: 390 },

    // Regions (Approximate centers)
    "Macedonia": { x: 260, y: 90 },
};

// Simplified coastline path (abstract representation)
const COASTLINE_PATH = `
  M 20,50 L 120,50 L 150,150 L 120,280 L 180,310 L 220,150 L 250,50 
  L 400,50 L 420,120 L 380,150 L 400,250 L 550,250 L 600,220 L 650,220 
  L 650,450 L 550,450 L 550,380 L 450,320 L 350,350 L 250,320 L 150,400 L 20,400 Z
`;

// A better artistic approximation of the Mediterranean
// Italy boot, Greece peninsula, Turkey rectangle, Levant Vertical
const MAP_PATHS = [
    // Italy
    "M 30,20 L 100,20 L 110,150 L 150,200 L 100,220 L 70,160 L 50,100 Z",
    // Balkans / Greece
    "M 150,20 L 350,20 L 380,120 L 330,220 L 280,240 L 250,200 L 200,100 Z",
    // Peloponnese
    "M 250,200 L 280,200 L 270,230 L 250,220 Z",
    // Asia Minor (Turkey)
    "M 380,80 L 650,80 L 650,250 L 550,260 L 450,250 L 380,220 L 370,120 Z",
    // Levant (Syria/Israel/Egypt)
    "M 650,220 L 700,220 L 700,480 L 500,480 L 550,400 L 580,350 L 580,250 Z",
    // Cyprus
    "M 470,270 L 530,260 L 540,280 L 480,290 Z",
    // Crete
    "M 310,290 L 390,290 L 380,310 L 320,310 Z",
    // Sicily
    "M 90,230 L 140,220 L 130,260 L 90,250 Z"
];

const MissionMapSVG: React.FC<MissionMapSVGProps> = ({
    journeyId,
    visitedSteps,
    selectedStepIndex,
    onStepClick,
    steps
}) => {
    const { language } = useLanguage();

    // Get coordinates for current journey steps
    const journeyPoints = useMemo(() => {
        return steps.map(step => {
            // Try to find coordinate by full English Name (assuming steps usually have consistent keys, but might need mapping)
            // Our CITY_COORDINATES uses English keys. step.city.en should match.
            const key = step.city.en;
            // Handle composite keys like "Cyprus (Salamis, Paphos)"
            if (CITY_COORDINATES[key]) return CITY_COORDINATES[key];

            // Fallback searches
            const partialMatch = Object.keys(CITY_COORDINATES).find(k => key.includes(k));
            return partialMatch ? CITY_COORDINATES[partialMatch] : { x: 0, y: 0 };
        });
    }, [steps]);

    // Generate path string for the route
    const routePath = useMemo(() => {
        if (journeyPoints.length === 0) return "";
        return journeyPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    }, [journeyPoints]);

    return (
        <div className="w-full bg-[#f4e4bc] rounded-xl overflow-hidden shadow-inner border border-[#d4c49c] relative">
            <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-auto drop-shadow-md">
                {/* Ocean Background */}
                <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="#6fa3c4" opacity="0.4" />

                {/* Land Masses */}
                {MAP_PATHS.map((d, i) => (
                    <path key={i} d={d} fill="#e6d5a7" stroke="#bfaa7f" strokeWidth="2" />
                ))}

                {/* Journey Route (Dotted Line) */}
                <path
                    d={routePath}
                    fill="none"
                    stroke={
                        journeyId === 1 ? "#d97706" :  // Amber
                            journeyId === 2 ? "#2563eb" :  // Blue
                                journeyId === 3 ? "#16a34a" :  // Green
                                    "#dc2626"                      // Red
                    }
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm opacity-80"
                >
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="30s" repeatCount="indefinite" />
                </path>

                {/* City Markers */}
                {journeyPoints.map((point, index) => {
                    const isSelected = selectedStepIndex === index;
                    const isVisited = visitedSteps.includes(index);
                    const cityData = steps[index];

                    if (point.x === 0 && point.y === 0) return null; // Skip if no coordinate found

                    return (
                        <g
                            key={index}
                            onClick={() => onStepClick(index)}
                            style={{ cursor: 'pointer' }}
                            className="transition-all duration-300"
                        >
                            {/* Pulse effect for selected */}
                            {isSelected && (
                                <circle cx={point.x} cy={point.y} r="12" fill="none" stroke="currentColor" className="text-sky-500 animate-ping opacity-75" strokeWidth="2" />
                            )}

                            {/* Marker Circle */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={isSelected ? 6 : 4}
                                fill={isSelected ? "#0ea5e9" : isVisited ? "#0f172a" : "#fff"}
                                stroke="#0f172a"
                                strokeWidth="2"
                                className="transition-all duration-300 hover:scale-150"
                            />

                            {/* City Name Label (Only show for selected or special ones to avoid clutter?) 
                  Currently showing all for visibility, staggered if needed
              */}
                            <text
                                x={point.x}
                                y={point.y + 15}
                                textAnchor="middle"
                                className={`text-[10px] font-bold fill-slate-800 pointer-events-none drop-shadow-md ${isSelected ? 'text-[12px] font-extrabold fill-black' : ''}`}
                                style={{ fontFamily: 'serif' }}
                            >
                                {cityData.city[language]}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Texture Overlay for Old Paper Look */}
            <div className="absolute inset-0 bg-yellow-900/10 pointer-events-none mix-blend-multiply" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-20 pointer-events-none" />

            {/* Legend / Title */}
            <div className="absolute top-4 left-4 font-serif text-slate-800 opacity-70">
                <span className="text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-1">Mediterranean Sea</span>
            </div>
        </div>
    );
};

export default MissionMapSVG;
