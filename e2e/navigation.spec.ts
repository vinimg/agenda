import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('sidebar shows all nav items on desktop', async ({ page }) => {
    const nav = page.locator('nav').first()
    await expect(nav.getByText('Today')).toBeVisible()
    await expect(nav.getByText('Calendar')).toBeVisible()
    await expect(nav.getByText('Tasks')).toBeVisible()
    await expect(nav.getByText('Habits')).toBeVisible()
    await expect(nav.getByText('Settings')).toBeVisible()
  })

  test('navigates to Calendar via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL('/calendar')
  })

  test('navigates to Tasks via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Tasks' }).click()
    await expect(page).toHaveURL('/tasks')
  })

  test('navigates to Habits via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Habits' }).click()
    await expect(page).toHaveURL('/habits')
  })

  test('navigates to Settings via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL('/settings')
  })

  test('active nav item is highlighted', async ({ page }) => {
    const nav = page.locator('nav').first()
    const todayLink = nav.getByRole('link', { name: 'Today' })
    await expect(todayLink).toHaveClass(/text-\[#e7e9ea\]/)
  })

  test('Settings page loads', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('direct URL navigation works (SPA fallback)', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
    await page.goto('/habits')
    await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible()
    await page.goto('/calendar')
    await expect(page.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)).toBeVisible()
  })
})
