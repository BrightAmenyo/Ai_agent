"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

// Mock data for anomaly trends
const dailyData = [
  { date: "03/23", missingAIS: 18, routeDeviation: 12, unusualAnchoring: 5 },
  { date: "03/24", missingAIS: 22, routeDeviation: 15, unusualAnchoring: 7 },
  { date: "03/25", missingAIS: 16, routeDeviation: 10, unusualAnchoring: 4 },
  { date: "03/26", missingAIS: 20, routeDeviation: 14, unusualAnchoring: 6 },
  { date: "03/27", missingAIS: 24, routeDeviation: 16, unusualAnchoring: 8 },
  { date: "03/28", missingAIS: 21, routeDeviation: 13, unusualAnchoring: 5 },
  { date: "03/29", missingAIS: 24, routeDeviation: 16, unusualAnchoring: 7 },
]

const hourlyData = [
  { time: "06:00", missingAIS: 15, routeDeviation: 10, unusualAnchoring: 4 },
  { time: "08:00", missingAIS: 18, routeDeviation: 12, unusualAnchoring: 5 },
  { time: "10:00", missingAIS: 22, routeDeviation: 14, unusualAnchoring: 6 },
  { time: "12:00", missingAIS: 24, routeDeviation: 16, unusualAnchoring: 7 },
  { time: "14:00", missingAIS: 21, routeDeviation: 13, unusualAnchoring: 5 },
  { time: "16:00", missingAIS: 19, routeDeviation: 11, unusualAnchoring: 4 },
  { time: "18:00", missingAIS: 17, routeDeviation: 9, unusualAnchoring: 3 },
]

const regionData = [
  { region: "North Atlantic", missingAIS: 35, routeDeviation: 28, unusualAnchoring: 12 },
  { region: "South Atlantic", missingAIS: 22, routeDeviation: 18, unusualAnchoring: 8 },
  { region: "North Pacific", missingAIS: 30, routeDeviation: 24, unusualAnchoring: 10 },
  { region: "South Pacific", missingAIS: 18, routeDeviation: 14, unusualAnchoring: 6 },
  { region: "Indian Ocean", missingAIS: 25, routeDeviation: 20, unusualAnchoring: 9 },
  { region: "Mediterranean", missingAIS: 28, routeDeviation: 22, unusualAnchoring: 11 },
  { region: "Caribbean", missingAIS: 20, routeDeviation: 16, unusualAnchoring: 7 },
]

export function AnomalyChart({ extended = false }: { extended?: boolean }) {
  return (
    <div className={extended ? "p-4" : ""}>
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="hourly">Hourly</TabsTrigger>
          {extended && <TabsTrigger value="region">By Region</TabsTrigger>}
        </TabsList>

        <TabsContent value="daily">
          <ChartContainer
            config={{
              missingAIS: {
                label: "Missing AIS",
                color: "hsl(var(--destructive))",
              },
              routeDeviation: {
                label: "Route Deviation",
                color: "hsl(38 92% 50%)",
              },
              unusualAnchoring: {
                label: "Unusual Anchoring",
                color: "hsl(221 83% 53%)",
              },
            }}
            className={extended ? "h-[350px]" : "h-[200px]"}
          >
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="missingAIS"
                stackId="1"
                stroke="var(--color-missingAIS)"
                fill="var(--color-missingAIS)"
                fillOpacity={0.6}
              />
              {/* Area chart components */}
              <Area
                type="monotone"
                dataKey="routeDeviation"
                stackId="1"
                stroke="var(--color-routeDeviation)"
                fill="var(--color-routeDeviation)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="unusualAnchoring"
                stackId="1"
                stroke="var(--color-unusualAnchoring)"
                fill="var(--color-unusualAnchoring)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </TabsContent>

        <TabsContent value="hourly">
          <ChartContainer
            config={{
              missingAIS: {
                label: "Missing AIS",
                color: "hsl(var(--destructive))",
              },
              routeDeviation: {
                label: "Route Deviation",
                color: "hsl(38 92% 50%)",
              },
              unusualAnchoring: {
                label: "Unusual Anchoring",
                color: "hsl(221 83% 53%)",
              },
            }}
            className={extended ? "h-[350px]" : "h-[200px]"}
          >
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="missingAIS" stroke="var(--color-missingAIS)" strokeWidth={2} />
              <Line type="monotone" dataKey="routeDeviation" stroke="var(--color-routeDeviation)" strokeWidth={2} />
              <Line type="monotone" dataKey="unusualAnchoring" stroke="var(--color-unusualAnchoring)" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </TabsContent>

        {extended && (
          <TabsContent value="region">
            <ChartContainer
              config={{
                missingAIS: {
                  label: "Missing AIS",
                  color: "hsl(var(--destructive))",
                },
                routeDeviation: {
                  label: "Route Deviation",
                  color: "hsl(38 92% 50%)",
                },
                unusualAnchoring: {
                  label: "Unusual Anchoring",
                  color: "hsl(221 83% 53%)",
                },
              }}
              className="h-[350px]"
            >
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="region" />
                <YAxis />
                <Legend />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="missingAIS" fill="var(--color-missingAIS)" />
                <Bar dataKey="routeDeviation" fill="var(--color-routeDeviation)" />
                <Bar dataKey="unusualAnchoring" fill="var(--color-unusualAnchoring)" />
              </BarChart>
            </ChartContainer>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

