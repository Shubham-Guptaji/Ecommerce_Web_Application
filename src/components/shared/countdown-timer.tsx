'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: Date | string
  onExpire?: () => void
}

function getTimeLeft(targetTimestamp: number, currentTime: number) {
  const difference = targetTimestamp - currentTime

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    expired: false,
  }
}

const INITIAL_TIME_LEFT = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  expired: false,
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
  const [now, setNow] = useState<number | null>(null)
  const targetTimestamp = new Date(targetDate).getTime()
  const timeLeft = now === null ? INITIAL_TIME_LEFT : getTimeLeft(targetTimestamp, now)

  useEffect(() => {
    const updateNow = () => setNow(Date.now())
    updateNow()

    if (timeLeft.expired) return

    const timer = setInterval(() => {
      updateNow()
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft.expired])

  useEffect(() => {
    if (now !== null && timeLeft.expired) {
      onExpire?.()
    }
  }, [now, timeLeft.expired, onExpire])

  const formatNumber = (num: number) => num.toString().padStart(2, '0')

  return (
    <div className="flex items-center gap-3 text-sm font-mono">
      <div className="bg-background border rounded px-2 py-1">
        <span className="text-lg text-black dark:text-white">{formatNumber(timeLeft.days)}</span>
        <span className="text-xs text-muted-foreground block">Days</span>
      </div>
      <span>:</span>
      <div className="bg-background border rounded px-2 py-1">
        <span className="text-lg text-black dark:text-white">{formatNumber(timeLeft.hours)}</span>
        <span className="text-xs text-muted-foreground block">Hrs</span>
      </div>
      <span>:</span>
      <div className="bg-background border rounded px-2 py-1">
        <span className="text-lg text-black dark:text-white">{formatNumber(timeLeft.minutes)}</span>
        <span className="text-xs text-muted-foreground block">Mins</span>
      </div>
      <span>:</span>
      <div className="bg-background border rounded px-2 py-1">
        <span className="text-lg text-black dark:text-white">{formatNumber(timeLeft.seconds)}</span>
        <span className="text-xs text-muted-foreground block">Secs</span>
      </div>
    </div>
  )
}

export default CountdownTimer
