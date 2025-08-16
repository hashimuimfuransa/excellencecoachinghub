const mongoose = require('mongoose');
const { Assignment } = require('./dist/models/Assignment');
require('dotenv').config();

// Test the AI extraction for the specific assignment that's stuck
const testAssignmentAIExtraction = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the specific assignment that's having issues
    const assignmentId = '68a04754c497b840ad727cb9';
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      console.error('❌ Assignment not found');
      return;
    }

    console.log('📋 Assignment found:', {
      title: assignment.title,
      hasDocument: !!assignment.assignmentDocument,
      documentUrl: assignment.assignmentDocument?.fileUrl,
      documentName: assignment.assignmentDocument?.originalName,
      aiProcessingStatus: assignment.aiProcessingStatus,
      aiExtractionStatus: assignment.aiExtractionStatus,
      hasDocumentText: !!assignment.documentText,
      documentTextLength: assignment.documentText?.length || 0,
      questionsCount: assignment.questions?.length || 0,
      extractedQuestionsCount: assignment.extractedQuestions?.length || 0,
      hasQuestions: assignment.hasQuestions
    });

    if (!assignment.assignmentDocument?.fileUrl) {
      console.error('❌ No document found for this assignment');
      return;
    }

    // Use existing document text if available
    let documentText = assignment.documentText;
    
    if (documentText && documentText.length > 0) {
      console.log('📄 Using existing document text:');
      console.log('  - Length:', documentText.length, 'characters');
      console.log('  - Preview (first 500 chars):', documentText.substring(0, 500));
      console.log('  - Preview (last 500 chars):', documentText.substring(documentText.length - 500));
    } else {
      console.log('📄 No document text available, skipping AI extraction test');
      return;
    }

    try {
      // Test AI extraction
      console.log('🤖 Testing AI extraction...');
      const { aiService } = require('./dist/services/aiService');
      
      const extractedQuestions = await aiService.extractQuestionsFromDocument(documentText, 'assignment');
      
      console.log('🎯 AI Extraction Results:');
      console.log('  - Questions count:', extractedQuestions?.length || 0);
      
      if (extractedQuestions && extractedQuestions.length > 0) {
        console.log('  - Sample questions:');
        extractedQuestions.slice(0, 3).forEach((q, i) => {
          console.log(`    ${i + 1}. ${q.question.substring(0, 100)}... (${q.type}, ${q.points} pts)`);
          if (q.options) {
            console.log(`       Options: ${q.options.slice(0, 2).join(', ')}...`);
          }
        });

        // Update the assignment with extracted questions
        console.log('💾 Updating assignment with extracted questions...');
        const questionsWithIds = extractedQuestions.map((q, index) => ({
          ...q,
          id: q.id || `test_${Date.now()}_${index}`,
          _id: q._id || `test_${Date.now()}_${index}`,
          aiExtracted: true
        }));

        assignment.questions = questionsWithIds;
        assignment.extractedQuestions = questionsWithIds;
        assignment.hasQuestions = true;
        assignment.aiProcessingStatus = 'completed';
        assignment.aiExtractionStatus = 'completed';
        assignment.aiProcessingError = undefined;
        assignment.documentText = undefined; // Clear stored text
        
        await assignment.save();
        console.log('✅ Successfully updated assignment with', questionsWithIds.length, 'questions');
      } else {
        console.log('⚠️ No questions were extracted from the document');
        
        assignment.aiProcessingStatus = 'no_questions_found';
        assignment.aiExtractionStatus = 'failed';
        assignment.aiProcessingError = 'No questions could be extracted from the document';
        assignment.hasQuestions = false;
        assignment.documentText = undefined;
        await assignment.save();
        
        console.log('📝 Updated assignment status to no_questions_found');
      }

    } catch (error) {
      console.error('❌ AI extraction failed:', error);
      
      assignment.aiProcessingStatus = 'failed';
      assignment.aiExtractionStatus = 'failed';
      assignment.aiProcessingError = error.message;
      assignment.hasQuestions = false;
      assignment.documentText = undefined;
      await assignment.save();
      
      console.log('📝 Updated assignment status to failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the test
testAssignmentAIExtraction();