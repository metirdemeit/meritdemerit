// End-to-end smoke tests against a real backend (see .github/workflows/frontend-ci.yml).
import { test, expect } from '@playwright/test';

const PASSWORD = 'e2e-pass';

async function signIn(page, username) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Signed in')).toBeVisible();
}

async function skipTour(page) {
  const dialog = page.getByRole('dialog', { name: 'Welcome!' });
  await dialog.waitFor({ timeout: 4000 }).catch(() => {});
  if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Skip' }).click();
}

async function expectNoSideScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('teacher assigns points and the student sees them', async ({ page, browser }) => {
  await signIn(page, 'e2e.teacher');
  await skipTour(page);
  await expect(page.getByText('Teacher Dashboard')).toBeVisible();
  await expectNoSideScroll(page);

  await page.getByRole('button', { name: 'Students' }).click();
  await page.getByRole('button', { name: 'Class 7A' }).click();
  await page.getByRole('button', { name: 'Noah Bennett' }).click();

  const drawer = page.getByRole('presentation').filter({ hasText: 'Assign Merits/Demerits' });
  await drawer.getByText('Active in class').click();
  await drawer.getByLabel('Comment (required)').fill('Explained the homework to the group');
  await drawer.getByRole('button', { name: /^Assign/ }).click();
  await expect(page.getByText('Points assigned')).toBeVisible();
  await expect(page.getByText('68 points')).toBeVisible();

  // The student sees the entry, the new total and their progress.
  const studentContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const student = await studentContext.newPage();
  await signIn(student, 'e2e.noah');
  await skipTour(student);
  await expect(student.getByText('Explained the homework to the group')).toBeVisible();
  await expect(student.getByText('Your progress')).toBeVisible();
  await expect(student.getByText(/points to Demerit Level 1/)).toBeVisible();
  await expectNoSideScroll(student);
  await studentContext.close();
});

test('admin creates a demerit rule from a positive number', async ({ page }) => {
  await signIn(page, 'e2e.admin');
  await skipTour(page);
  await page.getByRole('button', { name: 'Codes' }).click();
  await page.getByRole('button', { name: 'Add New Rule' }).click();

  const form = page.getByRole('dialog').or(page.getByRole('presentation')).filter({ hasText: 'Add New Rule' }).last();
  await form.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Demerit (-)' }).click();
  await form.getByLabel('Points').fill('2');
  await form.getByLabel('Description').fill('Uniform violation');
  await form.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText('Rule created')).toBeVisible();
  const card = page.getByText('Uniform violation').locator('xpath=ancestor::*[contains(@class,"MuiCard-root")][1]');
  await expect(card.getByText('-2')).toBeVisible();
});

test('the in-app tour can be opened and stepped through', async ({ page }) => {
  await signIn(page, 'e2e.olivia');
  await skipTour(page);
  await page.getByRole('button', { name: 'Open the app guide' }).click();
  const tour = page.getByRole('dialog');
  await expect(tour.getByText('Student · 1 of 6')).toBeVisible();
  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(tour.getByText('Your points')).toBeVisible();
  await tour.getByRole('button', { name: 'Back' }).click();
  await expect(tour.getByText('Welcome!')).toBeVisible();
  await tour.getByRole('button', { name: 'Close guide' }).click();
  await expect(tour).toBeHidden();
});

test('the illustrated guide is served with the app', async ({ page }) => {
  await page.goto('/guide/index.html');
  await expect(page.getByRole('heading', { name: /how to use it/ })).toBeVisible();
  await expectNoSideScroll(page);
});
