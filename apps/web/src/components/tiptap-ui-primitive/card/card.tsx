import type * as React from "react"
import { cn } from "@/lib/tiptap-utils"
import "@/components/tiptap-ui-primitive/card/card.scss"

const Card = ({
  className,
  ref,
  ...props
}: React.ComponentProps<"div"> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div className={cn("tiptap-card", className)} ref={ref} {...props} />
)
Card.displayName = "Card"

const CardHeader = ({
  className,
  ref,
  ...props
}: React.ComponentProps<"div"> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div className={cn("tiptap-card-header", className)} ref={ref} {...props} />
)
CardHeader.displayName = "CardHeader"

const CardBody = ({
  className,
  ref,
  ...props
}: React.ComponentProps<"div"> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div className={cn("tiptap-card-body", className)} ref={ref} {...props} />
)
CardBody.displayName = "CardBody"

const CardItemGroup = ({
  className,
  orientation = "vertical",
  ref,
  ...props
}: (React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
}) & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    className={cn("tiptap-card-item-group", className)}
    data-orientation={orientation}
    ref={ref}
    {...props}
  />
)
CardItemGroup.displayName = "CardItemGroup"

const CardGroupLabel = ({
  className,
  ref,
  ...props
}: React.ComponentProps<"div"> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div className={cn("tiptap-card-group-label", className)} ref={ref} {...props} />
)
CardGroupLabel.displayName = "CardGroupLabel"

const CardFooter = ({
  className,
  ref,
  ...props
}: React.ComponentProps<"div"> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div className={cn("tiptap-card-footer", className)} ref={ref} {...props} />
)
CardFooter.displayName = "CardFooter"

export { Card, CardBody, CardFooter, CardGroupLabel, CardHeader, CardItemGroup }
