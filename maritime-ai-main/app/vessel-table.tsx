"use client"

import { useState } from "react"
import { AlertTriangle, Anchor, Navigation, Ship, BarChart3, Eye } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSimulation } from "./simulation-provider"

export function VesselTable() {
  const { simulationState, detectedAnomalies, selectVessel } = useSimulation()
  const [sortColumn, setSortColumn] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Sort vessels
  const sortedVessels = [...simulationState.vessels].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortColumn) {
      case "name":
        aValue = a.name
        bValue = b.name
        break
      case "imo":
        aValue = a.imo
        bValue = b.imo
        break
      case "type":
        aValue = a.type
        bValue = b.type
        break
      case "flag":
        aValue = a.flag
        bValue = b.flag
        break
      case "speed":
        aValue = a.speed
        bValue = b.speed
        break
      case "status":
        // Sort by anomaly severity
        const aAnomalies = detectedAnomalies.filter((anomaly) => anomaly.vesselId === a.id)
        const bAnomalies = detectedAnomalies.filter((anomaly) => anomaly.vesselId === b.id)

        aValue =
          aAnomalies.length > 0
            ? aAnomalies[0].severity === "HIGH"
              ? 3
              : aAnomalies[0].severity === "MEDIUM"
                ? 2
                : 1
            : 0
        bValue =
          bAnomalies.length > 0
            ? bAnomalies[0].severity === "HIGH"
              ? 3
              : bAnomalies[0].severity === "MEDIUM"
                ? 2
                : 1
            : 0
        break
      default:
        aValue = a.name
        bValue = b.name
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1
    }
    return 0
  })

  const getIconForVesselBehavior = (vessel: any) => {
    // If vessel has an active anomaly, show that first
    const vesselAnomalies = detectedAnomalies.filter((a) => a.vesselId === vessel.id)
    if (vesselAnomalies.length > 0) {
      const latestAnomaly = vesselAnomalies[vesselAnomalies.length - 1]

      switch (latestAnomaly.type) {
        case "AIS_LOSS":
          return <AlertTriangle className="h-4 w-4 text-destructive" />
        case "ROUTE_DEVIATION":
          return <Navigation className="h-4 w-4 text-amber-500" />
        case "SUSPICIOUS_ANCHORING":
          return <Anchor className="h-4 w-4 text-blue-500" />
        case "SPEED_ANOMALY":
          return <BarChart3 className="h-4 w-4 text-purple-500" />
      }
    }

    // Otherwise show based on behavior
    switch (vessel.behavior) {
      case "AIS_LOSS":
        return vessel.aisStatus === "INACTIVE" ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <Ship className="h-4 w-4 text-muted-foreground" />
        )
      case "ROUTE_DEVIATION":
        return <Navigation className="h-4 w-4 text-amber-500" />
      case "SUSPICIOUS_ANCHORING":
        return vessel.timeNearCable > 5 ? (
          <Anchor className="h-4 w-4 text-blue-500" />
        ) : (
          <Ship className="h-4 w-4 text-muted-foreground" />
        )
      case "SPEED_ANOMALY":
        return <BarChart3 className="h-4 w-4 text-purple-500" />
      default:
        return <Ship className="h-4 w-4 text-muted-foreground" />
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
              Vessel {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("imo")}>
              IMO {sortColumn === "imo" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
              Type {sortColumn === "type" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("flag")}>
              Flag {sortColumn === "flag" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("speed")}>
              Speed {sortColumn === "speed" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
              Status {sortColumn === "status" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedVessels.map((vessel) => (
            <TableRow
              key={vessel.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => selectVessel(vessel.id)}
              data-row-id={vessel.imo}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getIconForVesselBehavior(vessel)}
                  <span>{vessel.name}</span>
                </div>
              </TableCell>
              <TableCell>{vessel.imo}</TableCell>
              <TableCell>{vessel.type}</TableCell>
              <TableCell>{vessel.flag}</TableCell>
              <TableCell>{vessel.speed.toFixed(1)} knots</TableCell>
              <TableCell>{getBadgeForVesselBehavior(vessel)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    selectVessel(vessel.id)
                  }}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View details</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

