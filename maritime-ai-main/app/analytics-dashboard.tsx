"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useSimulation } from "./simulation-provider"

export function AnalyticsDashboard({ extended = false }: { extended?: boolean }) {
  const { simulationState, detectedAnomalies } = useSimulation()
  const [activeTab, setActiveTab] = useState("anomalies")

  // Generate anomaly type distribution data
  const anomalyTypeData = [
    { name: "AIS Loss", value: detectedAnomalies.filter((a) => a.type === "AIS_LOSS").length },
    { name: "Route Deviation", value: detectedAnomalies.filter((a) => a.type === "ROUTE_DEVIATION").length },
    { name: "Suspicious Anchoring", value: detectedAnomalies.filter((a) => a.type === "SUSPICIOUS_ANCHORING").length },
    { name: "Speed Anomaly", value: detectedAnomalies.filter((a) => a.type === "SPEED_ANOMALY").length },
  ].filter((item) => item.value > 0)

  // Generate anomaly severity distribution data
  const anomalySeverityData = [
    { name: "High", value: detectedAnomalies.filter((a) => a.severity === "HIGH").length },
    { name: "Medium", value: detectedAnomalies.filter((a) => a.severity === "MEDIUM").length },
    { name: "Low", value: detectedAnomalies.filter((a) => a.severity === "LOW").length },
  ].filter((item) => item.value > 0)

  // Generate anomaly timeline data
  const timelineData = Array.from({ length: 30 }, (_, i) => {
    const timePoint = i + 1
    return {
      time: timePoint,
      aisLoss: detectedAnomalies.filter((a) => a.type === "AIS_LOSS" && Math.floor(a.timestamp) === timePoint).length,
      routeDeviation: detectedAnomalies.filter(
        (a) => a.type === "ROUTE_DEVIATION" && Math.floor(a.timestamp) === timePoint,
      ).length,
      suspiciousAnchoring: detectedAnomalies.filter(
        (a) => a.type === "SUSPICIOUS_ANCHORING" && Math.floor(a.timestamp) === timePoint,
      ).length,
      speedAnomaly: detectedAnomalies.filter((a) => a.type === "SPEED_ANOMALY" && Math.floor(a.timestamp) === timePoint)
        .length,
    }
  })

  // Generate vessel behavior data
  const behaviorData = [
    { name: "Normal", value: simulationState.vessels.filter((v) => v.behavior === "NORMAL").length },
    { name: "AIS Loss", value: simulationState.vessels.filter((v) => v.behavior === "AIS_LOSS").length },
    { name: "Route Deviation", value: simulationState.vessels.filter((v) => v.behavior === "ROUTE_DEVIATION").length },
    {
      name: "Suspicious Anchoring",
      value: simulationState.vessels.filter((v) => v.behavior === "SUSPICIOUS_ANCHORING").length,
    },
    { name: "Speed Anomaly", value: simulationState.vessels.filter((v) => v.behavior === "SPEED_ANOMALY").length },
  ]

  // Colors for charts
  const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#a855f7", "#10b981"]

  return (
    <div className={extended ? "p-4" : ""}>
      <Tabs defaultValue="anomalies" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {extended && <TabsTrigger value="vessels">Vessels</TabsTrigger>}
          {extended && <TabsTrigger value="heatmap">Heatmap</TabsTrigger>}
        </TabsList>

        <TabsContent value="anomalies">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={extended ? "h-[300px]" : "h-[200px]"}>
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anomaly Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={extended ? "h-[300px]" : "h-[200px]"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={anomalySeverityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#ef4444" /> {/* High - Red */}
                        <Cell fill="#f59e0b" /> {/* Medium - Amber */}
                        <Cell fill="#6b7280" /> {/* Low - Gray */}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={extended ? "h-[350px]" : "h-[200px]"}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="time"
                      label={{ value: "Simulation Time (s)", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis label={{ value: "Count", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="aisLoss"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      name="AIS Loss"
                    />
                    <Area
                      type="monotone"
                      dataKey="routeDeviation"
                      stackId="1"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      name="Route Deviation"
                    />
                    <Area
                      type="monotone"
                      dataKey="suspiciousAnchoring"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      name="Suspicious Anchoring"
                    />
                    <Area
                      type="monotone"
                      dataKey="speedAnomaly"
                      stackId="1"
                      stroke="#a855f7"
                      fill="#a855f7"
                      name="Speed Anomaly"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {extended && (
          <TabsContent value="vessels">
            <Card>
              <CardHeader>
                <CardTitle>Vessel Behavior Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={behaviorData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Vessel Count">
                        {behaviorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {extended && (
          <TabsContent value="heatmap">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md">
                  <div className="text-center text-muted-foreground">
                    Heatmap visualization would be displayed here in a real implementation
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

