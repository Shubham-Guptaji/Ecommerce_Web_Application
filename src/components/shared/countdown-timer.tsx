'use client'

import { useState, useEffect, useCallback } from 'react'

interface CountdownTimerProps {
  targetDate: Date | string
  onExpire?: () => void
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
  const calculateTimeLeft = useCallback(() => {
    const difference = new Date(targetDate).getTime() - new Date().getTime()

    if (difference <= 0) {
      onExpire?.()
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    }
  }, [targetDate, onExpire])

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [calculateTimeLeft])

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
