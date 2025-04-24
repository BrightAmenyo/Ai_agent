"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Anchor, Navigation, BarChart3, Ship, Cable, Brain, Filter, Eye, Shield } from "lucide-react"
import { useSimulation } from "./simulation-provider"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SimulationReport() {
  const { simulationState, detectedAnomalies } = useSimulation()
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedVessel, setSelectedVessel] = useState<any>(null)
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<any>(null)

  // Calculate statistics
  const totalVessels = simulationState.vessels.length
  const totalAnomalies = detectedAnomalies.length
  const highSeverityCount = detectedAnomalies.filter((a) => a.severity === "HIGH").length
  const mediumSeverityCount = detectedAnomalies.filter((a) => a.severity === "MEDIUM").length
  const lowSeverityCount = detectedAnomalies.filter((a) => a.severity === "LOW").length

  const aisLossCount = detectedAnomalies.filter((a) => a.type === "AIS_LOSS").length
  const routeDeviationCount = detectedAnomalies.filter((a) => a.type === "ROUTE_DEVIATION").length
  const suspiciousAnchoringCount = detectedAnomalies.filter((a) => a.type === "SUSPICIOUS_ANCHORING").length
  const speedAnomalyCount = detectedAnomalies.filter((a) => a.type === "SPEED_ANOMALY").length

  // Calculate anomaly rate
  const anomalyRate = totalVessels > 0 ? (totalAnomalies / totalVessels) * 100 : 0

  // Generate vessel risk scores
  const vesselRiskScores = simulationState.vessels
    .map((vessel) => {
      const vesselAnomalies = detectedAnomalies.filter((a) => a.vesselId === vessel.id)
      const highCount = vesselAnomalies.filter((a) => a.severity === "HIGH").length
      const mediumCount = vesselAnomalies.filter((a) => a.severity === "MEDIUM").length
      const lowCount = vesselAnomalies.filter((a) => a.severity === "LOW").length

      // Calculate risk score (weighted sum)
      const riskScore = highCount * 10 + mediumCount * 5 + lowCount * 2

      // Determine risk level
      let riskLevel = "LOW"
      if (riskScore >= 10) riskLevel = "HIGH"
      else if (riskScore >= 5) riskLevel = "MEDIUM"
      else if (riskScore > 0) riskLevel = "LOW"
      else riskLevel = "NONE"

      return {
        id: vessel.id,
        name: vessel.name,
        imo: vessel.imo,
        flag: vessel.flag,
        riskScore,
        riskLevel,
        anomalyCount: vesselAnomalies.length,
        highSeverityCount: highCount,
        mediumSeverityCount: mediumCount,
        lowSeverityCount: lowCount,
        behavior: vessel.behavior,
        position: vessel.position,
        speed: vessel.speed,
        heading: vessel.heading,
        destination: vessel.destination,
        type: vessel.type,
        anomalies: vesselAnomalies,
      }
    })
    .sort((a, b) => b.riskScore - a.riskScore)

  // Filter vessels based on risk level and search query
  const filteredVessels = vesselRiskScores.filter((vessel) => {
    // Filter by risk level
    if (riskFilter !== "all" && vessel.riskLevel !== riskFilter) {
      return false
    }

    // Filter by search query
    if (
      searchQuery &&
      !vessel.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !vessel.imo.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    return true
  })

  // Generate anomaly type distribution data for chart
  const anomalyTypeData = [
    { name: "AIS Loss", value: aisLossCount, color: "#ef4444" },
    { name: "Route Deviation", value: routeDeviationCount, color: "#f59e0b" },
    { name: "Suspicious Anchoring", value: suspiciousAnchoringCount, color: "#3b82f6" },
    { name: "Speed Anomaly", value: speedAnomalyCount, color: "#a855f7" },
  ].filter((item) => item.value > 0)

  // Generate severity distribution data for chart
  const severityData = [
    { name: "High", value: highSeverityCount, color: "#ef4444" },
    { name: "Medium", value: mediumSeverityCount, color: "#f59e0b" },
    { name: "Low", value: lowSeverityCount, color: "#6b7280" },
  ].filter((item) => item.value > 0)

  // Generate infrastructure risk data
  const infrastructureRiskData = simulationState.infrastructure.cables
    .map((cable) => {
      // Count anomalies near this cable
      const nearbyAnomalies = detectedAnomalies.filter((anomaly) => {
        const vessel = simulationState.vessels.find((v) => v.id === anomaly.vesselId)
        if (!vessel) return false

        // Check if vessel is near cable
        // This is a simplified check - in a real implementation, we would use proper distance calculation
        const isNear = cable.path.some((point) => {
          const dx = vessel.position.lat - point.lat
          const dy = vessel.position.lng - point.lng
          return Math.sqrt(dx * dx + dy * dy) < 0.05
        })

        return isNear
      })

      const highCount = nearbyAnomalies.filter((a) => a.severity === "HIGH").length
      const mediumCount = nearbyAnomalies.filter((a) => a.severity === "MEDIUM").length
      const lowCount = nearbyAnomalies.filter((a) => a.severity === "LOW").length

      // Calculate risk score
      const riskScore = highCount * 10 + mediumCount * 5 + lowCount * 2

      // Determine risk level
      let riskLevel = "LOW"
      if (riskScore >= 10) riskLevel = "HIGH"
      else if (riskScore >= 5) riskLevel = "MEDIUM"
      else if (riskScore > 0) riskLevel = "LOW"
      else riskLevel = "NONE"

      return {
        id: cable.id,
        name: cable.name,
        riskScore,
        riskLevel,
        anomalyCount: nearbyAnomalies.length,
        highSeverityCount: highCount,
        mediumSeverityCount: mediumCount,
        lowSeverityCount: lowCount,
        path: cable.path,
        nearbyAnomalies,
      }
    })
    .sort((a, b) => b.riskScore - a.riskScore)

  // Generate AI explanation for a vessel
  const generateVesselExplanation = (vessel: any) => {
    if (!vessel) return ""

    let explanation = ""

    if (vessel.riskLevel === "HIGH") {
      explanation = `This ${vessel.type.toLowerCase()} vessel exhibits multiple high-risk behaviors that require immediate attention. Neptune's Eye has detected ${vessel.highSeverityCount} high-severity anomalies associated with this vessel.

The combination of ${vessel.behavior.toLowerCase().replace("_", " ")} behavior near critical infrastructure represents a significant security threat. I recommend immediate investigation and potential interception of this vessel.

Based on historical patterns, vessels with similar behavior profiles have been associated with deliberate infrastructure targeting activities.`
    } else if (vessel.riskLevel === "MEDIUM") {
      explanation = `This ${vessel.type.toLowerCase()} vessel shows concerning behavior patterns that warrant close monitoring. Neptune's Eye has identified ${vessel.anomalyCount} anomalies, including ${vessel.mediumSeverityCount} of medium severity.

The vessel's ${vessel.behavior.toLowerCase().replace("_", " ")} activity suggests possible suspicious intent, though not yet at critical levels. I recommend enhanced surveillance and tracking of this vessel's movements, particularly if it approaches undersea infrastructure.`
    } else if (vessel.riskLevel === "LOW") {
      explanation = `This ${vessel.type.toLowerCase()} vessel shows minor anomalies in its behavior pattern. Neptune's Eye has detected ${vessel.anomalyCount} low-severity anomalies.

While not immediately concerning, these patterns deviate slightly from expected maritime behavior. The vessel should be monitored as part of routine surveillance, with special attention if it changes course toward critical infrastructure.`
    } else {
      explanation = `This ${vessel.type.toLowerCase()} vessel shows normal maritime behavior with no detected anomalies. Neptune's Eye analysis indicates standard movement patterns consistent with its declared route and cargo type.

No special monitoring is required beyond standard maritime awareness.`
    }

    return explanation
  }

  // Generate AI explanation for infrastructure
  const generateInfrastructureExplanation = (infrastructure: any) => {
    if (!infrastructure) return ""

    let explanation = ""

    if (infrastructure.riskLevel === "HIGH") {
      explanation = `This undersea cable is at high risk based on current vessel activity. Neptune's Eye has detected ${infrastructure.highSeverityCount} high-severity anomalies in close proximity to this infrastructure.

The presence of multiple vessels exhibiting suspicious behavior near this cable suggests a coordinated effort that may indicate deliberate targeting. I recommend immediate deployment of security assets to protect this critical infrastructure.

Historical analysis shows that this pattern of activity has preceded cable damage incidents in other regions.`
    } else if (infrastructure.riskLevel === "MEDIUM") {
      explanation = `This undersea cable shows elevated risk levels based on nearby vessel activity. Neptune's Eye has identified ${infrastructure.anomalyCount} anomalies in proximity to this infrastructure, including ${infrastructure.mediumSeverityCount} of medium severity.

While not yet at critical levels, the unusual concentration of vessels with anomalous behavior near this cable warrants increased monitoring. I recommend allocating additional surveillance resources to this area.`
    } else if (infrastructure.riskLevel === "LOW") {
      explanation = `This undersea cable shows minimal risk based on current vessel activity. Neptune's Eye has detected ${infrastructure.anomalyCount} low-severity anomalies in the vicinity.

Standard monitoring protocols are sufficient, though periodic checks are recommended as vessel traffic in the area evolves.`
    } else {
      explanation = `This undersea cable currently shows no risk indicators. Neptune's Eye analysis indicates normal maritime traffic patterns in the vicinity with no suspicious vessel behavior detected.

Standard monitoring protocols are sufficient for this infrastructure.`
    }

    return explanation
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-cyan-400" />
            <div>
              <CardTitle className="text-2xl text-white">Neptune's Eye Threat Assessment</CardTitle>
              <CardDescription className="text-slate-400">
                Comprehensive AI analysis of maritime security threats
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/80 border-slate-700">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-slate-300">Total Vessels</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <div className="text-2xl font-bold text-white">{totalVessels}</div>
                <p className="text-xs text-slate-400">Vessels in simulation</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 border-slate-700">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-slate-300">Detected Anomalies</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <div className="text-2xl font-bold text-cyan-400">{totalAnomalies}</div>
                <p className="text-xs text-slate-400">Total anomalies detected</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 border-slate-700">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-slate-300">Anomaly Rate</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <div className="text-2xl font-bold text-cyan-400">{anomalyRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-400">Percentage of vessels with anomalies</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 border-slate-700">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-slate-300">High Severity</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <div className="text-2xl font-bold text-red-400">{highSeverityCount}</div>
                <p className="text-xs text-slate-400">Critical security threats</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Anomaly Distribution</CardTitle>
            <CardDescription className="text-slate-400">Breakdown of detected anomalies by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={anomalyTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {anomalyTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Severity Distribution</CardTitle>
            <CardDescription className="text-slate-400">Breakdown of anomalies by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vessels" className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="vessels" className="data-[state=active]:bg-cyan-900/50">
            High Risk Vessels
          </TabsTrigger>
          <TabsTrigger value="infrastructure" className="data-[state=active]:bg-cyan-900/50">
            Infrastructure Risk
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-cyan-900/50">
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vessels" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-slate-200">Vessel Risk Assessment</CardTitle>
                  <CardDescription className="text-slate-400">
                    Vessels ranked by risk score based on detected anomalies
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Risk Level" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="HIGH">High Risk</SelectItem>
                        <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                        <SelectItem value="LOW">Low Risk</SelectItem>
                        <SelectItem value="NONE">No Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Search vessels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-[200px] bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-800/80">
                  <TableRow className="hover:bg-slate-700/50 border-slate-700">
                    <TableHead className="text-slate-300">Vessel</TableHead>
                    <TableHead className="text-slate-300">IMO</TableHead>
                    <TableHead className="text-slate-300">Flag</TableHead>
                    <TableHead className="text-slate-300">Behavior</TableHead>
                    <TableHead className="text-slate-300">Anomalies</TableHead>
                    <TableHead className="text-slate-300">Risk Score</TableHead>
                    <TableHead className="text-slate-300">Threat Level</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVessels.map((vessel) => (
                    <TableRow key={vessel.id} className="hover:bg-slate-700/50 border-slate-700">
                      <TableCell className="font-medium text-white">{vessel.name}</TableCell>
                      <TableCell className="text-slate-300">{vessel.imo}</TableCell>
                      <TableCell className="text-slate-300">{vessel.flag}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {vessel.behavior === "AIS_LOSS" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                          {vessel.behavior === "ROUTE_DEVIATION" && <Navigation className="h-4 w-4 text-amber-400" />}
                          {vessel.behavior === "SUSPICIOUS_ANCHORING" && <Anchor className="h-4 w-4 text-blue-400" />}
                          {vessel.behavior === "SPEED_ANOMALY" && <BarChart3 className="h-4 w-4 text-purple-400" />}
                          {vessel.behavior === "NORMAL" && <Ship className="h-4 w-4 text-slate-400" />}
                          <span className="capitalize text-slate-300">
                            {vessel.behavior.replace("_", " ").toLowerCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{vessel.anomalyCount}</TableCell>
                      <TableCell className="text-slate-300">{vessel.riskScore}</TableCell>
                      <TableCell>
                        {vessel.riskLevel === "HIGH" ? (
                          <Badge variant="destructive">High Risk</Badge>
                        ) : vessel.riskLevel === "MEDIUM" ? (
                          <Badge variant="default" className="bg-amber-500">
                            Medium Risk
                          </Badge>
                        ) : vessel.riskLevel === "LOW" ? (
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            Low Risk
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400">
                            No Risk
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
                          onClick={() => setSelectedVessel(vessel)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredVessels.length === 0 && (
                    <TableRow className="hover:bg-slate-700/50 border-slate-700">
                      <TableCell colSpan={8} className="text-center py-4 text-slate-400">
                        No vessels matching the current filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Infrastructure Risk Assessment</CardTitle>
              <CardDescription className="text-slate-400">
                Undersea cables ranked by risk based on nearby vessel activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-800/80">
                  <TableRow className="hover:bg-slate-700/50 border-slate-700">
                    <TableHead className="text-slate-300">Infrastructure</TableHead>
                    <TableHead className="text-slate-300">Nearby Anomalies</TableHead>
                    <TableHead className="text-slate-300">High Severity</TableHead>
                    <TableHead className="text-slate-300">Medium Severity</TableHead>
                    <TableHead className="text-slate-300">Risk Score</TableHead>
                    <TableHead className="text-slate-300">Threat Level</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {infrastructureRiskData.map((infra) => (
                    <TableRow key={infra.id} className="hover:bg-slate-700/50 border-slate-700">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-1">
                          <Cable className="h-4 w-4 text-cyan-400" />
                          {infra.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{infra.anomalyCount}</TableCell>
                      <TableCell className="text-slate-300">{infra.highSeverityCount}</TableCell>
                      <TableCell className="text-slate-300">{infra.mediumSeverityCount}</TableCell>
                      <TableCell className="text-slate-300">{infra.riskScore}</TableCell>
                      <TableCell>
                        {infra.riskLevel === "HIGH" ? (
                          <Badge variant="destructive">High Risk</Badge>
                        ) : infra.riskLevel === "MEDIUM" ? (
                          <Badge variant="default" className="bg-amber-500">
                            Medium Risk
                          </Badge>
                        ) : infra.riskLevel === "LOW" ? (
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            Low Risk
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400">
                            No Risk
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
                          onClick={() => setSelectedInfrastructure(infra)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-cyan-400" />
                <div>
                  <CardTitle className="text-slate-200">Neptune's Eye Recommendations</CardTitle>
                  <CardDescription className="text-slate-400">
                    AI-generated security recommendations based on simulation results
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {highSeverityCount > 0 ? (
                <>
                  <div className="p-4 border rounded-md bg-red-900/20 border-red-900/30">
                    <h3 className="text-lg font-medium flex items-center gap-2 text-white">
                      <Shield className="h-5 w-5 text-red-400" />
                      Critical Security Concerns
                    </h3>
                    <p className="mt-2 text-slate-300">
                      Neptune's Eye has detected {highSeverityCount} high-severity anomalies that require immediate
                      attention. These represent potential threats to undersea cable infrastructure.
                    </p>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-slate-300">
                      {aisLossCount > 0 && (
                        <li>{aisLossCount} vessels with AIS signal loss near critical infrastructure</li>
                      )}
                      {suspiciousAnchoringCount > 0 && (
                        <li>{suspiciousAnchoringCount} vessels exhibiting suspicious anchoring patterns</li>
                      )}
                      {routeDeviationCount > 0 && (
                        <li>{routeDeviationCount} vessels with significant route deviations</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 text-white">Recommended Actions</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 p-3 rounded-md bg-slate-800/50 border border-slate-700">
                        <div className="mt-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                          1
                        </div>
                        <div>
                          <strong className="text-white">Increase Surveillance:</strong>
                          <p className="text-slate-300">
                            Deploy additional monitoring assets to track high-risk vessels identified in this report.
                            Neptune's Eye recommends focusing on vessels with AIS signal loss near cable infrastructure.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 p-3 rounded-md bg-slate-800/50 border border-slate-700">
                        <div className="mt-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                          2
                        </div>
                        <div>
                          <strong className="text-white">Investigate Suspicious Vessels:</strong>
                          <p className="text-slate-300">
                            Conduct detailed investigation of vessels with multiple anomalies, particularly those with
                            AIS signal loss near cables. Neptune's Eye has identified{" "}
                            {vesselRiskScores.filter((v) => v.riskLevel === "HIGH").length} vessels requiring immediate
                            investigation.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 p-3 rounded-md bg-slate-800/50 border border-slate-700">
                        <div className="mt-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                          3
                        </div>
                        <div>
                          <strong className="text-white">Enhance Cable Protection:</strong>
                          <p className="text-slate-300">
                            Consider deploying physical protection measures for the highest-risk cable segments.
                            Neptune's Eye analysis indicates{" "}
                            {infrastructureRiskData.filter((i) => i.riskLevel === "HIGH").length} cable segments at
                            elevated risk.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 p-3 rounded-md bg-slate-800/50 border border-slate-700">
                        <div className="mt-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">
                          4
                        </div>
                        <div>
                          <strong className="text-white">Update Risk Models:</strong>
                          <p className="text-slate-300">
                            Incorporate findings from this simulation to improve future anomaly detection algorithms.
                            Neptune's Eye has identified new behavioral patterns that can enhance predictive
                            capabilities.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="p-4 border rounded-md bg-green-900/20 border-green-900/30">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-green-400">
                    <Shield className="h-5 w-5" />
                    No Critical Threats Detected
                  </h3>
                  <p className="mt-2 text-slate-300">
                    Neptune's Eye has not detected any high-severity anomalies. Continue routine monitoring and consider
                    running additional simulations with different parameters.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vessel Detail Dialog */}
      <Dialog open={!!selectedVessel} onOpenChange={(open) => !open && setSelectedVessel(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-cyan-400" />
              <div>
                <DialogTitle className="text-xl">Neptune's Eye Analysis: {selectedVessel?.name}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  AI-powered threat assessment and behavioral analysis
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedVessel && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-300">Vessel Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium text-slate-400">Vessel Name:</div>
                      <div className="text-white">{selectedVessel.name}</div>
                      <div className="font-medium text-slate-400">IMO Number:</div>
                      <div className="text-white">{selectedVessel.imo}</div>
                      <div className="font-medium text-slate-400">Flag:</div>
                      <div className="text-white">{selectedVessel.flag}</div>
                      <div className="font-medium text-slate-400">Type:</div>
                      <div className="text-white">{selectedVessel.type}</div>
                      <div className="font-medium text-slate-400">Speed:</div>
                      <div className="text-white">{selectedVessel.speed.toFixed(1)} knots</div>
                      <div className="font-medium text-slate-400">Heading:</div>
                      <div className="text-white">{Math.round(selectedVessel.heading)}°</div>
                      <div className="font-medium text-slate-400">Destination:</div>
                      <div className="text-white">{selectedVessel.destination}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-300">Threat Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      {selectedVessel.riskLevel === "HIGH" ? (
                        <Badge variant="destructive" className="mb-2">
                          High Risk
                        </Badge>
                      ) : selectedVessel.riskLevel === "MEDIUM" ? (
                        <Badge variant="default" className="bg-amber-500 mb-2">
                          Medium Risk
                        </Badge>
                      ) : selectedVessel.riskLevel === "LOW" ? (
                        <Badge variant="outline" className="text-green-400 border-green-400 mb-2">
                          Low Risk
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 mb-2">
                          No Risk
                        </Badge>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div className="font-medium text-slate-400">Risk Score:</div>
                        <div className="text-white">{selectedVessel.riskScore}</div>
                        <div className="font-medium text-slate-400">Total Anomalies:</div>
                        <div className="text-white">{selectedVessel.anomalyCount}</div>
                        <div className="font-medium text-slate-400">High Severity:</div>
                        <div className="text-white">{selectedVessel.highSeverityCount}</div>
                        <div className="font-medium text-slate-400">Medium Severity:</div>
                        <div className="text-white">{selectedVessel.mediumSeverityCount}</div>
                      </div>

                      <div className="font-medium text-slate-400 mb-1">Behavior Pattern:</div>
                      <div className="flex items-center gap-1 mb-2">
                        {selectedVessel.behavior === "AIS_LOSS" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                        {selectedVessel.behavior === "ROUTE_DEVIATION" && (
                          <Navigation className="h-4 w-4 text-amber-400" />
                        )}
                        {selectedVessel.behavior === "SUSPICIOUS_ANCHORING" && (
                          <Anchor className="h-4 w-4 text-blue-400" />
                        )}
                        {selectedVessel.behavior === "SPEED_ANOMALY" && (
                          <BarChart3 className="h-4 w-4 text-purple-400" />
                        )}
                        {selectedVessel.behavior === "NORMAL" && <Ship className="h-4 w-4 text-slate-400" />}
                        <span className="capitalize text-white">
                          {selectedVessel.behavior.replace("_", " ").toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800/80 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-cyan-400" />
                    <CardTitle className="text-slate-300">Neptune's Eye Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-slate-900/50 rounded-md border border-slate-700 text-slate-300">
                    {generateVesselExplanation(selectedVessel)}
                  </div>
                </CardContent>
              </Card>

              {selectedVessel.anomalies.length > 0 && (
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-300">Detected Anomalies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedVessel.anomalies.map((anomaly: any, index: number) => (
                        <div
                          key={index}
                          className={`p-2 rounded-md border ${
                            anomaly.severity === "HIGH"
                              ? "bg-red-900/20 border-red-900/30"
                              : anomaly.severity === "MEDIUM"
                                ? "bg-amber-900/20 border-amber-900/30"
                                : "bg-slate-700/50 border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {anomaly.type === "AIS_LOSS" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                            {anomaly.type === "ROUTE_DEVIATION" && <Navigation className="h-4 w-4 text-amber-400" />}
                            {anomaly.type === "SUSPICIOUS_ANCHORING" && <Anchor className="h-4 w-4 text-blue-400" />}
                            {anomaly.type === "SPEED_ANOMALY" && <BarChart3 className="h-4 w-4 text-purple-400" />}
                            <div className="font-medium text-white">
                              {anomaly.type === "AIS_LOSS" && "AIS Signal Loss"}
                              {anomaly.type === "ROUTE_DEVIATION" && "Route Deviation"}
                              {anomaly.type === "SUSPICIOUS_ANCHORING" && "Suspicious Anchoring"}
                              {anomaly.type === "SPEED_ANOMALY" && "Speed Anomaly"}
                            </div>
                            <div className="ml-auto">
                              {anomaly.severity === "HIGH" ? (
                                <Badge variant="destructive">High</Badge>
                              ) : anomaly.severity === "MEDIUM" ? (
                                <Badge variant="default" className="bg-amber-500">
                                  Medium
                                </Badge>
                              ) : (
                                <Badge variant="outline">Low</Badge>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-slate-300">{anomaly.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setSelectedVessel(null)} className="bg-cyan-700 hover:bg-cyan-600">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Infrastructure Detail Dialog */}
      <Dialog open={!!selectedInfrastructure} onOpenChange={(open) => !open && setSelectedInfrastructure(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-cyan-400" />
              <div>
                <DialogTitle className="text-xl">Neptune's Eye Analysis: {selectedInfrastructure?.name}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  AI-powered infrastructure risk assessment
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedInfrastructure && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-300">Infrastructure Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium text-slate-400">Name:</div>
                      <div className="text-white">{selectedInfrastructure.name}</div>
                      <div className="font-medium text-slate-400">Type:</div>
                      <div className="text-white">Undersea Cable</div>
                      <div className="font-medium text-slate-400">Length:</div>
                      <div className="text-white">
                        Approx. {(selectedInfrastructure.path.length * 50).toFixed(0)} km
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-300">Threat Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      {selectedInfrastructure.riskLevel === "HIGH" ? (
                        <Badge variant="destructive" className="mb-2">
                          High Risk
                        </Badge>
                      ) : selectedInfrastructure.riskLevel === "MEDIUM" ? (
                        <Badge variant="default" className="bg-amber-500 mb-2">
                          Medium Risk
                        </Badge>
                      ) : selectedInfrastructure.riskLevel === "LOW" ? (
                        <Badge variant="outline" className="text-green-400 border-green-400 mb-2">
                          Low Risk
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 mb-2">
                          No Risk
                        </Badge>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium text-slate-400">Risk Score:</div>
                        <div className="text-white">{selectedInfrastructure.riskScore}</div>
                        <div className="font-medium text-slate-400">Nearby Anomalies:</div>
                        <div className="text-white">{selectedInfrastructure.anomalyCount}</div>
                        <div className="font-medium text-slate-400">High Severity:</div>
                        <div className="text-white">{selectedInfrastructure.highSeverityCount}</div>
                        <div className="font-medium text-slate-400">Medium Severity:</div>
                        <div className="text-white">{selectedInfrastructure.mediumSeverityCount}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800/80 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-cyan-400" />
                    <CardTitle className="text-slate-300">Neptune's Eye Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-slate-900/50 rounded-md border border-slate-700 text-slate-300">
                    {generateInfrastructureExplanation(selectedInfrastructure)}
                  </div>
                </CardContent>
              </Card>

              {selectedInfrastructure.nearbyAnomalies && selectedInfrastructure.nearbyAnomalies.length > 0 && (
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-300">Nearby Suspicious Vessels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {vesselRiskScores
                        .filter((vessel) =>
                          selectedInfrastructure.nearbyAnomalies.some((a: any) => a.vesselId === vessel.id),
                        )
                        .slice(0, 5)
                        .map((vessel) => (
                          <div key={vessel.id} className="p-2 rounded-md border border-slate-700 bg-slate-700/50">
                            <div className="flex items-center gap-2">
                              {vessel.behavior === "AIS_LOSS" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                              {vessel.behavior === "ROUTE_DEVIATION" && (
                                <Navigation className="h-4 w-4 text-amber-400" />
                              )}
                              {vessel.behavior === "SUSPICIOUS_ANCHORING" && (
                                <Anchor className="h-4 w-4 text-blue-400" />
                              )}
                              {vessel.behavior === "SPEED_ANOMALY" && <BarChart3 className="h-4 w-4 text-purple-400" />}
                              <div className="font-medium text-white">{vessel.name}</div>
                              <div className="text-xs text-slate-400">IMO: {vessel.imo}</div>
                              <div className="ml-auto">
                                {vessel.riskLevel === "HIGH" ? (
                                  <Badge variant="destructive">High Risk</Badge>
                                ) : vessel.riskLevel === "MEDIUM" ? (
                                  <Badge variant="default" className="bg-amber-500">
                                    Medium Risk
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Low Risk</Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 p-0 h-auto"
                              onClick={() => {
                                setSelectedInfrastructure(null)
                                setSelectedVessel(vessel)
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View vessel details
                            </Button>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setSelectedInfrastructure(null)} className="bg-cyan-700 hover:bg-cyan-600">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

