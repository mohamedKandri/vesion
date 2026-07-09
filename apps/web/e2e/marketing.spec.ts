import { expect, test } from '@playwright/test';

test.describe('Marketing site', () => {
  test('home page renders the hero and universe sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/extraordinary software/i);
    await expect(page.getByRole('link', { name: /start a project/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();
  });

  test('navigation reaches the services page', async ({ page }) => {
    await page.goto('/services');
    await expect(page.getByRole('heading', { name: /ten disciplines/i })).toBeVisible();
  });

  test('contact form validates required fields', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test('legal pages are reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
  });

  test('has no severe accessibility landmarks missing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main#main-content')).toBeAttached();
    await expect(page.locator('header')).toBeAttached();
    await expect(page.locator('footer')).toBeAttached();
  });
});

test.describe('Auth flow', () => {
  test('login page renders and rejects bad credentials gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@nowhere.dev');
    await page.getByLabel('Password').fill('WrongPassword1');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Toast appears with the API error (or network failure in offline runs).
    await expect(page.locator('[role="status"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('register page enforces password rules client-side', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('First name').fill('Play');
    await page.getByLabel('Last name').fill('Wright');
    await page.getByLabel('Work email').fill('playwright@test.dev');
    await page.getByLabel('Password').fill('weak');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
  });
});
