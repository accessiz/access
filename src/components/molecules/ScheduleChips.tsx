"use client";

import * as React from "react";
import { CalendarDays, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Project } from "@/lib/types";

// Helper para convertir hora 12h a minutos totales para ordenamiento
function timeToMinutes(timeStr: string) {
  const parts = timeStr.split(" ");
  if (parts.length < 2) return 0;

  const [time, period] = parts;
  const [hoursStr, minutesStr] = time.split(":");
  let hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

type Props = {
  schedule: Project["schedule"];
  className?: string;
  /** When true, include year in date label. */
  includeYear?: boolean;
};

export function ScheduleChips({ schedule, className, includeYear }: Props) {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return null;

  const groupedByDate: Record<string, { startTime: string; endTime: string }[]> = {};
  for (const item of schedule) {
    if (item?.date && item.startTime && item.endTime) {
      groupedByDate[item.date] ??= [];
      groupedByDate[item.date].push({ startTime: item.startTime, endTime: item.endTime });
    }
  }

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className={cn("space-y-2", className)}>
      {sortedDates.map((dateStr) => {
        const slots = groupedByDate[dateStr]
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        const dateObj = new Date(`${dateStr}T00:00:00`);
        const formattedDate = dateObj.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          ...(includeYear ? { year: "numeric" as const } : null),
        });

        return (
          <div
            key={dateStr}
            className={cn(
              "rounded-lg border bg-background",
              "p-3 w-fit",
              "flex flex-col gap-2"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-body font-medium capitalize truncate">
                {formattedDate}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {slots.map((slot, idx) => (
                <div
                  key={`${dateStr}-${idx}`}
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    "rounded-lg border",
                    "bg-muted/30",
                    "px-2 py-1",
                    "text-label"
                  )}
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-foreground/90 whitespace-nowrap">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
