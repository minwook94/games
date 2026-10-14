import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,action,tick,lock,spawn,garbage,SHAPES} from '../public/engine.js';
const make=(o={})=>createGame({...o,rng:()=>.5});
function fourLines(g,id=0){let p=g.players[id];p.board=Array.from({length:20},()=>Array(10).fill(0));for(let y=16;y<20;y++)p.board[y]=Array.from({length:10},(_,x)=>x===4?0:1);p.piece={t:0,m:[[1],[1],[1],[1]],x:4,y:16};lock(g,p);}
test('four-line clear damages boss and advances immediately',()=>{let g=make();fourLines(g);assert.equal(g.stage,2);assert.equal(g.players[0].damage,180);assert.equal(g.players[0].lines,4);assert.equal(g.boss.mechanic,'hold');});
test('cooperative HP scales with party size',()=>{assert.equal(make({count:2}).boss.maxHp,248);});
test('competitive last hit sends two garbage rows to opponent',()=>{let g=make({mode:'versus',count:2});fourLines(g);assert.equal(g.players[1].board[19].filter(v=>v===8).length,9);assert.equal(g.players[1].board[18].filter(v=>v===8).length,9);});
test('hold is limited once per piece and sealed by warden',()=>{let g=make();let p=g.players[0];action(g,0,'hold');let held=p.hold;action(g,0,'hold');assert.equal(p.hold,held);fourLines(g);p.hold=null;action(g,0,'hold');assert.equal(p.hold,null);});
test('ghost blocks expire after six seconds',()=>{let g=make();action(g,0,'drop');assert.ok(g.players[0].ghosts.length);tick(g,6.1);assert.equal(g.players[0].ghosts.length,0);});
test('cooperative deadline fails; competitive mode continues',()=>{let g=make();tick(g,50);assert.equal(g.finished,true);let v=make({mode:'versus'});tick(v,50);assert.equal(v.finished,false);tick(v,130);assert.equal(v.reason,'러시 제한 시간 종료');});
test('one eliminated co-op player does not end party',()=>{let g=make({count:2});g.players[0].dead=true;tick(g,.1);assert.equal(g.finished,false);g.players[1].dead=true;tick(g,.1);assert.equal(g.finished,true);});
test('seven-bag contains all seven pieces',()=>{let g=make(),p=g.players[0],pieces=[];for(let i=0;i<7;i++){pieces.push(p.piece.t);spawn(p,g.rng);}assert.equal(new Set(pieces).size,7);});
test('garbage top-out and bounds are enforced',()=>{let g=make(),p=g.players[0];p.board[0][0]=1;garbage(p,()=>.5);assert.equal(p.dead,true);});
test('hard drop locks a piece without leaving board bounds',()=>{let g=make();action(g,0,'drop');assert.equal(g.players[0].board.flat().filter(Boolean).length,4);assert.equal(g.players[0].dead,false);});
test('shield-boss transition does not collide with an already locked piece',()=>{let g=make();g.stage=3;g.boss.hp=1;let p=g.players[0];p.board[19]=Array(10).fill(1);p.board[19][4]=0;p.board[19][5]=0;p.piece={t:1,m:SHAPES[1],x:4,y:18};lock(g,p);assert.equal(g.stage,4);assert.equal(g.boss.mechanic,'shield');assert.equal(p.dead,false);assert.equal(p.board[19].filter(v=>v===8).length,9);});
