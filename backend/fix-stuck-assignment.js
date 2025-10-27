const mongoose = require('mongoose');
const { Assignment } = require('./dist/models/Assignment');
require('dotenv').config();

// Direct fix for the stuck assignment
const fixStuckAssignment = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the stuck assignment
    const assignmentId = '68a04754c497b840ad727cb9';
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      console.error('❌ Assignment not found');
      return;
    }

    console.log('📋 Found stuck assignment:', {
      title: assignment.title,
      aiProcessingStatus: assignment.aiProcessingStatus,
      aiExtractionStatus: assignment.aiExtractionStatus,
      hasDocument: !!assignment.assignmentDocument,
      documentText: assignment.documentText ? assignment.documentText.length : 'No text',
    });

    // Manually trigger AI extraction using the same logic as debugAIProcessing
    console.log('🔧 Starting manual AI extraction...');

    // Re-download and parse the document if needed
    let documentText = assignment.documentText;
    
    if (!documentText && assignment.assignmentDocument?.fileUrl) {
      console.log('📄 Re-downloading document from Cloudinary...');
      
      const DocumentParser = require('./dist/utils/documentParser').default;
      
      // Use built-in fetch (Node 18+)
      const response = await fetch(assignment.assignmentDocument.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const fileBuffer = Buffer.from(buffer);
      
      // Parse the document
      const parser = new DocumentParser();
      documentText = await parser.extractTextFromBuffer(fileBuffer, assignment.assignmentDocument.originalName);
      
      console.log(`📄 Re-parsed document, extracted ${documentText.length} characters`);
    }

    if (!documentText || documentText.length === 0) {
      console.error('❌ No document text available');
      
      // Set assignment to failed
      assignment.aiProcessingStatus = 'failed';
      assignment.aiExtractionStatus = 'failed';
      assignment.aiProcessingError = 'No document text available for processing';
      assignment.hasQuestions = false;
      await assignment.save();
      
      console.log('📝 Updated assignment status to failed');
      return;
    }

    console.log('🤖 Processing document with AI...');
    console.log('Document preview:', documentText.substring(0, 200));

    // Use AI service to extract questions
    const { aiService } = require('./dist/services/aiService');
    
    try {
      const extractedQuestions = await aiService.extractQuestionsFromDocument(documentText, 'assignment');
      
      console.log(`🎯 AI extraction completed. Found ${extractedQuestions ? extractedQuestions.length : 0} questions`);

      if (extractedQuestions && extractedQuestions.length > 0) {
        // Add unique IDs to extracted questions
        const questionsWithIds = extractedQuestions.map((q, index) => ({
          ...q,
          id: q.id || `manual_fix_${Date.now()}_${index}`,
          _id: q._id || `manual_fix_${Date.now()}_${index}`,
          aiExtracted: true
        }));

        console.log('📝 Sample questions:');
        questionsWithIds.slice(0, 2).forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.question.substring(0, 100)}... (${q.type}, ${q.points} pts)`);
          if (q.options && q.options.length > 0) {
            console.log(`     Options: ${q.options.slice(0, 2).join(', ')}...`);
          }
        });

        // Update assignment with extracted questions
        assignment.questions = questionsWithIds;
        assignment.extractedQuestions = questionsWithIds;
        assignment.hasQuestions = true;
        assignment.aiProcessingStatus = 'completed';
        assignment.aiExtractionStatus = 'completed';
        assignment.aiProcessingError = undefined;
        assignment.documentText = undefined; // Clear stored text
        
        await assignment.save();
        console.log(`✅ SUCCESS: Assignment fixed with ${questionsWithIds.length} questions!`);
      } else {
        // No questions found
        console.log('⚠️ AI could not extract questions from the document');
        assignment.aiProcessingStatus = 'no_questions_found';
        assignment.aiExtractionStatus = 'failed';
        assignment.aiProcessingError = 'No questions could be extracted from the document';
        assignment.hasQuestions = false;
        assignment.documentText = undefined;
        await assignment.save();
        console.log('📝 Updated assignment status to no_questions_found');
      }
    } catch (aiError) {
      console.error('❌ AI extraction failed:', aiError.message);
      
      assignment.aiProcessingStatus = 'failed';
      assignment.aiExtractionStatus = 'failed';
      assignment.aiProcessingError = aiError.message;
      assignment.hasQuestions = false;
      assignment.documentText = undefined;
      await assignment.save();
      console.log('📝 Updated assignment status to failed due to AI error');
    }

  } catch (error) {
    console.error('❌ Fix attempt failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the fix
fixStuckAssignment();