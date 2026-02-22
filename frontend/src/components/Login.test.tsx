import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { Login } from "./Login";

test("requires correct credentials to login", () => {
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
  expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();

  // Valid test
  fireEvent.change(usernameInput, { target: { value: "user" } });
  fireEvent.change(passwordInput, { target: { value: "password" } });
  fireEvent.click(submitButton);

  expect(handleLogin).toHaveBeenCalledTimes(1);
});
