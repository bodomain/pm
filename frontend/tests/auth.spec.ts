"use client";

import { test, expect } from "@playwright/test";

test("login and logout flow", async ({ page }) => {
  await page.goto("/");
  
  // Wait for and verify the login form is visible
  await expect(page.getByRole("heading", { name: "Kanban Studio", exact: true })).toBeVisible();
  const usernameInput = page.getByLabel(/username/i);
  const passwordInput = page.getByLabel(/password/i);
  const submitButton = page.getByRole("button", { name: /sign in/i });

  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  // Invalid login
  await usernameInput.fill("wrong");
  await passwordInput.fill("wrong");
  await submitButton.click();
  await expect(page.getByText(/invalid credentials/i)).toBeVisible();

  // Valid login
  await usernameInput.fill("user");
  await passwordInput.fill("password");
  await submitButton.click();

  // Verify we are logged in by seeing the kanban board
  await expect(page.getByText(/one board. five columns. zero clutter./i)).toBeVisible();

  // Logout
  const logoutButton = page.getByRole("button", { name: /logout/i });
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();

  // Verify we are back on login page
  await expect(usernameInput).toBeVisible();
});
