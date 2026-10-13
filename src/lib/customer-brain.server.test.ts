import { describe, it, expect, vi, beforeEach } from "vitest";
import { nextCustomerTurn, GatewayError } from "./customer-brain.server";
import type { FullScenario } from "./scenarios";

const mockScenario: FullScenario = {
  id: "test-scenario",
  customerName: "John Doe",
  accountSummary: "Basic Plan, $50/mo",
  statedReason: "Too expensive",
  hiddenMotive: "Moving to a new house",
  emotionalDriver: "Stressed about moving",
  difficulty: "standard",
  personality: "guarded",
  saveConditions: ["Offer to transfer service to new house", "Waive transfer fee"],
  dealBreakers: ["Offer 10% discount", 'Say "I understand"'],
  acceptableResolutions: ["Transferred to new address"],
  createdAt: new Date().toISOString(),
  createdBy: "test-user",
  title: "Test Scenario",
};

const mockTranscript = [
  { speaker: "agent" as const, text: "Hello, this is John. How can I help you?" },
];

describe("customer-brain.server.ts - nextCustomerTurn", () => {
  beforeEach(() => {
    // Reset process.env and global fetch before each test
    vi.unstubAllEnvs();
    vi.stubEnv("LOVABLE_API_KEY", "test-api-key");
    vi.restoreAllMocks();
  });

  it("throws GatewayError 401 when AI is not configured (missing LOVABLE_API_KEY)", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("LOVABLE_API_KEY", ""); // Clear the key

    await expect(nextCustomerTurn(mockScenario, mockTranscript)).rejects.toThrowError(
      new GatewayError(401, "AI is not configured for this project."),
    );
  });

  it("throws GatewayError 402 when AI credits are exhausted", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      text: () => Promise.resolve(JSON.stringify({ error: { message: "Out of credits" } })),
    });

    await expect(nextCustomerTurn(mockScenario, mockTranscript)).rejects.toThrowError(
      new GatewayError(402, "Out of credits"),
    );
  });

  it("throws GatewayError 429 when too many calls at once", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve(JSON.stringify({ error: { message: "Rate limited" } })),
    });

    await expect(nextCustomerTurn(mockScenario, mockTranscript)).rejects.toThrowError(
      new GatewayError(429, "Too many calls at once — wait a moment and try again."),
    );
  });

  it("throws generic GatewayError with status for other errors (e.g. 500)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({ error: { message: "Internal Server Error" } })),
    });

    await expect(nextCustomerTurn(mockScenario, mockTranscript)).rejects.toThrowError(
      new GatewayError(500, "Internal Server Error"),
    );
  });

  it("throws generic GatewayError with default message when no text is provided", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(""),
    });

    await expect(nextCustomerTurn(mockScenario, mockTranscript)).rejects.toThrowError(
      new GatewayError(503, "The customer line dropped."),
    );
  });
});
