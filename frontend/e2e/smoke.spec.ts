import { expect, test } from '@playwright/test'

test('consultation-start page renders', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: '相談を始める' }),
  ).toBeVisible()
})

test('unknown route renders not-found page and links home', async ({
  page,
}) => {
  await page.goto('/does-not-exist')

  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Back to starter' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByRole('heading', { name: '相談を始める' }),
  ).toBeVisible()
})
