const fs = require('fs');
['components/site/gallery.tsx', 'components/site/portfolio-highlights.tsx', 'components/site/showreel.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /className=\{cn\(\s*"no-scrollbar([^"]*)overflow-x-auto([^"]*)",/g,
    'className={cn(\n              "no-scrollbar$1overflow-x-auto touch-pan-x overscroll-x-contain$2",'
  );
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
