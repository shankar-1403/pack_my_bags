// Enquiry form rules, shared by the form (as you type and on submit) and the API (which re-checks).

export type EnquiryFields = { name: string; email: string; phone: string; message: string };
export type EnquiryErrors = Partial<Record<keyof EnquiryFields, string>>;

const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Keystrokes the field refuses outright: digits in a name; letters, or more than 12 digits, in a phone. */
export function refuses(field: string, value: string) {
  if (field === "name") return /\d/.test(value);
  if (field === "phone") return /[a-zA-Z]/.test(value) || value.replace(/\D/g, "").length > 12;
  return false;
}

export function checkEnquiry({ name, email, phone, message }: EnquiryFields): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const n = name.trim();
  if (!n) errors.name = "Full name is required.";
  else if (n.length < 2) errors.name = "Name must be at least 2 characters.";
  else if (/\d/.test(n)) errors.name = "Name must not contain numbers.";
  else if (!/^[a-zA-Z\s.'-]+$/.test(n)) errors.name = "Name contains invalid characters.";

  if (!email.trim()) errors.email = "Email is required.";
  else if (!EMAIL.test(email.trim())) errors.email = "Enter a valid email address (e.g. name@domain.com).";

  if (!phone.trim()) errors.phone = "Phone number is required.";
  else {
    const digits = phone.replace(/\D/g, "");
    if (/[a-zA-Z]/.test(phone) || (digits.length !== 10 && digits.length !== 12))
      errors.phone = "Enter a 10-digit mobile number or 12-digit number with country code.";
  }

  if (!message.trim()) errors.message = "Message is required.";
  else if (message.trim().length < 10) errors.message = "Message must be at least 10 characters.";
  return errors;
}
