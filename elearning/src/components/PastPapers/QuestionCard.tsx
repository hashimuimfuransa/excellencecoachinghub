import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  TextField,
  Button,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Flag,
  FlagOutlined,
  HelpOutline,
  Psychology,
  Science,
  Calculate,
  Language,
  Business
} from '@mui/icons-material';

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: any;
  points: number;
  section?: string;
  difficulty?: string;
  explanation?: string;
  topic?: string;
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  answer: any;
  onAnswerChange: (answer: any) => void;
  onFlag: () => void;
  isFlagged: boolean;
  settings: {
    showResultsImmediately: boolean;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
  };
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswerChange,
  onFlag,
  isFlagged,
  settings
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'multiple-choice':
      case 'multiple_choice':
        return <Psychology />;
      case 'true-false':
      case 'true_false':
        return <HelpOutline />;
      case 'short-answer':
      case 'short_answer':
        return <Language />;
      case 'essay':
        return <Business />;
      case 'numerical':
        return <Calculate />;
      case 'matching':
        return <Science />;
      case 'ordering':
        return <Calculate />;
      case 'fill_in_blank':
        return <Language />;
      default:
        return <Science />;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple-choice':
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true-false':
      case 'true_false':
        return 'True/False';
      case 'short-answer':
      case 'short_answer':
        return 'Short Answer';
      case 'essay':
        return 'Essay';
      case 'numerical':
        return 'Numerical';
      case 'matching':
        return 'Matching';
      case 'ordering':
        return 'Ordering';
      case 'fill_in_blank':
        return 'Fill in Blank';
      case 'multiple_choice_multiple':
        return 'Multiple Select';
      default:
        return 'Question';
    }
  };

  const getQuestionInstructions = (type: string) => {
    switch (type) {
      case 'multiple-choice':
      case 'multiple_choice':
        return 'Select the best answer from the options below.';
      case 'true-false':
      case 'true_false':
        return 'Choose True or False based on the statement.';
      case 'short-answer':
      case 'short_answer':
        return 'Provide a brief, concise answer.';
      case 'essay':
        return 'Write a detailed response. Consider structure, examples, and thorough explanation.';
      case 'numerical':
        return 'Enter a numerical value. Include units if applicable.';
      case 'matching':
        return 'Match each item on the left with the corresponding item on the right.';
      case 'ordering':
        return 'Arrange the items in the correct order by entering numbers (1, 2, 3, etc.).';
      case 'fill_in_blank':
        return 'Fill in the blank with the appropriate word or phrase.';
      case 'multiple_choice_multiple':
        return 'Select all correct answers. You may choose more than one option.';
      default:
        return null;
    }
  };

  const renderQuestionType = () => {
    switch (question.type) {
      case 'multiple-choice':
      case 'multiple_choice':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={answer || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
            >
              {question.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                  sx={{ mb: 1 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'multiple_choice_multiple':
        return (
          <FormControl component="fieldset" fullWidth>
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={Array.isArray(answer) ? answer.includes(option) : false}
                    onChange={(e) => {
                      const currentAnswers = Array.isArray(answer) ? answer : [];
                      if (e.target.checked) {
                        onAnswerChange([...currentAnswers, option]);
                      } else {
                        onAnswerChange(currentAnswers.filter((a: string) => a !== option));
                      }
                    }}
                  />
                }
                label={option}
                sx={{ mb: 1 }}
              />
            ))}
          </FormControl>
        );

      case 'true-false':
      case 'true_false':
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={answer || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
            >
              <FormControlLabel
                value="true"
                control={<Radio />}
                label="True"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                value="false"
                control={<Radio />}
                label="False"
                sx={{ mb: 1 }}
              />
            </RadioGroup>
          </FormControl>
        );

      case 'short-answer':
      case 'short_answer':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Enter your answer here..."
            variant="outlined"
          />
        );

      case 'essay':
        return (
          <TextField
            fullWidth
            multiline
            rows={6}
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Write your essay here..."
            variant="outlined"
          />
        );

      case 'numerical':
        return (
          <TextField
            fullWidth
            type="number"
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Enter numerical answer..."
            variant="outlined"
          />
        );

      case 'fill_in_blank':
        return (
          <TextField
            fullWidth
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Fill in the blank..."
            variant="outlined"
          />
        );

      case 'matching':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Match the items on the left with the items on the right:
            </Typography>
            {question.options?.map((option, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>
                  {option}
                </Typography>
                <TextField
                  size="small"
                  placeholder="Match with..."
                  value={Array.isArray(answer) ? answer[index] || '' : ''}
                  onChange={(e) => {
                    const currentMatches = Array.isArray(answer) ? [...answer] : [];
                    currentMatches[index] = e.target.value;
                    onAnswerChange(currentMatches);
                  }}
                  sx={{ flexGrow: 1 }}
                />
              </Box>
            ))}
          </Box>
        );

      case 'ordering':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Arrange the following items in the correct order:
            </Typography>
            {question.options?.map((option, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  size="small"
                  type="number"
                  placeholder="Order"
                  value={Array.isArray(answer) ? answer[index] || '' : ''}
                  onChange={(e) => {
                    const currentOrder = Array.isArray(answer) ? [...answer] : [];
                    currentOrder[index] = parseInt(e.target.value) || 0;
                    onAnswerChange(currentOrder);
                  }}
                  sx={{ width: 80 }}
                />
                <Typography variant="body2">
                  {option}
                </Typography>
              </Box>
            ))}
          </Box>
        );

      default:
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Enter your answer here..."
            variant="outlined"
          />
        );
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Question Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getQuestionIcon(question.type)}
            <Typography variant="h6" component="span">
              Question {questionNumber} of {totalQuestions}
            </Typography>
          </Box>
          <Chip
            label={getQuestionTypeLabel(question.type)}
            color="secondary"
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${question.points} point${question.points !== 1 ? 's' : ''}`}
            color="primary"
            size="small"
          />
          {question.difficulty && (
            <Chip
              label={question.difficulty}
              color={getDifficultyColor(question.difficulty) as any}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        
        <Tooltip title={isFlagged ? 'Unflag question' : 'Flag question for review'}>
          <IconButton
            onClick={onFlag}
            color={isFlagged ? 'warning' : 'default'}
          >
            {isFlagged ? <Flag /> : <FlagOutlined />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Section */}
      {question.section && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={question.section}
            color="secondary"
            size="small"
            variant="outlined"
          />
        </Box>
      )}

      {/* Question Instructions */}
      {getQuestionInstructions(question.type) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {getQuestionInstructions(question.type)}
          </Typography>
        </Alert>
      )}

      {/* Question Text */}
      <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.6 }}>
        {question.question}
      </Typography>

      {/* Answer Input */}
      <Box sx={{ mb: 3 }}>
        {renderQuestionType()}
      </Box>

      {/* Topic */}
      {question.topic && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Topic: {question.topic}
          </Typography>
        </Box>
      )}

      {/* Explanation (if available and settings allow) */}
      {question.explanation && settings.showExplanations && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Button
            variant="text"
            onClick={() => setShowExplanation(!showExplanation)}
            startIcon={<HelpOutline />}
            sx={{ mb: 2 }}
          >
            {showExplanation ? 'Hide' : 'Show'} Explanation
          </Button>
          
          {showExplanation && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                {question.explanation}
              </Typography>
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default QuestionCard;
