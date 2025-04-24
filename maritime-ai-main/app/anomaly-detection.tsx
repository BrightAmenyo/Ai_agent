"use client"

import type { Vessel, Infrastructure, Cable } from "./simulation-data"

// Anomaly type definition
export type Anomaly = {
  id: string
  type: "AIS_LOSS" | "ROUTE_DEVIATION" | "SUSPICIOUS_ANCHORING" | "SPEED_ANOMALY"
  vesselId: string
  vesselName: string
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH"
  timestamp: number
  position: { lat: number; lng: number }
}

// Detect anomalies in vessel behavior
export function detectAnomalies(vessels: Vessel[], infrastructure: Infrastructure): Anomaly[] {
  const anomalies: Anomaly[] = []
  const timestamp = Date.now()

  for (const vessel of vessels) {
    // Check for AIS signal loss
    if (vessel.aisStatus === "INACTIVE") {
      // Check if vessel is near a cable
      const nearestCable = findNearestCable(vessel.position, infrastructure.cables)
      const severity = nearestCable && nearestCable.distance < 0.02 ? "HIGH" : "MEDIUM"

      anomalies.push({
        id: `anomaly-ais-${vessel.id}-${timestamp}`,
        type: "AIS_LOSS",
        vesselId: vessel.id,
        vesselName: vessel.name,
        description: `Vessel ${vessel.name} (IMO: ${vessel.imo}) has lost AIS signal${
          nearestCable && nearestCable.distance < 0.02 ? ` near ${nearestCable.cable.name} cable` : ""
        }`,
        severity,
        timestamp,
        position: vessel.position,
      })
    }

    // Check for suspicious anchoring near cables
    if (vessel.timeNearCable > 5) {
      const nearestCable = findNearestCable(vessel.position, infrastructure.cables)

      if (nearestCable && nearestCable.distance < 0.01) {
        anomalies.push({
          id: `anomaly-anchoring-${vessel.id}-${timestamp}`,
          type: "SUSPICIOUS_ANCHORING",
          vesselId: vessel.id,
          vesselName: vessel.name,
          description: `Vessel ${vessel.name} (IMO: ${vessel.imo}) has been stationary near ${nearestCable.cable.name} cable for ${vessel.timeNearCable.toFixed(1)} seconds`,
          severity: vessel.timeNearCable > 10 ? "HIGH" : "MEDIUM",
          timestamp,
          position: vessel.position,
        })
      }
    }

    // Check for speed anomalies
    if (vessel.speedHistory.length >= 5) {
      const recentSpeeds = vessel.speedHistory.slice(-5)
      const avgSpeed = recentSpeeds.reduce((sum, speed) => sum + speed, 0) / recentSpeeds.length
      const maxSpeed = Math.max(...recentSpeeds)
      const minSpeed = Math.min(...recentSpeeds)
      const speedRange = maxSpeed - minSpeed

      // Detect rapid acceleration or deceleration
      if (speedRange > 5 && vessel.behavior === "SPEED_ANOMALY") {
        const nearestCable = findNearestCable(vessel.position, infrastructure.cables)
        const severity = nearestCable && nearestCable.distance < 0.03 ? "HIGH" : "MEDIUM"

        anomalies.push({
          id: `anomaly-speed-${vessel.id}-${timestamp}`,
          type: "SPEED_ANOMALY",
          vesselId: vessel.id,
          vesselName: vessel.name,
          description: `Vessel ${vessel.name} (IMO: ${vessel.imo}) has shown unusual speed changes (${minSpeed.toFixed(1)} to ${maxSpeed.toFixed(1)} knots)${
            nearestCable && nearestCable.distance < 0.03 ? ` near ${nearestCable.cable.name} cable` : ""
          }`,
          severity,
          timestamp,
          position: vessel.position,
        })
      }
    }

    // Check for route deviations
    if (vessel.positionHistory.length >= 10 && vessel.behavior === "ROUTE_DEVIATION") {
      // Calculate expected path (straight line)
      const start = vessel.positionHistory[0]
      const current = vessel.position

      // Check for zigzag pattern
      const isZigzag = detectZigzagPattern(vessel.positionHistory.slice(-10))

      if (isZigzag) {
        const nearestCable = findNearestCable(vessel.position, infrastructure.cables)
        const severity = nearestCable && nearestCable.distance < 0.03 ? "HIGH" : "MEDIUM"

        anomalies.push({
          id: `anomaly-route-${vessel.id}-${timestamp}`,
          type: "ROUTE_DEVIATION",
          vesselId: vessel.id,
          vesselName: vessel.name,
          description: `Vessel ${vessel.name} (IMO: ${vessel.imo}) is following an unusual zigzag pattern${
            nearestCable && nearestCable.distance < 0.03 ? ` near ${nearestCable.cable.name} cable` : ""
          }`,
          severity,
          timestamp,
          position: vessel.position,
        })
      }
    }
  }

  return anomalies
}

// Find the nearest cable to a position
function findNearestCable(position: { lat: number; lng: number }, cables: Cable[]) {
  let nearestCable = null
  let minDistance = Number.POSITIVE_INFINITY

  for (const cable of cables) {
    for (let i = 1; i < cable.path.length; i++) {
      const start = cable.path[i - 1]
      const end = cable.path[i]

      // Calculate distance from position to line segment
      const distance = distanceToLineSegment(position, start, end)

      if (distance < minDistance) {
        minDistance = distance
        nearestCable = { cable, distance }
      }
    }
  }

  return nearestCable
}

// Calculate distance from a point to a line segment
function distanceToLineSegment(
  point: { lat: number; lng: number },
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
) {
  const A = point.lat - start.lat
  const B = point.lng - start.lng
  const C = end.lat - start.lat
  const D = end.lng - start.lng

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = start.lat
    yy = start.lng
  } else if (param > 1) {
    xx = end.lat
    yy = end.lng
  } else {
    xx = start.lat + param * C
    yy = start.lng + param * D
  }

  const dx = point.lat - xx
  const dy = point.lng - yy

  return Math.sqrt(dx * dx + dy * dy)
}

// Detect zigzag pattern in position history
function detectZigzagPattern(positions: { lat: number; lng: number }[]): boolean {
  if (positions.length < 6) return false

  // Calculate direction changes
  let directionChanges = 0

  for (let i = 2; i < positions.length; i++) {
    const prev2 = positions[i - 2]
    const prev1 = positions[i - 1]
    const current = positions[i]

    const dir1 = Math.atan2(prev1.lng - prev2.lng, prev1.lat - prev2.lat)
    const dir2 = Math.atan2(current.lng - prev1.lng, current.lat - prev1.lat)

    // Calculate angle difference
    let angleDiff = Math.abs(dir2 - dir1)
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff

    // If angle difference is significant, count as direction change
    if (angleDiff > Math.PI / 6) {
      directionChanges++
    }
  }

  // If there are multiple direction changes, consider it a zigzag
  return directionChanges >= 3
}

