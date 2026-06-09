import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import type * as React from "react"
import { cn } from "@/lib/tiptap-utils"
import "@/components/tiptap-ui-primitive/dropdown-menu/dropdown-menu.scss"

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root modal={false} {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal {...props} />
}

const DropdownMenuTrigger = ({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> & {
  ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.Trigger> | null>
}) => <DropdownMenuPrimitive.Trigger ref={ref} {...props} />
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuItem = DropdownMenuPrimitive.Item

const DropdownMenuSubTrigger = DropdownMenuPrimitive.SubTrigger

const DropdownMenuSubContent = ({
  className,
  portal = true,
  ref,
  ...props
}: (React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
  portal?: boolean | React.ComponentProps<typeof DropdownMenuPortal>
}) & {
  ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.SubContent> | null>
}) => {
  const content = (
    <DropdownMenuPrimitive.SubContent
      className={cn("tiptap-dropdown-menu", className)}
      ref={ref}
      {...props}
    />
  )

  return portal ? (
    <DropdownMenuPortal {...(typeof portal === "object" ? portal : {})}>
      {content}
    </DropdownMenuPortal>
  ) : (
    content
  )
}
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = ({
  className,
  sideOffset = 4,
  portal = false,
  ref,
  ...props
}: (React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
  portal?: boolean
}) & {
  ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.Content> | null>
}) => {
  const content = (
    <DropdownMenuPrimitive.Content
      className={cn("tiptap-dropdown-menu", className)}
      onCloseAutoFocus={(e) => e.preventDefault()}
      ref={ref}
      sideOffset={sideOffset}
      {...props}
    />
  )

  return portal ? (
    <DropdownMenuPortal {...(typeof portal === "object" ? portal : {})}>
      {content}
    </DropdownMenuPortal>
  ) : (
    content
  )
}
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
