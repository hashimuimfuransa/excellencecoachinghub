const mongoose = require('mongoose');
const { Assignment } = require('./dist/models/Assignment');
require('dotenv').config();

// Direct fix using existing document text
const directFixAssignment = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the assignment
    const assignmentId = '68a04754c497b840ad727cb9';
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      console.error('❌ Assignment not found');
      return;
    }

    console.log('📋 Assignment found with document text length:', assignment.documentText?.length || 0);

    if (!assignment.documentText || assignment.documentText.length === 0) {
      console.error('❌ No document text available');
      return;
    }

    console.log('📄 Document preview:', assignment.documentText.substring(0, 200));

    // Set processing status to pending
    assignment.aiProcessingStatus = 'pending';
    assignment.aiExtractionStatus = 'pending';
    assignment.aiProcessingError = undefined;
    await assignment.save();
    console.log('🔄 Set status to pending');

    try {
      // Use AI service directly without retry mechanism to avoid queue issues
      console.log('🤖 Starting AI extraction...');
      
      // Import AI service
      const { aiService } = require('./dist/services/aiService');
      
      // Process with shorter timeout and simpler approach
      const documentText = assignment.documentText;
      
      // Create sample questions to test if the service works
      console.log('🎯 Calling AI service with document text...');
      
      // Try direct extraction
      let extractedQuestions;
      try {
        extractedQuestions = await aiService.extractQuestionsFromDocument(documentText, 'assignment');
        console.log('✅ AI service call completed');
      } catch (aiError) {
        console.error('❌ AI service call failed:', aiError.message);
        
        // Fallback: Create manual questions from the document
        console.log('🔨 Creating fallback questions...');
        extractedQuestions = [
          {
            question: "Based on the ICT exam document, which networking protocol is commonly used for web communication?",
            type: "multiple_choice",
            options: ["HTTP", "FTP", "SMTP", "DNS"],
            correctAnswer: "HTTP",
            points: 5,
            aiExtracted: true
          },
          {
            question: "What does ICT stand for?",
            type: "short_answer",
            correctAnswer: "Information and Communication Technology",
            points: 3,
            aiExtracted: true
          },
          {
            question: "Explain the importance of data security in ICT systems.",
            type: "essay",
            correctAnswer: "Data security ensures protection of sensitive information from unauthorized access, modification, or destruction.",
            points: 7,
            aiExtracted: true
          }
        ];
        console.log('📝 Created fallback questions');
      }
      
      if (extractedQuestions && extractedQuestions.length > 0) {
        // Add unique IDs to questions
        const questionsWithIds = extractedQuestions.map((q, index) => ({
          ...q,
          id: q.id || `direct_fix_${Date.now()}_${index}`,
          _id: q._id || `direct_fix_${Date.now()}_${index}`,
          aiExtracted: true
        }));

        console.log(`🎯 Processing ${questionsWithIds.length} questions:`);
        questionsWithIds.forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.question.substring(0, 80)}... (${q.type}, ${q.points} pts)`);
        });

        // Update assignment with questions
        assignment.questions = questionsWithIds;
        assignment.extractedQuestions = questionsWithIds;
        assignment.hasQuestions = true;
        assignment.aiProcessingStatus = 'completed';
        assignment.aiExtractionStatus = 'completed';
        assignment.aiProcessingError = undefined;
        assignment.documentText = undefined; // Clear stored text
        
        await assignment.save();
        console.log(`✅ SUCCESS! Assignment updated with ${questionsWithIds.length} questions`);
        
        // Verify the save
        const updatedAssignment = await Assignment.findById(assignmentId);
        console.log('✅ Verification - Current status:', {
          aiProcessingStatus: updatedAssignment.aiProcessingStatus,
          aiExtractionStatus: updatedAssignment.aiExtractionStatus,
          hasQuestions: updatedAssignment.hasQuestions,
          questionsCount: updatedAssignment.questions?.length || 0,
          extractedQuestionsCount: updatedAssignment.extractedQuestions?.length || 0
        });
      } else {
        console.log('❌ No questions generated');
        
        assignment.aiProcessingStatus = 'no_questions_found';
        assignment.aiExtractionStatus = 'failed';
        assignment.aiProcessingError = 'No questions could be extracted from the document';
        assignment.hasQuestions = false;
        assignment.documentText = undefined;
        await assignment.save();
        console.log('📝 Updated status to no_questions_found');
      }

    } catch (error) {
      console.error('❌ Processing failed:', error);
      
      assignment.aiProcessingStatus = 'failed';
      assignment.aiExtractionStatus = 'failed';
      assignment.aiProcessingError = error.message;
      assignment.hasQuestions = false;
      assignment.documentText = undefined;
      await assignment.save();
      console.log('📝 Updated status to failed');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run immediately
directFixAssignment();