require('dotenv').config();
const { centralAIManager } = require('./dist/services/centralAIManager');

async function demonstrateChunking() {
  console.log('🚀 Demonstrating AI Chunking and Rate Limiting\n');

  try {
    // Check current status
    const status = centralAIManager.getSystemStatus();
    console.log('📊 Current Status:');
    console.log(`- Model: ${status.currentModel}`);
    console.log(`- Requests: ${status.requestCount}/${status.dailyLimit}`);
    console.log(`- Queue: ${status.queueStatus.queueLength} pending requests`);
    console.log(`- Last request: ${Math.round(status.queueStatus.timeSinceLastRequest/1000)}s ago`);
    console.log('');

    // Example 1: Single request with rate limiting
    console.log('🎯 Example 1: Single AI Request');
    const singlePrompt = "Generate a very short motivational quote (max 10 words)";
    
    try {
      const result = await centralAIManager.generateContent(singlePrompt, {
        priority: 'normal',
        retries: 2,
        timeout: 15000
      });
      console.log(`✅ Result: "${result}"`);
    } catch (error) {
      console.log(`⚠️ Request failed (expected due to quota): ${error.message}`);
    }

    console.log('');

    // Example 2: Batch processing with chunking
    console.log('🗂️ Example 2: Batch Processing with Chunking');
    const prompts = [
      "Generate a very short tip about learning (max 8 words)",
      "Generate a very short tip about motivation (max 8 words)", 
      "Generate a very short tip about success (max 8 words)",
      "Generate a very short tip about growth (max 8 words)",
      "Generate a very short tip about goals (max 8 words)"
    ];

    console.log(`Processing ${prompts.length} prompts in chunks...`);

    try {
      const batchResults = await centralAIManager.generateContentBatch(prompts, {
        chunkSize: 2, // Process 2 at a time
        delayBetweenChunks: 90000, // 1.5 minutes between chunks
        priority: 'low',
        retries: 1
      });

      console.log('✅ Batch Results:');
      batchResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result}`);
      });

    } catch (error) {
      console.log(`⚠️ Batch processing failed (expected due to quota): ${error.message}`);
    }

    console.log('');

    // Example 3: Large dataset chunking simulation
    console.log('📦 Example 3: Large Dataset Simulation');
    const largeDataset = Array.from({length: 20}, (_, i) => `Item ${i + 1}`);
    
    try {
      const results = await centralAIManager.processInChunks(
        largeDataset,
        async (item) => {
          // Simulate processing each item
          console.log(`  Processing: ${item}`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
          return `Processed: ${item}`;
        },
        {
          chunkSize: 5,
          delayBetweenChunks: 10000, // 10 seconds between chunks for demo
          maxConcurrent: 2
        }
      );

      console.log('✅ Large dataset processed successfully');
      console.log(`Total results: ${results.length}`);

    } catch (error) {
      console.log(`❌ Large dataset processing failed: ${error.message}`);
    }

    console.log('\n📋 Final Status:');
    const finalStatus = centralAIManager.getSystemStatus();
    console.log(`- Queue length: ${finalStatus.queueStatus.queueLength}`);
    console.log(`- Total requests made: ${finalStatus.requestCount}/${finalStatus.dailyLimit}`);
    console.log(`- Minutes requests: ${finalStatus.queueStatus.minuteRequestCount}/${finalStatus.queueStatus.minuteLimit}`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Usage tips
console.log('💡 Usage Tips for Rate-Limited AI:');
console.log('1. Use generateContentBatch() for multiple requests');
console.log('2. Set appropriate chunkSize (2-5 for free tier)');
console.log('3. Use longer delays between chunks (60-120 seconds)');
console.log('4. Monitor queue status with getQueueStatus()');
console.log('5. Set priority to "low" for non-urgent requests');
console.log('6. Use smaller maxTokens to reduce quota usage');
console.log('');

demonstrateChunking();