// Auto-grade submission
const autoGradeSubmission = async (homework: any, submission: any) => {
  let totalScore = 0;
  let earnedPoints = 0;

  const answers = submission.extractedAnswers || [];
  const questions = homework.extractedQuestions || [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (!question) continue;
    
    const answer = answers.find((a: any) => a.questionIndex === i);
    if (!answer) continue;
    
    totalScore += question.points || 0;

    // Grade multiple-choice questions
    if (question.type === 'multiple-choice') {
      if (answer.answer === question.correctAnswer) {
        earnedPoints += question.points || 0;
      }
    }
    // Grade matching questions
    else if (question.type === 'matching') {
      let correctMatches = 0;
      const totalMatches = Object.keys(question.correctMatches || {}).length;
      
      // Handle matching question answers
      if (answer.answer && typeof answer.answer === 'object' && answer.answer.matches) {
        Object.entries(answer.answer.matches).forEach(([leftItem, rightItem]) => {
          if (question.correctMatches?.[leftItem] === rightItem) {
            correctMatches++;
          }
        });
        
        if (totalMatches > 0) {
          const matchPercentage = correctMatches / totalMatches;
          earnedPoints += Math.round((question.points || 0) * matchPercentage);
        }
      }
    }
    // Grade short-answer questions (simple check)
    else if (question.type === 'short-answer') {
      if (answer.answer && typeof answer.answer === 'string') {
        // Simple check - in a real app, this would use AI or more sophisticated matching
        if (answer.answer.trim().length > 0) {
          earnedPoints += question.points || 0;
        }
      }
    }
  }

  return totalScore > 0 ? Math.round((earnedPoints / totalScore) * 100) : 0;
};