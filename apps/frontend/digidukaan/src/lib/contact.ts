export const CONTACT_ENDPOINT =
  "https://qwipo-website-api.bms.qwipo.com/api/contact_us";

export type ContactFields = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  business_type: string;
  message: string;
};

export type ContactErrors = Partial<Record<keyof ContactFields, string>>;
export type ContactPayload = Pick<
  ContactFields,
  "first_name" | "last_name" | "email" | "phone" | "message"
>;

function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s().-]/g, "");
}

export function validateContactFields(fields: ContactFields): ContactErrors {
  const errors: ContactErrors = {};
  for (const field of ["first_name", "last_name"] as const) {
    if (!fields[field].trim()) {
      errors[field] =
        `Enter your ${field === "first_name" ? "first" : "last"} name.`;
    } else if (fields[field].trim().length > 80) {
      errors[field] = "Use 80 characters or fewer.";
    }
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()) ||
    fields.email.trim().length > 254
  ) {
    errors.email = "Enter a valid email address.";
  }
  if (!/^\+?\d{10,15}$/.test(normalizePhone(fields.phone))) {
    errors.phone = "Enter a valid phone number (10–15 digits).";
  }
  if (fields.company.trim().length > 120) {
    errors.company = "Use 120 characters or fewer.";
  }
  if (!fields.message.trim()) {
    errors.message = "Tell us a little about your enquiry.";
  } else if (fields.message.trim().length > 4000) {
    errors.message = "Use 4,000 characters or fewer.";
  }
  return errors;
}

export function buildContactPayload(fields: ContactFields): ContactPayload {
  const businessDetails = [`Business type: ${fields.business_type.trim()}`];
  if (fields.company.trim()) {
    businessDetails.push(`Company: ${fields.company.trim()}`);
  }
  return {
    first_name: fields.first_name.trim(),
    last_name: fields.last_name.trim(),
    email: fields.email.trim(),
    phone: normalizePhone(fields.phone),
    message: `${fields.message.trim()}\n\n${businessDetails.join("\n")}`,
  };
}

type ContactFetch = (url: string, init: RequestInit) => Promise<Response>;

export async function submitContact(
  payload: ContactPayload,
  {
    fetcher = fetch,
    timeoutMs = 15000,
  }: {
    fetcher?: ContactFetch;
    timeoutMs?: number;
  } = {},
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      response = await fetcher(CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify(payload),
        credentials: "omit",
        signal: controller.signal,
      });
    } catch {
      throw new Error(
        controller.signal.aborted
          ? "The request took too long. We couldn’t confirm your enquiry was received. Please contact us by email if this continues."
          : "We couldn’t confirm your enquiry was received. Check your connection, or contact us by email below.",
      );
    }
    if (!response.ok) {
      throw new Error(
        response.status === 429
          ? "Too many requests. Please wait a little before trying again."
          : "Your enquiry could not be submitted. Please try again, or contact us by email below.",
      );
    }
    // The supplied API uses HTTP success; no response-body schema is required.
  } finally {
    clearTimeout(timeout);
  }
}
