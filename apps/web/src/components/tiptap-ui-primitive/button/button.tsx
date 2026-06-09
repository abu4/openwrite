import * as React from "react"

// --- Tiptap UI Primitive ---
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tiptap-ui-primitive/tooltip"

// --- Lib ---
import { cn, parseShortcutKeys } from "@/lib/tiptap-utils"

import "@/components/tiptap-ui-primitive/button/button-colors.scss"
import "@/components/tiptap-ui-primitive/button/button-group.scss"
import "@/components/tiptap-ui-primitive/button/button.scss"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  className?: string
  shortcutKeys?: string
  showTooltip?: boolean
  tooltip?: React.ReactNode
}

export const ShortcutDisplay: React.FC<{ shortcuts: string[] }> = ({ shortcuts }) => {
  if (shortcuts.length === 0) {
    return null
  }

  return (
    <div>
      {shortcuts.map((key, index) => (
        <React.Fragment key={`shortcut-${key}`}>
          {index > 0 && <kbd>+</kbd>}
          <kbd>{key}</kbd>
        </React.Fragment>
      ))}
    </div>
  )
}

export const Button = ({
  className,
  children,
  tooltip,
  showTooltip = true,
  shortcutKeys,
  asChild = false,
  "aria-label": ariaLabel,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const shortcuts = React.useMemo(() => parseShortcutKeys({ shortcutKeys }), [shortcutKeys])

  // When asChild is true, always render just the button element (no tooltip)
  // This allows parent components like PopoverTrigger to properly merge with it
  if (asChild || !(tooltip && showTooltip)) {
    return (
      <button
        aria-label={ariaLabel}
        className={cn("tiptap-button", className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }

  return (
    <Tooltip delay={200}>
      <TooltipTrigger asChild>
        <button
          aria-label={ariaLabel}
          className={cn("tiptap-button", className)}
          ref={ref}
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {tooltip}
        <ShortcutDisplay shortcuts={shortcuts} />
      </TooltipContent>
    </Tooltip>
  )
}

Button.displayName = "Button"

export const ButtonGroup = ({
  className,
  children,
  orientation = "vertical",
  ref,
  ...props
}: (React.ComponentProps<"fieldset"> & {
  orientation?: "horizontal" | "vertical"
}) & { ref?: React.Ref<HTMLFieldSetElement> }) => (
  <fieldset
    className={cn("tiptap-button-group", className)}
    data-orientation={orientation}
    ref={ref}
    {...props}
  >
    {children}
  </fieldset>
)
ButtonGroup.displayName = "ButtonGroup"

export default Button
