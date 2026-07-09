import type { MailJob } from './mail.service';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders the shared transactional email layout: header with the VESION
 * wordmark, content card, optional CTA button, and legal footer.
 */
export function renderEmail(job: MailJob): string {
  const lines = job.bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 16px;color:#3f3f50;font-size:15px;line-height:1.6;">${escapeHtml(line)}</p>`,
    )
    .join('');

  const cta = job.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);">
         <a href="${escapeHtml(job.cta.url)}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(job.cta.label)}</a>
       </td></tr></table>`
    : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr><td style="padding:0 0 24px;" align="center">
            <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#18181b;">VESION<span style="color:#7c3aed;">.</span></span>
          </td></tr>
          <tr><td style="background:#ffffff;border-radius:16px;padding:36px;border:1px solid #e4e4ee;">
            <h1 style="margin:0 0 20px;font-size:20px;color:#18181b;">${escapeHtml(job.heading)}</h1>
            ${lines}
            ${cta}
            <p style="margin:0;color:#8a8a9a;font-size:13px;">If you did not expect this email, you can safely ignore it.</p>
          </td></tr>
          <tr><td style="padding:24px 8px 0;" align="center">
            <p style="margin:0;color:#a0a0b0;font-size:12px;">© ${new Date().getFullYear()} Vesion. All rights reserved.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
