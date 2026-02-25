import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { Login } from "./Login";

test("requires correct credentials to login", async () => {
  global.fetch = vi.fn().mockImplementation(async (url, config) => {
    if (config?.body) {
      const body = JSON.parse(config.body as string);
      if (body.username === "user" && body.password === "password") {
        return { ok: true, json: async () => ({ access_token: "fake-token" }) };
      }
    }
    return { ok: false, json: async () => ({ detail: "Invalid credentials" }) };
  });

  const handleLogin = vi.fn();
  render(<Login onLogin={handleLogin} />);

  const usernameInput = screen.getByLabelText(/username/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole("button", { name: /sign in/i });

  // Invalid test
  fireEvent.change(usernameInput, { target: { value: "hacker" } });
  fireEvent.change(passwordInput, { target: { value: "invalid" } });
  fireEvent.click(submitButton);

  expect(handleLogin).not.toHaveBeenCalled();
  
  await waitFor(() => {
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  // Valid test
  fireEvent.change(usernameInput, { target: { value: "user" } });
  fireEvent.change(passwordInput, { target: { value: "password" } });
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(handleLogin).toHaveBeenCalledTimes(1);
  });
});
