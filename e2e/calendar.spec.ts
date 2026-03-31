import { test, expect } from '@playwright/test'
import { seedDB } from './helpers/seed'

test.describe('Calendar page', () => {
  test.beforeEach(async ({ page }) => {
    await seedDB(page)
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('shows month view by default with current month', async ({ page }) => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const currentMonth = months[new Date().getMonth()]
    await expect(page.getByText(new RegExp(currentMonth))).toBeVisible()
  })

  test('shows weekday headers', async ({ page }) => {
    await expect(page.getByText('Sun')).toBeVisible()
    // use exact to avoid matching 'month' button
    await expect(page.getByText('Mon', { exact: true })).toBeVisible()
    await expect(page.getByText('Sat')).toBeVisible()
  })

  test('shows today highlighted with blue circle', async ({ page }) => {
    const todayNum = new Date().getDate().toString()
    const todayCell = page.locator('[class*="bg-\\[\\#1d9bf0\\]"][class*="rounded-full"]').filter({ hasText: todayNum })
    await expect(todayCell).toBeVisible()
  })

  test('shows habit events on today cell', async ({ page }) => {
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    await expect(page.getByText('Morning Run').first()).toBeVisible()
  })

  test('shows task events on today cell', async ({ page }) => {
    await page.waitForSelector('text=Review pull requests', { timeout: 10000 })
    await expect(page.getByText('Review pull requests').first()).toBeVisible()
  })

  test('can switch to Week view', async ({ page }) => {
    await page.getByRole('button', { name: 'week' }).click()
    await page.waitForTimeout(600)
    // week view shows time column
    await expect(page.locator('text=/^01:00$/')).toBeVisible()
  })

  test('can switch to Day view', async ({ page }) => {
    await page.getByRole('button', { name: 'day' }).click()
    await page.waitForTimeout(600)
    await expect(page.locator('text=/^01:00$/')).toBeVisible()
    // only today's column shown
    const todayHeader = new Date().getDate().toString()
    await expect(page.locator('[class*="font-semibold"]').filter({ hasText: todayHeader }).first()).toBeVisible()
  })

  test('can switch to Year view', async ({ page }) => {
    await page.getByRole('button', { name: 'year' }).click()
    await page.waitForTimeout(600)
    // Year view shows month labels like Jan, Feb, etc.
    await expect(page.getByText('Jan')).toBeVisible()
  })

  test('can navigate to next month', async ({ page }) => {
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-chevron-right"], svg') }).nth(1).click()
    await page.waitForTimeout(400)
    const nextMonth = new Date(new Date().setMonth(new Date().getMonth() + 1))
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    await expect(page.getByText(months[nextMonth.getMonth()])).toBeVisible()
  })

  test('can navigate back to current month', async ({ page }) => {
    // go forward then back
    await page.locator('button').filter({ has: page.locator('svg') }).nth(1).click()
    await page.locator('button').filter({ has: page.locator('svg') }).nth(0).click()
    await page.waitForTimeout(400)
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    await expect(page.getByText(months[new Date().getMonth()])).toBeVisible()
  })

  test('week view shows habit events positioned by time', async ({ page }) => {
    await page.getByRole('button', { name: 'week' }).click()
    await page.waitForTimeout(800)
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    await expect(page.getByText('Morning Run').first()).toBeVisible()
  })

  test('completed habit shows checkmark in month view', async ({ page }) => {
    // Read 30 min is completed — its event chip shows ✓
    await page.waitForSelector('text=Read 30 min', { timeout: 10000 })
    // The chip is a div with both the ✓ span and the title span
    await expect(page.locator('text=✓').first()).toBeVisible()
  })
})
