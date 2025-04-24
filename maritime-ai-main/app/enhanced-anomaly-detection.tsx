"use client"

import type { Vessel, Infrastructure, Cable } from "./simulation-data"

// Enhanced Anomaly type definition
export type EnhancedAnomaly = {
  id: string
  type: "AIS_LOSS" | "ROUTE_DEVIATION" | "SUSPICIOUS_ANCHORING" | "SPEED_ANOMALY" | "RF_EMISSIONS" | "TYPE_MISMATCH"
  vesselId: string
  vesselName: string
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH"
  timestamp: number
  position: { lat: number; lng: number }
  duration?: number
  nearInfrastructure?: string
  distanceToInfrastructure?: number
}

// Detect enhanced anomalies in vessel behavior
export function detectEnhancedAnomalies(vessels: Vessel[], infrastructure: Infrastructure): EnhancedAnomaly[] {
  const anomalies: EnhancedAnomaly[] = []
  const timestamp = Date.now()

  for (const vessel of vessels) {
    // Find nearest cable for context
    const nearestCable = findNearestCable(vessel.position, infrastructure.cables)
    const nearCable = nearestCable && nearestCable.distance < 0.05
    const veryCable = nearestCable && nearestCable.distance < 0.02
    const directlyOverCable = nearestCable && nearestCable.distance < 0.01

    // 1. Check for AIS signal loss
    if (vessel.aisStatus === "INACTIVE") {
      // Severity depends on proximity to infrastructure
      let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW"
      let description = `Vessel ${vessel.name} (IMO: ${vessel.imo}) has lost AIS signal`

      if (directlyOverCable) {
        severity = "HIGH"
        description = `AIS Disabled directly above ${nearestCable.cable.name} cable.`
      } else if (veryCable) {
        severity = "HIGH"
        description = `Vessel ${vessel.name} has disabled AIS very close to ${nearestCable.cable.name} cable.`
      } else if (nearCable) {
        severity = "MEDIUM"
        description = `Vessel ${vessel.name} has disabled AIS near ${nearestCable.cable.name} cable.`
      }

      anomalies.push({
        id: `anomaly-ais-${vessel.id}-${timestamp}`,
        type: "AIS_LOSS",
        vesselId: vessel.id,
        vesselName: vessel.name,
        description,
        severity,
        timestamp,
        position: vessel.position,
        nearInfrastructure: nearCable ? nearestCable.cable.name : undefined,
        distanceToInfrastructure: nearCable ? nearestCable.distance : undefined,
      })
    }

    // 2. Check for suspicious anchoring near cables
    if (vessel.speed < 0.5 && vessel.timeNearCable > 0) {
      if (directlyOverCable) {
        const duration = vessel.timeNearCable.toFixed(1)

        anomalies.push({
          id: `anomaly-anchoring-${vessel.id}-${timestamp}`,
          type: "SUSPICIOUS_ANCHORING",
          vesselId: vessel.id,
          vesselName: vessel.name,
          description: `Anchored ${duration} minutes above ${nearestCable.cable.name} cable — no declared activity.`,
          severity: vessel.timeNearCable > 5 ? "HIGH" : "MEDIUM",
          timestamp,
          position: vessel.position,
          duration: vessel.timeNearCable,
          nearInfrastructure: nearestCable.cable.name,
          distanceToInfrastructure: nearestCable.distance,
        })
      }
    }

    // 3. Check for loitering / slow movement in cable zones
    if (vessel.speed > 0.5 && vessel.speed < 2.0 && vessel.timeNearCable > 0) {
      if (nearCable) {
        const duration = vessel.timeNearCable.toFixed(1)

        anomalies.push({
          id: `anomaly-loitering-${vessel.id}-${timestamp}`,
          type: "ROUTE_DEVIATION",
          vesselId: vessel.id,
          vesselName: vessel.name,
          description: `Loitered near ${nearestCable.cable.name} cable for ${duration} minutes at ${vessel.speed.toFixed(1)} knots.`,
          severity: directlyOverCable ? "HIGH" : "MEDIUM",
          timestamp,
          position: vessel.position,
          duration: vessel.timeNearCable,
          nearInfrastructure: nearestCable.cable.name,
          distanceToInfrastructure: nearestCable.distance,
        })
      }
    }

    // 4. Check for type mismatch (research vessels in restricted areas)
    if (vessel.type === "RESEARCH" && nearCable) {
      anomalies.push({
        id: `anomaly-type-${vessel.id}-${timestamp}`,
        type: "TYPE_MISMATCH",
        vesselId: vessel.id,
        vesselName: vessel.name,
        description: `Research vessel with no research permit, loitering in restricted zone near ${nearestCable.cable.name}.`,
        severity: directlyOverCable ? "HIGH" : "MEDIUM",
        timestamp,
        position: vessel.position,
        nearInfrastructure: nearestCable.cable.name,
        distanceToInfrastructure: nearestCable.distance,
      })
    }

    // 5. Random RF emissions detection (simulation)
    if (vessel.behavior !== "NORMAL" && Math.random() < 0.05 && nearCable) {
      anomalies.push({
        id: `anomaly-rf-${vessel.id}-${timestamp}`,
        type: "RF_EMISSIONS",
        vesselId: vessel.id,
        vesselName: vessel.name,
        description: `High-frequency RF signals detected from ${vessel.name} near ${nearestCable.cable.name} cable.`,
        severity: directlyOverCable ? "HIGH" : "MEDIUM",
        timestamp,
        position: vessel.position,
        nearInfrastructure: nearestCable.cable.name,
        distanceToInfrastructure: nearestCable.distance,
      })
    }

    // 6. Check for speed anomalies
    if (vessel.speedHistory.length >= 5) {
      const recentSpeeds = vessel.speedHistory.slice(-5)
      const avgSpeed = recentSpeeds.reduce((sum, speed) => sum + speed, 0) / recentSpeeds.length
      const maxSpeed = Math.max(...recentSpeeds)
      const minSpeed = Math.min(...recentSpeeds)
      const speedRange = maxSpeed - minSpeed

      // Detect rapid acceleration or deceleration
      if (speedRange > 5 && vessel.behavior === "SPEED_ANOMALY") {
        anomalies.push({
          id: `anomaly-speed-${vessel.id}-${timestamp}`,
          type: "SPEED_ANOMALY",
          vesselId: vessel.id,
          vesselName: vessel.name,
          description: `Vessel ${vessel.name} has shown unusual speed changes (${minSpeed.toFixed(1)} to ${maxSpeed.toFixed(1)} knots)${
            nearCable ? ` near ${nearestCable.cable.name} cable` : ""
          }`,
          severity: nearCable ? "HIGH" : "MEDIUM",
          timestamp,
          position: vessel.position,
          nearInfrastructure: nearCable ? nearestCable.cable.name : undefined,
          distanceToInfrastructure: nearCable ? nearestCable.distance : undefined,
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

