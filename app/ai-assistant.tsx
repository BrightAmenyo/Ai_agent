"use client"

import { useState, useEffect } from "react"
import { Brain, MessageSquare, Zap, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSimulation } from "./simulation-provider"

export function AIAssistant() {
  const { simulationState, detectedAnomalies, isRunning } = useSimulation()
  const [message, setMessage] = useState<string>("")
  const [typing, setTyping] = useState<boolean>(false)
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0)

  // Messages that Neptune's Eye can display
  const messages = [
    "Analyzing vessel movement patterns for anomalous behavior...",
    "Monitoring AIS signal integrity across all vessels in the region...",
    "Detecting potential route deviations and suspicious anchoring...",
    "Cross-referencing vessel positions with undersea cable infrastructure...",
    "Calculating risk scores based on behavioral analysis...",
    "Identifying potential coordinated activities between vessels...",
    "Applying machine learning models to detect unusual speed patterns...",
    "Evaluating proximity of vessels to critical infrastructure...",
  ]

  // Alert messages when anomalies are detected
  const alertMessages = [
    "ALERT: Detected vessel with AIS signal loss near critical infrastructure",
    "ALERT: Suspicious anchoring pattern detected over undersea cable",
    "ALERT: Unusual route deviation detected in restricted area",
    "ALERT: Abnormal speed pattern detected near critical infrastructure",
    "ALERT: Multiple vessels exhibiting coordinated suspicious behavior",
  ]

  // Generate a message based on simulation state
  useEffect(() => {
    // Add a console log to debug
    console.log("AI Assistant state:", { isRunning, detectedAnomalies: detectedAnomalies.length })

    if (!isRunning) {
      if (detectedAnomalies.length > 0) {
        const highSeverityCount = detectedAnomalies.filter((a) => a.severity === "HIGH").length
        if (highSeverityCount > 0) {
          setMessage(
            `I've detected ${detectedAnomalies.length} anomalies, including ${highSeverityCount} high-severity threats that require immediate attention. Please review the threat report for detailed analysis.`,
          )
        } else {
          setMessage(
            `Analysis complete. I've identified ${detectedAnomalies.length} anomalies in vessel behavior. None are high-severity, but continued monitoring is recommended.`,
          )
        }
      } else {
        setMessage(
          "Neptune's Eye is ready to monitor maritime activity. Start the simulation to begin real-time anomaly detection.",
        )
      }
      setTyping(false)
      setCurrentCharIndex(0)
    } else {
      // During simulation, cycle through messages
      const interval = setInterval(() => {
        // If there are anomalies, occasionally show an alert message
        if (detectedAnomalies.length > 0 && Math.random() < 0.3) {
          const randomAlertIndex = Math.floor(Math.random() * alertMessages.length)
          setMessage(alertMessages[randomAlertIndex])
        } else {
          const randomIndex = Math.floor(Math.random() * messages.length)
          setMessage(messages[randomIndex])
        }

        setTyping(true)
        setCurrentCharIndex(0)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isRunning, detectedAnomalies.length])

  // Typing effect
  useEffect(() => {
    if (typing && currentCharIndex < message.length) {
      const timer = setTimeout(() => {
        setCurrentCharIndex(currentCharIndex + 1)
      }, 30)

      return () => clearTimeout(timer)
    } else if (typing && currentCharIndex >= message.length) {
      setTyping(false)
    }
  }, [typing, currentCharIndex, message])

  // Display text with typing effect
  const displayText = typing ? message.substring(0, currentCharIndex) : message

  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className="bg-cyan-900/30 p-4 flex items-center justify-center">
            <div className="relative">
              <Brain className="h-8 w-8 text-cyan-400" />
              {isRunning && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
              )}
            </div>
          </div>
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-cyan-400">Neptune's Eye</h3>
              <span className="text-xs bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded-full">AI Assistant</span>
            </div>
            <p className="text-slate-300 min-h-[3rem]">
              {displayText}
              {typing && <span className="animate-pulse">|</span>}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Ask Question
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
              >
                <Shield className="h-3 w-3 mr-1" />
                Security Recommendations
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-cyan-400"
              >
                <Zap className="h-3 w-3 mr-1" />
                Run Analysis
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

