import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
  loginUrl: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'SONSIEL Mentorship Hub <noreply@sonsiel.org>',
      to: data.email,
      subject: 'Welcome to SONSIEL Mentorship Hub - Your Account is Ready',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to SONSIEL Mentorship Hub</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hello ${data.firstName} ${data.lastName},</p>
            
            <p>Your account has been created on the SONSIEL Mentorship Hub. We're excited to have you join our community of healthcare professionals!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: 600;">Your Login Credentials:</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${data.temporaryPassword}</code></p>
            </div>
            
            <p style="color: #dc2626; font-size: 14px;">Please change your password after logging in for the first time.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Sign In to Your Account</a>
            </div>
            
            <p>After signing in, you'll be guided through completing your profile to get the most out of the mentorship program.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">If you have any questions, please contact our support team.</p>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            SONSIEL Mentorship Hub - Empowering Healthcare Professionals
          </p>
        </body>
        </html>
      `,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export async function sendBulkWelcomeEmails(
  users: Array<{ email: string; firstName: string; lastName: string; temporaryPassword: string }>,
  loginUrl: string
): Promise<{ successful: string[]; failed: Array<{ email: string; error: string }> }> {
  const successful: string[] = [];
  const failed: Array<{ email: string; error: string }> = [];

  for (const user of users) {
    const result = await sendWelcomeEmail({
      ...user,
      loginUrl
    });

    if (result.success) {
      successful.push(user.email);
    } else {
      failed.push({ email: user.email, error: result.error || 'Unknown error' });
    }
  }

  return { successful, failed };
}
