import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createFeedParser } from '../src/lib/rss.ts';

test('RSS fetch uses modern URLs, follows redirects, preserves headers and rejects errors', async () => {
  const warnings=[];
  const onWarning=w=>warnings.push(w.code);
  process.on('warning',onWarning);
  const server=createServer((req,res)=>{
    if(req.url==='/redirect'){res.writeHead(302,{location:'/feed'});res.end();return;}
    if(req.url==='/bad'){res.writeHead(503);res.end();return;}
    if(req.url==='/large'){res.end('x'.repeat(5*1024*1024+1));return;}
    assert.equal(req.headers['user-agent'],'bancada-test');
    res.setHeader('content-type','application/rss+xml');
    res.end('<rss version="2.0"><channel><title>Football</title><item><title>Goal</title><link>https://example.com/goal</link></item></channel></rss>');
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const parser=createFeedParser({timeout:2000,headers:{'User-Agent':'bancada-test'}});
  try{
    const feed=await parser.parseURL(base+'/redirect');assert.equal(feed.items[0].title,'Goal');
    await assert.rejects(parser.parseURL(base+'/bad'),/503/);
    await assert.rejects(parser.parseURL(base+'/large'),/5 MiB/);
    await assert.rejects(parser.parseURL('file:///etc/passwd'),/protocol/);
    assert.ok(!warnings.includes('DEP0169'));
  }finally{process.off('warning',onWarning);server.closeAllConnections();await new Promise(r=>server.close(r));}
});
