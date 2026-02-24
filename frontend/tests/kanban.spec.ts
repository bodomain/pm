import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("isAuthenticated", "true");
  });
});

test("loads the kanban board", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
});

test("adds a card to a column", async ({ page }) => {
  await page.goto("/");
  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill("Playwright card");
  await firstColumn.getByPlaceholder("Details").fill("Added via e2e.");
  await firstColumn.getByRole("button", { name: /add card/i }).click();
  await expect(firstColumn.getByText("Playwright card")).toBeVisible();
});

test("moves a card between columns", async ({ page }) => {
  await page.goto("/");

  // Wait for board to load (first card becomes visible)
  await expect(page.locator('[data-testid^="card-"]').first()).toBeVisible();

  // Get card title from source card (first card in the board)
  const sourceCard = page.locator('[data-testid^="card-"]').first();
  const cardTitle = await sourceCard.locator("h4").textContent();
  if (!cardTitle) throw new Error("Card title not found");

  // Get the target column (4th column, index 3 = Review)
  const targetColumn = page.locator('[data-testid^="column-"]').nth(3);
  // Ensure target column has at least one card to drop onto
  await expect(targetColumn.locator('[data-testid^="card-"]').first()).toBeVisible();
  const targetCard = targetColumn.locator('[data-testid^="card-"]').first();

  // Get bounding boxes for drag coordinates
  const sourceCardBox = await sourceCard.boundingBox();
  const targetCardBox = await targetCard.boundingBox();
  if (!sourceCardBox || !targetCardBox) throw new Error("Could not get bounding boxes");

  // Perform drag: source card -> target card
  await page.mouse.move(
    sourceCardBox.x + sourceCardBox.width / 2,
    sourceCardBox.y + sourceCardBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    targetCardBox.x + targetCardBox.width / 2,
    targetCardBox.y + targetCardBox.height / 2,
    { steps: 12 }
  );
  await page.mouse.up();

  // Verify the moved card now appears in the target column
  await expect(targetColumn.getByText(cardTitle)).toBeVisible();
});
