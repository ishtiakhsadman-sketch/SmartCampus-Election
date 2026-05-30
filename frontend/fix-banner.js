const fs = require('fs');
const path = require('path');
const dir = 'e:/SmartCampus-Election-FullStack - Copy/SmartCampus-Election-FullStack/frontend';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let count = 0;

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');

  // Check if page-banner is before </header>
  const regex = /(<section class="page-banner">[\s\S]*?<\/section>)\s*(<\/header>)/;
  
  if (regex.test(content)) {
    content = content.replace(regex, '$2\n\n  $1');
    fs.writeFileSync(p, content);
    count++;
    console.log('Modified', f);
  } else {
    // maybe it has other classes
    const regex2 = /(<section class="[^"]*page-banner[^"]*">[\s\S]*?<\/section>)\s*(<\/header>)/;
    if (regex2.test(content)) {
      content = content.replace(regex2, '$2\n\n  $1');
      fs.writeFileSync(p, content);
      count++;
      console.log('Modified', f);
    }
  }
});

console.log('Total modified:', count);
