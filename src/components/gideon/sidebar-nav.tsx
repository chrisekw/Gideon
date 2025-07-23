"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home, History, Settings, Info } from 'lucide-react';
import { Separator } from '../ui/separator';

const mainMenuItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/history', label: 'History', icon: History },
];

const footerMenuItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/about', label: 'About', icon: Info },
];

export default function SidebarNav({ isFooter = false }: { isFooter?: boolean }) {
  const pathname = usePathname();

  const items = isFooter ? footerMenuItems : mainMenuItems;

  return (
    <nav className="flex flex-col h-full">
      {isFooter && <Separator className="my-1 mx-2 w-auto" />}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
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
