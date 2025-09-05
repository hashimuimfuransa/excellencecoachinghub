# AI Rate Limiting and Chunking Improvements

## 🚨 Issues Fixed

### 1. **Model Name Errors (404)**
- ❌ **Before**: Using incorrect model names like `gemini-1.5-pro-latest`
- ✅ **After**: Using correct model names: `gemini-1.5-flash`, `gemini-1.5-pro`

### 2. **API Quota Exceeded (429)**
- ❌ **Before**: Making rapid successive requests without rate limiting
- ✅ **After**: Implemented comprehensive rate limiting and request queuing

## 🔧 Improvements Made

### **Rate Limiting System**
```typescript
// New rate limiting parameters
private readonly MINUTE_REQUEST_LIMIT = 2;        // Max 2 requests per minute
private readonly MIN_REQUEST_INTERVAL = 30000;    // 30 seconds between requests
private dailyRequestLimit: number = 300;          // Reduced daily limit
```

### **Request Queuing**
- All AI requests now go through a queue system
- Automatic throttling based on time intervals
- Minute-by-minute request tracking
- Proper delays between requests

### **Chunking System for Large Operations**
```typescript
// Process large datasets in chunks
await centralAIManager.processInChunks(
  items,
  async (item) => processItem(item),
  {
    chunkSize: 5,
    delayBetweenChunks: 60000, // 1 minute between chunks
    maxConcurrent: 1
  }
);
```

### **Batch Processing**
```typescript
// Process multiple prompts with automatic chunking
const results = await centralAIManager.generateContentBatch(
  prompts,
  {
    chunkSize: 2,
    delayBetweenChunks: 120000, // 2 minutes between chunks
    priority: 'low'
  }
);
```

## 📊 Free Tier Quota Limits (Google Gemini)

Based on the error analysis, the free tier has these limits:
- **Requests per minute per model**: ~2-5 requests
- **Requests per day per model**: Limited (varies)
- **Input tokens per minute**: Limited
- **Recommended retry delay**: 5-9 seconds minimum

## 🎯 Usage Recommendations

### For Single Requests:
```typescript
const result = await centralAIManager.generateContent(prompt, {
  priority: 'low',        // Use 'low' for non-urgent requests
  retries: 2,            // Reduce retries to save quota
  timeout: 15000,        // Shorter timeout
  maxTokens: 1000        // Limit output tokens
});
```

### For Multiple Requests:
```typescript
const results = await centralAIManager.generateContentBatch(prompts, {
  chunkSize: 2,                    // Very small chunks
  delayBetweenChunks: 120000,      // 2+ minutes between chunks
  priority: 'low',
  maxTokens: 500                   // Smaller responses
});
```

### For Scraping/Large Operations:
```typescript
const scrapedData = await centralAIManager.processInChunks(
  urls,
  async (url) => scrapeAndAnalyze(url),
  {
    chunkSize: 3,                  // Small chunks
    delayBetweenChunks: 180000,    // 3 minutes between chunks
    maxConcurrent: 1               // No concurrency
  }
);
```

## 🔍 Monitoring Tools

### Queue Status Monitoring:
```typescript
const status = centralAIManager.getQueueStatus();
console.log(`Queue: ${status.queueLength} pending`);
console.log(`Requests: ${status.requestCount}/${status.dailyLimit}`);
console.log(`This minute: ${status.minuteRequestCount}/${status.minuteLimit}`);
```

### System Status:
```typescript
const systemStatus = centralAIManager.getSystemStatus();
// Includes queue status, model info, and availability
```

## ⚡ Performance Benefits

1. **Quota Conservation**: 30-second intervals prevent rapid quota depletion
2. **Error Reduction**: Proper model names eliminate 404 errors  
3. **Predictable Processing**: Chunking makes large operations reliable
4. **Better UX**: Queue system prevents request failures
5. **Monitoring**: Real-time status tracking for better debugging

## 🚀 Next Steps

1. **Monitor Usage**: Track daily/hourly request patterns
2. **Adjust Limits**: Fine-tune based on actual quota limits observed
3. **Caching**: Add response caching to reduce API calls
4. **Failover**: Consider alternative AI providers for overflow

## 📝 Usage Examples

See `example-chunking.js` for complete working examples of:
- Single request with rate limiting
- Batch processing with chunking
- Large dataset processing simulation
- Status monitoring

---
*These improvements ensure reliable AI operations within Google Gemini's free tier quotas.*