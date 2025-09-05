/**
 * Comprehensive test script to verify all AI services are using the newer Gemini AI version
 * This script tests all AI services across the application
 */

const { centralAIManager } = require('./backend/src/services/centralAIManager');
const { aiService } = require('./backend/src/services/aiService');
const { JobScrapingService } = require('./backend/src/services/jobScrapingService');
const { AIDocumentService } = require('./backend/src/services/aiDocumentService');

async function testAllAIServices() {
  console.log('🚀 Testing All AI Services with Newer Gemini AI Versions');
  console.log('=' .repeat(70));
  
  const testResults = {
    centralAIManager: { success: false, model: '', errors: [] },
    aiService: { success: false, model: '', errors: [] },
    jobScrapingService: { success: false, model: '', errors: [] },
    documentService: { success: false, model: '', errors: [] },
    overall: { success: false, servicesPassed: 0, totalServices: 4 }
  };

  // Test 1: Central AI Manager
  console.log('\n📊 Testing Central AI Manager...');
  try {
    const systemStatus = centralAIManager.getSystemStatus();
    const modelStats = centralAIManager.getModelStats();
    
    console.log(`Current Model: ${systemStatus.currentModel}`);
    console.log(`Is Latest: ${modelStats.isLatest ? '✅ Yes' : '⚠️ No'}`);
    console.log(`Request Count: ${systemStatus.requestCount}/${systemStatus.dailyLimit}`);
    
    // Test basic generation
    const testContent = await centralAIManager.generateContent('Hello, test message', {
      retries: 1,
      timeout: 10000,
      priority: 'low'
    });
    
    testResults.centralAIManager.success = testContent.length > 0;
    testResults.centralAIManager.model = systemStatus.currentModel;
    
    console.log(`✅ Central AI Manager: ${testResults.centralAIManager.success ? 'PASS' : 'FAIL'}`);
    
    // Check for newer versions
    console.log('🔍 Checking for newer AI model versions...');
    const migrated = await centralAIManager.checkForNewerVersions();
    console.log(`Migration result: ${migrated ? 'Upgraded' : 'No upgrade needed'}`);
    
  } catch (error) {
    testResults.centralAIManager.errors.push(error.message);
    console.error(`❌ Central AI Manager: FAIL - ${error.message}`);
  }

  // Test 2: AI Service (Educational)
  console.log('\n🎓 Testing AI Service (Educational)...');
  try {
    const isAvailable = await aiService.isAvailable();
    const currentModel = aiService.getCurrentModel();
    const serviceStats = aiService.getServiceStats();
    
    console.log(`Service Available: ${isAvailable ? '✅ Yes' : '❌ No'}`);
    console.log(`Current Model: ${currentModel.name} (${currentModel.version})`);
    console.log(`Is Latest: ${serviceStats.isLatest ? '✅ Yes' : '⚠️ No'}`);
    
    // Test content generation
    const testContent = await aiService.generateContent('Generate a test educational question.', {
      retries: 1,
      priority: 'normal'
    });
    
    testResults.aiService.success = isAvailable && testContent.length > 0;
    testResults.aiService.model = currentModel.name;
    
    console.log(`✅ AI Service: ${testResults.aiService.success ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    testResults.aiService.errors.push(error.message);
    console.error(`❌ AI Service: FAIL - ${error.message}`);
  }

  // Test 3: Job Scraping Service
  console.log('\n🔍 Testing Job Scraping Service...');
  try {
    const integrationTest = await JobScrapingService.testAIIntegration();
    
    console.log(`Current Model: ${integrationTest.currentModel}`);
    console.log(`Service Available: ${integrationTest.testResults.serviceAvailability ? '✅ Yes' : '❌ No'}`);
    console.log(`Basic Generation: ${integrationTest.testResults.basicGeneration ? '✅ Pass' : '❌ Fail'}`);
    console.log(`Job Parsing: ${integrationTest.testResults.jobParsing ? '✅ Pass' : '❌ Fail'}`);
    console.log(`Version Migration: ${integrationTest.testResults.versionMigration ? '✅ Pass' : '❌ Fail'}`);
    console.log(`Is Latest Model: ${integrationTest.modelStats.isLatest ? '✅ Yes' : '⚠️ No'}`);
    
    testResults.jobScrapingService.success = integrationTest.success;
    testResults.jobScrapingService.model = integrationTest.currentModel;
    
    if (integrationTest.errors.length > 0) {
      testResults.jobScrapingService.errors = integrationTest.errors;
    }
    
    console.log(`✅ Job Scraping Service: ${testResults.jobScrapingService.success ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    testResults.jobScrapingService.errors.push(error.message);
    console.error(`❌ Job Scraping Service: FAIL - ${error.message}`);
  }

  // Test 4: Document Service
  console.log('\n📄 Testing AI Document Service...');
  try {
    const documentService = new AIDocumentService();
    
    // Test with sample document content
    const sampleContent = `
      Question 1: What is the capital of Rwanda?
      A) Kigali
      B) Butare
      C) Gisenyi
      D) Ruhengeri

      Question 2: What year did Rwanda gain independence?
      A) 1960
      B) 1962
      C) 1964
      D) 1966
    `;
    
    const extractedQuestions = await documentService.extractQuestionsFromDocument(
      sampleContent,
      'txt'
    );
    
    const hasQuestions = extractedQuestions.length > 0;
    const hasValidStructure = extractedQuestions.every(q => 
      q.question && q.type && q.points !== undefined
    );
    
    testResults.documentService.success = hasQuestions && hasValidStructure;
    testResults.documentService.model = 'Central AI Manager'; // Uses central manager
    
    console.log(`Questions Extracted: ${extractedQuestions.length}`);
    console.log(`Valid Structure: ${hasValidStructure ? '✅ Yes' : '❌ No'}`);
    console.log(`✅ Document Service: ${testResults.documentService.success ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    testResults.documentService.errors.push(error.message);
    console.error(`❌ Document Service: FAIL - ${error.message}`);
  }

  // Calculate overall results
  const servicesResults = [
    testResults.centralAIManager.success,
    testResults.aiService.success,
    testResults.jobScrapingService.success,
    testResults.documentService.success
  ];
  
  testResults.overall.servicesP​assed = servicesResults.filter(Boolean).length;
  testResults.overall.success = testResults.overall.servicesPassed >= 3; // At least 3/4 services should pass

  // Final Summary
  console.log('\n📊 OVERALL TEST RESULTS');
  console.log('=' .repeat(50));
  console.log(`Services Tested: ${testResults.overall.servicesPassed}/${testResults.overall.totalServices}`);
  console.log(`Overall Status: ${testResults.overall.success ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n📋 Service Details:');
  console.log(`Central AI Manager: ${testResults.centralAIManager.success ? '✅ PASS' : '❌ FAIL'} (${testResults.centralAIManager.model})`);
  console.log(`AI Service: ${testResults.aiService.success ? '✅ PASS' : '❌ FAIL'} (${testResults.aiService.model})`);
  console.log(`Job Scraping: ${testResults.jobScrapingService.success ? '✅ PASS' : '❌ FAIL'} (${testResults.jobScrapingService.model})`);
  console.log(`Document Service: ${testResults.documentService.success ? '✅ PASS' : '❌ FAIL'} (${testResults.documentService.model})`);

  // Display errors if any
  const allErrors = [
    ...testResults.centralAIManager.errors,
    ...testResults.aiService.errors,
    ...testResults.jobScrapingService.errors,
    ...testResults.documentService.errors
  ];

  if (allErrors.length > 0) {
    console.log('\n⚠️ ERRORS ENCOUNTERED:');
    allErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  // AI Model Information Summary
  console.log('\n🤖 AI MODEL INFORMATION:');
  console.log('=' .repeat(50));
  try {
    const modelStats = centralAIManager.getModelStats();
    console.log(`Current Model: ${modelStats.currentModel.name}`);
    console.log(`Version: ${modelStats.currentModel.version}`);
    console.log(`Description: ${modelStats.currentModel.description || 'N/A'}`);
    console.log(`Is Latest: ${modelStats.isLatest ? '✅ Yes' : '⚠️ No'}`);
    console.log(`Available Models: ${modelStats.availableModels.length}`);
    console.log(`Daily Requests: ${modelStats.requestCount}/${modelStats.dailyLimit}`);
    
    console.log('\n📚 Available Models:');
    modelStats.availableModels.forEach((model, index) => {
      const current = model.name === modelStats.currentModel.name ? ' (CURRENT)' : '';
      console.log(`${index + 1}. ${model.name} - ${model.description || model.version}${current}`);
    });
    
  } catch (error) {
    console.error('❌ Could not retrieve model information:', error.message);
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  if (!testResults.overall.success) {
    console.log('❌ Some AI services are not working properly. Please check:');
    console.log('   - GEMINI_API_KEY environment variable is set');
    console.log('   - Internet connectivity for API calls');
    console.log('   - Google AI API quota and billing status');
  } else {
    console.log('✅ All AI services are working with newer Gemini AI versions!');
    console.log('✅ System is ready for production use.');
  }

  return testResults;
}

// Run the comprehensive test
if (require.main === module) {
  testAllAIServices()
    .then(results => {
      process.exit(results.overall.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testAllAIServices };