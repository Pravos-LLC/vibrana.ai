'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, BriefcaseBusiness } from 'lucide-react'

interface AdminNavProps {
  onLogout?: () => void
}

export function AdminNav({ onLogout }: AdminNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/admin/leads',
      label: 'Sales Pipeline',
      icon: <BriefcaseBusiness className="w-4 h-4" />,
    },
  ]

  return (
    <nav className="border-b border-line-subtle bg-surface-frost backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/admin/leads" className="font-mono font-bold text-lg text-ink">
              Admin
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 font-mono text-sm transition-colors ${
                      isActive
                        ? 'text-brand-violet-strong bg-violet-500/10 border-b-2 border-violet-500'
                        : 'text-ink-secondary hover:text-ink hover:bg-surface-card'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-ink-secondary hover:text-ink transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
