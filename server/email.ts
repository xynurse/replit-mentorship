import { Resend } from 'resend';

export function getTrustedBaseUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:5000';
}

async function getCredentials() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    'SONSIEL Mentorship Hub <noreply@sonsiel.org>';
  return { apiKey, fromEmail };
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

export interface PasswordResetEmailData {
  email: string;
  firstName: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[EMAIL DEBUG] sendPasswordResetEmail called for: ${data.email}`);
    console.log(`[EMAIL DEBUG] Reset URL: ${data.resetUrl}`);
    
    const { client, fromEmail } = await getResendClient();
    console.log(`[EMAIL DEBUG] Resend client obtained, fromEmail: ${fromEmail}`);
    
    console.log(`[EMAIL DEBUG] Calling Resend API to send email...`);
    const result = await client.emails.send({
      from: fromEmail || 'SONSIEL Mentorship Hub <noreply@sonsiel.org>',
      to: data.email,
      subject: 'Reset Your Password - SONSIEL Mentorship Hub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hello ${data.firstName},</p>
            
            <p>We received a request to reset your password for your SONSIEL Mentorship Hub account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Your Password</a>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">This link will expire in 1 hour for security reasons.</p>
            </div>
            
            <p style="color: #dc2626; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${data.resetUrl}</p>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            SONSIEL Mentorship Hub - Empowering Healthcare Professionals
          </p>
        </body>
        </html>
      `,
    });
    
    console.log(`[EMAIL DEBUG] Resend API response:`, JSON.stringify(result, null, 2));

    if (result.error) {
      console.error(`[EMAIL DEBUG] Resend API returned error:`, result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[EMAIL DEBUG] Email sent successfully! ID: ${result.data?.id}`);
    return { success: true };
  } catch (error: any) {
    console.error('[EMAIL DEBUG] Exception in sendPasswordResetEmail:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

// ============= NOTIFICATION EMAIL FUNCTIONS =============

export interface TaskAssignedEmailData {
  email: string;
  recipientName: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate?: string;
  assignedBy: string;
  dashboardUrl: string;
}

export async function sendTaskAssignedEmail(data: TaskAssignedEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const descriptionHtml = data.taskDescription 
      ? `<p style="margin: 10px 0;"><strong>Description:</strong> ${data.taskDescription.length > 200 ? data.taskDescription.substring(0, 200) + '...' : data.taskDescription}</p>`
      : '';
    
    const dueDateHtml = data.dueDate 
      ? `<p style="margin: 10px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>`
      : '';

    const result = await client.emails.send({
      from: fromEmail || 'SONSIEL Mentorship Hub <noreply@sonsiel.org>',
      to: data.email,
      subject: `[SONSIEL Mentorship] New Task Assigned: ${data.taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Task Assigned</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hello ${data.recipientName},</p>
            
            <p>A new task has been assigned to you by <strong>${data.assignedBy}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">${data.taskTitle}</h3>
              ${descriptionHtml}
              ${dueDateHtml}
              <p style="margin: 10px 0;"><strong>Assigned by:</strong> ${data.assignedBy}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}/tasks" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Task</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">You can manage all your tasks from your dashboard.</p>
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
    console.error('Failed to send task assigned email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export interface CalendarInviteEmailData {
  email: string;
  recipientName: string;
  eventTitle: string;
  dateTime: string;
  duration: string;
  organizerName: string;
  description?: string;
  meetingLink?: string;
  dashboardUrl: string;
}

export async function sendCalendarInviteEmail(data: CalendarInviteEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const descriptionHtml = data.description 
      ? `<p style="margin: 10px 0;"><strong>Agenda:</strong> ${data.description}</p>`
      : '';
    
    const meetingLinkHtml = data.meetingLink 
      ? `<p style="margin: 10px 0;"><strong>Meeting Link:</strong> <a href="${data.meetingLink}" style="color: #667eea;">${data.meetingLink}</a></p>`
      : '';

    const result = await client.emails.send({
      from: fromEmail || 'SONSIEL Mentorship Hub <noreply@sonsiel.org>',
      to: data.email,
      subject: `[SONSIEL Mentorship] Meeting Scheduled: ${data.eventTitle} on ${data.dateTime.split(' ')[0]}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Meeting Scheduled</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hello ${data.recipientName},</p>
            
            <p>You have been invited to a meeting by <strong>${data.organizerName}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">${data.eventTitle}</h3>
              <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${data.dateTime}</p>
              <p style="margin: 10px 0;"><strong>Duration:</strong> ${data.duration}</p>
              <p style="margin: 10px 0;"><strong>Organizer:</strong> ${data.organizerName}</p>
              ${descriptionHtml}
              ${meetingLinkHtml}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}/calendar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Calendar</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Add this event to your calendar to stay on track.</p>
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
    console.error('Failed to send calendar invite email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export interface DocumentUploadedEmailData {
  email: string;
  recipientName: string;
  documentTitle: string;
  description?: string;
  uploadDate: string;
  uploadedBy: string;
  dashboardUrl: string;
}

export async function sendDocumentUploadedEmail(data: DocumentUploadedEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const descriptionHtml = data.description 
      ? `<p style="margin: 10px 0;"><strong>Description:</strong> ${data.description}</p>`
      : '';

    const result = await client.emails.send({
      from: fromEmail || 'SONSIEL Mentorship Hub <noreply@sonsiel.org>',
      to: data.email,
      subject: `[SONSIEL Mentorship] New Resource Available: ${data.documentTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Resource Available</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hello ${data.recipientName},</p>
            
            <p>A new document has been uploaded to the platform.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">${data.documentTitle}</h3>
              ${descriptionHtml}
              <p style="margin: 10px 0;"><strong>Upload Date:</strong> ${data.uploadDate}</p>
              <p style="margin: 10px 0;"><strong>Uploaded by:</strong> ${data.uploadedBy}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}/documents" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Documents</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Access all resources in your Documents library.</p>
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
    console.error('Failed to send document uploaded email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export interface NewMessageEmailData {
  email: string;
  recipientName: string;
  senderName: string;
  messagePreview: string;
  timestamp: string;
  dashboardUrl: string;
}

export async function sendNewMessageEmail(data: NewMessageEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const truncatedMessage = data.messagePreview.length > 100 
      ? data.messagePreview.substring(0, 100) + '...' 
      : data.messagePreview;

    const result = await client.emails.send({
      from: fromEmail || 'SONSIEL Mentorship Hub <noreply@sonsiel.org>',
      to: data.email,
      subject: `[SONSIEL Mentorship] New Message from ${data.senderName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Message</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hello ${data.recipientName},</p>
            
            <p>You have received a new message from <strong>${data.senderName}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: 600;">From: ${data.senderName}</p>
              <p style="margin: 10px 0; font-style: italic; color: #4b5563;">"${truncatedMessage}"</p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">${data.timestamp}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}/messages" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Messages</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Reply to continue the conversation.</p>
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
    console.error('Failed to send new message email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export interface GoalUpdateEmailData {
  email: string;
  recipientName: string;
  goalTitle: string;
  updateType: 'new_goal' | 'goal_modified' | 'new_comment';
  preview?: string;
  updatedBy: string;
  dashboardUrl: string;
}

export async function sendGoalUpdateEmail(data: GoalUpdateEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const updateTypeLabels = {
      'new_goal': 'New Goal Created',
      'goal_modified': 'Goal Modified',
      'new_comment': 'New Comment on Goal'
    };
    
    const updateTypeDescriptions = {
      'new_goal': 'A new goal has been created',
      'goal_modified': 'A goal has been updated',
      'new_comment': 'A new comment has been added to a goal'
    };
    
    const previewHtml = data.preview 
      ? `<p style="margin: 10px 0; font-style: italic; color: #4b5563;">"${data.preview.length > 200 ? data.preview.substring(0, 200) + '...' : data.preview}"</p>`
      : '';

    const result = await client.emails.send({
      from: fromEmail || 'SONSIEL Mentorship Hub <noreply@sonsiel.org>',
      to: data.email,
      subject: `[SONSIEL Mentorship] Goal Update: ${data.goalTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${updateTypeLabels[data.updateType]}</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hello ${data.recipientName},</p>
            
            <p>${updateTypeDescriptions[data.updateType]} by <strong>${data.updatedBy}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">${data.goalTitle}</h3>
              <p style="margin: 10px 0;"><strong>Update Type:</strong> ${updateTypeLabels[data.updateType]}</p>
              ${previewHtml}
              <p style="margin: 10px 0;"><strong>Updated by:</strong> ${data.updatedBy}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}/goals" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Goals</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Track progress on all goals from your dashboard.</p>
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
    console.error('Failed to send goal update email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}
