"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Anchor, Ship, Navigation, Cable, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type FeedEvent = {
  id: number
  type: "ais-loss" | "route-deviation" | "anchoring" | "cable-alert" | "system" | "vessel-update"
  timestamp: Date
  vessel?: string
  imo?: string
  message: string
  severity: "low" | "medium" | "high"
}

// Initial feed events
const initialEvents: FeedEvent[] = [
  {
    id: 1,
    type: "cable-alert",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    message: "Signal loss detected on Undersea Cable Alpha",
    severity: "high",
  },
  {
    id: 2,
    type: "ais-loss",
    timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    vessel: "Horizon Star",
    imo: "9876543",
    message: "AIS signal lost for vessel Horizon Star near protected infrastructure",
    severity: "high",
  },
  {
    id: 3,
    type: "route-deviation",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    vessel: "Blue Ocean",
    imo: "8765432",
    message: "Vessel Blue Ocean has deviated 12nm from expected route",
    severity: "medium",
  },
  {
    id: 4,
    type: "anchoring",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    vessel: "Northern Light",
    imo: "7654321",
    message: "Unusual anchoring detected for vessel Northern Light near undersea cable",
    severity: "medium",
  },
  {
    id: 5,
    type: "system",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    message: "System scan completed. 1,248 vessels currently tracked in monitoring zone.",
    severity: "low",
  },
]

// Possible simulation events to add randomly
const possibleEvents: Omit<FeedEvent, "id" | "timestamp">[] = [
  {
    type: "ais-loss",
    vessel: "Eastern Star",
    imo: "4321098",
    message: "AIS signal lost for vessel Eastern Star in high traffic area",
    severity: "low",
  },
  {
    type: "vessel-update",
    vessel: "Horizon Star",
    imo: "9876543",
    message: "Vessel Horizon Star has changed course toward undersea cable Alpha",
    severity: "high",
  },
  {
    type: "route-deviation",
    vessel: "Pacific Trader",
    imo: "6543210",
    message: "Minor route deviation detected for vessel Pacific Trader",
    severity: "low",
  },
  {
    type: "system",
    message: "Satellite imagery update received. Processing new data.",
    severity: "low",
  },
  {
    type: "cable-alert",
    message: "Increased signal latency detected on Undersea Cable Beta",
    severity: "medium",
  },
]

export function LiveFeed({
  simulationActive = false,
  simulationSpeed = 1,
}: {
  simulationActive?: boolean
  simulationSpeed?: number
}) {
  const [events, setEvents] = useState<FeedEvent[]>(initialEvents)

  // Add random events during simulation
  useEffect(() => {
    if (!simulationActive) return

    const interval = setInterval(() => {
      // 30% chance to add a new event
      if (Math.random() < 0.3) {
        const randomEvent = possibleEvents[Math.floor(Math.random() * possibleEvents.length)]

        setEvents((prev) => [
          {
            ...randomEvent,
            id: prev.length > 0 ? Math.max(...prev.map((e) => e.id)) + 1 : 1,
            timestamp: new Date(),
          },
          ...prev,
        ])
      }
    }, 5000 / simulationSpeed)

    return () => clearInterval(interval)
  }, [simulationActive, simulationSpeed])

  const getIconForEventType = (type: string) => {
    switch (type) {
      case "ais-loss":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "route-deviation":
        return <Navigation className="h-4 w-4 text-amber-500" />
      case "anchoring":
        return <Anchor className="h-4 w-4 text-blue-500" />
      case "cable-alert":
        return <Cable className="h-4 w-4 text-destructive" />
      case "vessel-update":
        return <Ship className="h-4 w-4 text-primary" />
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getBadgeForSeverity = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return (
          <Badge variant="default" className="bg-amber-500">
            Medium
          </Badge>
        )
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const formatTimeDiff = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)

    if (diffSec < 60) {
      return `${diffSec}s ago`
    } else if (diffSec < 3600) {
      return `${Math.floor(diffSec / 60)}m ago`
    } else {
      return `${Math.floor(diffSec / 3600)}h ago`
    }
  }

  return (
    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
      {events.map((event) => (
        <div
          key={event.id}
          className={`flex items-start gap-2 p-2 rounded-md border ${
            event.severity === "high"
              ? "bg-destructive/10 border-destructive/20"
              : event.severity === "medium"
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-muted/30 border-muted"
          } ${event.vessel ? "cursor-pointer hover:bg-muted/50" : ""}`}
          onClick={() => {
            if (event.imo) {
              document
                .querySelector(`[data-row-id="${event.imo}"]`)
                ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
            }
          }}
        >
          <div className="mt-1">{getIconForEventType(event.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-sm truncate">
                {event.type === "cable-alert"
                  ? "Cable Alert"
                  : event.type === "ais-loss"
                    ? "AIS Signal Loss"
                    : event.type === "route-deviation"
                      ? "Route Deviation"
                      : event.type === "anchoring"
                        ? "Unusual Anchoring"
                        : event.type === "vessel-update"
                          ? "Vessel Update"
                          : "System"}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {getBadgeForSeverity(event.severity)}
                <span className="text-xs text-muted-foreground whitespace-nowrap" title={formatTime(event.timestamp)}>
                  {formatTimeDiff(event.timestamp)}
                </span>
              </div>
            </div>
            <p className="text-sm mt-1">{event.message}</p>
            {event.vessel && (
              <div className="text-xs text-muted-foreground mt-1">
                Vessel: {event.vessel} (IMO: {event.imo})
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

