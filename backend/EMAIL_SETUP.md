# Email Configuration Guide

## Setting up Real Email Delivery

To enable real email delivery for job applications and other features, you need to configure email settings in your `.env` file.

### Option 1: Gmail SMTP (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Update your `.env` file**:
```bash
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=noreply@your-domain.com
```

### Option 2: SendGrid (Production Recommended)

```bash
# Email Configuration (SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@your-domain.com
```

### Option 3: Mailgun

```bash
# Email Configuration (Mailgun)
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-smtp-user
EMAIL_PASS=your-mailgun-smtp-password
EMAIL_FROM=noreply@your-domain.com
```

## Testing Email Configuration

Run the backend server and check the console logs:
- ✅ "Using Gmail SMTP for email delivery" = Real emails will be sent
- ⚠️ "Using Ethereal Email for testing" = Test emails only (view preview URLs in console)

## Email Templates Available

### Job Application Email Template Structure

The system sends a comprehensive professional email to employers with:

1. **Header Section**
   - Professional branding
   - Clear subject line
   - Application date

2. **Job Details Section**
   - Position title
   - Company name
   - Location
   - Application date

3. **Candidate Profile Section**
   - Full name and contact information
   - Current location and job title
   - Experience level

4. **Skills & Expertise Section**
   - Skill tags with visual formatting
   - Color-coded expertise areas

5. **Professional Summary Section**
   - Candidate's summary/bio
   - Professional highlights

6. **Education Background Section**
   - Degree information
   - Institution details
   - Graduation dates

7. **Work Experience Section**
   - Job titles and companies
   - Employment dates
   - Job descriptions

8. **Profile Completion Indicator**
   - Visual progress bar
   - Completion percentage
   - Quality assessment

9. **Quick Actions Section**
   - Direct email contact button
   - Profile view links
   - Resume download (if available)

## Email Delivery Logic

### Job Application Emails are sent to:
1. **Priority 1**: Contact email from job posting (`job.contactInfo.email`)
2. **Priority 2**: Employer's account email (`job.employer.email`)

### If no email is available:
- Application is still submitted successfully
- User receives clear message about missing email
- Suggested alternative contact methods are provided

## Security Features

- All emails include disclaimer about automated sending
- No reply functionality to prevent spam
- Professional formatting with company branding
- Secure SMTP connections (TLS/SSL)

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**
   - Check if 2FA is enabled on Gmail
   - Verify app password is correct
   - Ensure EMAIL_USER and EMAIL_PASS are set correctly

2. **"Connection timeout"**
   - Check firewall settings
   - Verify EMAIL_HOST and EMAIL_PORT
   - Try different SMTP providers

3. **Emails not received**
   - Check spam/junk folders
   - Verify EMAIL_FROM domain is valid
   - Test with different recipient addresses

4. **"Using Ethereal Email for testing"**
   - EMAIL_USER or EMAIL_PASS not set correctly
   - Check .env file configuration
   - Restart the server after changes