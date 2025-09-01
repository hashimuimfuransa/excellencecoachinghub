# CV/Resume Email Integration Guide

## Overview

The job application email system now includes comprehensive CV/Resume handling that automatically sends candidate CVs to employers via EmailJS when they apply for jobs.

## How CV/Resume is Handled

### 1. **CV Storage**
- CVs are stored as file URLs in the user profile
- Support for both `resume` and `cvFile` fields
- Files are uploaded via the file upload system to secure storage

### 2. **Email Integration**
- **If CV is available**: Direct download link included in email
- **If CV is missing**: Clear message indicating CV should be requested
- **Multiple formats**: Both HTML and text email versions support CV links

### 3. **Template Variables**

The EmailJS templates use these CV-related variables:

```javascript
{{candidate_resume}}        // Resume URL or "No CV/Resume uploaded"
{{candidate_cv_url}}       // Direct CV download URL
{{cv_download_link}}       // Same as cv_url, for template readability
{{has_cv}}                 // "Yes" or "No" - indicates CV availability
```

### 4. **Email Template Features**

#### **Rich HTML Template (`emailjs-template.html`)**
- ✅ **Dedicated CV section** with download button
- ✅ **Conditional display** - shows CV link or "not available" message  
- ✅ **Styled download button** matching ExJobNet branding
- ✅ **Multiple access points** - CV section + call-to-action button

#### **Simple Template (`emailjs-template-simple.html`)**  
- ✅ **Clean CV section** with simple download link
- ✅ **Fallback message** when CV not available
- ✅ **Email client compatibility** for all platforms

### 5. **Backend Data Flow**

```javascript
// 1. User applies for job
POST /api/applications/{jobId}/apply

// 2. Controller gathers user data including CV
const candidateData = {
  // ... other fields
  resume: user.resume,        // Primary CV field
  cvFile: user.cvFile,        // Alternative CV field
  // ... rest of data
};

// 3. Frontend receives complete data
const emailData = {
  shouldSendEmail: true,
  candidateData: candidateData  // Includes CV URLs
};

// 4. EmailJS service formats data
const templateParams = {
  candidate_cv_url: candidateData.resume || candidateData.cvFile,
  cv_download_link: candidateData.resume || candidateData.cvFile,
  has_cv: candidateData.resume || candidateData.cvFile ? 'Yes' : 'No'
};
```

### 6. **Email Content Examples**

#### **When CV is Available:**
```
📄 CV/RESUME: Available for download
📎 Download: https://storage.exjobnet.com/cv/user123-cv.pdf

[Download CV Button] - Direct link to PDF
```

#### **When CV is Not Available:**
```
📄 CV/RESUME: Not uploaded  
💡 Contact candidate for CV/Resume

"Request their CV/Resume when you contact them."
```

### 7. **Security & Access**

- **Direct Download**: CV links work directly in email clients
- **No Authentication Required**: Links are publicly accessible once shared
- **Secure Storage**: Files stored in protected cloud storage
- **Virus Scanning**: All uploads are scanned before storage

### 8. **File Format Support**

Supported CV formats automatically included:
- ✅ **PDF** (.pdf)
- ✅ **Word Documents** (.doc, .docx) 
- ✅ **Text Files** (.txt)
- ✅ **Rich Text** (.rtf)

### 9. **Mobile Compatibility**

- **Download Links**: Work on mobile email apps
- **Responsive Design**: CV section adapts to screen size
- **Touch-Friendly**: Large download buttons for mobile

### 10. **Troubleshooting**

#### **If CV not appearing in emails:**

1. **Check User Profile**: Verify `user.resume` or `user.cvFile` contains valid URL
2. **Check Template**: Ensure `{{cv_download_link}}` variable is in template  
3. **Check EmailJS Config**: Verify template ID matches service
4. **Test with Sample Data**: Use `testJobApplicationEmail()` function

#### **If CV links are broken:**

1. **Verify Storage URLs**: Check if file still exists in storage
2. **Check Permissions**: Ensure files are publicly accessible
3. **Update File URLs**: Re-upload CV if storage location changed

### 11. **Analytics & Tracking**

Monitor CV engagement:
- **Email Open Rates**: Track if employers open emails
- **CV Download Rates**: Monitor link clicks (if analytics enabled)
- **Application Success**: Correlate CV availability with job offers

### 12. **Future Enhancements**

Planned improvements:
- 📈 **CV Preview**: Thumbnail/preview in email
- 📊 **Download Analytics**: Track when CVs are downloaded
- 🔄 **Auto-Updates**: Notify when candidate updates CV
- 🎨 **CV Formatting**: Auto-generate formatted CV versions

---

## Quick Setup Checklist

✅ **Backend**: CV data included in application response  
✅ **Frontend**: EmailJS service handles CV URLs  
✅ **Templates**: Both HTML templates support CV display  
✅ **Testing**: Test functions include sample CV data  
✅ **Error Handling**: Graceful fallback when CV missing  

**🎯 Result**: Employers receive professional emails with direct access to candidate CVs, increasing application response rates and streamlining the hiring process.