/**
 * base.template.ts
 *
 * Shared layout helpers used by every email template.
 * All templates wrap their content with `emailLayout()`.
 */

const BRAND_COLOR      = '#7A0E42';
const BRAND_COLOR_DARK = '#5e0a31';
const BRAND_LIGHT_BG   = '#fdf4f7';
const BRAND_LIGHT_BORDER = '#f5dde7';
const BRAND_MUTED      = '#9b3060';

export { BRAND_COLOR, BRAND_COLOR_DARK, BRAND_LIGHT_BG, BRAND_LIGHT_BORDER, BRAND_MUTED };

export function emailLayout(opts: {
  headerTitle: string;
  headerSubtitle?: string;
  headerColor?: string;   
  content: string;
  footerNote?: string;
}): string {
  const headerBg = opts.headerColor ?? BRAND_COLOR;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.headerTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3e8f0;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3e8f0;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">

        <!-- Header -->
        <tr><td style="background-color:${headerBg};border-radius:12px 12px 0 0;padding:28px 32px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px">Skulcredit</h1>
          ${opts.headerSubtitle ? `<p style="margin:6px 0 0;color:#f0c4d8;font-size:14px;font-weight:400">${opts.headerSubtitle}</p>` : ''}
        </td></tr>

        <!-- Body -->
        <tr><td style="background-color:#ffffff;padding:32px;border-radius:0 0 12px 12px">
          ${opts.content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align:left;vertical-align:middle">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:8px;vertical-align:middle">
                      <div style="width:28px;height:28px;background-color:${BRAND_COLOR};border-radius:4px;text-align:center;line-height:28px;display:inline-block">
                        <span style="color:#fff;font-size:14px;font-weight:700">S</span>
                      </div>
                    </td>
                    <td style="vertical-align:middle">
                      <span style="font-size:13px;font-weight:700;color:${BRAND_COLOR}">Skulcredit</span><br>
                      <span style="font-size:10px;color:${BRAND_MUTED}">Pathway to excel</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="text-align:right;font-size:12px;color:#aaa;vertical-align:middle">
                ${opts.footerNote ?? '© 2026. All rights reserved.'}
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function infoCard(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rowsHtml = rows.map((row, i) => {
    const isLast    = i === rows.length - 1;
    const borderStyle = isLast ? '' : `border-bottom:1px solid ${BRAND_LIGHT_BORDER};`;
    const valueColor  = row.highlight ? BRAND_COLOR : BRAND_COLOR;
    const valueFw     = 'font-weight:700';
    return `
      <tr>
        <td style="padding:14px 20px;${borderStyle}font-size:13px;color:${BRAND_MUTED};width:50%">${row.label}</td>
        <td style="padding:14px 20px;${borderStyle}font-size:14px;${valueFw};color:${valueColor};text-align:right">${row.value}</td>
      </tr>`;
  }).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background-color:${BRAND_LIGHT_BG};border-radius:10px;margin-bottom:24px">
      ${rowsHtml}
    </table>`;
}

export function ctaButton(label: string, href: string, color?: string): string {
  const bg = color ?? BRAND_COLOR;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0">
      <tr><td align="center">
        <a href="${href}"
           style="display:inline-block;background-color:${bg};color:#ffffff;font-size:14px;
                  font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none">
          ${label}
        </a>
      </td></tr>
    </table>`;
}

export function noticeBox(html: string, color?: string): string {
  const c = color ?? BRAND_COLOR;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr><td style="background:${BRAND_LIGHT_BG};border-left:4px solid ${c};
                     border-radius:6px;padding:14px 16px">
        <p style="margin:0;font-size:13px;color:${c};line-height:1.6">${html}</p>
      </td></tr>
    </table>`;
}
