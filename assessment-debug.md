# Assessment Not Showing for Students - Debug Guide

## Quick Fix Checklist:

### 1. **Publish the Assessment**
- In teacher dashboard, find your assessment
- Look for the "Publish" button (should say "Publish" if it's in draft mode)
- Click "Publish" - the button should turn green and say "Unpublish"
- You should see a "Published" chip on the assessment card

### 2. **Check Student Enrollment**
- Make sure the student is enrolled in the course where you created the assessment
- Go to Course Management → View enrolled students
- If student is not enrolled, add them manually

### 3. **Check Assessment Status**
- Assessment must have `status: 'published'` AND `isPublished: true`
- Both conditions must be met for students to see it

### 4. **Debug API Call**
You can test the debug endpoint I just created:
- As a student, make a GET request to: `/api/assessments/debug/student-info`
- This will show your enrollments and published assessments

## Common Issues:

1. **Assessment created but not published** → Click Publish button
2. **Student not enrolled in course** → Enroll student in course
3. **Browser cache** → Refresh student dashboard (Ctrl+F5)
4. **Database sync issue** → Restart backend server

## If Still Not Working:

Check the browser console and backend logs for:
- "🔍 Student assessments debug" - shows enrollments
- "📊 Assessment query results" - shows found assessments
- Any error messages

The debug logs will help identify if it's an enrollment issue or assessment status issue.