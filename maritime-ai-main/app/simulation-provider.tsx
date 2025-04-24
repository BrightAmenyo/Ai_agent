"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import {
  generateVessels,
  generateInfrastructure,
  type Vessel,
  type Infrastructure,
  type Cable,
} from "./simulation-data"
import { detectAnomalies, type Anomaly } from "./anomaly-detection"

// Define the simulation state type
export type SimulationState = {
  vessels: Vessel[]
  infrastructure: Infrastructure
  events: SimulationEvent[]
  timeElapsed: number
}

// Define the simulation event type
export type SimulationEvent = {
  id: string
  timestamp: number
  type: string
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH"
  vesselId?: string
  position?: { lat: number; lng: number }
}

// Define the simulation context type
type SimulationContextType = {
  simulationState: SimulationState
  detectedAnomalies: Anomaly[]
  simulationTime: number
  simulationDuration: number
  isRunning: boolean
  isComplete: boolean
  startSimulation: () => void
  pauseSimulation: () => void
  resetSimulation: () => void
  generateNewScenario: () => void
  selectVessel: (id: string | null) => void
  selectedVesselId: string | null
}

// Create the simulation context
const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

// Simulation provider props
type SimulationProviderProps = {
  children: ReactNode
}

// Simulation provider component
export function SimulationProvider({ children }: SimulationProviderProps) {
  // Simulation configuration
  const SIMULATION_DURATION = 30 // seconds
  const UPDATE_INTERVAL = 2000 // Update every 2 seconds for more visible movement

  // Simulation state
  const [simulationState, setSimulationState] = useState<SimulationState>({
    vessels: [],
    infrastructure: { cables: [], platforms: [] },
    events: [],
    timeElapsed: 0,
  })

  // Simulation control state
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [simulationTime, setSimulationTime] = useState(0)
  const [detectedAnomalies, setDetectedAnomalies] = useState<Anomaly[]>([])
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Generate a new simulation scenario
  const generateNewScenario = useCallback(() => {
    console.log("Generating new scenario")
    try {
      const vessels = generateVessels(15)
      const infrastructure = generateInfrastructure()

      setSimulationState({
        vessels,
        infrastructure,
        events: [],
        timeElapsed: 0,
      })

      setSimulationTime(0)
      setIsComplete(false)
      setDetectedAnomalies([])
      setInitialized(true)
      console.log("New scenario generated successfully")
    } catch (error) {
      console.error("Error generating new scenario:", error)
    }
  }, [])

  // Reset the simulation
  const resetSimulation = useCallback(() => {
    console.log("Resetting simulation")
    setSimulationTime(0)
    setIsRunning(false)
    setIsComplete(false)

    // Reset vessel positions to initial state
    setSimulationState((prevState) => ({
      ...prevState,
      vessels: prevState.vessels.map((vessel) => ({
        ...vessel,
        position: vessel.initialPosition,
        heading: vessel.initialHeading,
        speed: vessel.initialSpeed,
        aisStatus: "ACTIVE",
        timeNearCable: 0,
        speedHistory: [vessel.initialSpeed],
        positionHistory: [vessel.initialPosition],
      })),
      events: [],
    }))

    setDetectedAnomalies([])
  }, [])

  // Start the simulation
  const startSimulation = useCallback(() => {
    console.log("Starting simulation...")

    // Make sure we have vessels before starting
    if (simulationState.vessels.length === 0) {
      console.log("No vessels found, generating new scenario before starting")
      generateNewScenario()
    }

    if (isComplete) {
      resetSimulation()
    }

    // Set running state immediately
    setIsRunning(true)
    console.log("Simulation running state set to true")
  }, [isComplete, resetSimulation, generateNewScenario, simulationState.vessels.length])

  // Pause the simulation
  const pauseSimulation = useCallback(() => {
    setIsRunning(false)
  }, [])

  // Select a vessel
  const selectVessel = useCallback((id: string | null) => {
    setSelectedVesselId(id)
  }, [])

  // Make sure generateNewScenario is called on initialization
  useEffect(() => {
    console.log("Initializing simulation...")
    if (!initialized) {
      generateNewScenario()
    }
  }, [generateNewScenario, initialized])

  // Run the simulation
  useEffect(() => {
    if (!isRunning) return

    console.log("Simulation loop running, time:", simulationTime)

    // Double-check we have vessels
    if (simulationState.vessels.length === 0) {
      console.log("No vessels in simulation state, generating new scenario")
      generateNewScenario()
      return
    }

    const interval = setInterval(() => {
      setSimulationTime((prevTime) => {
        const newTime = prevTime + UPDATE_INTERVAL / 1000

        // Check if simulation is complete
        if (newTime >= SIMULATION_DURATION) {
          setIsRunning(false)
          setIsComplete(true)
          console.log("Simulation complete")
          return SIMULATION_DURATION
        }

        return newTime
      })

      // Update simulation state
      setSimulationState((prevState) => {
        // Update vessel positions
        const updatedVessels = prevState.vessels.map((vessel) => {
          // Skip update if vessel is anchored
          if (vessel.behavior === "SUSPICIOUS_ANCHORING" && vessel.timeNearCable > 5) {
            return {
              ...vessel,
              speed: 0,
              speedHistory: [...vessel.speedHistory, 0],
            }
          }

          // Calculate new position based on heading and speed
          const movementFactor = 0.005 * vessel.speed // DRAMATICALLY increased movement factor
          const lat = vessel.position.lat + Math.cos((vessel.heading * Math.PI) / 180) * movementFactor
          const lng = vessel.position.lng + Math.sin((vessel.heading * Math.PI) / 180) * movementFactor

          // Apply behavior patterns with more dramatic changes
          let newHeading = vessel.heading
          let newSpeed = vessel.speed
          let newAisStatus = vessel.aisStatus

          switch (vessel.behavior) {
            case "NORMAL":
              // Slight random variations
              newHeading += (Math.random() - 0.5) * 10 // Increase heading variation
              newSpeed += (Math.random() - 0.5) * 0.5 // Increase speed variation
              break

            case "ROUTE_DEVIATION":
              // Make more significant course changes
              if (Math.random() < 0.3) {
                // Increase probability of course change
                newHeading += (Math.random() - 0.5) * 60 // More dramatic heading changes
              }
              break

            case "SPEED_ANOMALY":
              // Randomly change speed dramatically
              if (Math.random() < 0.3) {
                // Increase probability of speed change
                newSpeed = Math.random() < 0.5 ? vessel.speed * 3 : vessel.speed * 0.2 // More dramatic speed changes
              }
              break

            case "AIS_LOSS":
              // Randomly turn off AIS
              if (Math.random() < 0.2 && vessel.aisStatus === "ACTIVE") {
                // Increase probability of AIS loss
                newAisStatus = "INACTIVE"
              } else if (Math.random() < 0.1 && vessel.aisStatus === "INACTIVE") {
                newAisStatus = "ACTIVE"
              }
              break

            case "SUSPICIOUS_ANCHORING":
              // Check if near a cable
              const nearestCable = findNearestCable(vessel.position, prevState.infrastructure.cables)
              if (nearestCable && nearestCable.distance < 0.01) {
                // Slow down and eventually stop
                newSpeed = Math.max(0, vessel.speed - 0.5) // Faster slowdown
                vessel.timeNearCable += UPDATE_INTERVAL / 1000
              }
              break
          }

          // Keep speed within reasonable bounds
          newSpeed = Math.max(0, Math.min(10, newSpeed))

          // Update vessel
          return {
            ...vessel,
            position: { lat, lng },
            heading: newHeading,
            speed: newSpeed,
            aisStatus: newAisStatus,
            speedHistory: [...vessel.speedHistory, newSpeed],
            positionHistory: [...vessel.positionHistory, { lat, lng }],
          }
        })

        // Detect anomalies
        const anomalies = detectAnomalies(updatedVessels, prevState.infrastructure)

        // Add new anomalies to the detected list
        const existingAnomalyIds = new Set(detectedAnomalies.map((a) => a.id))
        const newAnomalies = anomalies.filter((a) => !existingAnomalyIds.has(a.id))

        if (newAnomalies.length > 0) {
          setDetectedAnomalies((prev) => [...prev, ...newAnomalies])

          // Create events for new anomalies
          const newEvents = newAnomalies.map((anomaly) => ({
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: simulationTime,
            type: anomaly.type,
            description: anomaly.description,
            severity: anomaly.severity,
            vesselId: anomaly.vesselId,
            position: updatedVessels.find((v) => v.id === anomaly.vesselId)?.position,
          }))

          return {
            ...prevState,
            vessels: updatedVessels,
            events: [...prevState.events, ...newEvents],
            timeElapsed: simulationTime,
          }
        }

        return {
          ...prevState,
          vessels: updatedVessels,
          timeElapsed: simulationTime,
        }
      })
    }, UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [
    isRunning,
    simulationTime,
    detectedAnomalies,
    generateNewScenario,
    simulationState.vessels.length,
    UPDATE_INTERVAL,
  ])

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

  const value = {
    simulationState,
    detectedAnomalies,
    simulationTime,
    simulationDuration: SIMULATION_DURATION,
    isRunning,
    isComplete,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    generateNewScenario,
    selectVessel,
    selectedVesselId,
  }

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
}

// Hook to use the simulation context
export function useSimulation() {
  const context = useContext(SimulationContext)
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return context
}

