/* SKILL//TREE — vanilla JS growth RPG. No server, no dependencies. */
const SAVE_KEY = 'skilltree-rpg-v1.0';
const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => Math.random() * (b - a) + a;
const fmt = (n) => Math.floor(n).toLocaleString('ko-KR');

const BRANCHES = [
  { id:'blade', name:'검술', glyph:'刃', desc:'기본 공격, 치명타, 처형을 극단적으로 밀어붙인다.' },
  { id:'flame', name:'화염', glyph:'炎', desc:'스킬 피해와 폭발적인 순간 화력을 강화한다.' },
  { id:'frost', name:'빙결', glyph:'氷', desc:'적을 늦추고 방어를 굳히는 안정적인 계통.' },
  { id:'storm', name:'폭풍', glyph:'雷', desc:'공격 속도와 연타, 치명타를 폭증시킨다.' },
  { id:'vitality', name:'생명', glyph:'生', desc:'체력, 회복, 전투 지속력을 끌어올린다.' },
  { id:'shadow', name:'그림자', glyph:'影', desc:'치명타와 고위험 고화력 공격을 강화한다.' },
  { id:'summon', name:'소환', glyph:'骸', desc:'해골 군단을 불러 직접 공격과 별도로 피해를 누적한다.' },
  { id:'arcane', name:'비전', glyph:'星', desc:'스킬 위력과 재사용 대기시간을 다룬다.' },
  { id:'fortune', name:'행운', glyph:'幸', desc:'경험치, 골드, 장비 드롭과 보상을 증폭한다.' },
  { id:'guardian', name:'수호', glyph:'盾', desc:'방어, 피해 감소, 막기를 통해 버티며 성장한다.' },
];

const REGIONS = [
  { id:'meadow', name:'속삭임 초원', min:1, desc:'약한 마물과 부서진 유적이 흩어진 시작 지역.', enemies:['들쥐 마수','푸른 슬라임','떠도는 고블린'], boss:'초원의 포식자', hp:1, atk:1, xp:1, gold:1 },
  { id:'blackwood', name:'검은 숲', min:5, desc:'빛이 닿지 않는 숲. 독과 그림자 마물이 배회한다.', enemies:['가시 늑대','독버섯 마수','그림자 도적'], boss:'검은뿔 알파', hp:1.65, atk:1.35, xp:1.55, gold:1.5 },
  { id:'ashen', name:'잿빛 협곡', min:10, desc:'타오르는 균열과 재의 폭풍이 길을 삼킨다.', enemies:['용암충','재의 망령','화염 골렘'], boss:'잿불 군주', hp:2.5, atk:1.8, xp:2.25, gold:2.2 },
  { id:'frosttomb', name:'빙결 묘역', min:18, desc:'얼어붙은 왕국의 시체와 고대 마법이 잠든 묘역.', enemies:['서리 망자','빙결 기사','설원 마녀'], boss:'동결왕의 잔영', hp:3.7, atk:2.4, xp:3.3, gold:3.2 },
  { id:'arcane', name:'비전 폐허', min:28, desc:'폭주한 마력 회로가 현실을 뒤틀어 놓은 도시.', enemies:['마력 포식자','룬 감시자','공허술사'], boss:'붕괴한 대마도사', hp:5.4, atk:3.1, xp:4.8, gold:4.6 },
  { id:'abyss', name:'심연 관문', min:40, desc:'세계의 아래. 규칙이 부서지고 괴물만 남은 곳.', enemies:['심연 추적자','무명 기사','공허의 눈'], boss:'문지기 아바돈', hp:8, atk:4.2, xp:7, gold:6.8 },
];

const SKILLS = {
  powerStrike:{ name:'강타', desc:'공격력 165%', cd:3.6, key:'1' },
  whirlwind:{ name:'회전참', desc:'3연속 공격', cd:6.5, key:'2' },
  fireball:{ name:'화염구', desc:'강한 스킬 피해', cd:5.2, key:'3' },
  frostNova:{ name:'서리 고리', desc:'피해 + 적 둔화', cd:8, key:'4' },
  chainLightning:{ name:'연쇄 번개', desc:'4연속 번개', cd:7, key:'5' },
  secondWind:{ name:'재생', desc:'최대 HP 35% 회복', cd:14, key:'6' },
  shadowStrike:{ name:'그림자 일격', desc:'치명타 특화 공격', cd:6, key:'7' },
  summon:{ name:'해골 소환', desc:'전투 중 해골 +1', cd:9, key:'8' },
  arcaneBurst:{ name:'비전 폭발', desc:'스킬 위력 기반 강타', cd:9, key:'9' },
  guard:{ name:'철벽', desc:'4초간 받는 피해 -65%', cd:11, key:'0' },
};

const ACTIVE_UNLOCKS = {
  blade:'whirlwind', flame:'fireball', frost:'frostNova', storm:'chainLightning', vitality:'secondWind',
  shadow:'shadowStrike', summon:'summon', arcane:'arcaneBurst', guardian:'guard'
};

const KEYSTONES = {
  blade:{ name:'처형자의 궤적', text:'적 HP가 35% 이하일 때 모든 피해 +45%.', flag:'executioner' },
  flame:{ name:'피의 마도사', text:'스킬 사용 시 최대 HP 3% 소모. 스킬 피해 +65%.', flag:'bloodMage' },
  frost:{ name:'영원의 겨울', text:'둔화된 적에게 주는 피해 +30%, 받는 피해 -12%.', flag:'eternalWinter' },
  storm:{ name:'과전류', text:'기본 공격 속도 +35%. 치명타 시 다음 기본 공격이 빨라진다.', flag:'overcurrent' },
  vitality:{ name:'두 번째 심장', text:'전투당 1회, 치명상을 버티고 HP 30%로 생존.', flag:'secondHeart' },
  shadow:{ name:'완전한 그림자', text:'치명타 피해 +100%. 대신 최대 HP -20%.', flag:'perfectShadow' },
  summon:{ name:'군단의 주인', text:'해골 최대 수 +3, 해골 피해 +120%.', flag:'legionMaster' },
  arcane:{ name:'마력 과부하', text:'모든 스킬 재사용 대기시간 -25%, 스킬 피해 +25%.', flag:'arcaneOverload' },
  fortune:{ name:'운명의 주사위', text:'전투 보상 획득 시 15% 확률로 보상이 2배가 된다.', flag:'destinyDice' },
  guardian:{ name:'움직이지 않는 성', text:'방어력 +60%, 기본 공격 피해 -12%.', flag:'immovable' },
};

const GEAR_NAMES = {
  weapon:['금 간 장검','마력 도끼','잿빛 지팡이','공허 단검','폭풍 창','뼈의 대검'],
  armor:['가죽 전투복','룬 갑주','서리 망토','심연 판금','생명의 외투'],
  accessory:['낡은 부적','붉은 핵','푸른 룬석','망자의 반지','행운의 동전']
};

function freshState(){
  return {
    version:1, level:1, xp:0, sp:3, gold:0, hp:100,
    tree:{ active:['start'], discovered:{} },
    region:0, regionProgress:REGIONS.map(()=>0), bossDefeated:REGIONS.map(()=>false), unlockedRegions:1,
    unlockedSkills:['powerStrike'],
    inventory:[], equipment:{weapon:null,armor:null,accessory:null},
    records:{ kills:0,bossKills:0,crits:0,skillCasts:0,fireCasts:0,guardUses:0,summonCasts:0,damageTaken:0,goldEarned:0,xpEarned:0,deaths:0,highestHit:0,secretsFound:0 },
    discoveries:[], createdAt:Date.now(), lastSave:Date.now()
  };
}

let state = loadState();
let nodes = generateTree();
let selectedNode = null;
let combat = { enemy:null, lastPlayer:0,lastEnemy:0,lastSummon:0, guardUntil:0, slowedUntil:0, cooldowns:{}, summons:0, secondHeartUsed:false };
let treeCamera = {x:0,y:0,zoom:.86,drag:false,lastX:0,lastY:0,pointers:new Map()};

function loadState(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return freshState();
    const loaded = JSON.parse(raw);
    const base = freshState();
    return {...base,...loaded,tree:{...base.tree,...loaded.tree},records:{...base.records,...loaded.records},equipment:{...base.equipment,...loaded.equipment}};
  }catch(e){ return freshState(); }
}
function saveState(show=false){
  state.lastSave=Date.now();
  localStorage.setItem(SAVE_KEY,JSON.stringify(state));
  if(show) toast('저장 완료','이 브라우저에 현재 빌드를 저장했어.');
}

function generateTree(){
  const list=[{id:'start',name:'기원',branch:'core',tier:0,lane:0,x:0,y:0,type:'normal',cost:0,parents:[],effect:{},desc:'모든 빌드가 시작되는 단 하나의 노드.',start:true}];
  let global=0;
  BRANCHES.forEach((branch,b)=>{
    const baseAngle=(Math.PI*2/BRANCHES.length)*b-Math.PI/2;
    for(let tier=1;tier<=7;tier++){
      for(let lane=0;lane<4;lane++){
        const n=global++;
        const mod=n%10;
        const type=mod<7?'normal':mod<9?'conditional':'secret'; // exact 70 / 20 / 10 across 280 nodes
        const angle=baseAngle+(lane-1.5)*0.075+(tier%2?0.012:-0.012);
        const radius=145+tier*116+(lane%2)*16;
        const id=`${branch.id}-${tier}-${lane}`;
        const parents=tier===1?['start']:[`${branch.id}-${tier-1}-${lane}`];
        if(tier>1 && lane>0 && (tier+lane)%2===0) parents.push(`${branch.id}-${tier-1}-${lane-1}`);
        if(tier===4 && lane===3){ const prev=BRANCHES[(b-1+BRANCHES.length)%BRANCHES.length]; parents.push(`${prev.id}-3-0`); }
        const isSkill=tier===2 && lane===1 && ACTIVE_UNLOCKS[branch.id];
        const isKeystone=tier===7 && lane===2;
        const effect=makeEffect(branch.id,tier,lane,isSkill,isKeystone);
        const name=isKeystone?KEYSTONES[branch.id].name:isSkill?SKILLS[ACTIVE_UNLOCKS[branch.id]].name:makeNodeName(branch,tier,lane);
        list.push({id,name,branch:branch.id,tier,lane,x:Math.cos(angle)*radius,y:Math.sin(angle)*radius,type,cost:isKeystone?4:(tier>=5?2:1),parents,effect,isSkill:!!isSkill,isKeystone,condition:makeCondition(branch.id,tier,type),desc:isKeystone?KEYSTONES[branch.id].text:nodeDescription(branch.id,effect,isSkill)});
      }
    }
  });
  return list;
}

function makeNodeName(branch,tier,lane){
  const suffix=[['기초','숙련','감각','맥동'],['연마','응축','전개','가속'],['심화','각인','증폭','연결'],['변환','극대','관통','순환'],['지배','초월','폭주','공명'],['극의','왕좌','영역','진화'],['종점','절정','법칙','완성']];
  return `${branch.name} · ${suffix[tier-1][lane]}`;
}
function makeEffect(branch,tier,lane,isSkill,isKeystone){
  const p=1+tier*.18;
  const effects={};
  if(isSkill) effects.unlockSkill=ACTIVE_UNLOCKS[branch];
  switch(branch){
    case'blade': lane%3===0?effects.attackPct=.035*p:lane%3===1?effects.crit=.008*p:effects.critDamage=.045*p; break;
    case'flame': effects.skillPower=.045*p; if(lane===2)effects.attackPct=.018*p; break;
    case'frost': lane%2?effects.defensePct=.04*p:effects.hpPct=.032*p; break;
    case'storm': lane%2?effects.attackSpeed=.025*p:effects.crit=.007*p; break;
    case'vitality': lane%2?effects.healPower=.055*p:effects.hpPct=.045*p; break;
    case'shadow': lane%2?effects.critDamage=.065*p:effects.crit=.009*p; break;
    case'summon': effects.summonPower=.065*p; if(lane===3)effects.hpPct=.018*p; break;
    case'arcane': lane%2?effects.cooldown=.012*p:effects.skillPower=.04*p; break;
    case'fortune': lane%3===0?effects.goldBonus=.05*p:lane%3===1?effects.xpBonus=.045*p:effects.luck=.012*p; break;
    case'guardian': lane%2?effects.block=.012*p:effects.defensePct=.055*p; break;
  }
  if(isKeystone) effects.keystone=KEYSTONES[branch].flag;
  return effects;
}
function makeCondition(branch,tier,type){
  if(type==='normal') return null;
  let key='kills',target=Math.max(3,tier*5),label='몬스터 처치';
  if(tier>2){
    const map={flame:['fireCasts',tier*4,'화염구 사용'],storm:['crits',tier*5,'치명타 발생'],shadow:['crits',tier*6,'치명타 발생'],summon:['summonCasts',tier*3,'해골 소환'],arcane:['skillCasts',tier*8,'스킬 사용'],fortune:['goldEarned',tier*180,'골드 획득'],guardian:['guardUses',tier*3,'철벽 사용'],vitality:['damageTaken',tier*180,'피해 받기'],frost:['bossKills',Math.max(1,Math.floor(tier/2)),'보스 처치']};
    if(map[branch]) [key,target,label]=map[branch];
  }
  if(type==='secret') target=Math.ceil(target*1.25);
  return {key,target,label};
}
function nodeDescription(branch,effect,isSkill){
  if(isSkill) return `새 액티브 스킬 [${SKILLS[effect.unlockSkill].name}]을 해금한다.`;
  return `${BRANCHES.find(b=>b.id===branch).desc} 이 노드는 빌드의 수치를 직접 강화한다.`;
}

function getStats(){
  const s={
    maxHp:100+state.level*8, attack:10+state.level*1.8, defense:3+state.level*.72, crit:.05, critDamage:1.6,
    attackSpeed:0, skillPower:1, summonPower:1, cooldown:0, healPower:1, goldBonus:0, xpBonus:0, luck:0, block:0,
    keystones:new Set()
  };
  state.tree.active.forEach(id=>{
    const node=nodes.find(n=>n.id===id); if(!node)return;
    const e=node.effect||{};
    if(e.attackPct)s.attack*=1+e.attackPct;
    if(e.hpPct)s.maxHp*=1+e.hpPct;
    if(e.defensePct)s.defense*=1+e.defensePct;
    if(e.crit)s.crit+=e.crit;
    if(e.critDamage)s.critDamage+=e.critDamage;
    if(e.attackSpeed)s.attackSpeed+=e.attackSpeed;
    if(e.skillPower)s.skillPower+=e.skillPower;
    if(e.summonPower)s.summonPower+=e.summonPower;
    if(e.cooldown)s.cooldown+=e.cooldown;
    if(e.healPower)s.healPower+=e.healPower;
    if(e.goldBonus)s.goldBonus+=e.goldBonus;
    if(e.xpBonus)s.xpBonus+=e.xpBonus;
    if(e.luck)s.luck+=e.luck;
    if(e.block)s.block+=e.block;
    if(e.keystone)s.keystones.add(e.keystone);
  });
  Object.values(state.equipment).filter(Boolean).forEach(item=>{
    const e=item.effect||{};
    if(e.attack)s.attack+=e.attack;if(e.maxHp)s.maxHp+=e.maxHp;if(e.defense)s.defense+=e.defense;
    if(e.crit)s.crit+=e.crit;if(e.skillPower)s.skillPower+=e.skillPower;if(e.goldBonus)s.goldBonus+=e.goldBonus;
  });
  if(s.keystones.has('perfectShadow'))s.maxHp*=.8;
  if(s.keystones.has('immovable'))s.defense*=1.6;
  if(s.keystones.has('arcaneOverload')){s.skillPower+=.25;s.cooldown+=.25;}
  if(s.keystones.has('legionMaster'))s.summonPower*=2.2;
  s.maxHp=Math.floor(s.maxHp);s.attack=Math.round(s.attack*10)/10;s.defense=Math.round(s.defense*10)/10;s.crit=clamp(s.crit,0,.8);s.cooldown=clamp(s.cooldown,0,.6);
  return s;
}
function xpNeed(level=state.level){ return Math.floor(75+level*32+Math.pow(level,1.35)*13); }

function createEnemy(){
  const r=REGIONS[state.region]; const boss=state.regionProgress[state.region]>=5;
  const lvl=Math.max(r.min,state.level+Math.floor(rnd(-2,3)));
  const baseHp=(52+lvl*17)*r.hp*(boss?4.8:1);
  const baseAtk=(5+lvl*2.15)*r.atk*(boss?1.45:1);
  return {name:boss?r.boss:r.enemies[Math.floor(Math.random()*r.enemies.length)],level:lvl,maxHp:Math.floor(baseHp),hp:Math.floor(baseHp),attack:baseAtk,boss,icon:boss?'◆':['●','▲','✦'][Math.floor(Math.random()*3)]};
}

function startBattle(){
  if(combat.enemy)return;
  const s=getStats(); state.hp=clamp(state.hp||s.maxHp,1,s.maxHp);
  combat.enemy=createEnemy();combat.lastPlayer=performance.now();combat.lastEnemy=performance.now();combat.lastSummon=performance.now();combat.guardUntil=0;combat.slowedUntil=0;combat.summons=0;combat.secondHeartUsed=false;
  addLog(`${combat.enemy.boss?'보스 ':'전투 '}시작 — <b>${combat.enemy.name}</b>`,combat.enemy.boss?'bad':'');
  renderCombat();
}
function battleTick(now){
  if(!combat.enemy)return;
  const s=getStats();
  const interval=1100/(1+s.attackSpeed+(s.keystones.has('overcurrent')?.35:0));
  if(now-combat.lastPlayer>=interval){combat.lastPlayer=now;playerHit(s.attack,'기본 공격',0,s);}
  const enemyInterval=(now<combat.slowedUntil?2400:1750);
  if(combat.enemy && now-combat.lastEnemy>=enemyInterval){combat.lastEnemy=now;enemyHit();}
  if(combat.enemy && combat.summons>0 && now-combat.lastSummon>=1800){combat.lastSummon=now;for(let i=0;i<combat.summons;i++) if(combat.enemy)playerHit(s.attack*.42*s.summonPower,'해골',-.02,s,true);}
  updateCooldownUI();
}
function playerHit(base,label,critBonus=0,s=getStats(),silent=false){
  if(!combat.enemy)return;
  let crit=Math.random()<clamp(s.crit+critBonus,0,.95);
  let dmg=base*rnd(.9,1.1)*(crit?s.critDamage:1);
  if(s.keystones.has('executioner') && combat.enemy.hp/combat.enemy.maxHp<=.35)dmg*=1.45;
  if(s.keystones.has('eternalWinter') && performance.now()<combat.slowedUntil)dmg*=1.3;
  if(s.keystones.has('immovable'))dmg*=.88;
  dmg=Math.max(1,Math.floor(dmg));combat.enemy.hp-=dmg;
  state.records.highestHit=Math.max(state.records.highestHit,dmg);
  if(crit){state.records.crits++;floatDamage(dmg,true);if(!silent)addLog(`${label} 치명타! <b>${fmt(dmg)}</b> 피해`,'good');}
  else{floatDamage(dmg,false);if(!silent)addLog(`${label} · ${fmt(dmg)} 피해`);}
  $('#enemySigil')?.classList.add('hit');setTimeout(()=>$('#enemySigil')?.classList.remove('hit'),160);
  if(combat.enemy.hp<=0) winBattle(); else renderBars();
  checkDiscoveries();
}
function enemyHit(){
  if(!combat.enemy)return;
  const s=getStats();
  let dmg=Math.max(1,(combat.enemy.attack-s.defense*.62)*rnd(.85,1.15));
  if(performance.now()<combat.guardUntil)dmg*=.35;
  if(s.keystones.has('eternalWinter') && performance.now()<combat.slowedUntil)dmg*=.88;
  if(Math.random()<s.block)dmg*=.35;
  dmg=Math.floor(dmg);state.hp-=dmg;state.records.damageTaken+=dmg;floatDamage(dmg,false,true);
  if(state.hp<=0){
    if(s.keystones.has('secondHeart')&&!combat.secondHeartUsed){combat.secondHeartUsed=true;state.hp=Math.floor(s.maxHp*.3);toast('두 번째 심장','치명상을 버티고 다시 일어났다.');addLog('두 번째 심장이 뛰기 시작했다.','good');}
    else loseBattle();
  }
  renderBars();checkDiscoveries();
}
function winBattle(){
  const e=combat.enemy;if(!e)return;const r=REGIONS[state.region],s=getStats();
  let xp=Math.floor((28+e.level*8)*r.xp*(e.boss?3.8:1)*(1+s.xpBonus));
  let gold=Math.floor((10+e.level*4)*r.gold*(e.boss?4:1)*(1+s.goldBonus));
  if(s.keystones.has('destinyDice')&&Math.random()<.15){xp*=2;gold*=2;toast('운명의 주사위','전투 보상이 2배가 됐다.');}
  state.xp+=xp;state.gold+=gold;state.records.xpEarned+=xp;state.records.goldEarned+=gold;state.records.kills++;
  addLog(`<b>${e.name}</b> 처치 · EXP ${fmt(xp)} / ${fmt(gold)}G`,'good');
  if(e.boss){
    state.records.bossKills++;state.bossDefeated[state.region]=true;state.regionProgress[state.region]=0;state.sp+=3;
    if(state.unlockedRegions<REGIONS.length && state.region===state.unlockedRegions-1){state.unlockedRegions++;toast('새 지역 개방',REGIONS[state.unlockedRegions-1].name+'에 진입할 수 있어.');}
    toast('보스 격파','보너스 SP +3');
  }else state.regionProgress[state.region]++;
  if(Math.random()<.27+s.luck) dropGear(e.level,e.boss);
  combat.enemy=null;levelCheck();checkDiscoveries();saveState();renderAll();
}
function loseBattle(){
  state.records.deaths++;addLog('전투 패배. 정비 후 다시 일어났다.','bad');toast('패배','지역 진행도는 잃지 않는다.');combat.enemy=null;state.hp=getStats().maxHp;saveState();renderAll();
}
function levelCheck(){
  let ups=0;
  while(state.xp>=xpNeed()){state.xp-=xpNeed();state.level++;state.sp+=2;ups++;}
  if(ups){state.hp=getStats().maxHp;toast(`레벨 ${state.level}`,`레벨업 ${ups}회 · SP +${ups*2}`);addLog(`레벨 상승! <b>Lv.${state.level}</b> · SP +${ups*2}`,'good');}
}

function useSkill(id){
  if(!combat.enemy||!state.unlockedSkills.includes(id))return;
  const sk=SKILLS[id],s=getStats(),now=performance.now();
  if((combat.cooldowns[id]||0)>now)return;
  const cd=sk.cd*(1-s.cooldown)*1000;combat.cooldowns[id]=now+cd;state.records.skillCasts++;
  if(s.keystones.has('bloodMage')){state.hp=Math.max(1,state.hp-Math.floor(s.maxHp*.03));}
  const skillMult=s.skillPower*(s.keystones.has('bloodMage')?1.65:1);
  switch(id){
    case'powerStrike':playerHit(s.attack*1.65*skillMult,'강타',.02,s);break;
    case'whirlwind':for(let i=0;i<3;i++)setTimeout(()=>combat.enemy&&playerHit(s.attack*.72,'회전참',0,s,true),i*95);addLog('회전참 · 3연속 베기');break;
    case'fireball':state.records.fireCasts++;playerHit(s.attack*2.15*skillMult,'화염구',0,s);break;
    case'frostNova':playerHit(s.attack*1.45*skillMult,'서리 고리',0,s);combat.slowedUntil=performance.now()+5200;addLog('적이 얼어붙어 공격이 느려졌다.','good');break;
    case'chainLightning':for(let i=0;i<4;i++)setTimeout(()=>combat.enemy&&playerHit(s.attack*.62*skillMult,'연쇄 번개',.01,s,true),i*80);break;
    case'secondWind':{const heal=Math.floor(s.maxHp*.35*s.healPower);state.hp=Math.min(s.maxHp,state.hp+heal);addLog(`재생 · HP <b>${fmt(heal)}</b> 회복`,'good');break;}
    case'shadowStrike':playerHit(s.attack*2.05*skillMult,'그림자 일격',.32,s);break;
    case'summon':{state.records.summonCasts++;const max=s.keystones.has('legionMaster')?6:3;combat.summons=Math.min(max,combat.summons+1);addLog(`해골 소환 · 현재 <b>${combat.summons}</b>체`,'good');break;}
    case'arcaneBurst':playerHit(s.attack*2.7*skillMult,'비전 폭발',0,s);break;
    case'guard':state.records.guardUses++;combat.guardUntil=performance.now()+4000;addLog('철벽 · 4초간 받는 피해 65% 감소','good');break;
  }
  renderBars();checkDiscoveries();saveState();
}

function dropGear(level,boss){
  const slots=['weapon','armor','accessory'];const slot=slots[Math.floor(Math.random()*slots.length)];
  const rarity=boss?'epic':Math.random()<.18?'rare':'common';const mult=rarity==='epic'?2.3:rarity==='rare'?1.55:1;
  const effect={};let text='';
  if(slot==='weapon'){effect.attack=Math.floor((3+level*.75)*mult);text=`공격력 +${effect.attack}`;}
  if(slot==='armor'){effect.maxHp=Math.floor((18+level*3.2)*mult);effect.defense=Math.floor((1+level*.22)*mult);text=`HP +${effect.maxHp} · 방어 +${effect.defense}`;}
  if(slot==='accessory'){effect.crit=Number((.01+.001*level)*mult);effect.goldBonus=.04*mult;text=`치명타 +${(effect.crit*100).toFixed(1)}% · 골드 +${Math.round(effect.goldBonus*100)}%`;}
  const item={id:`gear-${Date.now()}-${Math.random()}`,slot,name:GEAR_NAMES[slot][Math.floor(Math.random()*GEAR_NAMES[slot].length)],rarity,level,effect,text};state.inventory.unshift(item);toast('장비 획득',`${item.name} · ${text}`);
}
function equipItem(id){
  const idx=state.inventory.findIndex(i=>i.id===id);if(idx<0)return;const item=state.inventory[idx];
  if(state.equipment[item.slot])state.inventory.push(state.equipment[item.slot]);state.equipment[item.slot]=item;state.inventory.splice(idx,1);state.hp=Math.min(state.hp,getStats().maxHp);saveState();renderAll();toast('장비 교체',item.name);
}

function isParentActive(node){return node.start||node.parents.some(p=>state.tree.active.includes(p));}
function isDiscovered(node){return node.type==='normal'||node.start||!!state.tree.discovered[node.id];}
function conditionMet(node){return !node.condition||(state.records[node.condition.key]||0)>=node.condition.target;}
function canInvest(node){return !state.tree.active.includes(node.id)&&isParentActive(node)&&isDiscovered(node)&&state.sp>=node.cost;}
function investNode(id){
  const node=nodes.find(n=>n.id===id);if(!node||!canInvest(node))return;
  state.sp-=node.cost;state.tree.active.push(id);
  if(node.effect.unlockSkill&&!state.unlockedSkills.includes(node.effect.unlockSkill)){state.unlockedSkills.push(node.effect.unlockSkill);toast('새 스킬 해금',SKILLS[node.effect.unlockSkill].name);}
  if(node.isKeystone)toast('핵심 노드 활성화',node.name);
  state.hp=Math.min(getStats().maxHp,state.hp+8);saveState();renderAll();selectNode(node.id);
}
function checkDiscoveries(){
  let changed=false;
  nodes.forEach(node=>{
    if(node.type==='normal'||state.tree.discovered[node.id]||!node.condition)return;
    if(conditionMet(node)){
      state.tree.discovered[node.id]=true;changed=true;
      const secret=node.type==='secret';if(secret)state.records.secretsFound++;
      state.discoveries.unshift({id:node.id,name:node.name,type:node.type,time:Date.now()});
      toast(secret?'비밀 노드 발견':'조건부 노드 해금',node.name);
    }
  });
  if(changed){saveState();renderTree();renderRecords();}
}

function renderAll(){renderHud();renderRegions();renderCombat();renderStats();renderTree();renderInventory();renderRecords();}
function renderHud(){
  $('#hudLevel').textContent=state.level;$('#bigLevel').textContent=state.level;$('#hudXp').textContent=`${fmt(state.xp)} / ${fmt(xpNeed())}`;$('#hudSp').textContent=state.sp;$('#hudGold').textContent=fmt(state.gold);
  const active=state.tree.active.length-1,score=state.level*10+active*18+state.records.bossKills*120;$('#buildScore').textContent=fmt(score);$('#buildScoreBar').style.width=`${Math.min(100,score/18)}%`;
  const title=active<6?'무명의 방랑자':active<18?'가지 개척자':active<40?'빌드 설계자':active<75?'초월의 탐구자':'스킬 트리 괴물';$('#buildTitle').textContent=title;
}
function renderRegions(){
  $('#regionTabs').innerHTML=REGIONS.map((r,i)=>`<button class="region-tab ${i===state.region?'active':''} ${i>=state.unlockedRegions?'locked':''}" data-region="${i}" ${i>=state.unlockedRegions?'disabled':''}>${String(i+1).padStart(2,'0')}</button>`).join('');
  const r=REGIONS[state.region];$('#regionName').textContent=r.name;$('#regionTitle').textContent=r.name;$('#regionLevel').textContent=`권장 Lv.${r.min}+`;$('#regionDesc').textContent=r.desc;
  const p=state.regionProgress[state.region];$('#regionProgressText').textContent=p>=5?'BOSS 출현':`${p} / 5`;$('#regionProgressBar').style.width=`${Math.min(100,p/5*100)}%`;
  $$('.region-tab').forEach(b=>b.onclick=()=>{if(!combat.enemy){state.region=Number(b.dataset.region);renderAll();saveState();}});
}
function renderCombat(){
  const e=combat.enemy,s=getStats();
  $('#enemyName').textContent=e?e.name:'탐험을 시작해라';$('#enemyTag').textContent=e?(e.boss?'REGION BOSS':'HOSTILE ENTITY'):'대기 중';$('#enemyLevel').textContent=e?`Lv.${e.level}`:'—';$('#enemySigil').classList.toggle('boss',!!e?.boss);$('#enemySigil').querySelector('span').textContent=e?e.icon:'?';
  $('#battleBtn').textContent=e?'전투 진행 중…':(state.regionProgress[state.region]>=5?'보스 도전':'탐험 시작');$('#battleBtn').disabled=!!e;
  $('#skillButtons').innerHTML=state.unlockedSkills.map((id,i)=>{const sk=SKILLS[id];return `<button class="skill-btn" data-skill="${id}" ${e?'':'disabled'}><b>${i<10?sk.key:'·'} · ${sk.name}</b><small>${sk.desc}</small><i class="cooldown" data-cd="${id}"></i></button>`}).join('');
  $$('.skill-btn').forEach(b=>b.onclick=()=>useSkill(b.dataset.skill));renderBars();
}
function renderBars(){
  const e=combat.enemy,s=getStats();state.hp=clamp(state.hp||s.maxHp,0,s.maxHp);$('#playerHpText').textContent=`${fmt(state.hp)} / ${fmt(s.maxHp)}`;$('#playerHpBar').style.width=`${state.hp/s.maxHp*100}%`;
  $('#enemyHpText').textContent=e?`${fmt(Math.max(0,e.hp))} / ${fmt(e.maxHp)}`:'—';$('#enemyHpBar').style.width=e?`${Math.max(0,e.hp/e.maxHp*100)}%`:'0%';
}
function updateCooldownUI(){
  const now=performance.now();$$('[data-cd]').forEach(el=>{const id=el.dataset.cd,sk=SKILLS[id],s=getStats(),total=sk.cd*(1-s.cooldown)*1000,remain=Math.max(0,(combat.cooldowns[id]||0)-now);el.style.transform=`scaleX(${remain/total})`;el.parentElement.disabled=!combat.enemy||remain>0;});
}
function renderStats(){
  const s=getStats();const data=[['HP',fmt(s.maxHp)],['공격',s.attack.toFixed(1)],['방어',s.defense.toFixed(1)],['치명타',(s.crit*100).toFixed(1)+'%'],['치명 피해',Math.round(s.critDamage*100)+'%'],['스킬 위력',Math.round(s.skillPower*100)+'%'],['공속',`+${Math.round(s.attackSpeed*100)}%`],['쿨감',`${Math.round(s.cooldown*100)}%`],['해골 위력',Math.round(s.summonPower*100)+'%']];
  $('#statGrid').innerHTML=data.map(([a,b])=>`<div class="stat-item"><span>${a}</span><b>${b}</b></div>`).join('');
  const counts=BRANCHES.map(b=>({name:b.name,n:state.tree.active.filter(id=>id.startsWith(b.id+'-')).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n).slice(0,4);$('#buildTags').innerHTML=counts.length?counts.map(x=>`<span class="tag">${x.name} ${x.n}</span>`).join(''):'<span class="tag">아직 방향 없음</span>';
}
function renderTree(){
  const svg=$('#treeSvg');if(!svg)return;
  let defs=`<defs><linearGradient id="activeGradient"><stop offset="0" stop-color="#9cff57"/><stop offset="1" stop-color="#6de7ff"/></linearGradient></defs>`;let lines='';let circles='';
  nodes.forEach(n=>{
    if(n.start)return;
    n.parents.forEach(pid=>{const p=nodes.find(x=>x.id===pid);if(!p)return;const active=state.tree.active.includes(n.id)&&state.tree.active.includes(pid);lines+=`<line class="tree-line ${active?'active':''}" x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}"/>`;});
  });
  nodes.forEach(n=>{
    const active=state.tree.active.includes(n.id),parent=isParentActive(n),disc=isDiscovered(n),available=parent&&disc&&!active;const mystery=n.type==='secret'&&!disc;const cond=n.type==='conditional';
    const cls=['tree-node',n.type,active?'active':'',available?'available':'',!disc?'undiscovered':'',!parent?'locked':'',n.isKeystone?'keystone':'',n.start?'start':''].join(' ');
    const radius=n.start?38:n.isKeystone?32:n.isSkill?28:22;let label=n.start?'S':mystery?'?':n.isKeystone?'◆':BRANCHES.find(b=>b.id===n.branch)?.glyph||'·';
    circles+=`<g class="${cls}" data-node="${n.id}" transform="translate(${n.x} ${n.y})"><circle r="${radius}"/><text>${label}</text></g>`;
  });
  svg.innerHTML=defs+`<g id="treeWorld" transform="translate(${treeCamera.x} ${treeCamera.y}) scale(${treeCamera.zoom})">${lines}${circles}</g>`;
  $$('.tree-node').forEach(el=>el.addEventListener('click',ev=>{ev.stopPropagation();selectNode(el.dataset.node);}));
}
function selectNode(id){selectedNode=id;const n=nodes.find(x=>x.id===id);if(!n)return;const active=state.tree.active.includes(id),disc=isDiscovered(n),parent=isParentActive(n);let effectText=describeEffect(n);
  let cond='';if(n.type!=='normal'&&!disc){cond=n.type==='secret'?'<div class="node-condition">발견 조건: ???</div>':`<div class="node-condition">발견 조건: ${n.condition.label} ${fmt(state.records[n.condition.key]||0)} / ${fmt(n.condition.target)}</div>`;}
  else if(n.type!=='normal')cond=`<div class="node-condition">발견 완료 · ${n.condition.label} ${fmt(n.condition.target)}</div>`;
  const typeName=n.start?'기원':n.type==='normal'?'일반 노드':n.type==='conditional'?'조건부 노드':'비밀 노드';let reason=active?'이미 활성화됨':!parent?'연결된 이전 노드가 필요함':!disc?'아직 발견하지 못함':state.sp<n.cost?'SP가 부족함':'';
  $('#nodePanel').innerHTML=`<div class="node-detail"><span class="type">${typeName.toUpperCase()}</span><h3>${n.type==='secret'&&!disc?'???':n.name}</h3><p>${n.type==='secret'&&!disc?'조건을 만족하면 정체가 드러난다.':n.desc}</p><div class="node-effect">${n.type==='secret'&&!disc?'효과: ???':effectText}</div>${cond}<div class="node-cost"><span>투자 비용</span><b>${n.cost} SP</b></div>${n.start?'':`<button class="invest-btn" ${canInvest(n)?'':'disabled'} data-invest="${id}">${canInvest(n)?'노드 활성화':reason}</button>`}</div>`;
  $('[data-invest]')?.addEventListener('click',()=>investNode(id));
}
function describeEffect(n){
  const e=n.effect||{},out=[];if(e.unlockSkill)out.push(`액티브 스킬 [${SKILLS[e.unlockSkill].name}] 해금`);if(e.attackPct)out.push(`공격력 +${(e.attackPct*100).toFixed(1)}%`);if(e.hpPct)out.push(`최대 HP +${(e.hpPct*100).toFixed(1)}%`);if(e.defensePct)out.push(`방어력 +${(e.defensePct*100).toFixed(1)}%`);if(e.crit)out.push(`치명타 확률 +${(e.crit*100).toFixed(1)}%`);if(e.critDamage)out.push(`치명타 피해 +${(e.critDamage*100).toFixed(1)}%`);if(e.attackSpeed)out.push(`공격 속도 +${(e.attackSpeed*100).toFixed(1)}%`);if(e.skillPower)out.push(`스킬 위력 +${(e.skillPower*100).toFixed(1)}%`);if(e.summonPower)out.push(`소환수 위력 +${(e.summonPower*100).toFixed(1)}%`);if(e.cooldown)out.push(`재사용 대기시간 -${(e.cooldown*100).toFixed(1)}%`);if(e.healPower)out.push(`회복 효과 +${(e.healPower*100).toFixed(1)}%`);if(e.goldBonus)out.push(`골드 획득 +${(e.goldBonus*100).toFixed(1)}%`);if(e.xpBonus)out.push(`경험치 획득 +${(e.xpBonus*100).toFixed(1)}%`);if(e.luck)out.push(`드롭 확률 +${(e.luck*100).toFixed(1)}%`);if(e.block)out.push(`막기 확률 +${(e.block*100).toFixed(1)}%`);if(e.keystone)out.push(`<b>${KEYSTONES[n.branch].text}</b>`);return out.join('<br>')||'연결 경로 노드';
}
function renderInventory(){
  const names={weapon:'무기',armor:'방어구',accessory:'장신구'};$('#equipmentSlots').innerHTML=Object.entries(names).map(([slot,label])=>{const i=state.equipment[slot];return `<div class="equip-slot"><span>${label}</span>${i?`<b>${i.name}</b><small>${i.text}</small>`:'<b>비어 있음</b><small>전투에서 장비를 획득해.</small>'}</div>`}).join('');
  $('#inventoryList').innerHTML=state.inventory.length?state.inventory.map(i=>`<div class="item-card ${i.rarity}"><b>${i.name}</b><p>Lv.${i.level} · ${i.text}</p><button data-equip="${i.id}">장착</button></div>`).join(''):'<div class="node-empty"><span>◇</span><b>아직 장비가 없어</b><small>몬스터와 보스를 잡으면 장비가 떨어진다.</small></div>';
  $$('[data-equip]').forEach(b=>b.onclick=()=>equipItem(b.dataset.equip));
}
function renderRecords(){
  const r=state.records;const data=[['총 처치',fmt(r.kills)],['보스 처치',fmt(r.bossKills)],['치명타',fmt(r.crits)],['스킬 사용',fmt(r.skillCasts)],['획득 골드',fmt(r.goldEarned)],['최고 피해',fmt(r.highestHit)],['발견 비밀',fmt(r.secretsFound)],['사망',fmt(r.deaths)]];$('#recordStats').innerHTML=data.map(([a,b])=>`<div class="record-box"><span>${a}</span><b>${b}</b></div>`).join('');
  $('#discoveryList').innerHTML=state.discoveries.length?state.discoveries.slice(0,30).map(d=>`<div class="discovery"><b>${d.name}</b><span>${d.type==='secret'?'SECRET':'CONDITION'}</span></div>`).join(''):'<div class="node-empty"><span>?</span><b>아직 발견 기록이 없어</b><small>싸우고, 스킬을 사용하고, 이상한 조건들을 만족해 봐.</small></div>';
}
function addLog(html,cls=''){const box=$('#combatLog');if(!box)return;box.insertAdjacentHTML('afterbegin',`<p class="${cls}">${html}</p>`);while(box.children.length>50)box.lastChild.remove();}
function floatDamage(n,crit=false,enemy=false){const layer=$('#damageFloatLayer');if(!layer)return;const el=document.createElement('span');el.className=`damage-float ${crit?'crit':''} ${enemy?'enemy':''}`;el.textContent=enemy?`-${fmt(n)}`:fmt(n);el.style.setProperty('--drift',`${rnd(-25,25)}px`);layer.appendChild(el);setTimeout(()=>el.remove(),850);}
function toast(title,text){const layer=$('#toastLayer');const el=document.createElement('div');el.className='toast';el.innerHTML=`<b>${title}</b><span>${text}</span>`;layer.appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(8px)';setTimeout(()=>el.remove(),250)},2800);}

function switchTab(name){$$('.tab').forEach(t=>t.classList.toggle('active',t.id===`tab-${name}`));$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));$('#sidebar').classList.remove('open');if(name==='tree')setTimeout(()=>renderTree(),0);}
function setupEvents(){
  $$('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));$('#menuToggle').onclick=()=>$('#sidebar').classList.toggle('open');$('#battleBtn').onclick=startBattle;$('#saveBtn').onclick=()=>saveState(true);
  $('#resetBtn').onclick=()=>{if(confirm('진짜 전부 초기화할까? 스킬 트리, 레벨, 장비가 모두 사라져.')){localStorage.removeItem(SAVE_KEY);location.reload();}};
  $('#zoomIn').onclick=()=>{treeCamera.zoom=clamp(treeCamera.zoom*1.16,.35,2.4);renderTree();};$('#zoomOut').onclick=()=>{treeCamera.zoom=clamp(treeCamera.zoom/1.16,.35,2.4);renderTree();};$('#centerTree').onclick=()=>{treeCamera={...treeCamera,x:0,y:0,zoom:.86};renderTree();};
  const vp=$('#treeViewport');
  vp.addEventListener('wheel',e=>{e.preventDefault();treeCamera.zoom=clamp(treeCamera.zoom*(e.deltaY<0?1.1:.9),.35,2.4);renderTree();},{passive:false});
  vp.addEventListener('pointerdown',e=>{treeCamera.drag=true;treeCamera.lastX=e.clientX;treeCamera.lastY=e.clientY;vp.setPointerCapture(e.pointerId)});
  vp.addEventListener('pointermove',e=>{if(!treeCamera.drag)return;const scale=2400/vp.clientWidth/treeCamera.zoom;treeCamera.x+=(e.clientX-treeCamera.lastX)*scale;treeCamera.y+=(e.clientY-treeCamera.lastY)*scale;treeCamera.lastX=e.clientX;treeCamera.lastY=e.clientY;const world=$('#treeWorld');if(world)world.setAttribute('transform',`translate(${treeCamera.x} ${treeCamera.y}) scale(${treeCamera.zoom})`);});
  vp.addEventListener('pointerup',()=>treeCamera.drag=false);vp.addEventListener('pointercancel',()=>treeCamera.drag=false);
  window.addEventListener('keydown',e=>{const sk=Object.keys(SKILLS).find(id=>SKILLS[id].key===e.key&&state.unlockedSkills.includes(id));if(sk)useSkill(sk);});
  window.addEventListener('beforeunload',()=>saveState());setInterval(()=>saveState(),15000);
}

function mainLoop(t){battleTick(t);requestAnimationFrame(mainLoop);}
checkDiscoveries();setupEvents();state.hp=Math.min(state.hp||getStats().maxHp,getStats().maxHp);renderAll();addLog('성장 기록이 시작됐다. 스킬 트리가 널 기다린다.');requestAnimationFrame(mainLoop);
