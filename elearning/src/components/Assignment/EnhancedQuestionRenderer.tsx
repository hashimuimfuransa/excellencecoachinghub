import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Slider
} from '@mui/material';
import {
  DragIndicator,
  Code,
  Functions,
  Quiz,
  Edit,
  CheckCircle,
  Cancel,
  Help,
  Timer,
  Lightbulb,
  Warning
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Styled components
const QuestionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
  }
}));

const QuestionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(1)
}));

const CodeEditor = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    fontSize: '14px',
    lineHeight: 1.5
  }
}));

const DraggableItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  margin: theme.spacing(0.5, 0),
  cursor: 'grab',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  '&:active': {
    cursor: 'grabbing'
  }
}));

interface Question {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'fill-in-blank' | 'matching' | 'ordering' | 'numerical' | 'code';
  options?: string[];
  correctAnswer?: string | string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  codeLanguage?: string;
  numericalRange?: { min: number; max: number };
  points: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Answer {
  questionIndex: number;
  answer: string | string[];
  questionType: string;
  timeSpent?: number;
  attempts?: number;
}

interface EnhancedQuestionRendererProps {
  question: Question;
  questionIndex: number;
  answer?: Answer;
  onAnswerChange: (questionIndex: number, answer: string | string[], timeSpent?: number) => void;
  showCorrectAnswer?: boolean;
  isSubmitted?: boolean;
  timeLimit?: number; // in seconds
}

const EnhancedQuestionRenderer: React.FC<EnhancedQuestionRendererProps> = ({
  question,
  questionIndex,
  answer,
  onAnswerChange,
  showCorrectAnswer = false,
  isSubmitted = false,
  timeLimit
}) => {
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>(answer?.answer || '');
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(answer?.attempts || 0);
  const [showHint, setShowHint] = useState(false);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Update answer when currentAnswer changes
  useEffect(() => {
    if (currentAnswer !== (answer?.answer || '')) {
      onAnswerChange(questionIndex, currentAnswer, timeSpent);
    }
  }, [currentAnswer, questionIndex, onAnswerChange, timeSpent, answer?.answer]);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMultipleChoice = () => (
    <RadioGroup
      value={currentAnswer}
      onChange={(e) => {
        setCurrentAnswer(e.target.value);
        setAttempts(prev => prev + 1);
      }}
    >
      {question.options?.map((option, index) => (
        <FormControlLabel
          key={index}
          value={option}
          control={<Radio />}
          label={option}
          disabled={isSubmitted}
          sx={{
            '& .MuiFormControlLabel-label': {
              fontSize: '1.1rem',
              lineHeight: 1.6
            }
          }}
        />
      ))}
    </RadioGroup>
  );

  const renderTrueFalse = () => (
    <RadioGroup
      value={currentAnswer}
      onChange={(e) => {
        setCurrentAnswer(e.target.value);
        setAttempts(prev => prev + 1);
      }}
      row
    >
      <FormControlLabel
        value="true"
        control={<Radio />}
        label="True"
        disabled={isSubmitted}
        sx={{ mr: 4 }}
      />
      <FormControlLabel
        value="false"
        control={<Radio />}
        label="False"
        disabled={isSubmitted}
      />
    </RadioGroup>
  );

  const renderShortAnswer = () => (
    <TextField
      fullWidth
      multiline
      rows={3}
      value={currentAnswer}
      onChange={(e) => setCurrentAnswer(e.target.value)}
      placeholder="Enter your answer here..."
      disabled={isSubmitted}
      variant="outlined"
      sx={{ mt: 2 }}
    />
  );

  const renderEssay = () => (
    <TextField
      fullWidth
      multiline
      rows={8}
      value={currentAnswer}
      onChange={(e) => setCurrentAnswer(e.target.value)}
      placeholder="Write your essay here... Be sure to address all parts of the question."
      disabled={isSubmitted}
      variant="outlined"
      sx={{ mt: 2 }}
      helperText={`${(currentAnswer as string).length} characters`}
    />
  );

  const renderFillInBlank = () => {
    const parts = question.question.split('_____');
    const blanks = parts.length - 1;
    const answers = Array.isArray(currentAnswer) ? currentAnswer : new Array(blanks).fill('');

    return (
      <Box sx={{ mt: 2 }}>
        {parts.map((part, index) => (
          <Box key={index} sx={{ display: 'inline-block' }}>
            <Typography component="span" sx={{ fontSize: '1.1rem' }}>
              {part}
            </Typography>
            {index < parts.length - 1 && (
              <TextField
                size="small"
                value={answers[index] || ''}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[index] = e.target.value;
                  setCurrentAnswer(newAnswers);
                }}
                disabled={isSubmitted}
                sx={{ mx: 1, minWidth: 120 }}
                variant="outlined"
              />
            )}
          </Box>
        ))}
      </Box>
    );
  };

  const renderMatching = () => {
    const leftItems = question.matchingPairs?.map(pair => pair.left) || [];
    const rightItems = question.matchingPairs?.map(pair => pair.right) || [];
    const matches = Array.isArray(currentAnswer) ? currentAnswer : [];

    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={6}>
          <Typography variant="h6" gutterBottom>Column A</Typography>
          {leftItems.map((item, index) => (
            <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
              <Typography>{index + 1}. {item}</Typography>
            </Paper>
          ))}
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6" gutterBottom>Column B</Typography>
          {rightItems.map((item, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Match with</InputLabel>
                <Select
                  value={matches[index] || ''}
                  onChange={(e) => {
                    const newMatches = [...matches];
                    newMatches[index] = e.target.value;
                    setCurrentAnswer(newMatches);
                  }}
                  disabled={isSubmitted}
                  label="Match with"
                >
                  {leftItems.map((leftItem, leftIndex) => (
                    <MenuItem key={leftIndex} value={leftIndex + 1}>
                      {leftIndex + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                {item}
              </Typography>
            </Box>
          ))}
        </Grid>
      </Grid>
    );
  };

  const renderOrdering = () => {
    const items = question.options || [];
    const orderedItems = Array.isArray(currentAnswer) ? currentAnswer : [...items];

    const handleOnDragEnd = (result: any) => {
      if (!result.destination) return;

      const newItems = Array.from(orderedItems);
      const [reorderedItem] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, reorderedItem);

      setCurrentAnswer(newItems);
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Drag and drop to reorder the items:
        </Typography>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="ordering-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {orderedItems.map((item, index) => (
                  <Draggable key={item} draggableId={item} index={index} isDragDisabled={isSubmitted}>
                    {(provided, snapshot) => (
                      <DraggableItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{
                          backgroundColor: snapshot.isDragging ? 'action.selected' : 'background.paper'
                        }}
                      >
                        <Box display="flex" alignItems="center">
                          <DragIndicator sx={{ mr: 2, color: 'text.secondary' }} />
                          <Typography>{index + 1}. {item}</Typography>
                        </Box>
                      </DraggableItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Box>
    );
  };

  const renderNumerical = () => (
    <Box sx={{ mt: 2 }}>
      <TextField
        type="number"
        value={currentAnswer}
        onChange={(e) => setCurrentAnswer(e.target.value)}
        placeholder="Enter numerical answer"
        disabled={isSubmitted}
        variant="outlined"
        fullWidth
        inputProps={{
          min: question.numericalRange?.min,
          max: question.numericalRange?.max,
          step: 'any'
        }}
      />
      {question.numericalRange && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Expected range: {question.numericalRange.min} - {question.numericalRange.max}
        </Typography>
      )}
    </Box>
  );

  const renderCode = () => (
    <Box sx={{ mt: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Code color="primary" />
        <Typography variant="subtitle2">
          Language: {question.codeLanguage || 'Plain Text'}
        </Typography>
      </Box>
      <CodeEditor
        fullWidth
        multiline
        rows={12}
        value={currentAnswer}
        onChange={(e) => setCurrentAnswer(e.target.value)}
        placeholder={`Write your ${question.codeLanguage || 'code'} here...`}
        disabled={isSubmitted}
        variant="outlined"
        sx={{
          '& .MuiInputBase-root': {
            backgroundColor: '#f8f9fa',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace'
          }
        }}
      />
    </Box>
  );

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple-choice':
        return renderMultipleChoice();
      case 'true-false':
        return renderTrueFalse();
      case 'short-answer':
        return renderShortAnswer();
      case 'essay':
        return renderEssay();
      case 'fill-in-blank':
        return renderFillInBlank();
      case 'matching':
        return renderMatching();
      case 'ordering':
        return renderOrdering();
      case 'numerical':
        return renderNumerical();
      case 'code':
        return renderCode();
      default:
        return <Typography color="error">Unsupported question type</Typography>;
    }
  };

  const getQuestionIcon = () => {
    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return <Quiz />;
      case 'short-answer':
      case 'essay':
        return <Edit />;
      case 'numerical':
        return <Functions />;
      case 'code':
        return <Code />;
      default:
        return <Help />;
    }
  };

  return (
    <QuestionCard>
      <CardContent>
        <QuestionHeader>
          <Box display="flex" alignItems="center" gap={2}>
            {getQuestionIcon()}
            <Typography variant="h6">
              Question {questionIndex + 1}
            </Typography>
            <Chip
              label={question.type.replace('-', ' ').toUpperCase()}
              size="small"
              color="primary"
              variant="outlined"
            />
            {question.difficulty && (
              <Chip
                label={question.difficulty.toUpperCase()}
                size="small"
                color={getDifficultyColor(question.difficulty) as any}
                variant="outlined"
              />
            )}
            <Chip
              label={`${question.points} pts`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {timeLimit && (
              <Tooltip title="Time spent on this question">
                <Chip
                  icon={<Timer />}
                  label={formatTime(timeSpent)}
                  size="small"
                  variant="outlined"
                  color={timeSpent > timeLimit ? 'error' : 'default'}
                />
              </Tooltip>
            )}
            {attempts > 0 && (
              <Tooltip title="Number of attempts">
                <Chip
                  label={`${attempts} attempts`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            )}
            {question.explanation && (
              <Tooltip title="Show hint">
                <IconButton
                  size="small"
                  onClick={() => setShowHint(!showHint)}
                  color={showHint ? 'primary' : 'default'}
                >
                  <Lightbulb />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </QuestionHeader>

        {/* Question Text */}
        <Typography
          variant="body1"
          sx={{
            fontSize: '1.1rem',
            lineHeight: 1.6,
            mb: 3,
            '& strong': { color: 'primary.main' },
            '& em': { fontStyle: 'italic', color: 'text.secondary' }
          }}
          dangerouslySetInnerHTML={{ __html: question.question }}
        />

        {/* Hint */}
        {showHint && question.explanation && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              💡 <strong>Hint:</strong> {question.explanation}
            </Typography>
          </Alert>
        )}

        {/* Question Content */}
        {renderQuestionContent()}

        {/* Correct Answer Display */}
        {showCorrectAnswer && question.correctAnswer && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircle color="success" />
              Correct Answer:
            </Typography>
            <Typography variant="body2">
              {Array.isArray(question.correctAnswer) 
                ? question.correctAnswer.join(', ')
                : question.correctAnswer
              }
            </Typography>
            {question.explanation && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                <strong>Explanation:</strong> {question.explanation}
              </Typography>
            )}
          </Box>
        )}

        {/* Time Warning */}
        {timeLimit && timeSpent > timeLimit * 0.8 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ⏰ You're spending a lot of time on this question. Consider moving on and coming back later.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </QuestionCard>
  );
};

export default EnhancedQuestionRenderer;