const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const SEND_REAL_EMAILS = false;

async function sendEmail({ to, subject, html, from }) {
  if (!SEND_REAL_EMAILS) {
    console.log(`\n[DEV EMAIL] to=${to} subject="${subject}"`);
    console.log(html); // the verification URL is inside this HTML
    console.log("");
    return { id: "dev-" + Date.now() };
  }

  const { data, error } = await resend.emails.send({
    from: from || "Acme <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }

  return data;
}

module.exports = { sendEmail, SEND_REAL_EMAILS };
