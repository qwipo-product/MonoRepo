import { describe, expect, test } from "bun:test";
import {
  CONTACT_ENDPOINT,
  buildContactPayload,
  submitContact,
  validateContactFields,
} from "../src/lib/contact";
import type { ContactFields } from "../src/lib/contact";

const fields: ContactFields = {
  first_name: " Test ",
  last_name: " Visitor ",
  email: " test@example.com ",
  phone: "98765 43210",
  business_type: "A distributor",
  company: " Example Distribution ",
  message: " Please explain DigiDukaan for our network. ",
};

describe("contact request contract", () => {
  test("sends exactly the five API fields and preserves business context in message", () => {
    expect(buildContactPayload(fields)).toEqual({
      first_name: "Test",
      last_name: "Visitor",
      email: "test@example.com",
      phone: "9876543210",
      message: "Please explain DigiDukaan for our network.\n\nBusiness type: A distributor\nCompany: Example Distribution",
    });
  });

  test("company can be omitted and a formatted country code is preserved", () => {
    const values = { ...fields, company: "  ", phone: "+91 (98765) 43210" };
    expect(validateContactFields(values)).toEqual({});
    expect(buildContactPayload(values).phone).toBe("+919876543210");
    expect(buildContactPayload(values).message).not.toContain("Company:");
  });

  test("rejects whitespace-only required fields, malformed email and invalid phone", () => {
    expect(Object.keys(validateContactFields({ ...fields, first_name: " ", last_name: "", email: "not-an-email", phone: "98765abc43210", message: "\n " }))).toEqual([
      "first_name", "last_name", "email", "phone", "message",
    ]);
    expect(validateContactFields({ ...fields, phone: "123" }).phone).toBeDefined();
  });

  test("accepts Unicode names and guards field length limits", () => {
    expect(validateContactFields({ ...fields, first_name: "अनुष्का", last_name: "O’Connor" })).toEqual({});
    const errors = validateContactFields({ ...fields, first_name: "a".repeat(81), last_name: "b".repeat(81), email: `${"a".repeat(250)}@example.com`, company: "x".repeat(121), message: "x".repeat(4001) });
    expect(Object.keys(errors).sort()).toEqual(["company", "email", "first_name", "last_name", "message"]);
  });
});

describe("contact submission without sending a live enquiry", () => {
  test("POSTs JSON with only application-controlled headers", async () => {
    let calls = 0;
    const payload = buildContactPayload(fields);
    await submitContact(payload, {
      fetcher: async (url, init) => {
        calls++;
        expect(url).toBe(CONTACT_ENDPOINT);
        expect(init.method).toBe("POST");
        expect(init.headers).toEqual({ "Content-Type": "application/json", Accept: "application/json, text/plain, */*" });
        expect(JSON.parse(String(init.body))).toEqual(payload);
        expect(init.credentials).toBe("omit");
        expect(init.signal?.aborted).toBe(false);
        return new Response(null, { status: 204 });
      },
    });
    expect(calls).toBe(1);
  });

  test.each([200, 201, 204])("accepts HTTP %i without assuming a JSON response body", async (status) => {
    await expect(submitContact(buildContactPayload(fields), { fetcher: async () => new Response(null, { status }) })).resolves.toBeUndefined();
  });

  test.each([400, 401, 422, 500, 503])("HTTP %i is not reported as success or automatically retried", async (status) => {
    let calls = 0;
    await expect(submitContact(buildContactPayload(fields), { fetcher: async () => {
      calls++;
      return new Response("Untrusted server details", { status });
    } })).rejects.toThrow("Your enquiry could not be submitted.");
    expect(calls).toBe(1);
  });

  test("rate limiting asks the visitor to wait", async () => {
    await expect(submitContact(buildContactPayload(fields), { fetcher: async () => new Response(null, { status: 429 }) })).rejects.toThrow("Please wait a little");
  });

  test("network failure does not claim success or discard uncertainty", async () => {
    await expect(submitContact(buildContactPayload(fields), { fetcher: async () => { throw new TypeError("Failed to fetch"); } })).rejects.toThrow("We couldn’t confirm your enquiry was received.");
  });

  test("timeout aborts a stalled request and does not retry", async () => {
    let calls = 0;
    await expect(submitContact(buildContactPayload(fields), {
      timeoutMs: 10,
      fetcher: async (_url, init) => {
        calls++;
        return await new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        });
      },
    })).rejects.toThrow("The request took too long.");
    expect(calls).toBe(1);
  });
});
