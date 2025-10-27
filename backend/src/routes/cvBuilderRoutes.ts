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
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  UnderlineType, 
  BorderStyle,
  WidthType,
  Table,
  TableRow,
  TableCell,
  ShadingType
} from 'docx';

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
    
    // Enhanced prompt processing for chat section
    let enhancedPrompt = prompt;
    if (section === 'chat') {
      enhancedPrompt = `${prompt}

RESPONSE GUIDELINES:
- Be conversational and encouraging
- Provide specific, actionable advice
- Use examples when helpful
- Keep responses focused and concise (2-4 paragraphs)
- Use emojis sparingly for a friendly tone
- If suggesting content, provide exact wording they can use`;
    }
    
    const content = await aiService.generateContent(enhancedPrompt);
    
    res.json({ content });
  } catch (error) {
    console.error('Error generating AI content:', error);
    res.status(500).json({ message: 'Failed to generate AI content. Please try again in a moment.' });
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
    Experience: ${(cvData.experiences || cvData.experience || []).length} positions
    Education: ${cvData.education?.map((e: any) => e.degree).join(', ') || 'Not specified'}
    Skills: ${Array.isArray(cvData.skills) ? cvData.skills.map((s: any) => s.name).join(', ') : (cvData.skills ? [...(cvData.skills.technical || []), ...(cvData.skills.soft || [])].map((s: any) => s.name).join(', ') : 'Various skills')}
    
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
    Experience: ${JSON.stringify(cvData.experiences || cvData.experience)}
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

// Generate Word document for CV
const generateCVWordDocument = (cvData: any, template: any) => {
  // Optional debugging (remove in production)
  // console.log('Word Generation - Experience data available:', !!(cvData?.experience || cvData?.experiences));
  
  const primaryColor = template.color === 'blue' ? '1976d2' : 
                      template.color === 'gray' ? '757575' :
                      template.color === 'purple' ? '9c27b0' :
                      template.color === 'green' ? '388e3c' :
                      template.color === 'orange' ? 'f57c00' :
                      template.color === 'navy' ? '1a237e' : '1976d2';

  const children = [];

  // Header with name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
          bold: true,
          size: 32,
          color: primaryColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );

  // Contact information
  const contactInfo = [];
  if (cvData.personalInfo.email) contactInfo.push(`📧 ${cvData.personalInfo.email}`);
  if (cvData.personalInfo.phone) contactInfo.push(`📞 ${cvData.personalInfo.phone}`);
  if (cvData.personalInfo.location) contactInfo.push(`📍 ${cvData.personalInfo.location}`);
  if (cvData.personalInfo.linkedin) contactInfo.push(`💼 ${cvData.personalInfo.linkedin}`);
  if (cvData.personalInfo.website) contactInfo.push(`🌐 ${cvData.personalInfo.website}`);

  if (contactInfo.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactInfo.join(' • '),
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      })
    );
  }

  // Divider line
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '________________________________________________________________________________________',
          color: primaryColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );

  // Professional Summary
  if (cvData.personalInfo.professionalSummary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROFESSIONAL SUMMARY',
            bold: true,
            size: 24,
            color: primaryColor,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
        spacing: { after: 120 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.personalInfo.professionalSummary,
            size: 20,
          }),
        ],
        spacing: { after: 240 },
      })
    );
  }

  // Professional Experience
  const experiences = cvData.experiences || cvData.experience || [];
  // Optional debugging (remove in production)
  // console.log('Processing experiences:', experiences.length);
  
  if (experiences.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROFESSIONAL EXPERIENCE',
            bold: true,
            size: 24,
            color: primaryColor,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
        spacing: { after: 120 },
      })
    );

    experiences.forEach((exp: any, index: number) => {
      // Job title and company
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.jobTitle,
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: ` | ${exp.company}`,
              size: 22,
              color: primaryColor,
              bold: true,
            }),
            ...(exp.location ? [new TextRun({ text: ` • ${exp.location}`, size: 20 })] : []),
          ],
          spacing: { after: 60 },
        })
      );

      // Date range
      const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
      const endDate = exp.isCurrentJob ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
      
      if (startDate || endDate) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${startDate} - ${endDate}`,
                italics: true,
                size: 20,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }

      // Responsibilities
      if (exp.responsibilities && exp.responsibilities.filter((r: string) => r.trim()).length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Key Responsibilities:',
                bold: true,
                size: 20,
              }),
            ],
            spacing: { after: 60 },
          })
        );

        exp.responsibilities.filter((r: string) => r.trim()).forEach((resp: string) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${resp}`,
                  size: 20,
                }),
              ],
              indent: { left: 720 },
              spacing: { after: 60 },
            })
          );
        });
      }

      // Achievements
      if (exp.achievements && exp.achievements.filter((a: string) => a.trim()).length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Key Achievements:',
                bold: true,
                size: 20,
              }),
            ],
            spacing: { after: 60 },
          })
        );

        exp.achievements.filter((a: string) => a.trim()).forEach((achievement: string) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${achievement}`,
                  size: 20,
                }),
              ],
              indent: { left: 720 },
              spacing: { after: 60 },
            })
          );
        });
      }

      children.push(
        new Paragraph({
          children: [new TextRun({ text: '', size: 20 })],
          spacing: { after: 240 },
        })
      );
    });
  }

  // Education
  if (cvData.education && cvData.education.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'EDUCATION',
            bold: true,
            size: 24,
            color: primaryColor,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
        spacing: { after: 120 },
      })
    );

    cvData.education.forEach((edu: any) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: ` | ${edu.institution}`,
              size: 22,
              color: primaryColor,
              bold: true,
            }),
            ...(edu.location ? [new TextRun({ text: ` • ${edu.location}`, size: 20 })] : []),
          ],
          spacing: { after: 60 },
        })
      );

      const graduationInfo = [];
      if (edu.graduationDate) {
        graduationInfo.push(new Date(edu.graduationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }
      if (edu.gpa) {
        graduationInfo.push(`GPA: ${edu.gpa}`);
      }

      if (graduationInfo.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: graduationInfo.join(' • '),
                italics: true,
                size: 20,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }

      if (edu.relevantCourses && edu.relevantCourses.filter((c: string) => c.trim()).length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Relevant Courses: ${edu.relevantCourses.filter((c: string) => c.trim()).join(', ')}`,
                size: 20,
              }),
            ],
            spacing: { after: 240 },
          })
        );
      }
    });
  }

  // Skills - Handle both array and nested object structures
  if (cvData.skills) {
    let hasSkills = false;
    
    // Check if skills is an array (old structure) or object (new structure)
    if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
      hasSkills = true;
    } else if (cvData.skills.technical?.length > 0 || cvData.skills.soft?.length > 0 || cvData.skills.languages?.length > 0) {
      hasSkills = true;
    }

    if (hasSkills) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'CORE COMPETENCIES',
              bold: true,
              size: 24,
              color: primaryColor,
              underline: { type: UnderlineType.SINGLE },
            }),
          ],
          spacing: { after: 120 },
        })
      );

      if (Array.isArray(cvData.skills)) {
        // Handle old array structure
        const skillCategories = ['Technical', 'Soft', 'Language', 'Other'];
        skillCategories.forEach(category => {
          const categorySkills = cvData.skills.filter((skill: any) => skill.category === category);
          if (categorySkills.length > 0) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${category} Skills: `,
                    bold: true,
                    size: 20,
                  }),
                  new TextRun({
                    text: categorySkills.map((skill: any) => skill.name).join(' • '),
                    size: 20,
                  }),
                ],
                spacing: { after: 120 },
              })
            );
          }
        });
      } else {
        // Handle new nested object structure
        if (cvData.skills.technical?.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Technical Skills: ',
                  bold: true,
                  size: 20,
                }),
                new TextRun({
                  text: cvData.skills.technical.map((skill: any) => skill.name).join(' • '),
                  size: 20,
                }),
              ],
              spacing: { after: 120 },
            })
          );
        }

        if (cvData.skills.soft?.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Soft Skills: ',
                  bold: true,
                  size: 20,
                }),
                new TextRun({
                  text: cvData.skills.soft.map((skill: any) => skill.name).join(' • '),
                  size: 20,
                }),
              ],
              spacing: { after: 120 },
            })
          );
        }

        if (cvData.skills.languages?.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Languages: ',
                  bold: true,
                  size: 20,
                }),
                new TextRun({
                  text: cvData.skills.languages.map((lang: any) => `${lang.name || lang.language} (${lang.proficiency || lang.level || 'Proficient'})`).join(' • '),
                  size: 20,
                }),
              ],
              spacing: { after: 120 },
            })
          );
        }
      }
    }
  }

  // Projects
  if (cvData.projects && cvData.projects.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROJECTS',
            bold: true,
            size: 24,
            color: primaryColor,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
        spacing: { after: 120 },
      })
    );

    cvData.projects.forEach((project: any) => {
      const organizationText = project.organization ? ` | ${project.organization}` : '';
      const dateText = (project.startDate || project.endDate) 
        ? ` | ${project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - ${project.isOngoing ? 'Ongoing' : project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}` 
        : '';

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.title + organizationText + dateText,
              bold: true,
              size: 22,
            }),
          ],
          spacing: { after: 60 },
        })
      );

      if (project.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project.description,
                size: 20,
              }),
            ],
            spacing: { after: 60 },
          })
        );
      }

      // Handle technologies (array or string)
      if (project.technologies) {
        const techText = Array.isArray(project.technologies) 
          ? project.technologies.filter((t: string) => t.trim()).join(', ') 
          : project.technologies;
        
        if (techText) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Technologies: ${techText}`,
                  size: 20,
                  color: primaryColor,
                }),
              ],
              spacing: { after: 60 },
            })
          );
        }
      }

      if (project.projectUrl || project.link) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `🔗 ${project.projectUrl || project.link}`,
                size: 20,
                italics: true,
              }),
            ],
            spacing: { after: 240 },
          })
        );
      }
    });
  }

  // Certifications
  if (cvData.certifications && cvData.certifications.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'CERTIFICATIONS',
            bold: true,
            size: 24,
            color: primaryColor,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
        spacing: { after: 120 },
      })
    );

    cvData.certifications.forEach((cert: any) => {
      const issuer = cert.issuingOrganization || cert.issuer;
      const issueDate = cert.issueDate || cert.date;
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cert.name,
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: ` | ${issuer}`,
              size: 22,
              color: primaryColor,
              bold: true,
            }),
            ...(issueDate ? [new TextRun({ text: ` • ${new Date(issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`, size: 20 })] : []),
          ],
          spacing: { after: 60 },
        })
      );

      if (cert.expiryDate) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Expires: ${new Date(cert.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
                size: 18,
                color: '#666666',
              }),
            ],
            spacing: { after: 60 },
          })
        );
      }

      if (cert.credentialId || cert.credentialUrl || cert.link) {
        const credInfo = [];
        if (cert.credentialId) credInfo.push(`Credential ID: ${cert.credentialId}`);
        if (cert.credentialUrl || cert.link) credInfo.push(`🔗 ${cert.credentialUrl || cert.link}`);
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: credInfo.join(' | '),
                size: 18,
                italics: true,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    });
  }

  // Awards
  if (cvData.awards && cvData.awards.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'AWARDS & ACHIEVEMENTS',
            bold: true,
            size: 24,
            color: primaryColor,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
        spacing: { after: 120 },
      })
    );

    cvData.awards.forEach((award: any) => {
      const awardName = award.name || award.title;
      const issuer = award.issuingOrganization || award.issuer;
      const awardDate = award.dateReceived || award.date;
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: awardName,
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: ` | ${issuer}`,
              size: 22,
              color: primaryColor,
              bold: true,
            }),
            ...(awardDate ? [new TextRun({ text: ` • ${new Date(awardDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`, size: 20 })] : []),
          ],
          spacing: { after: award.description ? 60 : 120 },
        })
      );

      if (award.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: award.description,
                size: 20,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    });
  }

  // Languages - Only if not already included in skills
  if (cvData.languages && cvData.languages.length > 0 && (!cvData.skills?.languages || cvData.skills.languages.length === 0)) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'LANGUAGES',
            bold: true,
            size: 24,
            color: primaryColor,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
        spacing: { after: 120 },
      })
    );

    cvData.languages.forEach((lang: any) => {
      const langName = lang.language || lang.name;
      const certificationText = lang.certification ? ` (${lang.certification})` : '';
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${langName}: `,
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: (lang.proficiency || 'Proficient') + certificationText,
              size: 20,
            }),
          ],
          spacing: { after: 60 },
        })
      );
    });

    children.push(
      new Paragraph({
        children: [new TextRun({ text: '', size: 20 })],
        spacing: { after: 120 },
      })
    );
  }

  // Custom Sections
  if (cvData.customSections && cvData.customSections.length > 0) {
    cvData.customSections.forEach((section: any) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.title.toUpperCase(),
              bold: true,
              size: 24,
              color: primaryColor,
              underline: { type: UnderlineType.SINGLE },
            }),
          ],
          spacing: { after: 120 },
        })
      );

      if (section.content) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.content,
                size: 20,
              }),
            ],
            spacing: { after: 240 },
          })
        );
      }

      if (section.items && section.items.length > 0) {
        section.items.forEach((item: string) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  size: 20,
                }),
              ],
              indent: { left: 720 },
              spacing: { after: 60 },
            })
          );
        });
      }

      children.push(
        new Paragraph({
          children: [new TextRun({ text: '', size: 20 })],
          spacing: { after: 120 },
        })
      );
    });
  }

  // References
  if (cvData.references && cvData.references.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'REFERENCES',
            bold: true,
            size: 24,
            color: primaryColor,
            underline: { type: UnderlineType.SINGLE },
          }),
        ],
        spacing: { after: 120 },
      })
    );

    cvData.references.forEach((ref: any, index: number) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ref.name,
              bold: true,
              size: 22,
            }),
          ],
          spacing: { after: 60 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${ref.jobTitle || ref.title}`,
              size: 20,
              color: primaryColor,
              bold: true,
            }),
          ],
          spacing: { after: 30 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ref.company,
              size: 20,
            }),
          ],
          spacing: { after: 60 },
        })
      );

      const contactInfo = [];
      if (ref.email) contactInfo.push(`📧 ${ref.email}`);
      if (ref.phone) contactInfo.push(`📞 ${ref.phone}`);

      if (contactInfo.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: contactInfo.join(' • '),
                size: 18,
              }),
            ],
            spacing: { after: 60 },
          })
        );
      }

      if (ref.relationship) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Relationship: ${ref.relationship}`,
                size: 18,
                italics: true,
              }),
            ],
            spacing: { after: index < cvData.references.length - 1 ? 180 : 120 },
          })
        );
      }
    });
  }

  // Optional debugging (remove in production)
  // console.log('Word document sections:', children.length);

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
    styles: {
      paragraphStyles: [
        {
          id: 'heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: primaryColor,
          },
          paragraph: {
            spacing: {
              after: 240,
            },
          },
        },
      ],
    },
  });

  return doc;
};

// Function to escape HTML
const escapeHtml = (text: string): string => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Function to safely render HTML content
const safeRender = (content: string): string => {
  if (!content) return '';
  return escapeHtml(content).replace(/\n/g, '<br>');
};

// Generate HTML for PDF export
const generateCVHTML = (cvData: any, template: any) => {
  // Validate input data
  if (!cvData || !cvData.personalInfo) {
    throw new Error('Invalid CV data: personalInfo is required');
  }

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
        * { box-sizing: border-box; }
        body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 40px 30px; 
            line-height: 1.6; 
            font-size: 12px; 
            color: #333;
            background: white;
        }
        .header { 
            border-bottom: 3px solid ${styles.primary}; 
            padding-bottom: 15px; 
            margin-bottom: 25px; 
            text-align: center; 
        }
        .name { 
            color: ${styles.primary}; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            letter-spacing: 1px;
        }
        .contact { 
            display: flex; 
            gap: 15px; 
            flex-wrap: wrap; 
            font-size: 11px; 
            justify-content: center;
            margin-top: 10px;
        }
        .contact-item { 
            display: inline-flex; 
            align-items: center; 
            gap: 3px; 
            white-space: nowrap;
        }
        .section-title { 
            color: ${styles.primary}; 
            font-size: 16px; 
            font-weight: bold; 
            margin: 25px 0 12px 0; 
            text-transform: uppercase;
            border-bottom: 1px solid ${styles.primary};
            padding-bottom: 3px;
        }
        .job-title { 
            font-size: 14px; 
            font-weight: bold; 
            margin-bottom: 3px; 
            display: inline-block;
        }
        .company { 
            color: ${styles.primary}; 
            font-weight: bold; 
            display: inline-block;
        }
        .date { 
            font-style: italic; 
            float: right; 
            font-size: 11px;
            color: #666;
        }
        .summary { 
            margin-bottom: 20px; 
            line-height: 1.7; 
            text-align: justify;
        }
        ul { 
            margin: 8px 0; 
            padding-left: 18px; 
            list-style-type: disc;
        }
        li { 
            margin-bottom: 4px; 
            line-height: 1.5;
        }
        .skills-grid { 
            display: flex;
            flex-wrap: wrap;
            gap: 20px; 
        }
        .skills-category { 
            flex: 1;
            min-width: 200px;
            margin-bottom: 15px; 
        }
        .skills-title { 
            font-weight: bold; 
            color: ${styles.primary}; 
            margin-bottom: 5px; 
        }
        .experience-item { 
            margin-bottom: 20px; 
            page-break-inside: avoid;
        }
        .education-item { 
            margin-bottom: 15px; 
            page-break-inside: avoid;
        }
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
        @media print {
            body { padding: 20px; }
            .section-title { page-break-after: avoid; }
            .experience-item, .education-item { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}</div>
        <div class="contact">
            ${cvData.personalInfo.email ? `<div class="contact-item">📧 ${cvData.personalInfo.email}</div>` : ''}
            ${cvData.personalInfo.phone ? `<div class="contact-item">📞 ${cvData.personalInfo.phone}</div>` : ''}
            ${cvData.personalInfo.location ? `<div class="contact-item">📍 ${cvData.personalInfo.location}</div>` : ''}
            ${cvData.personalInfo.linkedin ? `<div class="contact-item">💼 ${cvData.personalInfo.linkedin}</div>` : ''}
            ${cvData.personalInfo.website ? `<div class="contact-item">🌐 ${cvData.personalInfo.website}</div>` : ''}
        </div>
    </div>

    ${cvData.personalInfo.professionalSummary ? `
    <div class="section-title">PROFESSIONAL SUMMARY</div>
    <div class="summary">${cvData.personalInfo.professionalSummary}</div>
    ` : ''}

    ${(() => {
      const experiences = cvData.experiences || cvData.experience || [];
      return experiences.length > 0 ? `
    <div class="section-title">PROFESSIONAL EXPERIENCE</div>
    ${experiences.map((exp: any) => `
        <div class="experience-item">
            <div class="clearfix">
                <div class="job-title">${exp.jobTitle}</div>
                <div class="company"> | ${exp.company}${exp.location ? ` • ${exp.location}` : ''}</div>
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
    ` : '';
    })()}

    ${cvData.education && cvData.education.length > 0 ? `
    <div class="section-title">EDUCATION</div>
    ${cvData.education.map((edu: any) => `
        <div class="education-item">
            <div class="clearfix">
                <div class="job-title">${edu.degree}</div>
                <div class="company"> | ${edu.institution}${edu.location ? ` • ${edu.location}` : ''}</div>
                <div class="date">${edu.graduationDate ? new Date(edu.graduationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
            </div>
            ${edu.relevantCourses && edu.relevantCourses.filter((c: string) => c.trim()).length > 0 ? `
            <div><strong>Relevant Courses:</strong> ${edu.relevantCourses.filter((c: string) => c.trim()).join(', ')}</div>
            ` : ''}
        </div>
    `).join('')}
    ` : ''}

    ${cvData.skills ? (() => {
      let hasSkills = false;
      
      // Check if skills is an array (old structure) or object (new structure)
      if (Array.isArray(cvData.skills) && cvData.skills.length > 0) {
        hasSkills = true;
      } else if (cvData.skills.technical?.length > 0 || cvData.skills.soft?.length > 0 || cvData.skills.languages?.length > 0) {
        hasSkills = true;
      }

      if (!hasSkills) return '';

      let skillsHTML = '<div class="section-title">CORE COMPETENCIES</div><div class="skills-grid">';

      if (Array.isArray(cvData.skills)) {
        // Handle old array structure
        skillsHTML += ['Technical', 'Soft', 'Language', 'Other'].map(category => {
          const categorySkills = cvData.skills.filter((skill: any) => skill.category === category);
          return categorySkills.length > 0 ? `
            <div class="skills-category">
                <div class="skills-title">${category} Skills:</div>
                <div>${categorySkills.map((skill: any) => skill.name).join(' • ')}</div>
            </div>
          ` : '';
        }).join('');
      } else {
        // Handle new nested object structure
        if (cvData.skills.technical?.length > 0) {
          skillsHTML += `
            <div class="skills-category">
                <div class="skills-title">Technical Skills:</div>
                <div>${cvData.skills.technical.map((skill: any) => skill.name).join(' • ')}</div>
            </div>
          `;
        }
        
        if (cvData.skills.soft?.length > 0) {
          skillsHTML += `
            <div class="skills-category">
                <div class="skills-title">Soft Skills:</div>
                <div>${cvData.skills.soft.map((skill: any) => skill.name).join(' • ')}</div>
            </div>
          `;
        }
        
        if (cvData.skills.languages?.length > 0) {
          skillsHTML += `
            <div class="skills-category">
                <div class="skills-title">Languages:</div>
                <div>${cvData.skills.languages.map((lang: any) => `${lang.name || lang.language} (${lang.proficiency || lang.level || 'Proficient'})`).join(' • ')}</div>
            </div>
          `;
        }
      }

      skillsHTML += '</div>';
      return skillsHTML;
    })() : ''}

    ${cvData.projects && cvData.projects.length > 0 ? `
    <div class="section-title">PROJECTS</div>
    ${cvData.projects.map((project: any) => `
        <div class="experience-item">
            <div class="clearfix">
                <div class="job-title">${project.title}</div>
                ${project.organization ? `<div class="company"> | ${project.organization}</div>` : ''}
                ${project.startDate || project.endDate ? `<div class="date">${project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - ${project.isOngoing ? 'Ongoing' : project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}</div>` : ''}
            </div>
            ${project.description ? `<div style="margin-top: 8px;">${project.description}</div>` : ''}
            ${project.technologies && (Array.isArray(project.technologies) ? project.technologies.filter(t => t.trim()).length > 0 : project.technologies) ? `<div style="margin-top: 5px;"><strong>Technologies:</strong> ${Array.isArray(project.technologies) ? project.technologies.filter(t => t.trim()).join(', ') : project.technologies}</div>` : ''}
            ${project.projectUrl || project.link ? `<div style="margin-top: 5px; font-style: italic; font-size: 11px;">🔗 ${project.projectUrl || project.link}</div>` : ''}
        </div>
    `).join('')}
    ` : ''}

    ${cvData.certifications && cvData.certifications.length > 0 ? `
    <div class="section-title">CERTIFICATIONS</div>
    ${cvData.certifications.map((cert: any) => `
        <div class="education-item">
            <div class="clearfix">
                <div class="job-title">${cert.name}</div>
                <div class="company"> | ${cert.issuingOrganization || cert.issuer}</div>
                ${cert.issueDate || cert.date ? `<div class="date">${new Date(cert.issueDate || cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>` : ''}
            </div>
            ${cert.expiryDate ? `<div style="font-size: 11px; color: #666;">Expires: ${new Date(cert.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>` : ''}
            ${cert.credentialId || cert.credentialUrl || cert.link ? `
            <div style="margin-top: 5px; font-size: 11px; font-style: italic;">
                ${cert.credentialId ? `Credential ID: ${cert.credentialId}` : ''}
                ${cert.credentialId && (cert.credentialUrl || cert.link) ? ' | ' : ''}
                ${cert.credentialUrl || cert.link ? `🔗 ${cert.credentialUrl || cert.link}` : ''}
            </div>
            ` : ''}
        </div>
    `).join('')}
    ` : ''}

    ${cvData.awards && cvData.awards.length > 0 ? `
    <div class="section-title">AWARDS & ACHIEVEMENTS</div>
    ${cvData.awards.map((award: any) => `
        <div class="education-item">
            <div class="clearfix">
                <div class="job-title">${award.name || award.title}</div>
                <div class="company"> | ${award.issuingOrganization || award.issuer}</div>
                ${award.dateReceived || award.date ? `<div class="date">${new Date(award.dateReceived || award.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>` : ''}
            </div>
            ${award.description ? `<div style="margin-top: 8px;">${award.description}</div>` : ''}
        </div>
    `).join('')}
    ` : ''}

    ${cvData.languages && cvData.languages.length > 0 && (!cvData.skills?.languages || cvData.skills.languages.length === 0) ? `
    <div class="section-title">LANGUAGES</div>
    <div style="margin-bottom: 20px;">
        ${cvData.languages.map((lang: any) => `
            <div style="margin-bottom: 5px;">
                <strong>${lang.language || lang.name}:</strong> ${lang.proficiency || 'Proficient'}
                ${lang.certification ? ` (${lang.certification})` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${cvData.references && cvData.references.length > 0 ? `
    <div class="section-title">REFERENCES</div>
    <div style="display: flex; flex-wrap: wrap; gap: 20px;">
        ${cvData.references.map((ref: any) => `
            <div style="flex: 1; min-width: 250px; margin-bottom: 15px;">
                <div class="job-title">${ref.name}</div>
                <div style="color: ${styles.primary}; font-weight: bold;">${ref.jobTitle || ref.title}</div>
                <div>${ref.company}</div>
                ${ref.email ? `<div style="font-size: 11px; margin-top: 3px;">📧 ${ref.email}</div>` : ''}
                ${ref.phone ? `<div style="font-size: 11px;">📞 ${ref.phone}</div>` : ''}
                ${ref.relationship ? `<div style="font-size: 11px; font-style: italic; color: #666; margin-top: 2px;">Relationship: ${ref.relationship}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${cvData.customSections && cvData.customSections.length > 0 ? 
      cvData.customSections.map((section: any) => `
        <div class="section-title">${section.title.toUpperCase()}</div>
        ${section.content ? `<div class="summary">${section.content}</div>` : ''}
        ${section.items && section.items.length > 0 ? `
        <ul>
            ${section.items.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
        ` : ''}
      `).join('')
    : ''}
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

    // Validate CV data
    if (!cvData.personalInfo?.firstName || !cvData.personalInfo?.lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    const html = generateCVHTML(cvData, template);
    console.log('Generated HTML length:', html.length);

    // Generate PDF using Puppeteer with simplified approach
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'networkidle2' });
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        }
      });
      
      console.log('PDF generated successfully, size:', pdf.length, 'bytes');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV.pdf"`);
      res.setHeader('Content-Length', pdf.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      
      // Send as buffer to ensure binary integrity
      res.end(pdf, 'binary');
      
    } finally {
      await browser.close();
    }

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

    // Validate CV data
    if (!cvData.personalInfo?.firstName || !cvData.personalInfo?.lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    // Optional debugging (remove in production)
    // console.log('CV Export - Experience count:', (cvData?.experience || cvData?.experiences || []).length);

    const doc = generateCVWordDocument(cvData, template);
    const buffer = await Packer.toBuffer(doc);

    console.log('Generated Word document size:', buffer.length);
    
    if (buffer.length === 0) {
      throw new Error('Generated Word document is empty');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV.docx"`);
    res.send(buffer);

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

// Test endpoint to debug HTML generation
router.get('/test-html', auth, async (req, res) => {
  try {
    // Sample CV data for testing
    const sampleCvData = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+1234567890',
        location: 'New York, NY',
        linkedin: 'linkedin.com/in/johndoe',
        website: 'johndoe.com',
        professionalSummary: 'Experienced software developer with 5+ years of experience.'
      },
      experiences: [{
        jobTitle: 'Software Developer',
        company: 'Tech Company',
        location: 'New York, NY',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        isCurrentJob: false,
        responsibilities: ['Developed web applications', 'Led team of 3 developers']
      }],
      education: [{
        degree: 'Bachelor of Computer Science',
        institution: 'University of Technology',
        location: 'New York, NY',
        graduationDate: '2019-05-01',
        gpa: '3.8',
        relevantCourses: ['Data Structures', 'Algorithms', 'Web Development']
      }],
      skills: [{
        name: 'JavaScript',
        category: 'Technical'
      }, {
        name: 'Communication',
        category: 'Soft'
      }]
    };

    const sampleTemplate = {
      name: 'Professional',
      color: 'blue'
    };

    const html = generateCVHTML(sampleCvData, sampleTemplate);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating test HTML:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;