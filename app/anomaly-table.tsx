"use client"

import { useState } from "react"
import { AlertTriangle, Anchor, Navigation, Ship, ExternalLink } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for anomalies
const anomalies = [
  {
    id: 1,
    vessel: "Horizon Star",
    imo: "9876543",
    type: "missing-ais",
    severity: "high",
    location: "25.774, -80.19",
    timestamp: "2025-03-29T10:15:00Z",
    details: "Offline for 6 hours near protected infrastructure",
  },
  {
    id: 2,
    vessel: "Blue Ocean",
    imo: "8765432",
    type: "route-deviation",
    severity: "medium",
    location: "25.774, -80.30",
    timestamp: "2025-03-29T11:30:00Z",
    details: "Deviated 12 nautical miles from expected route",
  },
  {
    id: 3,
    vessel: "Northern Light",
    imo: "7654321",
    type: "unusual-anchoring",
    severity: "medium",
    location: "25.85, -80.25",
    timestamp: "2025-03-29T09:45:00Z",
    details: "Anchored near undersea communication cable for 8 hours",
  },
  {
    id: 4,
    vessel: "Eastern Star",
    imo: "4321098",
    type: "missing-ais",
    severity: "low",
    location: "25.70, -80.20",
    timestamp: "2025-03-29T12:10:00Z",
    details: "AIS signal lost for 3 hours in high traffic area",
  },
  {
    id: 5,
    vessel: "Southern Cross",
    imo: "3210987",
    type: "route-deviation",
    severity: "low",
    location: "25.65, -80.15",
    timestamp: "2025-03-29T08:20:00Z",
    details: "Minor deviation of 5 nautical miles from expected route",
  },
]

// Extended vessel data
const vesselDetails: Record<string, any> = {
  "9876543": {
    name: "Horizon Star",
    flag: "Panama",
    type: "Cargo Vessel",
    length: "183m",
    beam: "32m",
    yearBuilt: 2015,
    owner: "Global Shipping Ltd.",
    cargo: "Container cargo - electronics and machinery",
    crew: 22,
    aisHistory: [
      { status: "Active", timestamp: "2025-03-29T04:15:00Z" },
      { status: "Active", timestamp: "2025-03-29T03:15:00Z" },
      { status: "Active", timestamp: "2025-03-29T02:15:00Z" },
      { status: "Inactive", timestamp: "2025-03-29T01:15:00Z", duration: "6 hours" },
    ],
    routeHistory: [{ from: "Shanghai, China", to: "Miami, USA", departure: "2025-03-15", eta: "2025-04-02" }],
    deviations: [{ timestamp: "2025-03-29T01:15:00Z", location: "25.774, -80.19", distance: "0 nm" }],
    anchoringEvents: [],
    proximityEvents: [
      { timestamp: "2025-03-29T01:15:00Z", infrastructure: "Undersea Cable Alpha", distance: "0.3 nm" },
    ],
    riskAssessment: "High - Vessel lost AIS signal in close proximity to critical undersea infrastructure",
    notes: "Vessel has been observed in proximity to undersea cables on three previous voyages in the past 6 months.",
  },
  "8765432": {
    name: "Blue Ocean",
    flag: "Liberia",
    type: "Bulk Carrier",
    length: "225m",
    beam: "32m",
    yearBuilt: 2018,
    owner: "Atlantic Shipping Corp.",
    cargo: "Iron ore",
    crew: 25,
    aisHistory: [
      { status: "Active", timestamp: "2025-03-29T11:30:00Z" },
      { status: "Active", timestamp: "2025-03-29T10:30:00Z" },
      { status: "Active", timestamp: "2025-03-29T09:30:00Z" },
    ],
    routeHistory: [{ from: "Santos, Brazil", to: "New Orleans, USA", departure: "2025-03-20", eta: "2025-04-05" }],
    deviations: [
      { timestamp: "2025-03-29T08:30:00Z", location: "25.774, -80.30", distance: "12 nm" },
      { timestamp: "2025-03-29T09:30:00Z", location: "25.780, -80.32", distance: "14 nm" },
      { timestamp: "2025-03-29T10:30:00Z", location: "25.785, -80.35", distance: "15 nm" },
    ],
    anchoringEvents: [],
    proximityEvents: [],
    riskAssessment: "Medium - Significant deviation from filed route plan without explanation",
    notes:
      "Vessel has changed ownership twice in the past year. Previous deviation incidents reported in Gulf of Mexico.",
  },
  "7654321": {
    name: "Northern Light",
    flag: "Marshall Islands",
    type: "Research Vessel",
    length: "95m",
    beam: "18m",
    yearBuilt: 2020,
    owner: "Oceanic Research Institute",
    cargo: "Research equipment",
    crew: 35,
    aisHistory: [
      { status: "Active", timestamp: "2025-03-29T09:45:00Z" },
      { status: "Active", timestamp: "2025-03-29T08:45:00Z" },
      { status: "Active", timestamp: "2025-03-29T07:45:00Z" },
    ],
    routeHistory: [{ from: "San Juan, Puerto Rico", to: "Key West, USA", departure: "2025-03-25", eta: "2025-03-30" }],
    deviations: [],
    anchoringEvents: [{ timestamp: "2025-03-29T01:45:00Z", location: "25.85, -80.25", duration: "8 hours" }],
    proximityEvents: [
      { timestamp: "2025-03-29T01:45:00Z", infrastructure: "Undersea Cable Alpha", distance: "0.1 nm" },
    ],
    riskAssessment: "Medium - Unusual anchoring directly above critical undersea communication cable",
    notes:
      "Vessel documentation indicates oceanographic research mission, but no research permits filed for this area.",
  },
  "4321098": {
    name: "Eastern Star",
    flag: "Malta",
    type: "Container Ship",
    length: "175m",
    beam: "28m",
    yearBuilt: 2012,
    owner: "Mediterranean Shipping Co.",
    cargo: "Mixed container cargo",
    crew: 20,
    aisHistory: [
      { status: "Inactive", timestamp: "2025-03-29T12:10:00Z", duration: "3 hours" },
      { status: "Active", timestamp: "2025-03-29T09:10:00Z" },
      { status: "Active", timestamp: "2025-03-29T08:10:00Z" },
    ],
    routeHistory: [{ from: "Barcelona, Spain", to: "Havana, Cuba", departure: "2025-03-18", eta: "2025-04-01" }],
    deviations: [],
    anchoringEvents: [],
    proximityEvents: [],
    riskAssessment: "Low - AIS signal loss in high traffic area, possibly due to technical issues",
    notes: "Vessel has no history of suspicious activity. AIS signal loss appears to be intermittent.",
  },
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function AnomalyTable({ extended = false }: { extended?: boolean }) {
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null)

  const getIconForAnomalyType = (type: string) => {
    switch (type) {
      case "missing-ais":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "route-deviation":
        return <Navigation className="h-4 w-4 text-amber-500" />
      case "unusual-anchoring":
        return <Anchor className="h-4 w-4 text-blue-500" />
      default:
        return <Ship className="h-4 w-4 text-muted-foreground" />
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
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vessel</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Severity</TableHead>
            {extended && <TableHead>Location</TableHead>}
            <TableHead>Time</TableHead>
            {extended && <TableHead>Details</TableHead>}
            {extended && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {anomalies.map((anomaly) => (
            <TableRow
              key={anomaly.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedVessel(anomaly.imo)}
              data-row-id={anomaly.imo}
            >
              <TableCell className="font-medium">
                {anomaly.vessel}
                <div className="text-xs text-muted-foreground">IMO: {anomaly.imo}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {getIconForAnomalyType(anomaly.type)}
                  <span className="text-xs capitalize">{anomaly.type.replace("-", " ")}</span>
                </div>
              </TableCell>
              <TableCell>{getBadgeForSeverity(anomaly.severity)}</TableCell>
              {extended && <TableCell className="text-xs">{anomaly.location}</TableCell>}
              <TableCell className="text-xs">{formatDate(anomaly.timestamp)}</TableCell>
              {extended && <TableCell className="text-xs max-w-[200px] truncate">{anomaly.details}</TableCell>}
              {extended && (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedVessel(anomaly.imo)
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <VesselDetailModal vesselIMO={selectedVessel} isOpen={!!selectedVessel} onClose={() => setSelectedVessel(null)} />
    </>
  )
}

function VesselDetailModal({
  vesselIMO,
  isOpen,
  onClose,
}: {
  vesselIMO: string | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!vesselIMO || !vesselDetails[vesselIMO]) return null

  const vessel = vesselDetails[vesselIMO]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Ship className="h-5 w-5" />
            {vessel.name} - Vessel Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vessel Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">IMO Number:</div>
                <div>{vesselIMO}</div>
                <div className="font-medium">Flag:</div>
                <div>{vessel.flag}</div>
                <div className="font-medium">Type:</div>
                <div>{vessel.type}</div>
                <div className="font-medium">Length/Beam:</div>
                <div>
                  {vessel.length} / {vessel.beam}
                </div>
                <div className="font-medium">Year Built:</div>
                <div>{vessel.yearBuilt}</div>
                <div className="font-medium">Owner:</div>
                <div>{vessel.owner}</div>
                <div className="font-medium">Crew:</div>
                <div>{vessel.crew} persons</div>
                <div className="font-medium">Cargo:</div>
                <div>{vessel.cargo}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Badge
                  variant={
                    vessel.riskAssessment.startsWith("High")
                      ? "destructive"
                      : vessel.riskAssessment.startsWith("Medium")
                        ? "default"
                        : "outline"
                  }
                  className={vessel.riskAssessment.startsWith("Medium") ? "bg-amber-500" : ""}
                >
                  {vessel.riskAssessment.split(" - ")[0]} Risk
                </Badge>
              </div>
              <p className="text-sm">{vessel.riskAssessment.split(" - ")[1]}</p>
              <div className="mt-4">
                <div className="font-medium text-sm mb-1">Notes:</div>
                <p className="text-sm text-muted-foreground">{vessel.notes}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="route" className="mt-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="route">Route & Deviations</TabsTrigger>
            <TabsTrigger value="ais">AIS History</TabsTrigger>
            <TabsTrigger value="anchoring">Anchoring Events</TabsTrigger>
            <TabsTrigger value="proximity">Infrastructure Proximity</TabsTrigger>
          </TabsList>

          <TabsContent value="route" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Route Information & Deviations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="font-medium mb-2">Current Voyage</div>
                  {vessel.routeHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Origin</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Departure</TableHead>
                          <TableHead>ETA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vessel.routeHistory.map((route: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{route.from}</TableCell>
                            <TableCell>{route.to}</TableCell>
                            <TableCell>{route.departure}</TableCell>
                            <TableCell>{route.eta}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No route information available</p>
                  )}
                </div>

                <div>
                  <div className="font-medium mb-2">Route Deviations</div>
                  {vessel.deviations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Deviation Distance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vessel.deviations.map((deviation: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(deviation.timestamp)}</TableCell>
                            <TableCell>{deviation.location}</TableCell>
                            <TableCell>{deviation.distance}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No route deviations detected</p>
                  )}
                </div>

                {/* This would be a map visualization in a real application */}
                {vessel.deviations.length > 0 && (
                  <div className="mt-4 border rounded-md p-4 text-center text-muted-foreground">
                    [Route deviation map visualization would appear here]
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ais" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>AIS Signal History</CardTitle>
              </CardHeader>
              <CardContent>
                {vessel.aisHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration (if inactive)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vessel.aisHistory.map((record: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(record.timestamp)}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === "Active" ? "outline" : "destructive"}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.duration || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No AIS history available</p>
                )}

                {/* This would be a timeline visualization in a real application */}
                <div className="mt-4 border rounded-md p-4 text-center text-muted-foreground">
                  [AIS signal timeline visualization would appear here]
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anchoring" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Anchoring Events</CardTitle>
              </CardHeader>
              <CardContent>
                {vessel.anchoringEvents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vessel.anchoringEvents.map((event: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(event.timestamp)}</TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell>{event.duration}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No unusual anchoring events detected</p>
                )}

                {/* This would be a map visualization in a real application */}
                {vessel.anchoringEvents.length > 0 && (
                  <div className="mt-4 border rounded-md p-4 text-center text-muted-foreground">
                    [Anchoring locations map would appear here]
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proximity" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Critical Infrastructure Proximity</CardTitle>
              </CardHeader>
              <CardContent>
                {vessel.proximityEvents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Infrastructure</TableHead>
                        <TableHead>Distance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vessel.proximityEvents.map((event: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(event.timestamp)}</TableCell>
                          <TableCell>{event.infrastructure}</TableCell>
                          <TableCell>{event.distance}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No proximity events to critical infrastructure detected
                  </p>
                )}

                {/* This would be a map visualization in a real application */}
                {vessel.proximityEvents.length > 0 && (
                  <div className="mt-4 border rounded-md p-4 text-center text-muted-foreground">
                    [Infrastructure proximity map would appear here]
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

