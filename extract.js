const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function extract() {
  const logPath = 'C:\\Users\\Evo-minidesk\\.gemini\\antigravity\\brain\\be7817d2-a200-4506-b088-d2cb129e4593\\.system_generated\\logs\\transcript.jsonl';
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('Visualmente así se debería de ver toda la app')) {
      const data = JSON.parse(line);
      const content = data.content || '';
      fs.writeFileSync('c:\\Users\\Evo-minidesk\\Desktop\\iz-core\\access\\user_html.html', content);
      console.log('HTML extracted successfully!');
      return;
    }
  }
  console.log('HTML not found in logs!');
}

extract();
