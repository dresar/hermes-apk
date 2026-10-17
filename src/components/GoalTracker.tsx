import React, { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Repeat,
  Layers,
  ChevronRight,
  ChevronDown,
  Zap,
} from 'lucide-react'

export interface GoalMilestone {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress?: number
  children?: GoalMilestone[]
  timestamp?: string
}

export interface RecurringLoop {
  id: string
  name: string
  cronExpression?: string
  intervalMs?: number
  status: 'active' | 'paused' | 'idle'
  lastRun?: string
  nextRun?: string
  iterationCount: number
}

export interface HeartbeatState {
  status: 'healthy' | 'degraded' | 'offline'
  lastBeatTime: string
  intervalMs: number
  activeMonitors: number
  systemLoad?: number
}

export interface GoalTrackerProps {
  sessionId?: string
  goals?: GoalMilestone[]
  loops?: RecurringLoop[]
  heartbeat?: HeartbeatState
  isLoopPaused?: boolean
  onControl?: (action: 'pause' | 'resume' | 'trigger_heartbeat') => void
  className?: string
}

const DEFAULT_MILESTONES: GoalMilestone[] = [
  {
    id: 'm-1',
    title: 'Initialize Mobile Gateway Runtime',
    description: 'Establish WebSocket tunnel and authenticate session ticket.',
    status: 'completed',
    progress: 100,
    timestamp: '14:20:02',
    children: [
      {
        id: 'm-1-1',
        title: 'Verify SSL and Tailscale Route',
        status: 'completed',
        progress: 100,
        timestamp: '14:20:03',
      },
      {
        id: 'm-1-2',
        title: 'Perform JSON-RPC 2.0 handshake',
        status: 'completed',
        progress: 100,
        timestamp: '14:20:04',
      },
    ],
  },
  {
    id: 'm-2',
    title: 'Synthesize Mascot Companion Stream',
    description: 'Fetch 5,086 Petdex manifest and mount canvas frame stepper.',
    status: 'in_progress',
    progress: 68,
    timestamp: '14:21:15',
    children: [
      {
        id: 'm-2-1',
        title: 'Render Phase 1 Local Starter Roster',
        status: 'completed',
        progress: 100,
        timestamp: '14:21:18',
      },
      {
        id: 'm-2-2',
        title: 'Stream CDN Manifest and Cache Thumbnails',
        status: 'in_progress',
        progress: 55,
        timestamp: '14:21:40',
      },
    ],
  },
  {
    id: 'm-3',
    title: 'Execute Checkpoint Verification & Rollback Test',
    description: 'Record pre-mutation Git tree and verify one-tap restore safety.',
    status: 'pending',
    progress: 0,
    timestamp: 'Pending',
  },
]

const DEFAULT_LOOPS: RecurringLoop[] = [
  {
    id: 'loop-sync',
    name: 'State Checkpoint Daemon',
    cronExpression: '*/5 * * * *',
    intervalMs: 300000,
    status: 'active',
    lastRun: '2 mins ago',
    nextRun: 'in 3 mins',
    iterationCount: 24,
  },
  {
    id: 'loop-cache',
    name: 'Petdex Cache Pruner',
    intervalMs: 600000,
    status: 'active',
    lastRun: '8 mins ago',
    nextRun: 'in 2 mins',
    iterationCount: 12,
  },
]

const DEFAULT_HEARTBEAT: HeartbeatState = {
  status: 'healthy',
  lastBeatTime: 'Just now',
  intervalMs: 30000,
  activeMonitors: 4,
  systemLoad: 18,
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  goals = DEFAULT_MILESTONES,
  loops = DEFAULT_LOOPS,
  heartbeat = DEFAULT_HEARTBEAT,
  isLoopPaused = false,
  onControl,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'milestones' | 'loops' | 'heartbeat'>('all')
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({})
  const [paused, setPaused] = useState(isLoopPaused)
  const [lastBeatSecondsAgo, setLastBeatSecondsAgo] = useState(2)

  useEffect(() => {
    setPaused(isLoopPaused)
  }, [isLoopPaused])

  useEffect(() => {
    const timer = setInterval(() => {
      setLastBeatSecondsAgo((prev) => (prev >= 30 ? 1 : prev + 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleNode = (id: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleToggleLoop = () => {
    const nextState = !paused
    setPaused(nextState)
    if (onControl) {
      onControl(nextState ? 'pause' : 'resume')
    }
  }

  const handleTriggerHeartbeat = () => {
    setLastBeatSecondsAgo(0)
    if (onControl) {
      onControl('trigger_heartbeat')
    }
  }

  const renderStatusIcon = (status: GoalMilestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
      case 'in_progress':
        return <Activity className="h-4 w-4 animate-pulse text-[#ff6347]" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-[#ef4444]" />
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-[#9ca3af]" />
    }
  }

  const renderMilestoneItem = (milestone: GoalMilestone, level = 0) => {
    const hasChildren = milestone.children && milestone.children.length > 0
    const isCollapsed = collapsedNodes[milestone.id]

    return (
      <div key={milestone.id} className="w-full">
        <div
          className={`group flex items-start gap-2.5 rounded-xl border border-[#23262d] bg-[#1a1c20] p-3 transition-colors ${
            level > 0 ? 'mt-2 border-l-2 border-l-[#ff6347]/50' : 'mt-2.5'
          }`}
          style={{ marginLeft: level > 0 ? `${level * 14}px` : undefined }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleNode(milestone.id)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center -m-2 text-[#9ca3af] hover:text-[#f3f4f6]"
              aria-label={isCollapsed ? 'Expand milestone' : 'Collapse milestone'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center pt-0.5">
              {renderStatusIcon(milestone.status)}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#f3f4f6]">
                {milestone.title}
              </span>
              {milestone.progress !== undefined && (
                <span className="text-[11px] font-mono text-[#9ca3af]">
                  {milestone.progress}%
                </span>
              )}
            </div>

            {milestone.description && (
              <p className="mt-0.5 text-[11px] text-[#9ca3af]">
                {milestone.description}
              </p>
            )}

            {milestone.progress !== undefined && milestone.status === 'in_progress' && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#090a0b]">
                <div
                  className="h-full rounded-full bg-[#ff6347] transition-all duration-300"
                  style={{ width: `${milestone.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {milestone.children!.map((child) => renderMilestoneItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col rounded-2xl border border-[#23262d] bg-[#121316] p-4 text-[#f3f4f6] shadow-xl ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23262d] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#323640] bg-[#1a1c20] text-[#ff6347]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[#f3f4f6]">
              Goal & Heartbeat Controller
            </h3>
            <p className="text-[11px] text-[#9ca3af]">
              Hermes Autonomous Mode 8 & 9
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleLoop}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 text-xs font-medium transition-colors ${
              paused
                ? 'border-[#ff6347] bg-[#ff6347]/15 text-[#ff6347] hover:bg-[#ff6347]/25'
                : 'border-[#23262d] bg-[#1a1c20] text-[#f3f4f6] hover:border-[#323640]'
            }`}
            aria-label={paused ? 'Resume autonomous loops' : 'Pause autonomous loops'}
          >
            {paused ? (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Resume Loop
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                Pause Loop
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-[#23262d] bg-[#1a1c20] p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#9ca3af]">Heartbeat Pulse</span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
            </span>
          </div>
          <p className="mt-1 font-mono text-xs font-semibold text-[#10b981]">
            {lastBeatSecondsAgo}s ago
          </p>
          <span className="text-[9px] text-[#9ca3af]">30s interval</span>
        </div>

        <div className="rounded-xl border border-[#23262d] bg-[#1a1c20] p-2.5">
          <span className="text-[10px] text-[#9ca3af]">Active Loops</span>
          <p className="mt-1 font-mono text-xs font-semibold text-[#f3f4f6]">
            {loops.filter((l) => l.status === 'active').length} of {loops.length}
          </p>
          <span className="text-[9px] text-[#9ca3af]">Autonomous crons</span>
        </div>

        <div className="rounded-xl border border-[#23262d] bg-[#1a1c20] p-2.5">
          <span className="text-[10px] text-[#9ca3af]">Milestones</span>
          <p className="mt-1 font-mono text-xs font-semibold text-[#ff6347]">
            {goals.filter((g) => g.status === 'completed').length}/{goals.length}
          </p>
          <span className="text-[9px] text-[#9ca3af]">Contract gates</span>
        </div>

        <div className="rounded-xl border border-[#23262d] bg-[#1a1c20] p-2.5">
          <span className="text-[10px] text-[#9ca3af]">Loop Engine</span>
          <p className={`mt-1 font-mono text-xs font-semibold ${paused ? 'text-[#f59e0b]' : 'text-[#10b981]'}`}>
            {paused ? 'PAUSED' : 'AUTONOMOUS'}
          </p>
          <span className="text-[9px] text-[#9ca3af]">session.control</span>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 border-b border-[#23262d] pb-2">
        {(['all', 'milestones', 'loops', 'heartbeat'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex min-h-[44px] items-center px-3 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'rounded-lg border border-[#ff6347]/40 bg-[#ff6347]/15 text-[#ff6347]'
                : 'rounded-lg border border-transparent text-[#9ca3af] hover:text-[#f3f4f6]'
            }`}
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-2 flex-1 space-y-3 overflow-y-auto">
        {(activeTab === 'all' || activeTab === 'milestones') && (
          <div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-medium text-[#9ca3af]">Milestone Tree</span>
              <span className="text-[10px] text-[#9ca3af]">session.control.read</span>
            </div>
            <div className="flex flex-col">
              {goals.map((m) => renderMilestoneItem(m))}
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'loops') && (
          <div className="pt-2">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-medium text-[#9ca3af]">Recurring Loops</span>
              <Repeat className="h-3.5 w-3.5 text-[#9ca3af]" />
            </div>
            <div className="space-y-2">
              {loops.map((loop) => (
                <div
                  key={loop.id}
                  className="flex items-center justify-between rounded-xl border border-[#23262d] bg-[#1a1c20] p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#f3f4f6]">
                        {loop.name}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono ${
                          loop.status === 'active'
                            ? 'bg-[#10b981]/20 text-[#10b981]'
                            : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                        }`}
                      >
                        {loop.status}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-[#9ca3af]">
                      {loop.cronExpression || `${(loop.intervalMs || 0) / 1000}s timer`} - Iteration #{loop.iterationCount}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#9ca3af]">
                    Next: {loop.nextRun}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'heartbeat') && (
          <div className="pt-2">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-medium text-[#9ca3af]">Heartbeat Telemetry</span>
              <Zap className="h-3.5 w-3.5 text-[#ff6347]" />
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-[#23262d] bg-[#1a1c20] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9ca3af]">Daemon Status</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#10b981]">
                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  {heartbeat.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9ca3af]">Active Watchdogs</span>
                <span className="font-mono text-xs text-[#f3f4f6]">
                  {heartbeat.activeMonitors} monitors online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9ca3af]">Interval</span>
                <span className="font-mono text-xs text-[#f3f4f6]">
                  {heartbeat.intervalMs / 1000} seconds
                </span>
              </div>
              <button
                type="button"
                onClick={handleTriggerHeartbeat}
                className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#23262d] bg-[#090a0b] px-3 text-xs font-medium text-[#f3f4f6] transition-colors hover:border-[#323640] active:bg-[#121316]"
                aria-label="Send immediate heartbeat ping"
              >
                Send Immediate Heartbeat Ping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GoalTracker
