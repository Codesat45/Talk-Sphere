const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send meeting invitation email
const sendMeetingInvitation = async (meeting, participants) => {
  try {
    const transporter = createTransporter();

    const meetingDate = new Date(meeting.scheduledTime).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailPromises = participants.map((participant) => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: participant.email,
        subject: `Meeting Invitation: ${meeting.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
              }
              .meeting-details {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .detail-row {
                display: flex;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
              }
              .detail-label {
                font-weight: bold;
                width: 150px;
                color: #667eea;
              }
              .detail-value {
                flex: 1;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 12px;
              }
              .participants {
                background: #f0f4ff;
                padding: 15px;
                border-radius: 5px;
                margin: 10px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📅 Meeting Invitation</h1>
              <p>You've been invited to a meeting</p>
            </div>
            
            <div class="content">
              <h2>Hello ${participant.name},</h2>
              <p>${meeting.organizer.name} has invited you to a meeting on Talk-Sphere.</p>
              
              <div class="meeting-details">
                <div class="detail-row">
                  <div class="detail-label">📋 Title:</div>
                  <div class="detail-value"><strong>${meeting.title}</strong></div>
                </div>
                
                ${meeting.description ? `
                <div class="detail-row">
                  <div class="detail-label">📝 Description:</div>
                  <div class="detail-value">${meeting.description}</div>
                </div>
                ` : ''}
                
                <div class="detail-row">
                  <div class="detail-label">📅 Date & Time:</div>
                  <div class="detail-value">${meetingDate}</div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-label">⏱️ Duration:</div>
                  <div class="detail-value">${meeting.duration} minutes</div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-label">🎥 Type:</div>
                  <div class="detail-value">${meeting.meetingType === 'video' ? 'Video Call' : 'Audio Call'}</div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-label">👤 Organizer:</div>
                  <div class="detail-value">${meeting.organizer.name} (${meeting.organizer.email})</div>
                </div>
                
                <div class="detail-row">
                  <div class="detail-label">👥 Participants:</div>
                  <div class="detail-value">${participants.length} people invited</div>
                </div>
              </div>
              
              ${meeting.recordingUrl ? `
              <div class="participants">
                <strong>📹 Pre-recorded Video:</strong><br>
                <a href="${meeting.recordingUrl}" style="color: #667eea;">View Recording</a>
              </div>
              ` : ''}
              
              ${meeting.presentationUrl ? `
              <div class="participants">
                <strong>📊 Presentation:</strong><br>
                <a href="${meeting.presentationUrl}" style="color: #667eea;">View Presentation</a>
              </div>
              ` : ''}
              
              <center>
                <a href="${meeting.meetingLink || process.env.CLIENT_URL}" class="button">
                  Join Meeting on Talk-Sphere
                </a>
              </center>
              
              <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <strong>⏰ Reminder:</strong> Please mark your calendar and be ready 5 minutes before the meeting starts.
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated email from Talk-Sphere</p>
              <p>If you have any questions, please contact the meeting organizer</p>
              <p>&copy; ${new Date().getFullYear()} Talk-Sphere. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    console.log(`Meeting invitations sent to ${participants.length} participants`);
    return { success: true, count: participants.length };
  } catch (error) {
    console.error("Error sending meeting invitations:", error);
    throw error;
  }
};

// Send meeting reminder email
const sendMeetingReminder = async (meeting, participants, minutesBefore) => {
  try {
    const transporter = createTransporter();

    const meetingDate = new Date(meeting.scheduledTime).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailPromises = participants.map((participant) => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: participant.email,
        subject: `⏰ Reminder: Meeting "${meeting.title}" starts in ${minutesBefore} minutes`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
              }
              .alert-box {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .button {
                display: inline-block;
                padding: 15px 40px;
                background: #f5576c;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>⏰ Meeting Reminder</h1>
              <p>Your meeting starts soon!</p>
            </div>
            
            <div class="content">
              <div class="alert-box">
                <h2 style="margin-top: 0;">🔔 Meeting starts in ${minutesBefore} minutes!</h2>
                <p><strong>${meeting.title}</strong></p>
                <p>📅 ${meetingDate}</p>
                <p>⏱️ Duration: ${meeting.duration} minutes</p>
              </div>
              
              <p>Hi ${participant.name},</p>
              <p>This is a friendly reminder that your meeting is about to start. Please get ready and join on time.</p>
              
              <center>
                <a href="${meeting.meetingLink || process.env.CLIENT_URL}" class="button">
                  Join Meeting Now
                </a>
              </center>
            </div>
          </body>
          </html>
        `,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    console.log(`Meeting reminders sent to ${participants.length} participants`);
    return { success: true, count: participants.length };
  } catch (error) {
    console.error("Error sending meeting reminders:", error);
    throw error;
  }
};

// Send meeting update email
const sendMeetingUpdate = async (meeting, participants, updateType) => {
  try {
    const transporter = createTransporter();

    const subject = updateType === "cancelled" 
      ? `❌ Meeting Cancelled: ${meeting.title}`
      : `📝 Meeting Updated: ${meeting.title}`;

    const emailPromises = participants.map((participant) => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: participant.email,
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: ${updateType === 'cancelled' ? '#dc2626' : '#3b82f6'};
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${updateType === 'cancelled' ? '❌ Meeting Cancelled' : '📝 Meeting Updated'}</h1>
            </div>
            
            <div class="content">
              <p>Hi ${participant.name},</p>
              <p>The meeting "<strong>${meeting.title}</strong>" has been ${updateType}.</p>
              ${updateType === 'cancelled' 
                ? '<p>The organizer has cancelled this meeting. You do not need to attend.</p>'
                : '<p>Please check Talk-Sphere for the updated meeting details.</p>'
              }
            </div>
          </body>
          </html>
        `,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    return { success: true, count: participants.length };
  } catch (error) {
    console.error("Error sending meeting update:", error);
    throw error;
  }
};

module.exports = {
  sendMeetingInvitation,
  sendMeetingReminder,
  sendMeetingUpdate,
};
