"use client"

import { useEffect, useRef } from "react"
import { AlertTriangle, Anchor, Ship, Navigation, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSimulation } from "./simulation-provider"

export function EventFeed() {
  const { simulationState, isRunning } = useSimulation()
  const feedRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new events are added
  useEffect(() => {
    if (feedRef.current && isRunning) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [simulationState.events.length, isRunning])

  const getIconForEventType = (type: string) => {
    switch (type) {
      case "AIS_LOSS":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "ROUTE_DEVIATION":
        return <Navigation className="h-4 w-4 text-amber-500" />
      case "SUSPICIOUS_ANCHORING":
        return <Anchor className="h-4 w-4 text-blue-500" />
      case "SPEED_ANOMALY":
        return <BarChart3 className="h-4 w-4 text-purple-500" />
      default:
        return <Ship className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getBadgeForSeverity = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return <Badge variant="destructive">High</Badge>
      case "MEDIUM":
        return (
          <Badge variant="default" className="bg-amber-500">
            Medium
          </Badge>
        )
      case "LOW":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div ref={feedRef} className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
      {simulationState.events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No events detected yet</div>
      ) : (
        simulationState.events
          .slice()
          .reverse()
          .map((event) => (
            <div
              key={event.id}
              className={`flex items-start gap-2 p-2 rounded-md border ${
                event.severity === "HIGH"
                  ? "bg-destructive/10 border-destructive/20"
                  : event.severity === "MEDIUM"
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-muted/30 border-muted"
              } ${event.vesselId ? "cursor-pointer hover:bg-muted/50" : ""}`}
              onClick={() => {
                if (event.vesselId) {
                  // Find the vessel
                  const vessel = simulationState.vessels.find((v) => v.id === event.vesselId)
                  if (vessel) {
                    document
                      .querySelector(`[data-row-id="${vessel.imo}"]`)
                      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                  }
                }
              }}
            >
              <div className="mt-1">{getIconForEventType(event.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm truncate">
                    {event.type === "AIS_LOSS"
                      ? "AIS Signal Loss"
                      : event.type === "ROUTE_DEVIATION"
                        ? "Route Deviation"
                        : event.type === "SUSPICIOUS_ANCHORING"
                          ? "Suspicious Anchoring"
                          : event.type === "SPEED_ANOMALY"
                            ? "Speed Anomaly"
                            : "System"}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {getBadgeForSeverity(event.severity)}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-sm mt-1">{event.description}</p>
              </div>
            </div>
          ))
      )}
    </div>
  )
}

