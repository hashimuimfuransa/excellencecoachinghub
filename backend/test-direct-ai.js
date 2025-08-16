const mongoose = require('mongoose');
const { Assignment } = require('./dist/models/Assignment');
require('dotenv').config();

// Test the new direct AI extraction method
const testDirectAI = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test assignment
    const assignmentId = '68a0501f16d55cd723bba2c1';
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      console.error('❌ Assignment not found');
      return;
    }

    console.log('🧪 Testing direct AI extraction on assignment:', assignment.title);
    console.log('📄 Current status:', {
      aiProcessingStatus: assignment.aiProcessingStatus,
      aiExtractionStatus: assignment.aiExtractionStatus,
      hasQuestions: assignment.hasQuestions,
      questionsCount: assignment.questions?.length || 0
    });

    if (assignment.documentText) {
      console.log(`📄 Document text available (${assignment.documentText.length} characters)`);
      console.log('📄 Text preview:', assignment.documentText.substring(0, 200));

      // Test the direct extraction method (like the new controller does)
      console.log('🚀 Starting direct AI test (no queue)...');
      
      const startTime = Date.now();
      
      // Import the AI service to test direct call
      const { aiService } = require('./dist/services/aiService');
      
      const prompt = `Extract questions from this assignment document. Return JSON array only:

Document:
${assignment.documentText}

Required JSON format:
[{"question":"text","type":"multiple_choice|true_false|short_answer|essay","options":["A","B","C","D"],"correctAnswer":"A","points":10,"aiExtracted":true}]

Rules:
- Extract existing questions exactly as written
- For content without questions, create comprehension questions
- Use appropriate point values (5-20 points)
- Include 4 options for multiple choice
- Use "true"/"false" for true/false questions
- Keep questions clear and concise
- Maximum 20 questions for performance`;

      try {
        console.log('🤖 Calling AI model directly...');
        const result = await aiService.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const processingTime = Date.now() - startTime;
        console.log(`⚡ Direct AI call completed in ${processingTime}ms`);
        
        console.log('📝 AI Response length:', text.length);
        console.log('📝 AI Response preview:', text.substring(0, 300));
        
        // Try to parse the JSON response
        let cleanedText = text.trim();
        
        // Remove any markdown formatting
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```/, '');
        }
        
        // Try to find JSON array in the response
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          cleanedText = jsonMatch[0];
        }
        
        const extractedQuestions = JSON.parse(cleanedText);
        console.log(`🎯 Successfully extracted ${extractedQuestions.length} questions`);
        
        // Show preview of questions
        extractedQuestions.slice(0, 3).forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.question.substring(0, 80)}... (${q.type}, ${q.points} pts)`);
        });

        console.log('✅ SUCCESS! Direct AI extraction works perfectly!');
        console.log(`⚡ Total processing time: ${processingTime}ms`);
        console.log('🚀 This method bypasses the queue and is much faster!');

      } catch (aiError) {
        console.error('❌ Direct AI call failed:', aiError.message);
        console.log('Raw response for debugging:', text?.substring(0, 500));
      }

    } else {
      console.log('❌ No document text available for testing');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the test
testDirectAI();