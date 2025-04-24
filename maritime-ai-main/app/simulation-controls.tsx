"use client"

import { Play, Pause, RotateCcw, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SimulationControls({
  isRunning,
  isComplete,
  onStart,
  onPause,
  onReset,
  onNewScenario,
}: {
  isRunning: boolean
  isComplete: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onNewScenario: () => void
}) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-md border border-slate-700">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
              onClick={isRunning ? onPause : onStart}
              disabled={isComplete && isRunning}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRunning ? "Pause" : "Start"} Simulation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
              onClick={onReset}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset Simulation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
              onClick={onNewScenario}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate New Scenario</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

