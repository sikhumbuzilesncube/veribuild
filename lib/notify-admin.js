export async function notifyAdmin(subject, textBody) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'gatekeeperzw@gmail.com';

  if (!apiKey) {
    console.warn('RESEND_API_KEY is missing. Skipping admin notification.');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'VeriBuild Notifications <onboarding@resend.dev>',
        to: [adminEmail],
        subject: subject,
        text: textBody,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Failed to send admin notification:', errorData);
    } else {
      console.log('Admin notification sent:', subject);
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
        }
