"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, AlertTriangle, Anchor, Ship, Navigation, Cable, Waves, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for vessels
const initialVessels = [
  {
    id: 1,
    name: "Horizon Star",
    type: "missing-ais",
    position: { lat: 25.774, lng: -80.19 },
    details: { imo: "9876543", lastSeen: "6 hours ago", flag: "Panama" },
    isRogue: true,
    movement: { direction: "SE", speed: 0.5 },
  },
  {
    id: 2,
    name: "Blue Ocean",
    type: "route-deviation",
    position: { lat: 25.774, lng: -80.3 },
    details: { imo: "8765432", deviation: "12 nm", flag: "Liberia" },
    isRogue: true,
    movement: { direction: "NE", speed: 1.2 },
  },
  {
    id: 3,
    name: "Northern Light",
    type: "unusual-anchoring",
    position: { lat: 25.85, lng: -80.25 },
    details: { imo: "7654321", anchoredFor: "8 hours", flag: "Marshall Islands" },
    isRogue: true,
    movement: { direction: "S", speed: 0.1 },
  },
  {
    id: 4,
    name: "Pacific Trader",
    type: "normal",
    position: { lat: 25.9, lng: -80.15 },
    details: { imo: "6543210", status: "On route", flag: "Singapore" },
    isRogue: false,
    movement: { direction: "W", speed: 2.0 },
  },
  {
    id: 5,
    name: "Atlantic Voyager",
    type: "normal",
    position: { lat: 25.8, lng: -80.1 },
    details: { imo: "5432109", status: "On route", flag: "Greece" },
    isRogue: false,
    movement: { direction: "N", speed: 1.8 },
  },
  {
    id: 6,
    name: "Eastern Star",
    type: "missing-ais",
    position: { lat: 25.7, lng: -80.2 },
    details: { imo: "4321098", lastSeen: "3 hours ago", flag: "Malta" },
    isRogue: false,
    movement: { direction: "SW", speed: 1.0 },
  },
  {
    id: 7,
    name: "Coastal Runner",
    type: "normal",
    position: { lat: 25.65, lng: -80.12 },
    details: { imo: "3210987", status: "On route", flag: "Panama" },
    isRogue: false,
    movement: { direction: "NW", speed: 1.5 },
  },
  {
    id: 8,
    name: "Ocean Explorer",
    type: "normal",
    position: { lat: 25.95, lng: -80.22 },
    details: { imo: "2109876", status: "On route", flag: "Bahamas" },
    isRogue: false,
    movement: { direction: "E", speed: 1.7 },
  },
]

// Infrastructure locations
const infrastructure = [
  {
    id: 1,
    name: "Undersea Cable Alpha",
    position: { lat: 25.85, lng: -80.25 },
    type: "cable",
    path: [
      { lat: 25.8, lng: -80.3 },
      { lat: 25.85, lng: -80.25 },
      { lat: 25.9, lng: -80.2 },
    ],
  },
  {
    id: 2,
    name: "Undersea Cable Beta",
    position: { lat: 25.75, lng: -80.18 },
    type: "cable",
    path: [
      { lat: 25.7, lng: -80.25 },
      { lat: 25.75, lng: -80.18 },
      { lat: 25.8, lng: -80.1 },
    ],
  },
  {
    id: 3,
    name: "Offshore Platform Delta",
    position: { lat: 25.88, lng: -80.12 },
    type: "platform",
  },
]

// Simulated cable damage events
const cableDamageEvents = [
  {
    id: 1,
    infrastructureId: 1,
    position: { lat: 25.85, lng: -80.25 },
    timestamp: new Date().toISOString(),
    severity: "critical",
    status: "active",
    description: "Significant signal loss detected on Undersea Cable Alpha",
  },
]

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function AnomalyMap({
  fullscreen = false,
  simulationActive = false,
  simulationSpeed = 1,
}: {
  fullscreen?: boolean
  simulationActive?: boolean
  simulationSpeed?: number
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedVessel, setSelectedVessel] = useState<number | null>(null)
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<number | null>(null)
  const [selectedDamage, setSelectedDamage] = useState<number | null>(null)
  const [vessels, setVessels] = useState(initialVessels)
  const [showCables, setShowCables] = useState(true)
  const [showNormalVessels, setShowNormalVessels] = useState(true)
  const [showAnomalies, setShowAnomalies] = useState(true)

  // Simulate vessel movement
  useEffect(() => {
    if (!simulationActive) return

    const interval = setInterval(() => {
      setVessels((prevVessels) => {
        return prevVessels.map((vessel) => {
          // Skip if vessel is anchored
          if (vessel.type === "unusual-anchoring") return vessel

          // Calculate new position based on direction and speed
          let newLat = vessel.position.lat
          let newLng = vessel.position.lng

          switch (vessel.movement.direction) {
            case "N":
              newLat += 0.001 * vessel.movement.speed * simulationSpeed
              break
            case "NE":
              newLat += 0.0007 * vessel.movement.speed * simulationSpeed
              newLng += 0.0007 * vessel.movement.speed * simulationSpeed
              break
            case "E":
              newLng += 0.001 * vessel.movement.speed * simulationSpeed
              break
            case "SE":
              newLat -= 0.0007 * vessel.movement.speed * simulationSpeed
              newLng += 0.0007 * vessel.movement.speed * simulationSpeed
              break
            case "S":
              newLat -= 0.001 * vessel.movement.speed * simulationSpeed
              break
            case "SW":
              newLat -= 0.0007 * vessel.movement.speed * simulationSpeed
              newLng -= 0.0007 * vessel.movement.speed * simulationSpeed
              break
            case "W":
              newLng -= 0.001 * vessel.movement.speed * simulationSpeed
              break
            case "NW":
              newLat += 0.0007 * vessel.movement.speed * simulationSpeed
              newLng -= 0.0007 * vessel.movement.speed * simulationSpeed
              break
          }

          // Keep vessels within map bounds
          newLat = Math.max(25.65, Math.min(25.95, newLat))
          newLng = Math.max(-80.35, Math.min(-80.1, newLng))

          return {
            ...vessel,
            position: { lat: newLat, lng: newLng },
          }
        })
      })
    }, 1000 / simulationSpeed)

    return () => clearInterval(interval)
  }, [simulationActive, simulationSpeed])

  const getIconForVesselType = (type: string) => {
    switch (type) {
      case "missing-ais":
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      case "route-deviation":
        return <Navigation className="h-5 w-5 text-amber-500" />
      case "unusual-anchoring":
        return <Anchor className="h-5 w-5 text-blue-500" />
      default:
        return <Ship className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getBadgeForVesselType = (type: string) => {
    switch (type) {
      case "missing-ais":
        return <Badge variant="destructive">Missing AIS</Badge>
      case "route-deviation":
        return (
          <Badge variant="default" className="bg-amber-500">
            Route Deviation
          </Badge>
        )
      case "unusual-anchoring":
        return (
          <Badge variant="default" className="bg-blue-500">
            Unusual Anchoring
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
      case "platform":
        return <Waves className="h-5 w-5 text-primary" />
      default:
        return <MapPin className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className={`relative bg-slate-800 ${fullscreen ? "h-[600px]" : "h-[300px]"}`} ref={mapRef}>
      {/* This would be replaced with an actual map in a real application */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=800')] bg-cover bg-center opacity-20">
        {/* Map placeholder */}
      </div>

      {/* Map controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-background">
                <MapPin className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Center Map</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
            <span>Unusual Anchoring</span>
          </div>
          <div className="flex items-center gap-1">
            <Ship className="h-3 w-3 text-muted-foreground" />
            <span>Normal Vessel</span>
          </div>
          <div className="flex items-center gap-1">
            <Cable className="h-3 w-3 text-primary" />
            <span>Undersea Cable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span>Cable Damage</span>
          </div>
        </div>
      </div>

      {/* Cable paths - in a real app these would be drawn on the map */}
      {showCables &&
        infrastructure
          .filter((item) => item.type === "cable")
          .map((cable) => (
            <div key={`cable-${cable.id}`} className="absolute inset-0 pointer-events-none">
              {cable.path &&
                cable.path.map((point, index) => {
                  if (index === 0) return null
                  const prevPoint = cable.path[index - 1]

                  // Calculate line position
                  const x1 = ((prevPoint.lng + 80.35) / 0.35) * 100
                  const y1 = ((25.95 - prevPoint.lat) / 0.3) * 100
                  const x2 = ((point.lng + 80.35) / 0.35) * 100
                  const y2 = ((25.95 - point.lat) / 0.3) * 100

                  return (
                    <div
                      key={`cable-line-${cable.id}-${index}`}
                      className="absolute bg-primary/70"
                      style={{
                        height: "2px",
                        width: `${Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))}%`,
                        left: `${x1}%`,
                        top: `${y1}%`,
                        transformOrigin: "0 0",
                        transform: `rotate(${Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)}deg)`,
                      }}
                    />
                  )
                })}
            </div>
          ))}

      {/* Cable damage markers */}
      {showCables &&
        cableDamageEvents.map((damage) => (
          <div
            key={`damage-${damage.id}`}
            className="absolute cursor-pointer animate-pulse"
            style={{
              left: `${((damage.position.lng + 80.35) / 0.35) * 100}%`,
              top: `${((25.95 - damage.position.lat) / 0.3) * 100}%`,
            }}
            onClick={() => setSelectedDamage(damage.id)}
          >
            <div className="h-4 w-4 bg-red-500 rounded-full opacity-70"></div>
          </div>
        ))}

      {/* Infrastructure markers */}
      {showCables &&
        infrastructure.map((item) => (
          <div
            key={`infra-${item.id}`}
            className="absolute cursor-pointer"
            style={{
              left: `${((item.position.lng + 80.35) / 0.35) * 100}%`,
              top: `${((25.95 - item.position.lat) / 0.3) * 100}%`,
            }}
            onClick={() => setSelectedInfrastructure(item.id)}
          >
            <div className="flex flex-col items-center">
              {getIconForInfrastructureType(item.type)}
              {selectedInfrastructure === item.id && (
                <div className="absolute top-6 bg-background border rounded-md p-2 shadow-md z-20 w-48">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground mb-1">Type: {item.type}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedInfrastructure(null)
                    }}
                  >
                    View Details
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

      {/* Vessel markers - in a real app these would be placed on the map */}
      <div className="absolute inset-0">
        {vessels
          .filter((vessel) => {
            if (!showNormalVessels && vessel.type === "normal") return false
            if (!showAnomalies && vessel.type !== "normal") return false
            return true
          })
          .map((vessel) => (
            <div
              key={vessel.id}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110"
              style={{
                left: `${((vessel.position.lng + 80.35) / 0.35) * 100}%`,
                top: `${((25.95 - vessel.position.lat) / 0.3) * 100}%`,
              }}
              onClick={() => setSelectedVessel(vessel.id)}
            >
              <div className="flex flex-col items-center">
                {getIconForVesselType(vessel.type)}
                {vessel.isRogue && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
                {selectedVessel === vessel.id && (
                  <div className="absolute top-6 bg-background border rounded-md p-2 shadow-md z-20 w-48">
                    <div className="font-medium">{vessel.name}</div>
                    <div className="text-xs text-muted-foreground mb-1">IMO: {vessel.details.imo}</div>
                    {getBadgeForVesselType(vessel.type)}
                    <div className="mt-2 text-xs">
                      {vessel.type === "missing-ais" && <div>Last seen: {vessel.details.lastSeen}</div>}
                      {vessel.type === "route-deviation" && <div>Deviation: {vessel.details.deviation}</div>}
                      {vessel.type === "unusual-anchoring" && <div>Anchored for: {vessel.details.anchoredFor}</div>}
                      <div>Flag: {vessel.details.flag}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        // In a real implementation, this would open the vessel detail modal
                        document
                          .querySelector(`[data-row-id="${vessel.details.imo}"]`)
                          ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                        setSelectedVessel(null)
                      }}
                    >
                      View Full Details
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Cable damage detail dialog */}
      {selectedDamage && (
        <Dialog open={!!selectedDamage} onOpenChange={(open) => !open && setSelectedDamage(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Cable Damage Alert
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Damage Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Cable:</div>
                    <div>
                      {
                        infrastructure.find(
                          (i) => i.id === cableDamageEvents.find((d) => d.id === selectedDamage)?.infrastructureId,
                        )?.name
                      }
                    </div>
                    <div className="font-medium">Detected:</div>
                    <div>{formatDate(cableDamageEvents.find((d) => d.id === selectedDamage)?.timestamp || "")}</div>
                    <div className="font-medium">Status:</div>
                    <div>
                      <Badge variant="destructive">Active</Badge>
                    </div>
                    <div className="font-medium">Location:</div>
                    <div>
                      {cableDamageEvents.find((d) => d.id === selectedDamage)?.position.lat.toFixed(3)},{" "}
                      {cableDamageEvents.find((d) => d.id === selectedDamage)?.position.lng.toFixed(3)}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="font-medium text-sm mb-1">Description:</div>
                    <p className="text-sm text-muted-foreground">
                      {cableDamageEvents.find((d) => d.id === selectedDamage)?.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Nearby Vessels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {vessels
                      .filter((v) => {
                        const damage = cableDamageEvents.find((d) => d.id === selectedDamage)
                        if (!damage) return false

                        // Calculate distance (simplified)
                        const dx = v.position.lng - damage.position.lng
                        const dy = v.position.lat - damage.position.lat
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        return distance < 0.1 // Arbitrary threshold
                      })
                      .map((vessel) => (
                        <div key={vessel.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div>
                            <div className="font-medium">{vessel.name}</div>
                            <div className="text-xs text-muted-foreground">IMO: {vessel.details.imo}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getBadgeForVesselType(vessel.type)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                document
                                  .querySelector(`[data-row-id="${vessel.details.imo}"]`)
                                  ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                                setSelectedDamage(null)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                    {vessels.filter((v) => {
                      const damage = cableDamageEvents.find((d) => d.id === selectedDamage)
                      if (!damage) return false

                      const dx = v.position.lng - damage.position.lng
                      const dy = v.position.lat - damage.position.lat
                      const distance = Math.sqrt(dx * dx + dy * dy)

                      return distance < 0.1
                    }).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No vessels currently in proximity to damage location.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

