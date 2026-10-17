const fs = require('fs');
let code = fs.readFileSync('app/rooms/[roomCode]/page.tsx', 'utf8');
code = code.replace(/<Crown\s+className="([^"]+)"\s+title="([^"]+)"\s*\/>/g, '<span title="$2"><Crown className="$1" /></span>');
fs.writeFileSync('app/rooms/[roomCode]/page.tsx', code, 'utf8');

// Also check all other files in app for <Icon ... title="..." />
const globDirs = ['app', 'components'];
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = dir + '/' + f;
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      let c = fs.readFileSync(full, 'utf8');
      if (/<(Crown|Search|Target|Trash2|LogOut|Copy|Check)\s+[^>]*title=/i.test(c)) {
        c = c.replace(/<([A-Z][a-zA-Z0-9]+)\s+className="([^"]+)"\s+title="([^"]+)"\s*\/>/g, '<span title="$3"><$1 className="$2" /></span>');
        fs.writeFileSync(full, c, 'utf8');
        console.log('Fixed icon title in ' + full);
      }
    }
  }
}
walk('app');
walk('components');
console.log('Finished checking and fixing icon title props.');
