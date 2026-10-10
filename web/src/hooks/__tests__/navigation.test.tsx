/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createInstance } from 'i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'

import { useSidebarData } from '../use-sidebar-data'
import { useTopNavLinks } from '../use-top-nav-links'

function NavigationLinks() {
  const links = useTopNavLinks()
  return (
    <>
      {links.map((link) => (
        <a key={link.href} href={link.href}>
          {link.title}
        </a>
      ))}
    </>
  )
}

function SidebarLinks() {
  const { navGroups } = useSidebarData()
  return (
    <>
      {navGroups.map((group) => (
        <section key={group.id} aria-label={group.title}>
          {group.items.map((item) => (
            <a key={item.title} href={item.url}>
              {item.title}
            </a>
          ))}
        </section>
      ))}
    </>
  )
}

for (const status of [
  null,
  {
    HeaderNavModules: JSON.stringify({
      home: true,
      console: true,
      pricing: { enabled: true, requireAuth: false },
      rankings: { enabled: true, requireAuth: false },
      docs: true,
      about: true,
    }),
    docs_link: 'https://docs.example.com',
  },
]) {
  test(`top navigation omits removed entries with ${status ? 'enabled server configuration' : 'default configuration'}`, async () => {
    const i18n = createInstance()
    await i18n.init({ lng: 'en', resources: {} })
    const client = new QueryClient()
    client.setQueryData(['status'], status)
    try {
      const html = renderToStaticMarkup(
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={client}>
            <NavigationLinks />
          </QueryClientProvider>
        </I18nextProvider>
      )
      assert.equal(
        html,
        '<a href="/">Home</a><a href="/dashboard">Console</a><a href="/pricing">Model Square</a>'
      )
    } finally {
      client.clear()
    }
  })
}

test('sidebar navigation omits Playground and chat jump links while retaining console navigation', async () => {
  const i18n = createInstance()
  await i18n.init({ lng: 'en', resources: {} })
  const html = renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <SidebarLinks />
    </I18nextProvider>
  )
  assert.doesNotMatch(html, /Playground|Chat|playground|chat/)
  assert.match(html, /href="\/keys"/)
  assert.match(html, /href="\/dashboard\/overview"/)
})
