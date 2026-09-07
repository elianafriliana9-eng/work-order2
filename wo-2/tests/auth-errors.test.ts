import assert from "node:assert/strict";
import test from "node:test";
import { classifyLoginError, getLoginErrorMessage } from "../src/lib/auth-errors.ts";

test("invalid credentials stay safe", () => {
    const kind = classifyLoginError({ code: "invalid_credentials", message: "Invalid login credentials" });
    assert.equal(kind, "credentials");
    assert.equal(getLoginErrorMessage(kind), "Email atau password salah.");
});

test("network failures are distinguished", () => assert.equal(classifyLoginError(new TypeError("Failed to fetch")), "network"));

test("missing environment is configuration error", () => {
    const error = new Error("missing");
    error.name = "SupabaseConfigurationError";
    assert.equal(classifyLoginError(error), "configuration");
});

test("unknown failures use a generic safe message", () => {
    const kind = classifyLoginError({ code: "unexpected_failure", message: "internal detail" });
    assert.equal(kind, "unexpected");
    assert.doesNotMatch(getLoginErrorMessage(kind), /internal detail/);
});
