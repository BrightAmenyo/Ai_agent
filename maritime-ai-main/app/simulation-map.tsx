"use client"

import { useRef, useState } from "react"
import { AlertTriangle, Anchor, Ship, Navigation, Cable, Waves, BarChart3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSimulation } from "./simulation-provider"

export function SimulationMap({
  fullscreen = false,
}: {
  fullscreen?: boolean
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const { simulationState, detectedAnomalies, selectVessel, selectedVesselId, isRunning } = useSimulation()

  const [selectedInfrastructure, setSelectedInfrastructure] = useState<string | null>(null)
  const [showCables, setShowCables] = useState(true)
  const [showNormalVessels, setShowNormalVessels] = useState(true)
  const [showAnomalies, setShowAnomalies] = useState(true)

  // Get the selected vessel
  const selectedVessel = simulationState.vessels.find((v) => v.id === selectedVesselId)

  // Get the selected infrastructure
  const selectedCable = simulationState.infrastructure.cables.find((c) => c.id === selectedInfrastructure)
  const selectedPlatform = simulationState.infrastructure.platforms.find((p) => p.id === selectedInfrastructure)

  const getIconForVesselBehavior = (vessel: any) => {
    // If vessel has an active anomaly, show that first
    const vesselAnomalies = detectedAnomalies.filter((a) => a.vesselId === vessel.id)
    if (vesselAnomalies.length > 0) {
      const latestAnomaly = vesselAnomalies[vesselAnomalies.length - 1]

      switch (latestAnomaly.type) {
        case "AIS_LOSS":
          return <AlertTriangle className="h-5 w-5 text-destructive" />
        case "ROUTE_DEVIATION":
          return <Navigation className="h-5 w-5 text-amber-500" />
        case "SUSPICIOUS_ANCHORING":
          return <Anchor className="h-5 w-5 text-blue-500" />
        case "SPEED_ANOMALY":
          return <BarChart3 className="h-5 w-5 text-purple-500" />
      }
    }

    // Otherwise show based on behavior
    switch (vessel.behavior) {
      case "AIS_LOSS":
        return vessel.aisStatus === "INACTIVE" ? (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        ) : (
          <Ship className="h-5 w-5 text-muted-foreground" />
        )
      case "ROUTE_DEVIATION":
        return <Navigation className="h-5 w-5 text-amber-500" />
      case "SUSPICIOUS_ANCHORING":
        return vessel.timeNearCable > 5 ? (
          <Anchor className="h-5 w-5 text-blue-500" />
        ) : (
          <Ship className="h-5 w-5 text-muted-foreground" />
        )
      case "SPEED_ANOMALY":
        return <BarChart3 className="h-5 w-5 text-purple-500" />
      default:
        return <Ship className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getBadgeForVesselBehavior = (vessel: any) => {
    // If vessel has an active anomaly, show that first
    const vesselAnomalies = detectedAnomalies.filter((a) => a.vesselId === vessel.id)
    if (vesselAnomalies.length > 0) {
      const latestAnomaly = vesselAnomalies[vesselAnomalies.length - 1]

      switch (latestAnomaly.type) {
        case "AIS_LOSS":
          return <Badge variant="destructive">Missing AIS</Badge>
        case "ROUTE_DEVIATION":
          return (
            <Badge variant="default" className="bg-amber-500">
              Route Deviation
            </Badge>
          )
        case "SUSPICIOUS_ANCHORING":
          return (
            <Badge variant="default" className="bg-blue-500">
              Suspicious Anchoring
            </Badge>
          )
        case "SPEED_ANOMALY":
          return (
            <Badge variant="default" className="bg-purple-500">
              Speed Anomaly
            </Badge>
          )
      }
    }

    // Otherwise show based on behavior
    switch (vessel.behavior) {
      case "AIS_LOSS":
        return vessel.aisStatus === "INACTIVE" ? (
          <Badge variant="destructive">Missing AIS</Badge>
        ) : (
          <Badge variant="outline">Normal</Badge>
        )
      case "ROUTE_DEVIATION":
        return (
          <Badge variant="default" className="bg-amber-500">
            Route Deviation
          </Badge>
        )
      case "SUSPICIOUS_ANCHORING":
        return vessel.timeNearCable > 5 ? (
          <Badge variant="default" className="bg-blue-500">
            Suspicious Anchoring
          </Badge>
        ) : (
          <Badge variant="outline">Normal</Badge>
        )
      case "SPEED_ANOMALY":
        return (
          <Badge variant="default" className="bg-purple-500">
            Speed Anomaly
          </Badge>
        )
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  const getIconForInfrastructureType = (type: string) => {
    switch (type) {
      case "cable":
        return <Cable className="h-5 w-5 text-primary" />
      default:
        return <Waves className="h-5 w-5 text-primary" />
    }
  }

  // Convert lat/lng to pixel coordinates
  const getPixelCoordinates = (lat: number, lng: number) => {
    // Map bounds (Gulf of Mexico region)
    const minLat = 25.0
    const maxLat = 27.0
    const minLng = -90.0
    const maxLng = -86.0

    // Calculate percentage within bounds
    const latPercent = (lat - minLat) / (maxLat - minLat)
    const lngPercent = (lng - minLng) / (maxLng - minLng)

    // Invert lat percentage (north is up)
    const yPercent = 1 - latPercent

    return {
      x: `${lngPercent * 100}%`,
      y: `${yPercent * 100}%`,
    }
  }

  return (
    <div className={`relative bg-slate-800 ${fullscreen ? "h-[600px]" : "h-[300px]"}`} ref={mapRef}>
      {/* Map background */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=800')] bg-cover bg-center opacity-20">
        {/* Map placeholder */}
      </div>

      {/* Map controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 bg-background ${showNormalVessels ? "border-primary" : ""}`}
                onClick={() => setShowNormalVessels(!showNormalVessels)}
              >
                <Ship className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Normal Vessels</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 bg-background ${showAnomalies ? "border-primary" : ""}`}
                onClick={() => setShowAnomalies(!showAnomalies)}
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Anomalies</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 bg-background ${showCables ? "border-primary" : ""}`}
                onClick={() => setShowCables(!showCables)}
              >
                <Cable className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Cables</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Map legend */}
      <div className="absolute bottom-2 left-2 z-10 bg-background/90 p-2 rounded-md text-xs">
        <div className="font-medium mb-1">Legend</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span>Missing AIS</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-amber-500" />
            <span>Route Deviation</span>
          </div>
          <div className="flex items-center gap-1">
            <Anchor className="h-3 w-3 text-blue-500" />
            <span>Suspicious Anchoring</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-purple-500" />
            <span>Speed Anomaly</span>
          </div>
          <div className="flex items-center gap-1">
            <Ship className="h-3 w-3 text-muted-foreground" />
            <span>Normal Vessel</span>
          </div>
          <div className="flex items-center gap-1">
            <Cable className="h-3 w-3 text-primary" />
            <span>Undersea Cable</span>
          </div>
        </div>
      </div>

      {/* Cable paths */}
      {showCables &&
        simulationState.infrastructure.cables.map((cable) => (
          <div key={`cable-${cable.id}`} className="absolute inset-0 pointer-events-none">
            {cable.path.map((point, index) => {
              if (index === 0) return null
              const prevPoint = cable.path[index - 1]

              // Get pixel coordinates
              const start = getPixelCoordinates(prevPoint.lat, prevPoint.lng)
              const end = getPixelCoordinates(point.lat, point.lng)

              // Calculate line length and angle
              const dx = Number.parseFloat(end.x) - Number.parseFloat(start.x)
              const dy = Number.parseFloat(end.y) - Number.parseFloat(start.y)
              const length = Math.sqrt(dx * dx + dy * dy)
              const angle = Math.atan2(dy, dx) * (180 / Math.PI)

              return (
                <div
                  key={`cable-line-${cable.id}-${index}`}
                  className="absolute bg-primary/70"
                  style={{
                    height: "2px",
                    width: `${length}%`,
                    left: start.x,
                    top: start.y,
                    transformOrigin: "0 0",
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              )
            })}
          </div>
        ))}

      {/* Infrastructure markers */}
      {showCables &&
        simulationState.infrastructure.platforms.map((platform) => {
          const { x, y } = getPixelCoordinates(platform.position.lat, platform.position.lng)

          return (
            <div
              key={`platform-${platform.id}`}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
              onClick={() => setSelectedInfrastructure(platform.id === selectedInfrastructure ? null : platform.id)}
            >
              <div className="flex flex-col items-center">
                <Waves className="h-5 w-5 text-primary" />
                {selectedInfrastructure === platform.id && (
                  <div className="absolute top-6 bg-background border rounded-md p-2 shadow-md z-20 w-48">
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-xs text-muted-foreground mb-1">Type: {platform.type}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedInfrastructure(null)
                      }}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

      {/* Cable markers */}
      {showCables &&
        simulationState.infrastructure.cables.map((cable) => {
          // Use the middle point of the cable for the marker
          const middleIndex = Math.floor(cable.path.length / 2)
          const middlePoint = cable.path[middleIndex]
          const { x, y } = getPixelCoordinates(middlePoint.lat, middlePoint.lng)

          return (
            <div
              key={`cable-marker-${cable.id}`}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
              onClick={() => setSelectedInfrastructure(cable.id === selectedInfrastructure ? null : cable.id)}
            >
              <div className="flex flex-col items-center">
                <Cable className="h-5 w-5 text-primary" />
                {selectedInfrastructure === cable.id && (
                  <div className="absolute top-6 bg-background border rounded-md p-2 shadow-md z-20 w-48">
                    <div className="font-medium">{cable.name}</div>
                    <div className="text-xs text-muted-foreground mb-1">Type: Undersea Cable</div>
                    <div className="text-xs text-muted-foreground mb-1">Status: {cable.status}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedInfrastructure(null)
                      }}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

      {/* Vessel markers */}
      <div className="absolute inset-0">
        {simulationState.vessels
          .filter((vessel) => {
            // Filter based on toggles
            if (!showNormalVessels && !detectedAnomalies.some((a) => a.vesselId === vessel.id)) return false
            if (!showAnomalies && detectedAnomalies.some((a) => a.vesselId === vessel.id)) return false
            return true
          })
          .map((vessel) => {
            const { x, y } = getPixelCoordinates(vessel.position.lat, vessel.position.lng)

            // Check if vessel has anomalies
            const hasAnomalies = detectedAnomalies.some((a) => a.vesselId === vessel.id)

            return (
              <div
                key={vessel.id}
                className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
                  isRunning ? "animate-pulse" : ""
                }`}
                style={{
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) rotate(${vessel.heading}deg)`,
                }}
                onClick={() => selectVessel(vessel.id === selectedVesselId ? null : vessel.id)}
              >
                <div className="flex flex-col items-center">
                  {getIconForVesselBehavior(vessel)}
                  {hasAnomalies && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                  {selectedVesselId === vessel.id && (
                    <div
                      className="absolute top-6 bg-background border rounded-md p-2 shadow-md z-20 w-48"
                      style={{ transform: `rotate(-${vessel.heading}deg)` }}
                    >
                      <div className="font-medium">{vessel.name}</div>
                      <div className="text-xs text-muted-foreground mb-1">IMO: {vessel.imo}</div>
                      {getBadgeForVesselBehavior(vessel)}
                      <div className="mt-2 text-xs">
                        <div>Speed: {vessel.speed.toFixed(1)} knots</div>
                        <div>Heading: {Math.round(vessel.heading)}°</div>
                        <div>Flag: {vessel.flag}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          selectVessel(null)
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>

      {/* Vessel trails */}
      {simulationState.vessels.map((vessel) => {
        if (vessel.positionHistory.length < 2) return null

        return (
          <div key={`trail-${vessel.id}`} className="absolute inset-0 pointer-events-none">
            {vessel.positionHistory.slice(-10).map((position, index, array) => {
              if (index === 0) return null
              const prevPosition = array[index - 1]

              // Get pixel coordinates
              const start = getPixelCoordinates(prevPosition.lat, prevPosition.lng)
              const end = getPixelCoordinates(position.lat, position.lng)

              // Calculate line length and angle
              const dx = Number.parseFloat(end.x) - Number.parseFloat(start.x)
              const dy = Number.parseFloat(end.y) - Number.parseFloat(start.y)
              const length = Math.sqrt(dx * dx + dy * dy)
              const angle = Math.atan2(dy, dx) * (180 / Math.PI)

              // Determine opacity based on age (older = more transparent)
              const opacity = 0.1 + (index / array.length) * 0.5

              // Determine color based on vessel behavior
              let color
              if (detectedAnomalies.some((a) => a.vesselId === vessel.id)) {
                const anomaly = detectedAnomalies.find((a) => a.vesselId === vessel.id)
                switch (anomaly?.type) {
                  case "AIS_LOSS":
                    color = "rgba(239, 68, 68, "
                    break // red
                  case "ROUTE_DEVIATION":
                    color = "rgba(245, 158, 11, "
                    break // amber
                  case "SUSPICIOUS_ANCHORING":
                    color = "rgba(59, 130, 246, "
                    break // blue
                  case "SPEED_ANOMALY":
                    color = "rgba(168, 85, 247, "
                    break // purple
                  default:
                    color = "rgba(156, 163, 175, " // gray
                }
              } else {
                color = "rgba(156, 163, 175, " // gray
              }

              return (
                <div
                  key={`trail-line-${vessel.id}-${index}`}
                  style={{
                    position: "absolute",
                    height: "1px",
                    width: `${length}%`,
                    left: start.x,
                    top: start.y,
                    transformOrigin: "0 0",
                    transform: `rotate(${angle}deg)`,
                    backgroundColor: `${color}${opacity})`,
                  }}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

