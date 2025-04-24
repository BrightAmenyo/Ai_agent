"use client"

// Vessel type definition
export type Vessel = {
  id: string
  name: string
  mmsi: string
  imo: string
  type: string
  flag: string
  position: { lat: number; lng: number }
  initialPosition: { lat: number; lng: number }
  heading: number
  initialHeading: number
  speed: number
  initialSpeed: number
  destination: string
  aisStatus: "ACTIVE" | "INACTIVE"
  behavior: "NORMAL" | "ROUTE_DEVIATION" | "SPEED_ANOMALY" | "AIS_LOSS" | "SUSPICIOUS_ANCHORING"
  timeNearCable: number
  speedHistory: number[]
  positionHistory: { lat: number; lng: number }[]
}

// Cable type definition
export type Cable = {
  id: string
  name: string
  path: { lat: number; lng: number }[]
  status: "NORMAL" | "AT_RISK" | "DAMAGED"
}

// Platform type definition
export type Platform = {
  id: string
  name: string
  position: { lat: number; lng: number }
  type: string
}

// Infrastructure type definition
export type Infrastructure = {
  cables: Cable[]
  platforms: Platform[]
}

// Vessel names for random generation
const vesselNames = [
  "Atlantic Voyager",
  "Pacific Explorer",
  "Northern Star",
  "Southern Cross",
  "Ocean Pioneer",
  "Sea Dragon",
  "Coastal Runner",
  "Global Trader",
  "Horizon Seeker",
  "Maritime Venture",
  "Wave Rider",
  "Deep Blue",
  "Eastern Wind",
  "Western Sun",
  "Crystal Waters",
  "Golden Horizon",
  "Silver Mist",
  "Royal Odyssey",
  "Emerald Seas",
  "Diamond Crest",
]

// Vessel types for random generation
const vesselTypes = ["CARGO", "TANKER", "PASSENGER", "FISHING", "RESEARCH", "MILITARY", "PLEASURE", "TUG"]

// Country flags for random generation
const countryFlags = ["US", "UK", "JP", "CN", "DE", "FR", "IT", "ES", "NL", "GR", "PA", "LR", "MH", "SG", "HK", "MT"]

// Destinations for random generation
const destinations = [
  "New York",
  "Rotterdam",
  "Shanghai",
  "Singapore",
  "Los Angeles",
  "Hamburg",
  "Dubai",
  "Hong Kong",
  "Tokyo",
  "Busan",
  "Antwerp",
  "Valencia",
  "Felixstowe",
  "Santos",
  "Jebel Ali",
  "Kaohsiung",
]

// Helper function for weighted random selection
function weightedRandom<T>(items: [T, number][]): T {
  const totalWeight = items.reduce((sum, [_, weight]) => sum + weight, 0)
  let random = Math.random() * totalWeight

  for (const [item, weight] of items) {
    random -= weight
    if (random <= 0) {
      return item
    }
  }

  return items[0][0] // Fallback
}

// Generate a random vessel
function generateRandomVessel(id: number): Vessel {
  // Random position in the Gulf of Mexico region with more spread
  const lat = 25.5 + Math.random() * 1.5
  const lng = -88 + Math.random() * 3

  // Random heading with full 360-degree possibilities
  const heading = Math.random() * 360

  // Random speed (5-20 knots) with more variation for more visible movement
  const speed = 5 + Math.random() * 15

  // Random behavior with weighted probabilities - increase anomaly probability
  const behaviors: ["NORMAL" | "ROUTE_DEVIATION" | "SPEED_ANOMALY" | "AIS_LOSS" | "SUSPICIOUS_ANCHORING", number][] = [
    ["NORMAL", 0.4], // Reduced normal probability
    ["ROUTE_DEVIATION", 0.15], // Increased anomaly probabilities
    ["SPEED_ANOMALY", 0.15],
    ["AIS_LOSS", 0.15],
    ["SUSPICIOUS_ANCHORING", 0.15],
  ]

  const behavior = weightedRandom(behaviors)

  // Generate a unique IMO number
  const imo = `${9}${Math.floor(100000 + Math.random() * 900000)}`

  // Generate a unique MMSI number
  const mmsi = `${Math.floor(100000000 + Math.random() * 900000000)}`

  return {
    id: `vessel-${id}`,
    name: vesselNames[Math.floor(Math.random() * vesselNames.length)],
    mmsi,
    imo,
    type: vesselTypes[Math.floor(Math.random() * vesselTypes.length)],
    flag: countryFlags[Math.floor(Math.random() * countryFlags.length)],
    position: { lat, lng },
    initialPosition: { lat, lng },
    heading,
    initialHeading: heading,
    speed,
    initialSpeed: speed,
    destination: destinations[Math.floor(Math.random() * destinations.length)],
    aisStatus: "ACTIVE",
    behavior,
    timeNearCable: 0,
    speedHistory: [speed],
    positionHistory: [{ lat, lng }],
  }
}

// Generate a specified number of vessels
export function generateVessels(count: number): Vessel[] {
  const vessels: Vessel[] = []

  for (let i = 0; i < count; i++) {
    vessels.push(generateRandomVessel(i))
  }

  return vessels
}

// Generate infrastructure (cables and platforms)
export function generateInfrastructure(): Infrastructure {
  // Generate cables
  const cables: Cable[] = [
    {
      id: "cable-1",
      name: "Gulf Connector",
      path: [
        { lat: 25.7, lng: -89.5 },
        { lat: 26.0, lng: -88.8 },
        { lat: 26.2, lng: -87.9 },
        { lat: 26.3, lng: -87.0 },
        { lat: 26.4, lng: -86.0 },
      ],
      status: "NORMAL",
    },
    {
      id: "cable-2",
      name: "Southern Cross",
      path: [
        { lat: 25.2, lng: -89.0 },
        { lat: 25.5, lng: -88.5 },
        { lat: 25.8, lng: -88.0 },
        { lat: 26.1, lng: -87.5 },
        { lat: 26.4, lng: -87.0 },
      ],
      status: "NORMAL",
    },
    {
      id: "cable-3",
      name: "Atlantic Link",
      path: [
        { lat: 26.0, lng: -89.2 },
        { lat: 26.2, lng: -88.7 },
        { lat: 26.4, lng: -88.2 },
        { lat: 26.6, lng: -87.7 },
        { lat: 26.8, lng: -87.2 },
      ],
      status: "NORMAL",
    },
  ]

  // Generate platforms
  const platforms: Platform[] = [
    {
      id: "platform-1",
      name: "Gulf Platform Alpha",
      position: { lat: 26.1, lng: -88.5 },
      type: "OIL",
    },
    {
      id: "platform-2",
      name: "Research Station Beta",
      position: { lat: 25.8, lng: -87.8 },
      type: "RESEARCH",
    },
    {
      id: "platform-3",
      name: "Monitoring Station Gamma",
      position: { lat: 26.5, lng: -88.0 },
      type: "MONITORING",
    },
  ]

  return { cables, platforms }
}

