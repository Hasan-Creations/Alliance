"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const DonutChart = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ChartContainer> & {
    data: object[]
    dataKey: string
    nameKey: string
  }
>(({ data, dataKey, nameKey, config, className, ...props }, ref) => {
  return (
    <ChartContainer
      config={config ?? {}}
      className="mx-auto aspect-square"
      ref={ref}
      {...props}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        {props.children}
      </PieChart>
    </ChartContainer>
  )
})
DonutChart.displayName = "DonutChart"

const Donut = React.forwardRef<
  any,
  Omit<React.ComponentProps<typeof Pie>, 'ref'>
>(({ className, ...props }, ref) => {
  return (
    <Pie
      ref={ref}
      className={className}
      strokeWidth={2}
      innerRadius="calc(min(var(--chart-width), var(--chart-height)) / 2 * 0.6)"
      {...props}
    />
  )
})
Donut.displayName = "Donut"

type DonutLabelProps = React.ComponentProps<typeof Label> & {
  value: string;
  label: React.ReactNode;
  valueClassName?: string;
};

function DonutLabel({
  label,
  value,
  className,
  valueClassName,
  ...props
}: DonutLabelProps) {
  return (
    <Label
      {...props}
      className="ui-screen-hidden"
      content={({ viewBox }) => {
        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
          return (
            <>
              <text
                x={viewBox.cx}
                y={viewBox.cy}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                <tspan
                  x={viewBox.cx}
                  y={(viewBox.cy || 0) - 10}
                  className="fill-foreground text-sm"
                >
                  {label}
                </tspan>
                <tspan
                  x={viewBox.cx}
                  y={(viewBox.cy || 0) + 12}
                  className="fill-foreground text-2xl font-bold"
                >
                  {value}
                </tspan>
              </text>
            </>
          )
        }
      }}
    />
  )
}

export { Donut, DonutChart, DonutLabel }