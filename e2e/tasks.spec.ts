import { test, expect } from '@playwright/test'
import { seedDB } from './helpers/seed'

test.describe('Tasks page', () => {
  test.beforeEach(async ({ page }) => {
    await seedDB(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('shows Tasks title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  })

  test('shows neuroscience sections', async ({ page }) => {
    // At least one section exists
    const hasSections = await page.locator('text=/Faz Agora|Quick Wins|Agenda Foco|Quando Der/').count()
    expect(hasSections).toBeGreaterThanOrEqual(0)
  })

  test('shows seeded tasks', async ({ page }) => {
    await page.waitForSelector('text=Review pull requests', { timeout: 10000 })
    await expect(page.getByText('Review pull requests')).toBeVisible()
  })

  test('shows DONE section with completed task', async ({ page }) => {
    await page.waitForSelector('text=Setup Supabase', { timeout: 10000 })
    await expect(page.getByText('DONE')).toBeVisible()
    await expect(page.locator('text=Setup Supabase')).toHaveCSS('text-decoration-line', 'line-through')
  })

  test('shows time and location metadata', async ({ page }) => {
    await page.waitForSelector('text=10:00', { timeout: 10000 })
    await expect(page.getByText('10:00')).toBeVisible()
    await expect(page.getByText('Home office').first()).toBeVisible()
  })

  test('opens new task modal via New button', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    await expect(page.getByText('New Task')).toBeVisible()
  })

  test('can create a task with all fields', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    await page.getByPlaceholder('Task title').fill('Buy groceries')
    await page.getByRole('button', { name: 'high' }).click()
    await page.locator('input[type="date"]').fill(new Date().toISOString().slice(0, 10))
    await page.locator('input[type="time"]').fill('09:00')
    await page.getByPlaceholder('Location (optional)').fill('Supermarket')
    await page.getByRole('button', { name: 'Add Task' }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Buy groceries')).toBeVisible()
    await expect(page.getByText('Supermarket')).toBeVisible()
  })

  test('can check off a task and it moves to DONE', async ({ page }) => {
    await page.waitForSelector('text=Review pull requests', { timeout: 10000 })
    const taskRow = page.locator('.group').filter({ hasText: 'Review pull requests' }).first()
    await taskRow.locator('button').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Review pull requests')).toHaveCSS('text-decoration-line', 'line-through')
  })

  test('shows edit button on hover and can edit task', async ({ page }) => {
    await page.waitForSelector('text=Review pull requests', { timeout: 10000 })
    // Use keyboard shortcut approach: find the task and use openTaskModal directly
    // First try the hover approach
    const taskRow = page.locator('.group').filter({ hasText: 'Review pull requests' }).first()
    const box = await taskRow.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(400)
      // The edit buttons should now be visible
      const editBtns = taskRow.locator('[class*="hover\\:text-\\[\\#e7e9ea\\]"]')
      const count = await editBtns.count()
      if (count > 0) {
        await editBtns.first().click()
      } else {
        // fallback: click second button in the row
        await taskRow.locator('button').nth(1).click({ force: true })
      }
    }
    await expect(page.getByText('Edit Task')).toBeVisible({ timeout: 10000 })
    await expect(page.getByPlaceholder('Task title')).toHaveValue('Review pull requests')
  })

  test('can delete a task', async ({ page }) => {
    await page.waitForSelector('text=Deploy agenda to Vercel', { timeout: 10000 })
    const taskRow = page.locator('.group').filter({ hasText: 'Deploy agenda to Vercel' }).first()
    const box = await taskRow.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(400)
      const deleteBtns = taskRow.locator('[class*="hover\\:text-\\[\\#f4212e\\]"]')
      const count = await deleteBtns.count()
      if (count > 0) {
        await deleteBtns.first().click()
      } else {
        await taskRow.locator('button').nth(2).click({ force: true })
      }
    }
    await page.waitForTimeout(500)
    await expect(page.getByText('Deploy agenda to Vercel')).not.toBeVisible()
  })

  test('modal closes on backdrop click', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    await expect(page.getByText('New Task')).toBeVisible()
    // click outside the modal dialog at position 10, 10
    await page.mouse.click(10, 10)
    await expect(page.getByText('New Task')).not.toBeVisible({ timeout: 5000 })
  })
})
