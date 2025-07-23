
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, History, Settings, Info, LogOut } from 'lucide-react';
import { Separator } from '../ui/separator';

const mainMenuItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const footerMenuItems = [
  { href: '/about', label: 'About', icon: Info },
];

const logoutItem = {
    href: '#',
    label: 'Log out',
    icon: LogOut,
    onClick: () => alert('Logout functionality not implemented.'),
}

export default function SidebarNav({ isFooter = false }: { isFooter?: boolean }) {
  const pathname = usePathname();

  if (isFooter) {
      return (
          <nav className="flex flex-col">
               <Separator className="my-2 mx-4 w-auto" />
               <SidebarMenu>
                    {footerMenuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                            asChild
                            variant="ghost"
                            size="default"
                            isActive={pathname === item.href}
                            >
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                     <SidebarMenuItem>
                        <SidebarMenuButton
                        variant="ghost"
                        size="default"
                        onClick={logoutItem.onClick}
                        >
                        <logoutItem.icon />
                        <span>{logoutItem.label}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
               </SidebarMenu>
          </nav>
      )
  }

  return (
    <nav className="flex flex-col h-full">
      <SidebarMenu>
        {mainMenuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              variant="ghost"
              size="default"
              isActive={pathname === item.href}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
