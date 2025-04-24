"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Anchor, Ship, Navigation, Bell, BarChart3, Eye } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { EnhancedSimulationMap } from "./enhanced-simulation-map"
import { VesselTable } from "./vessel-table"
import { EventFeed } from "./event-feed"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { SimulationReport } from "./simulation-report"
import { SimulationControls } from "./simulation-controls"
import { useSimulation } from "./simulation-provider"
import { AIAssistant } from "./ai-assistant"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const {
    simulationState,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    generateNewScenario,
    detectedAnomalies,
    simulationTime,
    simulationDuration,
    isRunning,
    isComplete,
  } = useSimulation()

  // Switch to report tab when simulation completes
  useEffect(() => {
    if (isComplete) {
      setActiveTab("report")
    }
  }, [isComplete])

  // Format the simulation time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate anomaly counts by type
  const missingAISCount = detectedAnomalies.filter((a) => a.type === "AIS_LOSS").length
  const routeDeviationCount = detectedAnomalies.filter((a) => a.type === "ROUTE_DEVIATION").length
  const suspiciousAnchoringCount = detectedAnomalies.filter((a) => a.type === "SUSPICIOUS_ANCHORING").length
  const speedAnomalyCount = detectedAnomalies.filter((a) => a.type === "SPEED_ANOMALY").length
  const totalAnomalies = detectedAnomalies.length

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Eye className="h-8 w-8 text-cyan-400" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">Neptune's Eye</h1>
              <p className="text-xs text-slate-400">Advanced Maritime Anomaly Detection AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-md border border-slate-700">
              <div className="text-sm font-medium text-slate-300">Simulation Time:</div>
              <div className="text-sm tabular-nums text-cyan-400 font-mono">
                {formatTime(simulationTime)} / {formatTime(simulationDuration)}
              </div>
              <Progress value={(simulationTime / simulationDuration) * 100} className="w-24 h-2" />
              {isRunning && (
                <div
                  className="h-2 w-2 rounded-full bg-green-500 animate-pulse"
                  style={{ animationDuration: "2s" }}
                  title="Updating every 2 seconds"
                ></div>
              )}
            </div>

            <SimulationControls
              isRunning={isRunning}
              isComplete={isComplete}
              onStart={startSimulation}
              onPause={pauseSimulation}
              onReset={resetSimulation}
              onNewScenario={generateNewScenario}
            />

            <Button variant="destructive" size="sm" className="relative" disabled={totalAnomalies === 0}>
              <Bell className="h-4 w-4 mr-1" />
              Alerts
              {totalAnomalies > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {totalAnomalies}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-cyan-900/50">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="map" className="data-[state=active]:bg-cyan-900/50">
                Map View
              </TabsTrigger>
              <TabsTrigger value="vessels" className="data-[state=active]:bg-cyan-900/50">
                Vessels
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-900/50">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="report" disabled={!isComplete} className="data-[state=active]:bg-cyan-900/50">
                Threat Report
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`gap-1 border-slate-700 ${isRunning ? "bg-green-500/10 text-green-400" : isComplete ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : isComplete ? "bg-blue-500" : "bg-amber-500"}`}
                ></span>
                {isRunning ? "AI Monitoring Active" : isComplete ? "Analysis Complete" : "System Standby"}
              </Badge>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <AIAssistant />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Active Vessels</CardTitle>
                  <Ship className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{simulationState.vessels.length}</div>
                  <p className="text-xs text-slate-400">Total vessels in simulation</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Missing AIS</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">{missingAISCount}</div>
                  <p className="text-xs text-slate-400">Vessels with AIS signal loss</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Route Deviations</CardTitle>
                  <Navigation className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-400">{routeDeviationCount}</div>
                  <p className="text-xs text-slate-400">Vessels deviating from routes</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Suspicious Anchoring</CardTitle>
                  <Anchor className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">{suspiciousAnchoringCount}</div>
                  <p className="text-xs text-slate-400">Vessels anchored near cables</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Speed Anomalies</CardTitle>
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">{speedAnomalyCount}</div>
                  <p className="text-xs text-slate-400">Unusual speed patterns</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Simulation Map</CardTitle>
                  <CardDescription className="text-slate-400">
                    Real-time vessel positions and infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <EnhancedSimulationMap />
                </CardContent>
              </Card>
              <Card className="col-span-3 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Event Feed</CardTitle>
                  <CardDescription className="text-slate-400">Real-time detection events and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <EventFeed />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-3 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Critical Alerts</CardTitle>
                  <CardDescription className="text-slate-400">
                    High-priority anomalies requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {detectedAnomalies
                      .filter((anomaly) => anomaly.severity === "HIGH")
                      .slice(0, 3)
                      .map((anomaly, index) => (
                        <Alert
                          key={index}
                          variant={anomaly.severity === "HIGH" ? "destructive" : "default"}
                          className="cursor-pointer hover:bg-slate-700/50 border-slate-700 bg-slate-800/80"
                        >
                          {anomaly.type === "AIS_LOSS" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                          {anomaly.type === "ROUTE_DEVIATION" && <Navigation className="h-4 w-4 text-amber-400" />}
                          {anomaly.type === "SUSPICIOUS_ANCHORING" && <Anchor className="h-4 w-4 text-blue-400" />}
                          {anomaly.type === "SPEED_ANOMALY" && <BarChart3 className="h-4 w-4 text-purple-400" />}
                          <AlertTitle className="text-white">
                            {anomaly.type === "AIS_LOSS" && "Missing AIS Data"}
                            {anomaly.type === "ROUTE_DEVIATION" && "Unusual Route Deviation"}
                            {anomaly.type === "SUSPICIOUS_ANCHORING" && "Suspicious Anchoring"}
                            {anomaly.type === "SPEED_ANOMALY" && "Unusual Speed Pattern"}
                          </AlertTitle>
                          <AlertDescription className="text-slate-300">{anomaly.description}</AlertDescription>
                        </Alert>
                      ))}

                    {detectedAnomalies.filter((anomaly) => anomaly.severity === "HIGH").length === 0 && (
                      <div className="text-center py-8 text-slate-400">No critical alerts detected</div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-4 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Real-Time Analytics</CardTitle>
                  <CardDescription className="text-slate-400">Live analysis of maritime activity</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <AnalyticsDashboard />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Full Map View</CardTitle>
                <CardDescription className="text-slate-400">
                  Interactive map of all vessels and infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <EnhancedSimulationMap fullscreen />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vessels" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Vessel Data</CardTitle>
                <CardDescription className="text-slate-400">
                  Detailed information about all vessels in the simulation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VesselTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Advanced Analytics</CardTitle>
                <CardDescription className="text-slate-400">
                  Detailed analysis of maritime activity patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px]">
                  <AnalyticsDashboard extended />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            {isComplete ? (
              <SimulationReport />
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">Threat Report</CardTitle>
                  <CardDescription className="text-slate-400">
                    Complete the simulation to view the final report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-white">Simulation Not Complete</h3>
                    <p className="text-slate-400 mt-2 max-w-md">
                      Run the full simulation to generate a comprehensive analysis report of all detected anomalies and
                      security threats.
                    </p>
                    <Button
                      className="mt-6 bg-cyan-700 hover:bg-cyan-600"
                      onClick={() => {
                        resetSimulation()
                        startSimulation()
                        setActiveTab("dashboard")
                      }}
                    >
                      Start Simulation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

