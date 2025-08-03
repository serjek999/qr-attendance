"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/app/lib/utils"

export function TimePicker({ 
  value, 
  onChange, 
  className,
  placeholder = "Select time",
  disabled = false 
}) {
  const [timeValue, setTimeValue] = React.useState(value || "")

  React.useEffect(() => {
    setTimeValue(value || "")
  }, [value])

  const handleTimeChange = (e) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    if (onChange) {
      onChange(newTime)
    }
  }

  const handleTimeSelect = (hours, minutes) => {
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    setTimeValue(timeString)
    if (onChange) {
      onChange(timeString)
    }
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayTime = new Date().setHours(hour, minute, 0, 0)
        const displayString = new Date(displayTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        options.push({ value: timeString, display: displayString, hour, minute })
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-white/20 text-white hover:bg-white/20",
            !timeValue && "text-white/50",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {timeValue ? (
            new Date().setHours(
              parseInt(timeValue.split(':')[0]), 
              parseInt(timeValue.split(':')[1]), 
              0, 
              0
            ) && new Date(new Date().setHours(
              parseInt(timeValue.split(':')[0]), 
              parseInt(timeValue.split(':')[1]), 
              0, 
              0
            )).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white/10 backdrop-blur-md border border-white/20" align="start">
        <div className="p-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className="w-full bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
              {timeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-white hover:bg-white/20"
                  onClick={() => handleTimeSelect(option.hour, option.minute)}
                >
                  {option.display}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 