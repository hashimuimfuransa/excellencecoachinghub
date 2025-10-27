import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SimplifiedTestTaking from '../SimplifiedTestTaking';
import { simplePsychometricService } from '../../services/simplePsychometricService';

// Mock the service
jest.mock('../../services/simplePsychometricService');
const mockSimplePsychometricService = simplePsychometricService as jest.Mocked<typeof simplePsychometricService>;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: {
      testData: {
        sessionId: 'session123',
        questions: [
          {
            id: 1,
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            category: 'numerical'
          },
          {
            id: 2,
            question: 'Which is bigger?',
            options: ['Elephant', 'Mouse', 'Cat', 'Dog'],
            category: 'logical'
          }
        ],
        timeLimit: 30,
        startedAt: new Date().toISOString(),
        job: {
          _id: 'job123',
          title: 'Software Developer',
          company: 'TechCorp',
          industry: 'Technology'
        }
      }
    }
  }),
  useParams: () => ({})
}));

// Create theme for testing
const theme = createTheme();

const renderComponent = (initialLocation = '/test-taking') => {
  return render(
    <MemoryRouter initialEntries={[initialLocation]}>
      <ThemeProvider theme={theme}>
        <SimplifiedTestTaking />
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('SimplifiedTestTaking - JSON Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Submit test successfully', () => {
    it('should submit test and navigate to results page', async () => {
      const mockResult = {
        resultId: 'result123',
        score: 85,
        totalQuestions: 2,
        correctAnswers: 1,
        timeSpent: 300
      };

      mockSimplePsychometricService.submitSimpleTest.mockResolvedValue(mockResult);

      renderComponent();

      // Start the test
      fireEvent.click(screen.getByText('Start Assessment'));

      // Wait for test to load
      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      // Select answers
      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Elephant'));

      // Submit test
      fireEvent.click(screen.getByText('Submit Test'));
      fireEvent.click(screen.getByText('Confirm Submission'));

      await waitFor(() => {
        expect(mockSimplePsychometricService.submitSimpleTest).toHaveBeenCalledWith(
          'session123',
          [1, 0], // Selected answer indices
          expect.any(Number) // timeSpent
        );

        expect(mockNavigate).toHaveBeenCalledWith('/psychometric-test-result', {
          state: {
            result: mockResult,
            testData: expect.any(Object),
            returnUrl: '/app/tests'
          }
        });
      });
    });
  });

  describe('Handle server timeout gracefully', () => {
    it('should show user-friendly message on server timeout', async () => {
      const timeoutError = new Error('Server is temporarily unavailable. Please try again in a few moments.');
      mockSimplePsychometricService.submitSimpleTest.mockRejectedValue(timeoutError);

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      renderComponent();

      // Start the test
      fireEvent.click(screen.getByText('Start Assessment'));

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      // Select answers and submit
      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Elephant'));
      fireEvent.click(screen.getByText('Submit Test'));
      fireEvent.click(screen.getByText('Confirm Submission'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Server is temporarily unavailable. Please try again in a few moments.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Handle empty JSON response', () => {
    it('should show server communication error for empty response', async () => {
      const emptyResponseError = new Error('Server returned empty response');
      mockSimplePsychometricService.submitSimpleTest.mockRejectedValue(emptyResponseError);

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      renderComponent();

      // Start and complete test
      fireEvent.click(screen.getByText('Start Assessment'));

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Elephant'));
      fireEvent.click(screen.getByText('Submit Test'));
      fireEvent.click(screen.getByText('Confirm Submission'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Test submission failed due to a server communication issue. Your answers may have been saved. Please try refreshing the page or contact support if the problem persists.'
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('Handle malformed JSON response', () => {
    it('should handle JSON parsing errors gracefully', async () => {
      const jsonError = new Error('Unexpected end of JSON input');
      mockSimplePsychometricService.submitSimpleTest.mockRejectedValue(jsonError);

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      renderComponent();

      // Start and complete test
      fireEvent.click(screen.getByText('Start Assessment'));

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Elephant'));
      fireEvent.click(screen.getByText('Submit Test'));
      fireEvent.click(screen.getByText('Confirm Submission'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Test submission failed due to a server communication issue. Your answers may have been saved. Please try refreshing the page or contact support if the problem persists.'
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('Handle network connection failure', () => {
    it('should show network error message for connection failures', async () => {
      const networkError = new Error('Network connection failed. Please check your internet connection and try again.');
      mockSimplePsychometricService.submitSimpleTest.mockRejectedValue(networkError);

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      renderComponent();

      // Start and complete test
      fireEvent.click(screen.getByText('Start Assessment'));

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Elephant'));
      fireEvent.click(screen.getByText('Submit Test'));
      fireEvent.click(screen.getByText('Confirm Submission'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Network connection failed. Please check your internet connection and try again.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Retry on JSON parsing error', () => {
    it('should retry submission on retryable errors', async () => {
      let callCount = 0;
      mockSimplePsychometricService.submitSimpleTest.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Unexpected end of JSON input'));
        }
        return Promise.resolve({
          resultId: 'result123',
          score: 100,
          totalQuestions: 2,
          correctAnswers: 2,
          timeSpent: 300
        });
      });

      renderComponent();

      // Start and complete test
      fireEvent.click(screen.getByText('Start Assessment'));

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Elephant'));
      fireEvent.click(screen.getByText('Submit Test'));
      fireEvent.click(screen.getByText('Confirm Submission'));

      await waitFor(() => {
        expect(mockSimplePsychometricService.submitSimpleTest).toHaveBeenCalledTimes(3);
        expect(mockNavigate).toHaveBeenCalledWith('/psychometric-test-result', expect.any(Object));
      });
    });

    it('should fail after maximum retries', async () => {
      // Mock to always fail
      mockSimplePsychometricService.submitSimpleTest.mockRejectedValue(
        new Error('Unexpected end of JSON input')
      );

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      renderComponent();

      // Start and complete test
      fireEvent.click(screen.getByText('Start Assessment'));

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Elephant'));
      fireEvent.click(screen.getByText('Submit Test'));
      fireEvent.click(screen.getByText('Confirm Submission'));

      await waitFor(() => {
        expect(mockSimplePsychometricService.submitSimpleTest).toHaveBeenCalledTimes(3);
        expect(alertSpy).toHaveBeenCalledWith(
          'Test submission failed due to a server communication issue. Your answers may have been saved. Please try refreshing the page or contact support if the problem persists.'
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('Handle large response data', () => {
    it('should handle large test data efficiently', async () => {
      const largeResult = {
        resultId: 'result123',
        score: 75,
        totalQuestions: 100,
        correctAnswers: 75,
        timeSpent: 3600,
        categoryScores: {
          logical: 80,
          numerical: 70,
          verbal: 75,
          analytical: 85
        },
        summary: {
          correctCount: 75,
          incorrectCount: 25,
          categories: ['logical', 'numerical', 'verbal', 'analytical']
        }
      };

      mockSimplePsychometricService.submitSimpleTest.mockResolvedValue(largeResult);

      renderComponent();

      // Start and complete test
      fireEvent.click(screen.getByText('Start Assessment'));

      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('4'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Elephant'));
      fireEvent.click(screen.getByText('Submit Test'));
      fireEvent.click(screen.getByText('Confirm Submission'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/psychometric-test-result', {
          state: {
            result: largeResult,
            testData: expect.any(Object),
            returnUrl: '/app/tests'
          }
        });
      });
    });
  });

  describe('Timer and auto-submit functionality', () => {
    it('should auto-submit when time runs out', async () => {
      // Mock a test with very short time limit
      const shortTimeTestData = {
        sessionId: 'session123',
        questions: [
          {
            id: 1,
            question: 'Quick question?',
            options: ['A', 'B', 'C', 'D'],
            category: 'logical'
          }
        ],
        timeLimit: 0.01, // Very short time limit (0.6 seconds)
        startedAt: new Date().toISOString(),
        job: {
          _id: 'job123',
          title: 'Test Job',
          company: 'Test Company',
          industry: 'Technology'
        }
      };

      // Mock location state with short time test
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useLocation: () => ({
          state: { testData: shortTimeTestData }
        }),
        useParams: () => ({})
      }));

      mockSimplePsychometricService.submitSimpleTest.mockResolvedValue({
        resultId: 'result123',
        score: 0,
        totalQuestions: 1,
        correctAnswers: 0,
        timeSpent: 36
      });

      renderComponent();

      // Start the test
      fireEvent.click(screen.getByText('Start Assessment'));

      // Wait for auto-submit due to time expiry
      await waitFor(() => {
        expect(mockSimplePsychometricService.submitSimpleTest).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });
});