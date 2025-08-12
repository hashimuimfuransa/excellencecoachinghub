import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add,
  Delete,
  ExpandMore,
  Save,
  Publish,
  Preview,
  CloudUpload,
  Description
} from '@mui/icons-material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../store/AuthContext';
import { courseService } from '../../services/courseService';
import { assessmentService, ICreateQuestionData } from '../../services/assessmentService';
import SpecialCharacterInput from '../../components/SpecialCharacterInput';

interface Question extends ICreateQuestionData {
  _id?: string; // Optional for new questions
  section: 'A' | 'B' | 'C';
  mathEquation: boolean;
}

interface AssessmentData {
  title: string;
  description: string;
  courseId: string;
  type: 'quiz' | 'assignment' | 'exam' | 'project' | 'homework';
  questions: Question[];
  timeLimit?: number;
  attempts: number;
  dueDate?: Date;
  availableFrom?: Date;
  availableUntil?: Date;
  instructions: string;
  allowLateSubmission: boolean;
  lateSubmissionPenalty?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  requireProctoring: boolean;
  passingScore?: number;
  gradingRubric: string;
}

const steps = ['Basic Information', 'Questions', 'Settings', 'Review'];

const CreateAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractingQuestions, setExtractingQuestions] = useState(false);

  // Form data
  const [formData, setFormData] = useState<AssessmentData>({
    title: '',
    description: '',
    courseId: '',
    type: 'quiz',
    questions: [],
    attempts: 1,
    instructions: '',
    allowLateSubmission: false,
    randomizeQuestions: false,
    randomizeOptions: false,
    showResultsImmediately: true,
    showCorrectAnswers: true,
    requireProctoring: false,
    gradingRubric: ''
  });

  // Load teacher's courses and set initial courseId from URL
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await courseService.getTeacherCourses();
        setCourses(response.courses.filter((course: any) => course.status === 'approved'));
        
        // Set courseId from URL parameter if provided
        const courseIdParam = searchParams.get('courseId');
        if (courseIdParam) {
          setFormData(prev => ({
            ...prev,
            courseId: courseIdParam
          }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load courses');
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, [searchParams]);

  // Handle form input changes
  const handleInputChange = (field: keyof AssessmentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF, Word document, or text file');
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setUploadedFile(file);
      setError(null);
    }
  };

  // Remove uploaded file
  const removeUploadedFile = () => {
    setUploadedFile(null);
  };

  // Add new question
  const addQuestion = () => {
    const questionId = `q_${Date.now()}`;
    const newQuestion: Question = {
      _id: questionId,
      id: questionId,
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      section: 'A',
      difficulty: 'medium',
      mathEquation: false
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  // Update question
  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  // Delete question
  const deleteQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  // Handle next step
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  // Save as draft
  const saveDraft = async () => {
    try {
      setLoading(true);
      setError(null);
      setExtractingQuestions(!!uploadedFile);

      const assessmentData = {
        ...formData,
        course: formData.courseId, // Use 'course' field for backend compatibility
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : undefined,
        availableFrom: formData.availableFrom ? formData.availableFrom.toISOString() : undefined,
        availableUntil: formData.availableUntil ? formData.availableUntil.toISOString() : undefined,
        isPublished: false
      };

      await assessmentService.createAssessment(assessmentData, uploadedFile || undefined);

      navigate('/dashboard/teacher/assessments');
    } catch (err: any) {
      setError(err.message || 'Failed to save assessment');
    } finally {
      setLoading(false);
      setExtractingQuestions(false);
    }
  };

  // Publish assessment
  const publishAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      setExtractingQuestions(!!uploadedFile);

      const assessmentData = {
        ...formData,
        course: formData.courseId, // Use 'course' field for backend compatibility
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : undefined,
        availableFrom: formData.availableFrom ? formData.availableFrom.toISOString() : undefined,
        availableUntil: formData.availableUntil ? formData.availableUntil.toISOString() : undefined,
        isPublished: true
      };

      await assessmentService.createAssessment(assessmentData, uploadedFile || undefined);

      navigate('/dashboard/teacher/assessments');
    } catch (err: any) {
      setError(err.message || 'Failed to publish assessment');
    } finally {
      setLoading(false);
      setExtractingQuestions(false);
    }
  };

  // Render basic information step
  const renderBasicInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Assessment Title *"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter assessment title"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe what this assessment covers"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Course *</InputLabel>
          <Select
            value={formData.courseId}
            label="Course *"
            onChange={(e) => handleInputChange('courseId', e.target.value)}
            disabled={coursesLoading}
          >
            {courses.map((course) => (
              <MenuItem key={course._id} value={course._id}>
                {course.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Assessment Type *</InputLabel>
          <Select
            value={formData.type}
            label="Assessment Type *"
            onChange={(e) => handleInputChange('type', e.target.value)}
          >
            <MenuItem value="quiz">Quiz</MenuItem>
            <MenuItem value="assignment">Assignment</MenuItem>
            <MenuItem value="exam">Exam</MenuItem>
            <MenuItem value="project">Project</MenuItem>
            <MenuItem value="homework">Homework</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Instructions"
          value={formData.instructions}
          onChange={(e) => handleInputChange('instructions', e.target.value)}
          placeholder="Provide instructions for students taking this assessment"
        />
      </Grid>

      {/* Document Upload Section */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, border: '2px dashed #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description />
            Upload Assessment Document (Optional)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a PDF, Word document, or text file containing questions. Our AI will extract and format them automatically.
          </Typography>
          
          {!uploadedFile ? (
            <Box sx={{ textAlign: 'center' }}>
              <input
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                id="document-upload"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="document-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  sx={{ mb: 1 }}
                >
                  Choose File
                </Button>
              </label>
              <Typography variant="caption" display="block" color="text.secondary">
                Supported formats: PDF, Word (.doc, .docx), Text (.txt) • Max size: 10MB
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description color="primary" />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {uploadedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Box>
              <Button
                size="small"
                color="error"
                onClick={removeUploadedFile}
                startIcon={<Delete />}
              >
                Remove
              </Button>
            </Box>
          )}
          
          {extractingQuestions && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="primary">
                Extracting questions from document...
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  // Render questions step
  const renderQuestions = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6">
            Questions ({formData.questions.length})
          </Typography>
          {uploadedFile && (
            <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
              Questions will be extracted from uploaded document: {uploadedFile.name}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={addQuestion}
        >
          Add Question
        </Button>
      </Box>

      {formData.questions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No questions added yet. Click "Add Question" to get started.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {formData.questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onUpdate={(updates) => updateQuestion(question.id, updates)}
              onDelete={() => deleteQuestion(question.id)}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  if (coursesLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create Assessment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create a new assessment for your students
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stepper */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Form Content */}
        <Paper sx={{ p: 3, mb: 3 }}>
          {activeStep === 0 && renderBasicInfo()}
          {activeStep === 1 && renderQuestions()}
          {activeStep === 2 && <AssessmentSettings formData={formData} onChange={handleInputChange} />}
          {activeStep === 3 && <AssessmentReview formData={formData} />}
        </Paper>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={saveDraft}
              disabled={loading}
            >
              Save Draft
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                startIcon={<Publish />}
                onClick={publishAssessment}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Publish Assessment'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

// Question Editor Component (simplified for space)
const QuestionEditor: React.FC<{
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}> = ({ question, index, onUpdate, onDelete }) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Typography variant="subtitle1">
            Question {index + 1}
          </Typography>
          <Chip label={question.type} size="small" />
          <Chip label={`Section ${question.section}`} size="small" />
          <Chip label={`${question.points} pts`} size="small" />
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Delete />
          </IconButton>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <SpecialCharacterInput
              label="Question *"
              value={question.question}
              onChange={(value) => onUpdate({ question: value })}
              multiline
              rows={3}
            />
          </Grid>
          
          {question.type === 'multiple_choice' && (
            <>
              {question.options?.map((option, optionIndex) => (
                <Grid item xs={12} md={6} key={optionIndex}>
                  <SpecialCharacterInput
                    label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                    value={option}
                    onChange={(value) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = value;
                      onUpdate({ options: newOptions });
                    }}
                  />
                </Grid>
              ))}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Correct Answer</InputLabel>
                  <Select
                    value={question.correctAnswer}
                    label="Correct Answer"
                    onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                  >
                    {question.options?.map((option, optionIndex) => (
                      <MenuItem key={optionIndex} value={option}>
                        Option {String.fromCharCode(65 + optionIndex)}: {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {(question.type === 'short_answer' || question.type === 'essay' || question.type === 'numerical') && (
            <Grid item xs={12}>
              <SpecialCharacterInput
                label="Correct Answer / Sample Answer"
                value={question.correctAnswer as string}
                onChange={(value) => onUpdate({ correctAnswer: value })}
                multiline={question.type === 'essay'}
                rows={question.type === 'essay' ? 4 : 1}
              />
            </Grid>
          )}

          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Points"
              value={question.points}
              onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                value={question.section}
                label="Section"
                onChange={(e) => onUpdate({ section: e.target.value as 'A' | 'B' | 'C' })}
              >
                <MenuItem value="A">Section A</MenuItem>
                <MenuItem value="B">Section B</MenuItem>
                <MenuItem value="C">Section C</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <SpecialCharacterInput
              label="Explanation (Optional)"
              value={question.explanation || ''}
              onChange={(value) => onUpdate({ explanation: value })}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

// Placeholder components for other steps
const AssessmentSettings: React.FC<{
  formData: AssessmentData;
  onChange: (field: keyof AssessmentData, value: any) => void;
}> = ({ formData, onChange }) => (
  <Typography>Assessment Settings Component - To be implemented</Typography>
);

const AssessmentReview: React.FC<{
  formData: AssessmentData;
}> = ({ formData }) => (
  <Typography>Assessment Review Component - To be implemented</Typography>
);

export default CreateAssessment;
