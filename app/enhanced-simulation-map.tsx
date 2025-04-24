"use client"

import { useRef, useState, useEffect } from "react"
import { AlertTriangle, Anchor, Ship, Navigation, Cable, BarChart3, Radio, Search, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSimulation } from "./simulation-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Enhanced vessel type with additional anomaly tracking
type EnhancedVessel = {
  id: string
  name: string
  mmsi: string
  imo: string
  type: string
  flag: string
  position: { lat: number; lng: number }
  heading: number
  speed: number
  aisStatus: "ACTIVE" | "INACTIVE"
  behavior: string
  timeNearCable: number
  aisLossTime?: number
  loiteringTime?: number
  anchoringTime?: number
  rfEmissions?: boolean
  typeMismatch?: boolean
  trail: { lat: number; lng: number; timestamp: number }[]
  anomalyDetails?: {
    type: string
    description: string
    severity: "LOW" | "MEDIUM" | "HIGH"
    startTime: number
    duration?: number
  }[]
}

export function EnhancedSimulationMap({
  fullscreen = false,
}: {
  fullscreen?: boolean
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { simulationState, detectedAnomalies, selectVessel, selectedVesselId, isRunning, simulationTime } =
    useSimulation()

  const [selectedInfrastructure, setSelectedInfrastructure] = useState<string | null>(null)
  const [showCables, setShowCables] = useState(true)
  const [showNormalVessels, setShowNormalVessels] = useState(true)
  const [showAnomalies, setShowAnomalies] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showTrails, setShowTrails] = useState(true)
  const [activeTab, setActiveTab] = useState("map")
  const [enhancedVessels, setEnhancedVessels] = useState<EnhancedVessel[]>([])
  const [anomalyCount, setAnomalyCount] = useState({
    aisLoss: 0,
    anchoring: 0,
    loitering: 0,
    typeMismatch: 0,
    rfEmissions: 0,
  })

  // Get the selected vessel
  const selectedVessel = simulationState.vessels.find((v) => v.id === selectedVesselId)

  // Get the selected infrastructure
  const selectedCable = simulationState.infrastructure.cables.find((c) => c.id === selectedInfrastructure)
  const selectedPlatform = simulationState.infrastructure.platforms.find((p) => p.id === selectedInfrastructure)

  // Process vessels to add enhanced tracking data
  useEffect(() => {
    if (simulationState.vessels.length === 0) return

    setEnhancedVessels((prev) => {
      const newVessels = simulationState.vessels.map((vessel) => {
        // Find existing enhanced vessel data if available
        const existingVessel = prev.find((v) => v.id === vessel.id)

        // Calculate time-based anomalies
        let aisLossTime = 0
        let loiteringTime = 0
        let anchoringTime = 0
        let rfEmissions = false
        let typeMismatch = false

        // AIS Loss tracking
        if (vessel.aisStatus === "INACTIVE") {
          aisLossTime = existingVessel?.aisLossTime ? existingVessel.aisLossTime + 0.1 : 0.1
        }

        // Loitering tracking (slow movement near cables)
        if (vessel.speed < 1 && vessel.timeNearCable > 0) {
          loiteringTime = existingVessel?.loiteringTime ? existingVessel.loiteringTime + 0.1 : 0.1
        }

        // Anchoring tracking
        if (vessel.speed === 0 && vessel.timeNearCable > 0) {
          anchoringTime = existingVessel?.anchoringTime ? existingVessel.anchoringTime + 0.1 : 0.1
        }

        // Random RF emissions (10% chance if vessel is suspicious)
        if (vessel.behavior !== "NORMAL" && Math.random() < 0.1) {
          rfEmissions = true
        }

        // Type mismatch (research vessels in restricted areas)
        if (vessel.type === "RESEARCH" && vessel.timeNearCable > 0) {
          typeMismatch = true
        }

        // Build trail data
        const trail = existingVessel?.trail || []
        if (trail.length > 20) {
          trail.shift() // Remove oldest point if we have too many
        }
        trail.push({
          lat: vessel.position.lat,
          lng: vessel.position.lng,
          timestamp: simulationTime,
        })

        // Build anomaly details
        const anomalyDetails = existingVessel?.anomalyDetails || []

        // Check for new anomalies
        const vesselAnomalies = detectedAnomalies.filter((a) => a.vesselId === vessel.id)
        vesselAnomalies.forEach((anomaly) => {
          // Check if we already have this anomaly
          const existingAnomaly = anomalyDetails.find((a) => a.type === anomaly.type)
          if (!existingAnomaly) {
            anomalyDetails.push({
              type: anomaly.type,
              description: anomaly.description,
              severity: anomaly.severity,
              startTime: simulationTime,
            })
          }
        })

        return {
          ...vessel,
          aisLossTime,
          loiteringTime,
          anchoringTime,
          rfEmissions,
          typeMismatch,
          trail,
          anomalyDetails,
        }
      })

      return newVessels
    })
  }, [simulationState.vessels, detectedAnomalies, simulationTime])

  // Update anomaly counts
  useEffect(() => {
    if (enhancedVessels.length === 0) return

    const counts = {
      aisLoss: enhancedVessels.filter((v) => v.aisLossTime && v.aisLossTime > 0.5).length,
      anchoring: enhancedVessels.filter((v) => v.anchoringTime && v.anchoringTime > 0.5).length,
      loitering: enhancedVessels.filter((v) => v.loiteringTime && v.loiteringTime > 0.5).length,
      typeMismatch: enhancedVessels.filter((v) => v.typeMismatch).length,
      rfEmissions: enhancedVessels.filter((v) => v.rfEmissions).length,
    }

    setAnomalyCount(counts)
  }, [enhancedVessels])

  // Draw the map on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const container = mapRef.current
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw ocean background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#0c4a6e") // Darker blue at top
    gradient.addColorStop(1, "#0e7490") // Lighter blue at bottom
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Vertical grid lines
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Draw cables if enabled
    if (showCables && simulationState.infrastructure.cables.length > 0) {
      simulationState.infrastructure.cables.forEach((cable) => {
        if (cable.path.length < 2) return

        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
        ctx.lineWidth = 3
        ctx.beginPath()

        // Convert first point
        const firstPoint = getPixelCoordinates(cable.path[0].lat, cable.path[0].lng, canvas)
        ctx.moveTo(firstPoint.x, firstPoint.y)

        // Draw path
        for (let i = 1; i < cable.path.length; i++) {
          const point = getPixelCoordinates(cable.path[i].lat, cable.path[i].lng, canvas)
          ctx.lineTo(point.x, point.y)
        }

        ctx.stroke()

        // Draw cable label
        const midIndex = Math.floor(cable.path.length / 2)
        const midPoint = getPixelCoordinates(cable.path[midIndex].lat, cable.path[midIndex].lng, canvas)

        ctx.fillStyle = "white"
        ctx.font = "12px sans-serif"
        ctx.fillText(cable.name, midPoint.x + 10, midPoint.y - 10)
      })
    }

    // Draw platforms if enabled
    if (showCables && simulationState.infrastructure.platforms.length > 0) {
      simulationState.infrastructure.platforms.forEach((platform) => {
        const point = getPixelCoordinates(platform.position.lat, platform.position.lng, canvas)

        // Draw platform icon
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
        ctx.beginPath()
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2)
        ctx.fill()

        // Draw platform label
        ctx.fillStyle = "white"
        ctx.font = "12px sans-serif"
        ctx.fillText(platform.name, point.x + 12, point.y + 4)
      })
    }

    // Draw vessel trails if enabled
    if (showTrails && enhancedVessels.length > 0) {
      enhancedVessels.forEach((vessel) => {
        if (vessel.trail.length < 2) return

        // Skip if filtering is enabled
        if (!showNormalVessels && vessel.behavior === "NORMAL") return
        if (!showAnomalies && vessel.behavior !== "NORMAL") return

        // Determine trail color based on vessel behavior
        let trailColor = "rgba(255, 255, 255, 0.8)" // Increased opacity for better visibility

        if (vessel.aisStatus === "INACTIVE") {
          trailColor = "rgba(239, 68, 68, 0.9)" // Red for AIS loss - increased opacity
        } else if (vessel.anchoringTime && vessel.anchoringTime > 0.5) {
          trailColor = "rgba(59, 130, 246, 0.9)" // Blue for anchoring - increased opacity
        } else if (vessel.loiteringTime && vessel.loiteringTime > 0.5) {
          trailColor = "rgba(245, 158, 11, 0.9)" // Amber for loitering - increased opacity
        } else if (vessel.typeMismatch) {
          trailColor = "rgba(168, 85, 247, 0.9)" // Purple for type mismatch - increased opacity
        } else if (vessel.rfEmissions) {
          trailColor = "rgba(16, 185, 129, 0.9)" // Green for RF emissions - increased opacity
        }

        ctx.strokeStyle = trailColor
        ctx.lineWidth = 4 // Increased line width for better visibility
        ctx.beginPath()

        // Convert first point
        const firstPoint = getPixelCoordinates(vessel.trail[0].lat, vessel.trail[0].lng, canvas)
        ctx.moveTo(firstPoint.x, firstPoint.y)

        // Draw path
        for (let i = 1; i < vessel.trail.length; i++) {
          const point = getPixelCoordinates(vessel.trail[i].lat, vessel.trail[i].lng, canvas)
          ctx.lineTo(point.x, point.y)
        }

        ctx.stroke()

        // Add larger dots at each trail point for better visibility
        vessel.trail.forEach((trailPoint, index) => {
          const point = getPixelCoordinates(trailPoint.lat, trailPoint.lng, canvas)
          ctx.beginPath()
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2) // Larger dots
          ctx.fillStyle = trailColor
          ctx.fill()
        })
      })
    }

    // Draw heatmap if enabled
    if (showHeatmap && enhancedVessels.length > 0) {
      // Create a temporary canvas for the heatmap
      const heatmapCanvas = document.createElement("canvas")
      heatmapCanvas.width = canvas.width
      heatmapCanvas.height = canvas.height
      const heatCtx = heatmapCanvas.getContext("2d")

      if (heatCtx) {
        // Draw heat points for each vessel position
        enhancedVessels.forEach((vessel) => {
          // Skip if filtering is enabled
          if (!showNormalVessels && vessel.behavior === "NORMAL") return
          if (!showAnomalies && vessel.behavior !== "NORMAL") return

          // Determine intensity based on anomaly type
          let intensity = 0.3 // Default

          if (vessel.aisStatus === "INACTIVE") {
            intensity = 0.8 // High intensity for AIS loss
          } else if (vessel.anchoringTime && vessel.anchoringTime > 0.5) {
            intensity = 0.7 // High intensity for anchoring
          } else if (vessel.loiteringTime && vessel.loiteringTime > 0.5) {
            intensity = 0.6 // Medium intensity for loitering
          } else if (vessel.typeMismatch || vessel.rfEmissions) {
            intensity = 0.5 // Medium intensity for other anomalies
          }

          // Draw heat point for current position
          const point = getPixelCoordinates(vessel.position.lat, vessel.position.lng, canvas)

          const gradient = heatCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 30)

          gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`)
          gradient.addColorStop(1, "rgba(255, 0, 0, 0)")

          heatCtx.fillStyle = gradient
          heatCtx.beginPath()
          heatCtx.arc(point.x, point.y, 30, 0, Math.PI * 2)
          heatCtx.fill()

          // Add smaller heat points for trail
          vessel.trail.forEach((trailPoint, index) => {
            // Fade intensity based on age
            const trailIntensity = intensity * (index / vessel.trail.length)
            if (trailIntensity < 0.1) return // Skip very faint points

            const pixelPoint = getPixelCoordinates(trailPoint.lat, trailPoint.lng, canvas)

            const trailGradient = heatCtx.createRadialGradient(
              pixelPoint.x,
              pixelPoint.y,
              0,
              pixelPoint.x,
              pixelPoint.y,
              15,
            )

            trailGradient.addColorStop(0, `rgba(255, 0, 0, ${trailIntensity})`)
            trailGradient.addColorStop(1, "rgba(255, 0, 0, 0)")

            heatCtx.fillStyle = trailGradient
            heatCtx.beginPath()
            heatCtx.arc(pixelPoint.x, pixelPoint.y, 15, 0, Math.PI * 2)
            heatCtx.fill()
          })
        })

        // Apply heatmap to main canvas with transparency
        ctx.globalAlpha = 0.7
        ctx.drawImage(heatmapCanvas, 0, 0)
        ctx.globalAlpha = 1.0
      }
    }

    // Draw vessels
    enhancedVessels.forEach((vessel) => {
      // Skip if filtering is enabled
      if (!showNormalVessels && vessel.behavior === "NORMAL") return
      if (!showAnomalies && vessel.behavior !== "NORMAL") return

      const point = getPixelCoordinates(vessel.position.lat, vessel.position.lng, canvas)

      // Draw vessel based on its type and anomalies
      ctx.save()
      ctx.translate(point.x, point.y)
      ctx.rotate((vessel.heading * Math.PI) / 180)

      // Vessel shape
      ctx.beginPath()

      // Different shapes based on vessel type
      if (vessel.type === "CARGO" || vessel.type === "TANKER") {
        // Rectangle for cargo/tanker
        ctx.rect(-8, -4, 16, 8)
      } else if (vessel.type === "FISHING") {
        // Triangle for fishing
        ctx.moveTo(0, -8)
        ctx.lineTo(-6, 8)
        ctx.lineTo(6, 8)
        ctx.closePath()
      } else if (vessel.type === "RESEARCH") {
        // Diamond for research
        ctx.moveTo(0, -8)
        ctx.lineTo(8, 0)
        ctx.lineTo(0, 8)
        ctx.lineTo(-8, 0)
        ctx.closePath()
      } else {
        // Default oval shape
        ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2)
      }

      // Fill color based on anomaly
      if (vessel.aisStatus === "INACTIVE") {
        ctx.fillStyle = "rgba(239, 68, 68, 0.9)" // Red for AIS loss
      } else if (vessel.anchoringTime && vessel.anchoringTime > 0.5) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.9)" // Blue for anchoring
      } else if (vessel.loiteringTime && vessel.loiteringTime > 0.5) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.9)" // Amber for loitering
      } else if (vessel.typeMismatch) {
        ctx.fillStyle = "rgba(168, 85, 247, 0.9)" // Purple for type mismatch
      } else if (vessel.rfEmissions) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.9)" // Green for RF emissions
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)" // White for normal
      }

      ctx.fill()

      // Draw direction indicator
      ctx.beginPath()
      ctx.moveTo(0, -4)
      ctx.lineTo(0, -8)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"
      ctx.lineWidth = 1
      ctx.stroke()

      // Add pulsing effect for anomalies
      if (vessel.behavior !== "NORMAL" || vessel.aisStatus === "INACTIVE") {
        ctx.beginPath()
        const pulseSize = 10 + Math.sin(simulationTime * 5) * 3
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Add RF emission indicator
      if (vessel.rfEmissions) {
        ctx.beginPath()
        for (let i = 0; i < 3; i++) {
          const radius = 12 + i * 5
          ctx.arc(0, 0, radius, -Math.PI * 0.3, Math.PI * 0.3)
        }
        ctx.strokeStyle = "rgba(16, 185, 129, 0.7)"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.restore()

      // Draw vessel label if it's selected or has anomalies
      if (vessel.id === selectedVesselId || vessel.behavior !== "NORMAL" || vessel.aisStatus === "INACTIVE") {
        ctx.fillStyle = "white"
        ctx.font = "12px sans-serif"
        ctx.fillText(vessel.name, point.x + 10, point.y - 10)

        // Draw speed
        ctx.font = "10px sans-serif"
        ctx.fillText(`${vessel.speed.toFixed(1)} knots`, point.x + 10, point.y + 5)

        // Draw anomaly indicator if applicable
        if (vessel.aisStatus === "INACTIVE") {
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
          ctx.fillText(`AIS OFF: ${vessel.aisLossTime?.toFixed(1)}m`, point.x + 10, point.y + 18)
        } else if (vessel.anchoringTime && vessel.anchoringTime > 0.5) {
          ctx.fillStyle = "rgba(59, 130, 246, 0.9)"
          ctx.fillText(`ANCHORED: ${vessel.anchoringTime.toFixed(1)}m`, point.x + 10, point.y + 18)
        } else if (vessel.loiteringTime && vessel.loiteringTime > 0.5) {
          ctx.fillStyle = "rgba(245, 158, 11, 0.9)"
          ctx.fillText(`LOITERING: ${vessel.loiteringTime.toFixed(1)}m`, point.x + 10, point.y + 18)
        }
      }
    })
  }, [
    enhancedVessels,
    simulationState.infrastructure,
    showCables,
    showNormalVessels,
    showAnomalies,
    showTrails,
    showHeatmap,
    selectedVesselId,
    simulationTime,
  ])

  // Convert lat/lng to pixel coordinates
  const getPixelCoordinates = (lat: number, lng: number, canvas: HTMLCanvasElement) => {
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
      x: lngPercent * canvas.width,
      y: yPercent * canvas.height,
    }
  }

  const getIconForAnomalyType = (type: string) => {
    switch (type) {
      case "AIS_LOSS":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "ROUTE_DEVIATION":
        return <Navigation className="h-4 w-4 text-amber-500" />
      case "SUSPICIOUS_ANCHORING":
        return <Anchor className="h-4 w-4 text-blue-500" />
      case "SPEED_ANOMALY":
        return <BarChart3 className="h-4 w-4 text-purple-500" />
      case "RF_EMISSIONS":
        return <Radio className="h-4 w-4 text-green-500" />
      case "TYPE_MISMATCH":
        return <Info className="h-4 w-4 text-indigo-500" />
      default:
        return <Ship className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className={`relative bg-slate-800 ${fullscreen ? "h-[600px]" : "h-[300px]"}`} ref={mapRef}>
      {/* Canvas for map rendering */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onClick={(e) => {
          // Handle map clicks
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top

          // Find if a vessel was clicked
          const canvas = canvasRef.current
          if (!canvas) return

          // Check each vessel
          for (const vessel of enhancedVessels) {
            const point = getPixelCoordinates(vessel.position.lat, vessel.position.lng, canvas)

            // Simple distance check (10px radius)
            const dx = point.x - x
            const dy = point.y - y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 10) {
              selectVessel(vessel.id === selectedVesselId ? null : vessel.id)
              return
            }
          }

          // If no vessel was clicked, deselect
          selectVessel(null)
        }}
      />

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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 bg-background ${showTrails ? "border-primary" : ""}`}
                onClick={() => setShowTrails(!showTrails)}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Vessel Trails</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 bg-background ${showHeatmap ? "border-primary" : ""}`}
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Heatmap</p>
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
            <span>AIS Signal Loss</span>
          </div>
          <div className="flex items-center gap-1">
            <Anchor className="h-3 w-3 text-blue-500" />
            <span>Unusual Anchoring</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-amber-500" />
            <span>Unusual Anchoring</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-amber-500" />
            <span>Loitering/Slow Movement</span>
          </div>
          <div className="flex items-center gap-1">
            <Radio className="h-3 w-3 text-green-500" />
            <span>RF Emissions</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3 text-indigo-500" />
            <span>Type Mismatch</span>
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

      {/* Anomaly stats panel */}
      {fullscreen && (
        <div className="absolute top-2 left-2 z-10 bg-background/90 p-2 rounded-md text-xs w-48">
          <div className="font-medium mb-2">Anomaly Statistics</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span>AIS Loss:</span>
              </div>
              <span className="font-medium">{anomalyCount.aisLoss}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-1">
                <Anchor className="h-3 w-3 text-blue-500" />
                <span>Anchoring:</span>
              </div>
              <span className="font-medium">{anomalyCount.anchoring}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-1">
                <Navigation className="h-3 w-3 text-amber-500" />
                <span>Loitering:</span>
              </div>
              <span className="font-medium">{anomalyCount.loitering}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-1">
                <Radio className="h-3 w-3 text-green-500" />
                <span>RF Emissions:</span>
              </div>
              <span className="font-medium">{anomalyCount.rfEmissions}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3 text-indigo-500" />
                <span>Type Mismatch:</span>
              </div>
              <span className="font-medium">{anomalyCount.typeMismatch}</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected vessel details */}
      {selectedVesselId && selectedVessel && (
        <div className="absolute bottom-2 right-2 z-10 bg-background/90 p-3 rounded-md text-sm w-64">
          <div className="font-medium text-base mb-1">{selectedVessel.name}</div>
          <div className="text-xs text-muted-foreground mb-2">IMO: {selectedVessel.imo}</div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mb-2">
            <div className="text-muted-foreground">Type:</div>
            <div>{selectedVessel.type}</div>
            <div className="text-muted-foreground">Flag:</div>
            <div>{selectedVessel.flag}</div>
            <div className="text-muted-foreground">Speed:</div>
            <div>{selectedVessel.speed.toFixed(1)} knots</div>
            <div className="text-muted-foreground">Heading:</div>
            <div>{Math.round(selectedVessel.heading)}°</div>
          </div>

          {/* Anomaly details */}
          {enhancedVessels.find((v) => v.id === selectedVesselId)?.anomalyDetails?.length ? (
            <div className="mt-2">
              <div className="font-medium text-xs mb-1">Detected Anomalies:</div>
              <div className="space-y-1">
                {enhancedVessels
                  .find((v) => v.id === selectedVesselId)
                  ?.anomalyDetails?.map((anomaly, index) => (
                    <div key={index} className="flex items-start gap-1">
                      {getIconForAnomalyType(anomaly.type)}
                      <div className="text-xs">{anomaly.description}</div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No anomalies detected</div>
          )}

          <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={() => selectVessel(null)}>
            Close
          </Button>
        </div>
      )}

      {/* Tabs for full screen view */}
      {fullscreen && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList className="bg-background/90 grid grid-cols-3 w-full">
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="anomalies">Anomaly List</TabsTrigger>
              <TabsTrigger value="vessels">Vessel List</TabsTrigger>
            </TabsList>

            <TabsContent
              value="anomalies"
              className="bg-background/90 rounded-md mt-2 p-2 max-h-[200px] overflow-y-auto"
            >
              <div className="text-xs font-medium mb-2">Recent Anomalies</div>
              {detectedAnomalies.length > 0 ? (
                <div className="space-y-1">
                  {detectedAnomalies.slice(0, 10).map((anomaly, index) => {
                    const vessel = simulationState.vessels.find((v) => v.id === anomaly.vesselId)
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-1 rounded hover:bg-slate-700/30 cursor-pointer"
                        onClick={() => selectVessel(anomaly.vesselId || null)}
                      >
                        {getIconForAnomalyType(anomaly.type)}
                        <div>
                          <div className="text-xs font-medium">{vessel?.name || "Unknown Vessel"}</div>
                          <div className="text-xs text-muted-foreground">{anomaly.description}</div>
                        </div>
                        <Badge
                          variant={
                            anomaly.severity === "HIGH"
                              ? "destructive"
                              : anomaly.severity === "MEDIUM"
                                ? "default"
                                : "outline"
                          }
                          className="ml-auto text-[10px] h-5"
                        >
                          {anomaly.severity}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">No anomalies detected yet</div>
              )}
            </TabsContent>

            <TabsContent value="vessels" className="bg-background/90 rounded-md mt-2 p-2 max-h-[200px] overflow-y-auto">
              <div className="text-xs font-medium mb-2">Vessels in Region</div>
              <div className="space-y-1">
                {enhancedVessels.slice(0, 10).map((vessel) => (
                  <div
                    key={vessel.id}
                    className="flex items-center gap-2 p-1 rounded hover:bg-slate-700/30 cursor-pointer"
                    onClick={() => selectVessel(vessel.id)}
                  >
                    {vessel.aisStatus === "INACTIVE" ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : vessel.anchoringTime && vessel.anchoringTime > 0.5 ? (
                      <Anchor className="h-4 w-4 text-blue-500" />
                    ) : vessel.loiteringTime && vessel.loiteringTime > 0.5 ? (
                      <Navigation className="h-4 w-4 text-amber-500" />
                    ) : vessel.rfEmissions ? (
                      <Radio className="h-4 w-4 text-green-500" />
                    ) : vessel.typeMismatch ? (
                      <Info className="h-4 w-4 text-indigo-500" />
                    ) : (
                      <Ship className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="text-xs font-medium">{vessel.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {vessel.type} • {vessel.speed.toFixed(1)} knots
                      </div>
                    </div>
                    {(vessel.aisStatus === "INACTIVE" ||
                      (vessel.anchoringTime && vessel.anchoringTime > 0.5) ||
                      (vessel.loiteringTime && vessel.loiteringTime > 0.5) ||
                      vessel.rfEmissions ||
                      vessel.typeMismatch) && (
                      <Badge variant="destructive" className="ml-auto text-[10px] h-5">
                        Anomaly
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

