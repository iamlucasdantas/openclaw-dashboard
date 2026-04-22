const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const fs = require('fs');

async function run() {
  const updates = [
    { id: 'cmo9900dk0007271bq78784wp', file: '/tmp/botox-content.txt', title: 'Botox in Davenport, Iowa: Pricing, What to Expect & Where to Go in 2026' },
    { id: 'cmo9900dg0005271byd67qmxb', file: '/tmp/semaglutide-content.txt', title: 'Semaglutide Weight Loss in the Quad Cities: What You Need to Know' },
    { id: 'cmo9900dc0003271bfpf482vv', file: '/tmp/lipfiller-content.txt', title: 'Lip Filler Near Davenport, Iowa: Natural Results vs. The Overfilled Look' },
  ];
  
  for (const u of updates) {
    const content = fs.readFileSync(u.file, 'utf8').trim();
    const task = await p.task.findUnique({ where: { id: u.id } });
    if (!task) { console.log('SKIP: ' + u.id); continue; }
    const dd = JSON.parse(task.deliverableData || '{}');
    const oldLen = (dd.content || '').length;
    dd.content = content;
    dd.title = u.title;
    await p.task.update({ where: { id: u.id }, data: { deliverableData: JSON.stringify(dd) } });
    console.log(u.title + ': ' + oldLen + ' -> ' + content.length + ' chars');
  }
  
  await p.$disconnect();
  console.log('Done!');
}
run();
