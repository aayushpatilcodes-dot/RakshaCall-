import { AnimatePresence, motion } from 'framer-motion'
import { PhoneOff, RotateCcw, Radio } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { analyzeCallerText, type DetectionResult } from '../lib/detectionEngine'
import { useAppSettings } from '../i18n/LanguageContext'
import type { Scenario, TranscriptLine } from '../types'
import { RiskMeter } from './RiskMeter'
import { TacticsList } from './TacticsList'
import { WarningOverlay } from './WarningOverlay'

const EMPTY_RESULT: DetectionResult = { score: 0, level: 'LOW', matchedCategories: [], topCategoryIds: [] }

export function CallScreen({ scenario, onExit }: { scenario: Scenario; onExit: () => void }) {
  const { strings } = useAppSettings()
  const [visibleLines, setVisibleLines] = useState<TranscriptLine[]>([])
  const [result, setResult] = useState<DetectionResult>(EMPTY_RESULT)
  const [ended, setEnded] = useState(false)
  const [warningDismissed, setWarningDismissed] = useState(false)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)
  const timeoutsRef = useRef<number[]>([])

  useEffect(() => {
    setVisibleLines([])
    setResult(EMPTY_RESULT)
    setEnded(false)
    setWarningDismissed(false)
    timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutsRef.current = []

    let elapsed = 0
    const callerTextSoFar: string[] = []

    scenario.lines.forEach((line) => {
      elapsed += line.delayMs
      const id = window.setTimeout(() => {
        setVisibleLines((prev) => [...prev, line])
        if (line.speaker === 'caller') {
          callerTextSoFar.push(line.text)
          const nextResult = analyzeCallerText(callerTextSoFar.join(' '))
          setResult(nextResult)
          setWarningDismissed(false)
        }
      }, elapsed)
      timeoutsRef.current.push(id)
    })

    const endId = window.setTimeout(() => setEnded(true), elapsed + 1200)
    timeoutsRef.current.push(endId)

    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [visibleLines])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-800 text-ink-200">
            {scenario.callerName.charAt(0)}
          </div>
          <div>
            <p className="font-display font-bold text-ink-50">{scenario.callerName}</p>
            <p className="flex items-center gap-1.5 text-xs text-safe-400">
              <Radio className="h-3 w-3 animate-pulse" />
              {strings.callScreen.liveLabel} · {strings.callScreen.protectionOn}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-sm font-medium text-ink-200 hover:bg-ink-800"
          >
            <RotateCcw className="h-4 w-4" />
            {strings.callScreen.restart}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-lg bg-danger-500 px-3 py-2 text-sm font-semibold text-white hover:bg-danger-600"
          >
            <PhoneOff className="h-4 w-4" />
            {strings.callScreen.endCall}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="h-[420px] overflow-y-auto rounded-2xl border border-ink-700 bg-ink-900/40 p-4">
            <AnimatePresence initial={false}>
              {visibleLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-3 flex ${line.speaker === 'caller' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      line.speaker === 'caller'
                        ? 'bg-ink-800 text-ink-100'
                        : 'bg-brand-500/20 text-ink-50'
                    }`}
                  >
                    {line.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!ended && visibleLines.length < scenario.lines.length && (
              <div className="flex items-center gap-1 px-1 text-ink-500">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-500 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-500 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-500" />
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <RiskMeter score={result.score} level={result.level} />
          <TacticsList matched={result.matchedCategories} />
        </div>
      </div>

      {!warningDismissed && (
        <div className="mt-5">
          <WarningOverlay level={result.level} matched={result.matchedCategories} onDismiss={() => setWarningDismissed(true)} />
        </div>
      )}
    </div>
  )
}
