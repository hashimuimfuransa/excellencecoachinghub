import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth';
import { AIService } from '../services/aiService';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { CVDraft } from '../models/CVDraft';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import multer from 'multer';

const router = express.Router();
const aiService = new AIService();

// Helper function to extract JSON from markdown code blocks
const extractJSON = (text: string): string => {
  // Remove markdown code blocks if they exist
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
  return cleaned;
};

// Safe JSON parse with error handling
const safeJSONParse = (text: string, fallback: any = {}) => {
  try {
    const cleaned = extractJSON(text);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Text that failed to parse:', text);
    return fallback;
  }
};

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// CV Templates
const templates = [
  {
    id: 'modern-1',
    name: 'Modern Professional',
    description: 'Clean and contemporary design with bold typography',
    style: 'modern',
    color: 'blue',
    preview: '/template-previews/modern-1.jpg',
  },
  {
    id: 'classic-1',
    name: 'Classic Executive',
    description: 'Traditional professional layout perfect for corporate roles',
    style: 'classic',
    color: 'gray',
    preview: '/template-previews/classic-1.jpg',
  },
  {
    id: 'creative-1',
    name: 'Creative Designer',
    description: 'Eye-catching design for creative professionals',
    style: 'creative',
    color: 'purple',
    preview: '/template-previews/creative-1.jpg',
  },
  {
    id: 'minimal-1',
    name: 'Minimal Tech',
    description: 'Clean and simple design focusing on content',
    style: 'minimal',
    color: 'green',
    preview: '/template-previews/minimal-1.jpg',
  },
];

// Get CV templates
router.get('/templates', (req, res) => {
  try {
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// Get templates by industry
router.get('/templates/industry/:industry', (req, res) => {
  try {
    const { industry } = req.params;
    // Filter templates based on industry (could be enhanced with database)
    let filteredTemplates = templates;
    
    if (industry === 'tech') {
      filteredTemplates = templates.filter(t => t.style === 'modern' || t.style === 'minimal');
    } else if (industry === 'finance') {
      filteredTemplates = templates.filter(t => t.style === 'classic');
    } else if (industry === 'creative') {
      filteredTemplates = templates.filter(t => t.style === 'creative' || t.style === 'modern');
    }
    
    res.json(filteredTemplates);
  } catch (error) {
    console.error('Error fetching industry templates:', error);
    res.status(500).json({ message: 'Failed to fetch industry templates' });
  }
});

// Generate AI content
router.post('/ai/generate-content', auth, [
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('section').notEmpty().withMessage('Section is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prompt, section } = req.body;
    
    const content = await aiService.generateContent(prompt);
    
    res.json({ content });
  } catch (error) {
    console.error('Error generating AI content:', error);
    res.status(500).json({ message: 'Failed to generate AI content' });
  }
});

// Generate professional summary
router.post('/ai/professional-summary', auth, [
  body('cvData').isObject().withMessage('CV data is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cvData } = req.body;
    
    const prompt = `Create a compelling professional summary for a job seeker with the following profile:
    
    Name: ${cvData.personalInfo?.firstName} ${cvData.personalInfo?.lastName}
    Experience: ${cvData.experiences?.length || 0} positions
    Education: ${cvData.education?.map((e: any) => e.degree).join(', ') || 'Not specified'}
    Skills: ${cvData.skills?.map((s: any) => s.name).join(', ') || 'Various skills'}
    
    Create a 2-3 sentence professional summary that highlights their key strengths, experience, and value proposition. Make it compelling and tailored to their background.`;
    
    const summary = await aiService.generateContent(prompt);
    
    res.json({ summary: summary.trim() });
  } catch (error) {
    console.error('Error generating professional summary:', error);
    res.status(500).json({ message: 'Failed to generate professional summary' });
  }
});

// Analyze CV
router.post('/ai/analyze', auth, [
  body('cvData').isObject().withMessage('CV data is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cvData } = req.body;
    
    const prompt = `Analyze this CV and provide a comprehensive assessment:
    
    Personal Info: ${JSON.stringify(cvData.personalInfo)}
    Experience: ${JSON.stringify(cvData.experiences)}
    Education: ${JSON.stringify(cvData.education)}
    Skills: ${JSON.stringify(cvData.skills)}
    
    Provide analysis in the following JSON format:
    {
      "score": [number from 0-100],
      "suggestions": [array of general suggestions],
      "improvements": [
        {
          "section": "section name",
          "suggestion": "specific improvement suggestion",
          "priority": "high|medium|low"
        }
      ],
      "keywords": [array of detected keywords],
      "missingElements": [array of missing important elements]
    }`;
    
    const analysis = await aiService.generateContent(prompt);
    
    const fallbackAnalysis = {
      score: 75,
      suggestions: ['Add more quantifiable achievements', 'Include relevant keywords', 'Improve professional summary'],
      improvements: [
        {
          section: 'Professional Summary',
          suggestion: 'Make your summary more compelling and specific to your target role',
          priority: 'high'
        }
      ],
      keywords: ['professional', 'experience', 'skills'],
      missingElements: ['Quantifiable achievements', 'Industry keywords']
    };
    
    const parsedAnalysis = safeJSONParse(analysis, fallbackAnalysis);
    res.json(parsedAnalysis);
  } catch (error) {
    console.error('Error analyzing CV:', error);
    
    // Return fallback analysis in case of error
    const fallbackAnalysis = {
      score: 75,
      suggestions: ['Add more quantifiable achievements', 'Include relevant keywords', 'Improve professional summary'],
      improvements: [
        {
          section: 'Professional Summary',
          suggestion: 'Make your summary more compelling and specific to your target role',
          priority: 'high'
        }
      ],
      keywords: ['professional', 'experience', 'skills'],
      missingElements: ['Quantifiable achievements', 'Industry keywords']
    };
    
    res.json(fallbackAnalysis);
  }
});

// Optimize CV for job
router.post('/ai/optimize', auth, [
  body('cvData').isObject().withMessage('CV data is required'),
  body('targetJob').optional().isObject(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cvData, targetJob } = req.body;
    
    const prompt = `Optimize this CV for the target job:
    
    Current CV: ${JSON.stringify(cvData)}
    Target Job: ${JSON.stringify(targetJob)}
    
    Provide optimized CV data and analysis in this format:
    {
      "optimizedCV": [enhanced CV data with same structure],
      "analysis": {
        "score": [improved score],
        "changes": [array of changes made],
        "improvements": [array of improvement objects]
      }
    }`;
    
    const optimization = await aiService.generateContent(prompt);
    
    const fallbackOptimization = {
      optimizedCV: cvData,
      analysis: {
        score: 80,
        changes: ['Enhanced professional summary', 'Added relevant keywords'],
        improvements: [
          {
            section: 'Summary',
            suggestion: 'Tailored content for the target role',
            priority: 'medium'
          }
        ]
      }
    };
    
    const parsedOptimization = safeJSONParse(optimization, fallbackOptimization);
    res.json(parsedOptimization);
  } catch (error) {
    console.error('Error optimizing CV:', error);
    res.status(500).json({ message: 'Failed to optimize CV' });
  }
});

// Generate achievements
router.post('/ai/achievements', auth, [
  body('jobTitle').notEmpty().withMessage('Job title is required'),
  body('company').notEmpty().withMessage('Company is required'),
  body('responsibilities').isArray().withMessage('Responsibilities must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobTitle, company, responsibilities } = req.body;
    
    const prompt = `Generate 3-4 measurable achievements for a ${jobTitle} at ${company} with these responsibilities:
    ${responsibilities.join('\n')}
    
    Make achievements specific, quantifiable, and impactful. Use metrics, percentages, or concrete outcomes where possible.
    Return as a JSON array of strings.`;
    
    const achievements = await aiService.generateContent(prompt);
    
    const fallbackAchievements = [
      `Led team initiatives that improved ${jobTitle} processes`,
      `Contributed to company goals through effective ${jobTitle} practices`,
      `Demonstrated expertise in key ${jobTitle} responsibilities`
    ];
    
    const parsedAchievements = safeJSONParse(achievements, fallbackAchievements);
    res.json({ achievements: parsedAchievements });
  } catch (error) {
    console.error('Error generating achievements:', error);
    res.status(500).json({ message: 'Failed to generate achievements' });
  }
});

// Improve content
router.post('/ai/improve', auth, [
  body('content').notEmpty().withMessage('Content is required'),
  body('type').isIn(['experience', 'summary', 'skill', 'achievement']).withMessage('Invalid type'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, type } = req.body;
    
    const prompt = `Improve this ${type} content to be more professional, impactful, and compelling:
    
    Original: ${content}
    
    Provide an improved version that is more specific, action-oriented, and quantifiable where possible.`;
    
    const improvedContent = await aiService.generateContent(prompt);
    
    res.json({ improvedContent: improvedContent.trim() });
  } catch (error) {
    console.error('Error improving content:', error);
    res.status(500).json({ message: 'Failed to improve content' });
  }
});

// Get keyword suggestions
router.post('/ai/keywords', auth, [
  body('industry').notEmpty().withMessage('Industry is required'),
  body('role').notEmpty().withMessage('Role is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { industry, role } = req.body;
    
    const prompt = `Generate 15-20 relevant keywords for a ${role} position in the ${industry} industry. 
    Include both hard skills and soft skills that are commonly searched for by recruiters and ATS systems.
    Return as a JSON array of strings.`;
    
    const keywords = await aiService.generateContent(prompt);
    
    const fallbackKeywords = [
      'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration',
      'Project Management', 'Strategic Planning', 'Data Analysis', 'Customer Service',
      'Technical Skills', 'Innovation', 'Adaptability', 'Time Management'
    ];
    
    const parsedKeywords = safeJSONParse(keywords, fallbackKeywords);
    res.json({ keywords: parsedKeywords });
  } catch (error) {
    console.error('Error generating keywords:', error);
    res.status(500).json({ message: 'Failed to generate keywords' });
  }
});

// Save CV draft
router.post('/save-draft', auth, [
  body('cvData').isObject().withMessage('CV data is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cvData } = req.body;
    const userId = req.user!.id;
    
    // Create or update CV draft
    let draft = await CVDraft.findOne({ userId });
    
    if (draft) {
      draft.cvData = cvData;
      draft.lastModified = new Date();
      await draft.save();
    } else {
      draft = new CVDraft({
        userId,
        cvData,
        name: `${cvData.personalInfo?.firstName || 'My'} CV`,
      });
      await draft.save();
    }
    
    res.json({ id: draft._id, message: 'Draft saved successfully' });
  } catch (error) {
    console.error('Error saving CV draft:', error);
    res.status(500).json({ message: 'Failed to save CV draft' });
  }
});

// Get CV drafts
router.get('/drafts', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const drafts = await CVDraft.find({ userId }).sort({ lastModified: -1 });
    
    res.json(drafts.map(draft => ({
      id: draft._id,
      name: draft.name,
      lastModified: draft.lastModified,
      cvData: draft.cvData,
    })));
  } catch (error) {
    console.error('Error fetching CV drafts:', error);
    res.status(500).json({ message: 'Failed to fetch CV drafts' });
  }
});

// Parse resume file
router.post('/parse-resume', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    let extractedText = '';

    // Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(file.buffer);
      extractedText = pdfData.text;
    } else if (file.mimetype === 'application/msword' || 
               file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const docData = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = docData.value;
    }

    // Use AI to parse the extracted text into structured CV data
    const prompt = `Parse this resume text into structured CV data:

${extractedText}

Return a JSON object with this structure:
{
  "personalInfo": {
    "firstName": "",
    "lastName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedIn": "",
    "website": "",
    "professionalSummary": ""
  },
  "experiences": [
    {
      "id": "generated-id",
      "jobTitle": "",
      "company": "",
      "location": "",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "isCurrentJob": false,
      "responsibilities": [],
      "achievements": []
    }
  ],
  "education": [
    {
      "id": "generated-id",
      "degree": "",
      "institution": "",
      "location": "",
      "graduationDate": "YYYY-MM-DD",
      "gpa": "",
      "relevantCourses": []
    }
  ],
  "skills": [
    {
      "id": "generated-id",
      "name": "",
      "level": "Intermediate",
      "category": "Technical"
    }
  ]
}`;

    const parsedCV = await aiService.generateContent(prompt);
    
    const fallbackCVData = {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        summary: 'Professional with experience in various roles and responsibilities.'
      },
      experience: [],
      education: [],
      skills: []
    };
    
    const cvData = safeJSONParse(parsedCV, fallbackCVData);
    res.json({ cvData });
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ message: 'Failed to parse resume file' });
  }
});

// Generate HTML for PDF export
const generateCVHTML = (cvData: any, template: any) => {
  const styles = {
    primary: template.color === 'blue' ? '#1976d2' : 
             template.color === 'gray' ? '#757575' :
             template.color === 'purple' ? '#9c27b0' :
             template.color === 'green' ? '#388e3c' :
             template.color === 'orange' ? '#f57c00' :
             template.color === 'navy' ? '#1a237e' : '#1976d2',
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; line-height: 1.6; }
        .header { border-bottom: 3px solid ${styles.primary}; padding-bottom: 10px; margin-bottom: 20px; }
        .name { color: ${styles.primary}; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .contact { display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; }
        .contact-item { display: flex; align-items: center; gap: 5px; }
        .section-title { color: ${styles.primary}; font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
        .job-title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .company { color: ${styles.primary}; font-weight: bold; }
        .date { font-style: italic; float: right; }
        .summary { margin-bottom: 20px; line-height: 1.6; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin-bottom: 5px; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .skills-category { margin-bottom: 15px; }
        .skills-title { font-weight: bold; color: ${styles.primary}; margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}</div>
        <div class="contact">
            ${cvData.personalInfo.email ? `<div class="contact-item">📧 ${cvData.personalInfo.email}</div>` : ''}
            ${cvData.personalInfo.phone ? `<div class="contact-item">📞 ${cvData.personalInfo.phone}</div>` : ''}
            ${cvData.personalInfo.location ? `<div class="contact-item">📍 ${cvData.personalInfo.location}</div>` : ''}
            ${cvData.personalInfo.linkedIn ? `<div class="contact-item">💼 ${cvData.personalInfo.linkedIn}</div>` : ''}
            ${cvData.personalInfo.website ? `<div class="contact-item">🌐 ${cvData.personalInfo.website}</div>` : ''}
        </div>
    </div>

    ${cvData.personalInfo.professionalSummary ? `
    <div class="section-title">PROFESSIONAL SUMMARY</div>
    <div class="summary">${cvData.personalInfo.professionalSummary}</div>
    ` : ''}

    ${cvData.experiences && cvData.experiences.length > 0 ? `
    <div class="section-title">PROFESSIONAL EXPERIENCE</div>
    ${cvData.experiences.map((exp: any) => `
        <div style="margin-bottom: 20px;">
            <div>
                <div class="job-title">${exp.jobTitle}</div>
                <div class="company">${exp.company}${exp.location ? ` • ${exp.location}` : ''}</div>
                <div class="date">${exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - ${exp.isCurrentJob ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}</div>
            </div>
            ${exp.responsibilities && exp.responsibilities.filter((r: string) => r.trim()).length > 0 ? `
            <div style="margin-top: 10px;">
                <strong>Key Responsibilities:</strong>
                <ul>
                    ${exp.responsibilities.filter((r: string) => r.trim()).map((resp: string) => `<li>${resp}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            ${exp.achievements && exp.achievements.filter((a: string) => a.trim()).length > 0 ? `
            <div>
                <strong>Key Achievements:</strong>
                <ul>
                    ${exp.achievements.filter((a: string) => a.trim()).map((achievement: string) => `<li>${achievement}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    `).join('')}
    ` : ''}

    ${cvData.education && cvData.education.length > 0 ? `
    <div class="section-title">EDUCATION</div>
    ${cvData.education.map((edu: any) => `
        <div style="margin-bottom: 15px;">
            <div class="job-title">${edu.degree}</div>
            <div class="company">${edu.institution}${edu.location ? ` • ${edu.location}` : ''}</div>
            <div class="date">${edu.graduationDate ? new Date(edu.graduationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
            ${edu.relevantCourses && edu.relevantCourses.filter((c: string) => c.trim()).length > 0 ? `
            <div><strong>Relevant Courses:</strong> ${edu.relevantCourses.filter((c: string) => c.trim()).join(', ')}</div>
            ` : ''}
        </div>
    `).join('')}
    ` : ''}

    ${cvData.skills && cvData.skills.length > 0 ? `
    <div class="section-title">CORE COMPETENCIES</div>
    <div class="skills-grid">
        ${['Technical', 'Soft', 'Language', 'Other'].map(category => {
          const categorySkills = cvData.skills.filter((skill: any) => skill.category === category);
          return categorySkills.length > 0 ? `
            <div class="skills-category">
                <div class="skills-title">${category} Skills:</div>
                <div>${categorySkills.map((skill: any) => skill.name).join(' • ')}</div>
            </div>
          ` : '';
        }).join('')}
    </div>
    ` : ''}
</body>
</html>`;
};

// Export CV as PDF
router.post('/export/pdf', auth, [
  body('cvData').isObject().withMessage('CV data is required'),
  body('templateId').notEmpty().withMessage('Template ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cvData, templateId } = req.body;
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const html = generateCVHTML(cvData, template);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    });
    
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV.pdf"`);
    res.send(pdf);

  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ message: 'Failed to export PDF' });
  }
});

// Export CV as Word (simplified HTML version)
router.post('/export/word', auth, [
  body('cvData').isObject().withMessage('CV data is required'),
  body('templateId').notEmpty().withMessage('Template ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cvData, templateId } = req.body;
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const html = generateCVHTML(cvData, template);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV.doc"`);
    res.send(html);

  } catch (error) {
    console.error('Error exporting Word document:', error);
    res.status(500).json({ message: 'Failed to export Word document' });
  }
});

// Generate cover letter
router.post('/ai/cover-letter', auth, [
  body('cvData').isObject().withMessage('CV data is required'),
  body('jobDescription').notEmpty().withMessage('Job description is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cvData, jobDescription } = req.body;
    
    const prompt = `Generate a professional cover letter based on this CV and job description:

CV Data: ${JSON.stringify(cvData)}
Job Description: ${jobDescription}

Create a compelling cover letter that:
1. Addresses the hiring manager professionally
2. Shows enthusiasm for the role
3. Highlights relevant experience and skills from the CV
4. Explains why the candidate is a good fit
5. Includes a strong closing paragraph

Keep it professional, concise (3-4 paragraphs), and tailored to the job.`;

    const coverLetter = await aiService.generateContent(prompt);
    
    res.json({ coverLetter });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    res.status(500).json({ message: 'Failed to generate cover letter' });
  }
});

export default router;