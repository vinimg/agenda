import { test, expect } from '@playwright/test'
import { seedDB } from './helpers/seed'

test.describe('Today page', () => {
  test.beforeEach(async ({ page }) => {
    await seedDB(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('shows today date and title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
    // date string is present somewhere on the page
    await expect(page.locator('text=/Friday|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday/')).toBeVisible()
  })

  test('shows habits section with seeded habits', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'HABITS' })).toBeVisible()
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    await expect(page.getByText('Morning Run')).toBeVisible()
    await expect(page.getByText('07:00')).toBeVisible()
    await expect(page.getByText('Local Park')).toBeVisible()
  })

  test('shows Read 30 min as completed (strikethrough)', async ({ page }) => {
    await page.waitForSelector('text=Read 30 min', { timeout: 10000 })
    const readRow = page.locator('text=Read 30 min')
    await expect(readRow).toBeVisible()
    // completed habit has line-through style
    await expect(readRow).toHaveCSS('text-decoration-line', 'line-through')
  })

  test('can mark Morning Run as complete', async ({ page }) => {
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    const morningRunRow = page.locator('[class*="flex"][class*="items-center"]').filter({ hasText: 'Morning Run' }).first()
    const checkbox = morningRunRow.locator('button').first()
    await checkbox.click()
    await page.waitForTimeout(500)
    // after click, title should have line-through
    await expect(page.locator('text=Morning Run')).toHaveCSS('text-decoration-line', 'line-through')
  })

  test('shows tasks section with today tasks', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'TASKS' })).toBeVisible()
    await page.waitForSelector('text=Review pull requests', { timeout: 10000 })
    await expect(page.getByText('Review pull requests')).toBeVisible()
    await expect(page.getByText('Deploy agenda to Vercel')).toBeVisible()
    await expect(page.getByText('Home office').first()).toBeVisible()
  })

  test('shows Setup Supabase as done (strikethrough)', async ({ page }) => {
    await page.waitForSelector('text=Setup Supabase', { timeout: 10000 })
    await expect(page.locator('text=Setup Supabase')).toHaveCSS('text-decoration-line', 'line-through')
  })

  test('can check off a task', async ({ page }) => {
    await page.waitForSelector('text=Review pull requests', { timeout: 10000 })
    const taskRow = page.locator('.group').filter({ hasText: 'Review pull requests' }).first()
    await taskRow.locator('button').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Review pull requests')).toHaveCSS('text-decoration-line', 'line-through')
  })

  test('opens task form when clicking + button', async ({ page }) => {
    await page.locator('button[class*="text-\\[\\#1d9bf0\\]"]').click()
    await expect(page.getByText('New Task')).toBeVisible()
    await expect(page.getByPlaceholder('Task title')).toBeVisible()
  })

  test('can create a new task from today page', async ({ page }) => {
    // click the + button in the tasks section header
    await page.locator('button[class*="text-\\[\\#1d9bf0\\]"]').click()
    await page.getByPlaceholder('Task title').fill('Test task from e2e')
    await page.getByRole('button', { name: 'Add Task' }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Test task from e2e')).toBeVisible()
  })
})
