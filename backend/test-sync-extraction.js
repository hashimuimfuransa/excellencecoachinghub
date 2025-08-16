const mongoose = require('mongoose');
const { Assignment } = require('./dist/models/Assignment');
const DocumentParser = require('./dist/utils/documentParser').default;
const { aiService } = require('./dist/services/aiService');
require('dotenv').config();

// Test the new synchronous extraction method
const testSyncExtraction = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an assignment with a document
    const assignmentId = '68a04754c497b840ad727cb9';
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      console.error('❌ Assignment not found');
      return;
    }

    console.log('📋 Testing synchronous extraction on assignment:', assignment.title);
    console.log('📄 Has document:', !!assignment.assignmentDocument);
    console.log('📄 Document URL:', assignment.assignmentDocument?.fileUrl);

    if (!assignment.assignmentDocument?.fileUrl) {
      console.error('❌ No document to process');
      return;
    }

    // Test the synchronous extraction flow
    console.log('🔬 Testing synchronous extraction flow...');

    try {
      // Step 1: Download document
      console.log('📥 Step 1: Downloading document...');
      const response = await fetch(assignment.assignmentDocument.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const fileBuffer = Buffer.from(buffer);
      console.log(`✅ Downloaded ${fileBuffer.length} bytes`);

      // Step 2: Parse document (same as in the new controller using static methods)
      console.log('📝 Step 2: Parsing document...');
      
      // Determine MIME type based on file extension
      const fileName = assignment.assignmentDocument.originalName;
      let mimeType = 'application/pdf';
      if (fileName.includes('.docx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (fileName.includes('.doc')) {
        mimeType = 'application/msword';
      } else if (fileName.includes('.txt')) {
        mimeType = 'text/plain';
      }
      
      const parseResult = await DocumentParser.parseDocument(fileBuffer, mimeType, fileName);
      
      // Validate document
      const validation = DocumentParser.validateDocument(parseResult);
      if (!validation.isValid) {
        throw new Error('Invalid document: ' + validation.errors.join(', '));
      }
      
      if (!parseResult.text || parseResult.text.length === 0) {
        throw new Error('Could not extract text from document');
      }
      console.log(`✅ Extracted ${parseResult.text.length} characters of text`);
      console.log('📄 Text preview:', parseResult.text.substring(0, 200));

      // Step 3: AI extraction (same as in the new controller)
      console.log('🤖 Step 3: AI question extraction...');
      const cleanedText = DocumentParser.cleanText(parseResult.text);
      const extractedQuestions = await aiService.extractQuestionsFromDocument(cleanedText, 'assignment');
      
      if (!extractedQuestions || extractedQuestions.length === 0) {
        throw new Error('No questions could be extracted from the document');
      }
      console.log(`🎯 AI extracted ${extractedQuestions.length} questions`);

      // Step 4: Process questions (same as in the new controller)
      console.log('🔧 Step 4: Processing questions...');
      const questionsWithIds = extractedQuestions.map((q, index) => ({
        ...q,
        id: `sync_test_${Date.now()}_${index}`,
        _id: `sync_test_${Date.now()}_${index}`,
        aiExtracted: true
      }));

      // Preview questions
      console.log('📝 Extracted questions preview:');
      questionsWithIds.slice(0, 3).forEach((q, i) => {
        console.log(`  ${i + 1}. ${q.question.substring(0, 80)}... (${q.type}, ${q.points} pts)`);
        if (q.options && q.options.length > 0) {
          console.log(`     Options: ${q.options.slice(0, 2).join(', ')}${q.options.length > 2 ? '...' : ''}`);
        }
      });

      // Step 5: Update assignment (simulate the controller behavior)
      console.log('💾 Step 5: Updating assignment in database...');
      assignment.questions = questionsWithIds;
      assignment.extractedQuestions = questionsWithIds;
      assignment.hasQuestions = true;
      assignment.aiProcessingStatus = 'completed';
      assignment.aiExtractionStatus = 'completed';
      assignment.aiProcessingError = undefined;
      assignment.documentText = undefined;

      await assignment.save();
      console.log(`✅ Assignment updated successfully`);

      // Step 6: Verify the update
      console.log('✅ Step 6: Verifying update...');
      const updatedAssignment = await Assignment.findById(assignmentId);
      console.log('✅ Final status:', {
        hasQuestions: updatedAssignment.hasQuestions,
        questionsCount: updatedAssignment.questions?.length || 0,
        extractedQuestionsCount: updatedAssignment.extractedQuestions?.length || 0,
        aiProcessingStatus: updatedAssignment.aiProcessingStatus,
        aiExtractionStatus: updatedAssignment.aiExtractionStatus,
        aiProcessingError: updatedAssignment.aiProcessingError
      });

      console.log('🎉 SUCCESS! Synchronous extraction test completed successfully!');

    } catch (error) {
      console.error('❌ Synchronous extraction test failed:', error);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the test
testSyncExtraction();