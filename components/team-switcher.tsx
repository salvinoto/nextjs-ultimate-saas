"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CaretSortIcon, PlusIcon } from "@radix-ui/react-icons"
import { useActiveOrganization, useListOrganizations, organization } from "@/lib/auth-client"
import { CreateOrganizationDialog } from "@/app/dashboard/organization-card"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const organizations = useListOrganizations()
  const { data: activeOrganization } = useActiveOrganization()
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeOrganization?.logo ? (
                  <img 
                    src={activeOrganization.logo} 
                    alt={activeOrganization.name} 
                    className="size-4 rounded"
                  />
                ) : (
                  <span className="size-4 flex items-center justify-center font-semibold">
                    {activeOrganization?.name?.[0] || 'P'}
                  </span>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeOrganization?.name || "Personal"}
                </span>
              </div>
              <CaretSortIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                organization.setActive({ organizationId: null })
              }}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                P
              </div>
              Personal
            </DropdownMenuItem>
            {organizations.data?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => {
                  organization.setActive({ organizationId: org.id })
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  {org.logo ? (
                    <img src={org.logo} alt={org.name} className="size-4 rounded" />
                  ) : (
                    <span>{org.name[0]}</span>
                  )}
                </div>
                {org.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 p-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Create Organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {/* <CreateOrganizationDialog /> */}
    </SidebarMenu>
  )
}
