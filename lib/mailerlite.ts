/**
 * Optional MailerLite sync: when someone submits the lead-capture popup,
 * also add them to a MailerLite group so MailerLite's own automations
 * (welcome emails, drip sequences) can pick them up.
 *
 * This is deliberately best-effort — our own Supabase `leads` table is
 * the source of truth. If MAILERLITE_API_KEY/MAILERLITE_GROUP_ID aren't
 * set, or the MailerLite API is briefly down, the visitor's own signup
 * must still succeed; callers should not let this throw stop that.
 */

const TIMEOUT_MS = 6000;

export async function syncLeadToMailerLite(email: string): Promise<void> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  if (!apiKey || !groupId) return; // integration not configured — silently skip

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, groups: [groupId] }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`MailerLite sync failed (${res.status}):`, body.slice(0, 500));
    }
  } catch (err) {
    console.error("MailerLite sync error:", err);
  } finally {
    clearTimeout(timeout);
  }
}
