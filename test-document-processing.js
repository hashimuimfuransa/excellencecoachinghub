const fs = require('fs');
const path = require('path');

// Create a simple test PDF content (base64 encoded minimal PDF)
const testPdfContent = `JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAxIDAgUgo+Pgo+PgovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA1IDAgUgo+Pgo1IDAgb2JqCjw8Ci9MZW5ndGggMjQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoyMCA3NzAgVGQKKFRlc3QgRG9jdW1lbnQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjMgMCBvYmoKMjQKZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFsyXQovQ291bnQgMQovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKNiAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgNCAwIFIKPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI2OCAwMDAwMCBuIAowMDAwMDAwMzQ1IDAwMDAwIG4gCjAwMDAwMDA0OTkgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA3Ci9Sb290IDYgMCBSCi9JbmZvIDw8Ci9UaXRsZSAoVGVzdCBEb2N1bWVudCkKPj4KPj4Kc3RhcnR4cmVmCjU5NQolJUVPRgo=`;

console.log('🧪 Testing Document Processing Fix');
console.log('================================');

// Test the document processor service directly
async function testDocumentProcessor() {
  try {
    // Import the service
    const { DocumentProcessorService } = require('./dist/services/documentProcessorService');
    
    console.log('📄 Creating test PDF buffer...');
    const pdfBuffer = Buffer.from(testPdfContent, 'base64');
    
    console.log('🤖 Testing document processing...');
    const processor = DocumentProcessorService.getInstance();
    
    const result = await processor.processDocument(
      pdfBuffer,
      'test-document.pdf',
      'application/pdf'
    );
    
    console.log('✅ Test Results:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Processing Time: ${result.processingTime}ms`);
    console.log(`   Extracted Text Length: ${result.extractedText?.length || 0} characters`);
    
    if (result.success) {
      console.log('🎉 Document processing is working correctly!');
      console.log(`📝 Extracted text preview: "${result.extractedText?.substring(0, 100)}..."`);
    } else {
      console.log('❌ Document processing failed:');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDocumentProcessor();
