import { test, expect } from '@playwright/test'
import { seedDB } from './helpers/seed'

test.describe('Habits page', () => {
  test.beforeEach(async ({ page }) => {
    await seedDB(page)
    await page.goto('/habits')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('shows Habits title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible()
  })

  test('shows all seeded habits', async ({ page }) => {
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    await expect(page.getByText('Morning Run')).toBeVisible()
    await expect(page.getByText('Read 30 min')).toBeVisible()
    await expect(page.getByText('Gym')).toBeVisible()
  })

  test('shows frequency and time metadata', async ({ page }) => {
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    await expect(page.getByText(/Diário · 07:00/)).toBeVisible()
    await expect(page.getByText(/Diário · 22:00/)).toBeVisible()
    await expect(page.getByText(/Seg, Qua, Sex|Seg, Ter|Qua, Sex/)).toBeVisible()
  })

  test('shows streak counts with flame icon', async ({ page }) => {
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    // Morning Run streak = 5, visible in its row
    await expect(page.getByText('5').first()).toBeVisible()
  })

  // ─── Character card (RPG system) ────────────────────────────────────────────
  test('shows character card with attributes when habits have RPG stats', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 })
    await expect(page.locator('[data-testid="character-card"]')).toBeVisible()
    await expect(page.getByText('Personagem em evolução')).toBeVisible()
  })

  test('character card shows active attributes', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 })
    const card = page.locator('[data-testid="character-card"]')
    await expect(card.getByText('Força')).toBeVisible()
    await expect(card.getByText('Inteligência')).toBeVisible()
  })

  test('character card shows level and title', async ({ page }) => {
    await page.waitForSelector('[data-testid="character-card"]', { timeout: 10000 })
    await expect(page.getByText(/Nível \d+ · /)).toBeVisible()
  })

  // ─── Sub-habits ──────────────────────────────────────────────────────────────
  test('sub-habit Gym appears under parent Morning Run', async ({ page }) => {
    await page.waitForSelector('text=Gym', { timeout: 10000 })
    // Gym is visible below Morning Run
    await expect(page.getByText('Gym')).toBeVisible()
  })

  test('parent habit has collapse toggle button', async ({ page }) => {
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    // Morning Run is a parent, should have a chevron button
    const parentCard = page.locator('[class*="rounded-xl"]').filter({ hasText: 'Morning Run' }).first()
    const chevron = parentCard.locator('button').first()
    await expect(chevron).toBeVisible()
  })

  test('can collapse and expand sub-habits', async ({ page }) => {
    await page.waitForSelector('text=Gym', { timeout: 10000 })
    await expect(page.getByText('Gym')).toBeVisible()

    // Click the chevron to collapse
    const parentCard = page.locator('[class*="rounded-xl"]').filter({ hasText: 'Morning Run' }).first()
    await parentCard.locator('button').first().click()
    await page.waitForTimeout(300)
    await expect(page.getByText('Gym')).not.toBeVisible()

    // Click again to expand
    await parentCard.locator('button').first().click()
    await page.waitForTimeout(300)
    await expect(page.getByText('Gym')).toBeVisible()
  })

  // ─── Target hours progress bar ───────────────────────────────────────────────
  test('shows weekly target progress bar for habit with target', async ({ page }) => {
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    // Morning Run has targetHoursPerWeek: 5
    await expect(page.getByText(/Meta: 5h\/sem/)).toBeVisible()
  })

  // ─── Form: new features ──────────────────────────────────────────────────────
  test('opens new habit modal via New button', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    await expect(page.getByText('New Habit')).toBeVisible()
    await expect(page.getByPlaceholder('Habit name')).toBeVisible()
  })

  test('habit form shows RPG attribute selector', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    const form = page.locator('[class*="rounded-t-2xl"], [class*="rounded-2xl"]').last()
    await expect(form.getByText('Atributo RPG')).toBeVisible()
    await expect(form.getByText('Força')).toBeVisible()
    await expect(form.getByText('Disciplina')).toBeVisible()
  })

  test('habit form shows target hours input', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    const form = page.locator('[class*="rounded-t-2xl"], [class*="rounded-2xl"]').last()
    await expect(form.getByText('Meta de horas')).toBeVisible()
    await expect(form.getByText('sem', { exact: true })).toBeVisible()
  })

  test('habit form shows sub-habit parent selector when habits exist', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    await expect(page.getByText('Sub-hábito de')).toBeVisible()
  })

  test('can create a habit with RPG attribute and target hours', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    await page.getByPlaceholder('Habit name').fill('Meditate')
    // Select wellness attribute
    await page.getByText('Bem-estar').click()
    // Set target hours
    await page.locator('input[type="number"]').last().fill('1')
    await page.getByRole('button', { name: 'Add Habit' }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Meditate')).toBeVisible()
  })

  test('can create a daily habit', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    await page.getByPlaceholder('Habit name').fill('Cold shower')
    await page.getByRole('button', { name: 'daily' }).click()
    await page.locator('input[type="time"]').first().fill('06:30')
    await page.getByRole('button', { name: 'Add Habit' }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Cold shower')).toBeVisible()
  })

  test('can create a weekly habit with specific days', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    await page.getByPlaceholder('Habit name').fill('Piano practice')
    await page.getByRole('button', { name: 'weekly' }).click()
    await page.getByRole('button', { name: 'Tu' }).click()
    await page.getByRole('button', { name: 'Th' }).click()
    await page.getByRole('button', { name: 'Add Habit' }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Piano practice')).toBeVisible()
  })

  test('shows edit button on hover', async ({ page }) => {
    await page.waitForSelector('text=Morning Run', { timeout: 10000 })
    const habitRow = page.locator('[class*="flex"][class*="items-center"]').filter({ hasText: 'Morning Run' }).first()
    await habitRow.hover()
    await expect(habitRow.locator('button[class*="hover:text-\\[\\#e7e9ea\\]"]').first()).toBeVisible()
  })

  test('can delete a habit', async ({ page }) => {
    await page.waitForSelector('text=Gym', { timeout: 10000 })
    const habitRow = page.locator('[class*="flex"][class*="items-center"]').filter({ hasText: 'Gym' }).first()
    await habitRow.hover()
    await habitRow.locator('button').last().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Gym')).not.toBeVisible()
  })

  test('color picker shows 8 color options', async ({ page }) => {
    await page.getByRole('button', { name: 'New' }).click()
    const colorButtons = page.locator('[class*="rounded-full"][class*="w-7"]')
    await expect(colorButtons).toHaveCount(8)
  })
})
