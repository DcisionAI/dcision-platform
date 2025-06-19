const mammoth = require('mammoth');
const path = require('path');

const filePath = process.argv[2] || '/Users/ameydhavle/Documents/DcisionAI/docs/DcisionAI - PRFAQ.docx';

mammoth.extractRawText({ path: filePath })
  .then(result => {
    console.log('Extracted text (first 500 chars):');
    console.log(result.value.slice(0, 500));
  })
  .catch(err => {
    console.error('Mammoth error:', err);
  });