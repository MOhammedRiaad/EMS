export interface EmailTemplate {
  subject: string;
  html: string;
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  welcome_v1: {
    subject: 'Welcome to EMS Studio!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #6366f1;">Welcome to the Family!</h2>
        <p>Hi {{userName}},</p>
        <p>We're thrilled to have you with us. At EMS Studio, we're dedicated to helping you achieve your fitness goals faster and more efficiently.</p>
        <p>You can now log in to our client portal to book your sessions and track your progress.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{portalUrl}}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Client Portal</a>
        </div>
        <p>If you have any questions, just reply to this email!</p>
        <p>Best regards,<br>The {{studioName}} Team</p>
      </div>
    `,
  },
  birthday_promo: {
    subject: 'Happy Birthday! A Special Gift Inside 🎂',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: center;">
        <h1 style="color: #ec4899;">Happy Birthday, {{userName}}! 🥳</h1>
        <p style="font-size: 18px;">We want to celebrate your special day with a special offer.</p>
        <div style="background-color: #fce7f3; border: 2px dashed #ec4899; padding: 20px; margin: 30px 0; border-radius: 12px;">
          <p style="margin: 0; font-size: 16px; color: #9d174d;">Use code below for 20% off your next package:</p>
          <h2 style="margin: 10px 0; font-size: 32px; color: #be185d;">BDAY20</h2>
        </div>
        <p>Come celebrate with a high-energy session!</p>
        <div style="margin: 30px 0;">
          <a href="{{portalUrl}}" style="background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Book Birthday Session</a>
        </div>
        <p style="font-size: 14px; color: #666;">Valid for 7 days from today.</p>
      </div>
    `,
  },
  session_reminder_v1: {
    subject: 'Reminder: Your Upcoming Session ⚡',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0ea5e9;">Session Reminder</h2>
        <p>Hi {{userName}},</p>
        <p>This is a friendly reminder of your upcoming EMS session at {{studioName}}.</p>
        <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>When:</strong> {{sessionTime}}</p>
        </div>
        <p>Please remember to arrive 5-10 minutes early and stay hydrated!</p>
        <p>If you need to reschedule, please do so at least 24 hours in advance via the portal.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{portalUrl}}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Manage Booking</a>
        </div>
      </div>
    `,
  },
  Session_complete: {
    subject: 'Great Session! How was it? 💪',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #10b981;">Session Completed!</h2>
        <p>Hi {{userName}},</p>
        <p>Awesome job completing your session on {{sessionTime}}!</p>
        <p>Consistency is key to seeing those EMS results. We hope you're feeling the burn (in a good way!).</p>
        <p>How was your experience today? We'd love to hear your feedback.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{portalUrl}}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Book Next Session</a>
        </div>
        <p>Keep up the great work!</p>
        <p>Best regards,<br>The {{studioName}} Team</p>
      </div>
    `,
  },
};
