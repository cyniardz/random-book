/* =========================================================
   Random Book
   1) 인트로  2) 히어로 판 4개  3) 레이어 화면  4) 예약  5) 메뉴
   ========================================================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 색별 내용: 이름은 화면에 쓰지 않고 색으로만 구별 */
const THEMES = [
  { id: 'kraft', panel: '#AB9477', split: '#9C8063', pages: '쪽수 무관', price: '₩3,000',
    title: '가방 속에 편하게 두고\n다니기 좋은\n\n소설 책',
    ko: '모서리가 닳고 표지가 조금 바랜 책이다. 그래서 오히려 아무 데서나 마음 편히 펼칠 수 있다. 출퇴근길이 조금 짧게 느껴질 거다.',
    en: 'A novel you can toss into any bag. The corners are worn and the cover has faded a little, which makes it easy to open anywhere. Your commute will feel a little shorter.' },
  { id: 'brick', panel: '#8F584B', split: '#7B4137', pages: '200쪽 이하', price: '₩6,000',
    title: '차 한 잔이 식기 전에\n끝나는\n\n소설 책',
    ko: '200페이지 안쪽으로, 앉은 자리에서 한 번에 다 읽을 수 있는 책이다. 커피보다는 차와 잘 어울리는 향의 종류들로 이루어진 책이다. 다 읽어갈 때 마시고 있는 차의 향이 더욱 진하게 느껴질 거다.',
    en: 'A novel you finish before your tea goes cold. Under 200 pages, made for one sitting. It suits tea better than coffee, and near the last page, the tea in your cup will taste a little deeper.' },
  { id: 'olive', panel: '#757252', split: '#615E3C', pages: '200 ~ 300쪽', price: '₩8,000',
    title: '비가 내리는 날\n카페에서 읽기 좋은\n\n소설 책',
    ko: '300페이지 안쪽으로, 비가 내리는 날 집중해서 읽기 좋은 책이다. 내용은 구체적으로 설명할 수 없지만, 다 읽게 된다면 당신은 아마 비 오는 날이 그리워질 거다.',
    en: "A novel for a rainy afternoon at a café. Under 300 pages, easy to sink into while it rains. We can't tell you much about it, but once you finish, you'll probably start missing rainy days." },
  { id: 'ink', panel: '#485363', split: '#323D4E', pages: '450쪽 이상', price: '₩10,000',
    title: '새로운 시작을 앞두고\n오래 곁에 두기 좋은\n\n소설 책',
    ko: '450페이지가 넘는, 한 계절 동안 붙잡고 읽을 책이다. 읽으면 읽을수록 빠져드는 몰입감과 상상력. 당신의 추리가 어디까지 닿을지 알아볼 수 있을 거다.',
    en: 'A long novel to keep close before a new beginning. Over 450 pages, enough for a whole season. The deeper you read, the further it pulls you in. Find out how far your guesses can reach.' },
];
const img = id => `assets/book-${id}.webp`;

/* ---------- 상태 저장 (새로고침해도 유지) ---------- */
const DEFAULT_ORDER = ['main', 'orange', 'pink', 'board'];
const store = {
  get(k, d) { try { const v = localStorage.getItem('bb-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('bb-' + k, JSON.stringify(v)); } catch (e) {} },
};
let view = store.get('view', 'hero');
let theme = store.get('theme', 1);
let order = DEFAULT_ORDER.slice();   // 새로고침하면 항상 메인이 앞
if (!Array.isArray(order) || order.length !== 4) order = DEFAULT_ORDER.slice();

/* =========================================================
   1) 인트로
   영상 원래 크기로 재생 → 3.3초에 멈추고 ONLY IN STORE → 퇴장
   → 빈 띠에서 영상을 웹이 그린 띠로 바꾼 뒤 확대 (화질 깨짐 방지)
   ========================================================= */
/* 처음 상태로 되돌리기: 4색 판 화면 + 메인이 맨 앞 + 맨 위 */
function resetToStart() {
  gliding = false; target = cur = 0;
  setOrder(DEFAULT_ORDER.slice());
  store.set('y', 0);
  showHero();
}
/* 로고: 나중에 오프닝 영상을 넣으면 영상의 맨 처음 상태부터 다시 재생 (지금은 영상이 없어 처음 화면으로만) */
function playOpening() { /* 오프닝 영상 자리 */ }
$('#logo').addEventListener('click', () => { resetToStart(); playOpening(); });

/* 커서: 판에 올리면 손가락 모양(누를 수 있다는 표시), 색은 그 판 책 표지색. 기준점은 검지 끝 */
const handCursor = c => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24'><path d='M9 1.8c-.9 0-1.6.7-1.6 1.6v8.6l-1.3-1.3c-.7-.7-1.8-.7-2.5 0-.6.6-.7 1.6-.1 2.3l4.4 5.9c1 1.3 2.4 2 4 2h3.3c2.7 0 4.8-2.2 4.8-4.8V11.6c0-.9-.7-1.6-1.6-1.6-.4 0-.8.2-1.1.4v-.2c0-.9-.7-1.6-1.6-1.6-.5 0-1 .2-1.3.6-.2-.7-.9-1.2-1.6-1.2-.5 0-.9.2-1.2.5V3.4c0-.9-.7-1.6-1.6-1.6z' fill='${c}' stroke='white' stroke-width='1.2' stroke-linejoin='round'/></svg>`
)}") 10 2, pointer`;
/* 뒤 레이어용 커서: 기본 화살표 모양, 색은 그 레이어 색. 기준점은 화살표 끝 */
const arrowCursor = c => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M3 2l15 11.5-6.6.9 3.8 7.4-2.7 1.3-3.8-7.5L3 20z' fill='${c}' stroke='white' stroke-width='1.3' stroke-linejoin='round'/></svg>`
)}") 3 2, default`;
/* =========================================================
   2) 첫 화면: 이미지 드러내기 → 스토리 → 책 4권
   - 스크롤(휠) 한 번 = 한 칸. 화면은 움직이지 않고 가운데 장면만 바뀜
   - 이미지 한 장: 아래에서 9칸에 걸쳐 드러남(처음엔 노출·대비가 세다가 원본으로)
                  → 8칸에 걸쳐 조금씩 작아짐 → 다음 이미지가 같은 크기로 올라옴
   - 마지막 이미지(스토리 액자) → 양옆 글 → 화면 가득 확대 → 책 한 권이 네 권으로 펼쳐짐
   - 이미지 크기·비율은 모두 같음(약 9:10, 드러날 때 1.5배에서 줄어듦). 임시 이미지는 index.html의 .rv-art 안을 실제 <img>로 바꾸면 됨
   ========================================================= */
const REVEAL = 9, SHRINK = 8, SHRINK_TO = .86;   // 드러내기 9칸, 작아지기 8칸
const ZOOM_FROM = 1.5;   // 드러나는 9칸 동안 이 배율에서 원래 크기(1)로 줄어듦
const reveal = $('#reveal'), rvSlides = $$('.rv-slide', reveal);
const N_IMG = rvSlides.length;
const S_LAST = (N_IMG - 1) * (REVEAL + SHRINK) + REVEAL;   // 마지막 이미지가 다 드러난 칸
const S_SIDES = S_LAST + 1, S_FULL = S_LAST + 2, S_PICK = S_FULL, S_TOTAL = S_PICK;   // 확대 = 책 4권: 배경이 넓어지면서 바로 책이 올라옴 (책 한 권만 있는 확대 화면은 건너뜀)
let rvStep = 0, rvTarget = 0, rvState = 0;   // rvStep: 지금 보이는 위치(소수, 미끄러지듯 따라감) / rvTarget: 휠이 가리키는 목표 / rvState: 단계(양옆 글·확대·책4권) 판정용
const picksEl = $('#picks'), pickCols = $$('.pick', picksEl);

function renderReveal() {
  const s = rvStep;
  rvSlides.forEach((el, i) => {
    const start = i * (REVEAL + SHRINK);
    const k = clamp(s - start, 0, REVEAL);                       // 드러난 칸 수 (소수: 칸 사이도 부드럽게)
    const j = i < N_IMG - 1 ? clamp(s - start - REVEAL, 0, SHRINK) : 0;   // 작아진 칸 수
    const t = clamp((k - 1) / (REVEAL - 1)) * (+el.dataset.end || 1);   // 0(처음) → 1(원본). data-end가 있으면 그만큼 거친 상태에서 멈춤
    el.style.setProperty('--cut', ((1 - k / REVEAL) * 100).toFixed(2) + '%');
    el.style.setProperty('--p', (k / REVEAL).toFixed(3));   // 드러난 정도 0→1 (CSS 색 변화용)
    el.style.setProperty('--sc', (lerp(ZOOM_FROM, 1, k / REVEAL) * (1 - (1 - SHRINK_TO) * j / SHRINK)).toFixed(4));
    // 드러난 부분은 하나의 이미지: 처음엔 노출·대비가 세고 입자가 거칠다가, 다 드러날수록 원본으로
    el.style.setProperty('--br', lerp(1.9, 1, t).toFixed(3));
    el.style.setProperty('--ct', lerp(2.2, 1, t).toFixed(3));
    el.style.setProperty('--sat', lerp(.25, 1, t).toFixed(3));
    el.style.setProperty('--gr', ((1 - t) * .9 * +(el.dataset.grain ?? 1)).toFixed(3));   // data-grain: 입자 세기 배율
    el.classList.toggle('in', k > 0);
  });
  reveal.classList.toggle('started', s > .05);
  $('#rvBar').style.transform = `scaleY(${(s / S_TOTAL).toFixed(4)})`;
  // 양옆 글 → 확대 → 책 4권: 이 셋은 칸을 넘는 순간 정해진 애니메이션으로 바뀜
  const st = s >= S_PICK - .5 ? 3 : s >= S_FULL - .5 ? 2 : s >= S_SIDES - .5 ? 1 : 0;
  if (st !== rvState) {
    const prev = rvState; rvState = st; rvStateAt = performance.now();
    // 양옆 글·확대 화면에 들어오면: 밀려 있던 스크롤은 버리고, 화면이 다 그려질 때까지 아래로 못 내림
    if (st > prev && (st === 1 || st === 2)) {
      rvTarget = Math.min(rvTarget, (st === 1 ? S_FULL : S_PICK) - .51);
      rvLockUntil = rvStateAt + SETTLE_MS[st];
    }
    reveal.classList.toggle('sides', st === 1 || st === 2);
    reveal.classList.toggle('full', st >= 2);
    reveal.classList.toggle('picking', st === 3);
    if (st === 3) openPicks(prev >= 1);   // 양옆 글 화면에서 내려왔으면 책이 아래에서 올라옴
    if (prev === 3) closePicks();
  }
}
/* 미끄러지듯: 휠은 목표(rvTarget)만 옮기고, 보이는 위치(rvStep)는 매 프레임 목표를 따라감 */
function stepTo(n) {
  n = clamp(n, 0, S_TOTAL);
  if (n > rvTarget && performance.now() < rvLockUntil) return;   // 화면이 완성되기 전엔 아래로 가는 입력 무시
  // 확대된 화면에 머물러 있다가 아래로 내리면: 그 순간부터 0.5초 뒤에 책이 펼쳐짐
  if (rvState === 2 && rvTarget <= S_PICK - .51 && n > S_PICK - .51) rvStateAt = performance.now();
  rvTarget = n;
}
function jumpTo(n) { rvTarget = rvStep = clamp(n, 0, S_TOTAL); renderReveal(); }   // 건너뛰기·처음으로: 중간 장면 없이 바로
// 양옆 글·확대 화면에 들어오면 0.5초 머문 뒤에야 다음 단계로 (휠 입력은 버리지 않고 기다렸다 이어감)
const HOLD_MS = 500;
let rvStateAt = 0, rvLockUntil = 0;
const SETTLE_MS = { 1: 600, 2: 900 };   // 양옆 칸 퍼짐(.st-left translate .6s) · 확대(.rv-slide inset .9s)가 끝나는 시간 — CSS를 바꾸면 같이
function heroGlide(dt) {
  let goal = rvTarget;
  if ((rvState === 1 || rvState === 2) && performance.now() - rvStateAt < HOLD_MS)
    goal = Math.min(goal, (rvState === 1 ? S_FULL : S_PICK) - .51);
  const d = goal - rvStep;
  if (Math.abs(d) < .001) { if (rvStep !== goal) { rvStep = goal; renderReveal(); } return; }
  rvStep += d * Math.min(1, dt * 6);
  if (rvState < 3) rvStep = Math.min(rvStep, [S_SIDES, S_FULL, S_PICK][rvState] + .49);   // 한 프레임에 한 단계만: 빨리 내려도 양옆 글 화면을 건너뛰지 않게
  renderReveal();
}

/* 책 네 권: 스토리 화면의 책 자리에서 각 칸 가운데로 펼쳐짐 (건너뛰기로 바로 왔으면 하나씩 뿅) */
function openPicks(fromStory) {
  pickCols.forEach(c => c.classList.remove('on'));
  pickCols.forEach((c, i) => {
    const b = $('.pk-book', c);
    b.getAnimations().forEach(a => a.cancel());
    if (reduce) return;
    if (fromStory) {   // 박스는 그대로, 뒤 장면이 내려가는 동안 책 4권은 박스 아래에서 위로 올라옴
      b.animate([{ transform: `translateY(${picksEl.clientHeight}px)` }, { transform: 'none' }],
        { duration: 1000, delay: 150 + i * 90, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    } else {
      b.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }],
        { duration: 520, delay: 200 + i * 140, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    }
  });
}
function closePicks() { pickCols.forEach(c => { c.classList.remove('on'); $('.pk-book', c).getAnimations().forEach(a => a.cancel()); }); }

/* 칸: 마우스를 올리면 그 책의 색만 돌아옴, 누르면 레이어로. 휴대폰은 한 번 누르면 색, 한 번 더 누르면 진입 */
pickCols.forEach((c, i) => {
  c.style.cursor = handCursor(THEMES[i].split);
  c.setAttribute('aria-label', `${THEMES[i].pages}, ${THEMES[i].price} 책 열어 보기`);
  c.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') c.classList.add('on'); });
  c.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') c.classList.remove('on'); });
  c.addEventListener('click', e => {
    if (rvStep < S_PICK) return;
    const touch = e.pointerType === 'touch' || (e.pointerType === undefined && matchMedia('(hover: none)').matches);
    if (touch && !c.classList.contains('on')) { pickCols.forEach(o => o.classList.toggle('on', o === c)); return; }
    enterLayers(i, c);
  });
});

/* 입력: 휠·키보드·터치를 한 칸씩으로 바꿈 (트랙패드처럼 잘게 오는 신호는 모아서, 너무 빨리 연달아 넘어가지 않게) */
const heroActive = () => view === 'hero' && $('#menu').hidden;
addEventListener('wheel', e => {
  if (!heroActive()) return;
  e.preventDefault();
  stepTo(rvTarget + e.deltaY * (e.deltaMode === 1 ? 40 : 1) / 100);   // 휠 한 칸(약 100) = 한 칸
}, { passive: false });
addEventListener('keydown', e => {
  if (!heroActive()) return;
  if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); stepTo(Math.round(rvTarget) + 1); }
  if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); stepTo(Math.round(rvTarget) - 1); }
  if (e.key === 'End') stepTo(S_TOTAL);
  if (e.key === 'Home') stepTo(0);
});
let tY = null;
reveal.addEventListener('touchstart', e => { tY = e.touches[0].clientY; }, { passive: true });
reveal.addEventListener('touchmove', e => {
  if (tY === null) return;
  const dy = tY - e.touches[0].clientY;
  stepTo(rvTarget + dy / 60); tY = e.touches[0].clientY;
}, { passive: true });
reveal.addEventListener('touchend', () => { tY = null; }, { passive: true });

/* 첫 화면에서는 위쪽 메뉴를 숨겨 두고, 마우스를 맨 위로 올리면 보임 */
addEventListener('pointermove', e => { document.body.classList.toggle('nav-peek', e.clientY < 96); }, { passive: true });

function drawEdges(dt) { heroGlide(dt); }   // 매 프레임(첫 화면일 때) 호출됨
renderReveal();

/* 판 클릭 → 판 색이 화면 전체로 펼쳐짐 → 색으로 가득 찬 화면에서 잠깐 머묾
   → 색이 다시 맨 앞 레이어(메인) 크기로 줄어들며 그 레이어에 겹쳐 사라짐, 그동안 뒤 레이어들이 살며시 나타남 */
const expand = $('#expand');
function enterLayers(i, panel, frontLayer) {
  setTheme(i);
  if (frontLayer) order = frontLayer === 'main' ? DEFAULT_ORDER.slice() : bringOrder(frontLayer);
  if (reduce || !panel) { showLayers(true); showLayerGuide(); return; }
  const r = panel.getBoundingClientRect();
  expand.style.background = THEMES[i].split;   // 화면이 표지색으로 가득 참 → 메인 첫 섹션 위쪽 색과 이어짐
  expand.style.visibility = 'visible';         // (예전엔 이 줄이 위 주석 안에 들어가 있어서 색이 펼쳐지는 장면이 안 보였음)
  const from = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)`;
  expand.animate([{ clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px)' }], { duration: 650, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' })
    .onfinish = () => setTimeout(() => {   // 색이 화면을 다 채운 상태로 0.35초 머문 뒤
      showLayers(true);                    // 레이어 화면은 색 뒤에서 미리 준비
      const front = sheets[order[0]], fr = front.getBoundingClientRect();
      const to = `inset(${Math.max(0, fr.top).toFixed(0)}px ${(innerWidth - fr.right).toFixed(0)}px 0px ${fr.left.toFixed(0)}px)`;
      // 뒤 레이어들: 색이 줄어드는 동안 아래에서 살짝 떠오르며 나타남 (한꺼번에 '땅' 나타나지 않게)
      order.slice(1).forEach((id, k) => sheets[id].animate([{ opacity: 0, translate: '0 60px' }, { opacity: 1, translate: '0 0' }],
        { duration: 800, delay: 250 + 130 * k, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
      // 색: 화면 전체 → 맨 앞 레이어 크기로 줄어듦 → 그 레이어 위에서 서서히 사라짐
      expand.animate([{ clipPath: 'inset(0px 0px 0px 0px)' }, { clipPath: to }], { duration: 800, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' })
        .onfinish = () => {
          expand.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease-out', fill: 'forwards' })
            .onfinish = () => { expand.style.visibility = 'hidden'; expand.getAnimations().forEach(a => a.cancel()); showLayerGuide(); };   // 진입 전환이 끝난 직후: 처음 한 번만 안내
        };
    }, 350);
}
function showHero(save = true, at = 0) {   // at: 첫 화면의 몇 번째 칸에서 시작할지 (0 = 맨 처음, S_TOTAL = 책 4권)
  $('#nav').classList.remove('scrolled');
  jumpTo(at);
  view = 'hero'; if (save) store.set('view', view); updateTabs();
  document.body.classList.replace('view-layers', 'view-hero');
  scrollTo(0, 0);
  $$('.sheet-orange .credit, .sheet-orange .steps').forEach(el => el.classList.remove('drawn'));   // 첫 화면을 다녀오면 밑줄들은 다시 그어질 준비
}
function showLayers(toTop) {
  view = 'layers'; store.set('view', view); updateTabs();
  document.body.classList.replace('view-hero', 'view-layers');
  measure();
  gliding = false;
  if (toTop) { scrollTo(0, 0); sp = 0; target = cur = 0; store.set('y', 0); if (order[0] !== 'main') toLayerStart(order[0]); } else restoreY();
}

/* =========================================================
   3) 레이어 화면: 아래로 길게 이어지는 한 페이지
   - 레이어는 크기(너비)가 같고 놓인 위치만 다름. 각자 내용 길이만큼 길다
   - 페이지를 내리면 메인 레이어는 그대로 따라 올라가고(기준),
     다른 레이어는 더 느리게 올라가서 모든 레이어의 끝이 같은 순간 화면 아래에 닿음
   ========================================================= */
const stage = $('#stage'), stack = $('#stack');
const sheets = Object.fromEntries($$('.sheet').map(s => [s.dataset.layer, s]));
const fly = $('#fly'), flyImg = $('#flyImg'), noteRail = $('.note-rail');
const anchors = { land: $('#aLand'), cover: $('#aCover'), theme: $('#aTheme'), credit: $('#aCredit'), row: $('#aRow') };
const coverTitle = $('.sc-cover .press');
let geo = { end: 1, speed: {}, top: {}, a: {}, mainTop: 0 };

function slotPos(k) {
  const vw = innerWidth, narrow = vw < 820;
  // 맨 앞 레이어가 가장 위로 튀어나오고, 뒤로 갈수록 조금씩 아래
  // 가장 왼쪽 끝과 가장 오른쪽 끝의 여백이 같도록 좌우 대칭
  const sw = Math.min(1120, vw * .74);
  const D = narrow ? 12 : Math.max(0, (vw - sw) / 2 - vw * .07), vh = innerHeight;
  // 앞에서부터: 메인(가장 위) → 왼쪽 → 오른쪽 → 오른쪽 아래로 더 튀어나온 메모장
  // 왼쪽(머스타드)은 메인 밖으로 튀어나온 폭을 절반으로
  // 오른쪽 두 장(분홍·회색)은 같은 비율(R)로 왼쪽으로 당겨서 더 가림 → 오른쪽 배경이 더 보이게
  const R = .65;
  const base = narrow ? [[0, 72], [-D, 88], [D * .6, 102], [D, 116]] : [[0, 92], [-D * .5, 132], [Math.min(D, Math.max(D * .62, 150)) * R, 92 + vh * .2], [D * R, 92 + vh * .55]];
  const [x, y] = base[k]; return { x, y };
}
function setOrder(next) {
  order = next;
  order.forEach((id, k) => {
    const s = sheets[id], p = slotPos(DEFAULT_ORDER.indexOf(id));   // 자리는 레이어마다 고정, 앞뒤(겹침 순서)만 바뀜
    s.style.left = `calc(50% + ${p.x}px)`; s.style.top = p.y + 'px';
    s.style.zIndex = 40 - k * 10;
    s.classList.toggle('front', k === 0);
    s.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
  });
  $$('.nav-dot').forEach(d => { const on = d.dataset.go === order[0]; d.classList.toggle('on', on); d.setAttribute('aria-current', on ? 'true' : 'false'); });   // 네비 동그라미: 맨 앞 레이어 표시
  // 흰 메모 카드(RESERVE A VISIT): 순서가 바뀌어도 항상 메인 레이어 바로 뒤
  noteRail.style.zIndex = 40 - order.indexOf('main') * 10 - 5;
  fly.style.opacity = order[0] === 'main' ? 1 : 0;
}
// 겹침 순서: 고른 레이어가 맨 앞, 바로 뒤(2번째)는 항상 메인, 나머지는 기본 순서대로
// (예전엔 직전 맨 앞 레이어가 2번째로 가서, 서브 레이어끼리 옮겨 다니면 순서가 뒤죽박죽이 됐음)
function bringOrder(id) {
  if (id === 'main') return DEFAULT_ORDER.slice();
  return [id, 'main', ...DEFAULT_ORDER.filter(x => x !== id && x !== 'main')];
}
/* 레이어 바꾸기: 위로 휙 → 순서 바뀜 → 다시 내려옴 (1초 이내). 스크롤 위치는 그대로 */
let swapping = false, swapGuard = 0;
// 바꾸기 애니메이션을 깨끗이 끝냄: 위로 올라간 채 남아 있지 않도록 항상 제자리로
function endSwap() {
  clearTimeout(swapGuard);
  [stack, fly].forEach(el => el.getAnimations().forEach(a => a.cancel()));
  swapping = false;
  measure();   // 바꾸는 중엔 판이 위로 30vh 올라가 있어 책 자리를 잘못 잼 → 제자리로 온 뒤 다시 잼
}
function swapTo(next, after) {
  if (swapping) return; swapping = true;
  const els = [stack, fly];
  // 안전장치: 중간에 오류가 나거나 애니메이션이 끊겨도 1.5초 뒤엔 무조건 제자리 + 다시 바꿀 수 있게
  swapGuard = setTimeout(endSwap, 1500);
  const up = els.map(el => el.animate([{ translate: '0 0' }, { translate: '0 -30vh' }], { duration: 360, easing: 'cubic-bezier(.6,0,.9,.4)', fill: 'forwards' }));
  up[0].onfinish = () => {
    try {
      setOrder(next); if (after) after(); measure();
      // 서브 레이어가 맨 앞으로 오면 그 레이어의 시작(윗부분)부터: 메인 처음 화면처럼 화면 위에서 92px 아래에 오는 스크롤 위치로
      // (레이어가 위로 올라가 있는 동안 옮겨서 튀는 게 안 보임)
      if (next[0] !== 'main') toLayerStart(next[0]);
    }
    catch (err) { console.error(err); }   // 오류가 나도 아래로 내려오는 단계는 반드시 실행
    const down = els.map(el => el.animate([{ translate: '0 -30vh' }, { translate: '0 0' }], { duration: 480, easing: 'cubic-bezier(.15,.7,.2,1)' }));
    up[0].oncancel = null; up.forEach(a => a.cancel());   // 올라간 애니메이션을 남겨 두면 크롬이 '대체됨'으로 숨긴 채 -30vh를 계속 적용 → 레이어가 위에 붙어 고정됨
    down[0].onfinish = endSwap;
  };
  up[0].oncancel = endSwap;
}
// 서브 레이어의 시작(윗부분)이 화면 위에서 92px 아래에 오는 스크롤 위치로
function toLayerStart(id) {
  const slotTop = stage.getBoundingClientRect().top + scrollY + slotPos(DEFAULT_ORDER.indexOf(id)).y;
  const y = clamp((slotTop - 92) / (geo.speed[id] || 1), 0, maxY());
  smoothTo(y); scrollTo(0, y); sp = y; placeLayers();
}
// 누른 레이어가 맨 앞으로. 이미 맨 앞이면 아무 일 없음 (다시 눌러 되돌리기 없음 — 메인으로 가려면 메인을 누름)
function toggleLayer(id) {
  if (order[0] === id) return;
  swapTo(bringOrder(id));
}
Object.values(sheets).forEach(s => {
  s.addEventListener('click', e => {
    if (!s.classList.contains('front')) { e.preventDefault(); toggleLayer(s.dataset.layer); }   // 뒤에 있는 레이어는 누르면 맨 앞으로
  });
  // 뒤 레이어에 올리면 그 레이어 색의 화살표 커서 (메인은 탭의 표지색, 나머지는 종이색)
  s.addEventListener('pointerenter', () => {
    if (s.classList.contains('front')) { s.style.cursor = ''; return; }
    const c = getComputedStyle(s.dataset.layer === 'main' ? $('.tab', s) : s).backgroundColor;
    s.style.cursor = arrowCursor(c);
  });
});
/* 메모 카드 → 방문 안내 입장권이 메인 앞으로 나옴 (푸터 위 입장권을 복사해서 띄움)
   떠 있는 동안은 입장권 안에서만 스크롤 (스크롤바는 안 보임)
   바깥(어두운 곳)·닫기 버튼·Esc로 닫힘 → 원래 페이지 스크롤로 */
const ticketPop = $('#ticketPop'), tpScroll = $('#tpScroll'), tpSlot = $('#tpSlot');
let tpTimer = 0, tpReturn = null;
function openTicket() {
  if (!tpSlot.firstElementChild) tpSlot.appendChild($('#ticketTpl').content.cloneNode(true));
  clearTimeout(tpTimer);
  tpReturn = document.activeElement;
  ticketPop.hidden = false; tpScroll.scrollTop = 0;
  requestAnimationFrame(() => requestAnimationFrame(() => ticketPop.classList.add('on')));
  tpScroll.focus({ preventScroll: true });   // 키보드(↑↓·스페이스)로도 입장권 안이 스크롤되게
}
function closeTicket() {
  if (ticketPop.hidden) return;
  ticketPop.classList.remove('on');
  tpTimer = setTimeout(() => { ticketPop.hidden = true; }, 450);
  if (tpReturn) tpReturn.focus({ preventScroll: true });
}
$('#noteCard').addEventListener('click', e => { e.stopPropagation(); openTicket(); });
$('#tpClose').addEventListener('click', closeTicket);
tpScroll.addEventListener('click', e => { if (!e.target.closest('.ticket')) closeTicket(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeTicket(); });

/* 레이어 안내: 처음 한 번만 자동으로(레이어 진입 전환이 끝난 직후), 그 뒤엔 오른쪽 아래 "?"로 언제든
   넓은 화면: 화면이 어두워지고, 레이어 4장 옆(윗줄 높이)에 그 레이어 색의 포스트잇이 책갈피처럼 붙음
   휴대폰(820px 이하): 포스트잇 대신 화면 아래에 안내 목록
   첫 화면이 바뀌어도 레이어 진입이 끝난 뒤 showLayerGuide()만 부르면 됨 (본 적이 있으면 알아서 안 뜸) */
const GUIDE = [
  { id: 'main', name: 'Random Book', bg: 'var(--split)', fg: 'var(--light)', text: '고른 책 이야기. 아래로 내려 보세요.' },
  { id: 'orange', name: 'Wrapped by hand', bg: 'var(--wrap)', fg: 'var(--ink)', text: '포장 이야기. 뒤에 있는 종이는 누르면 앞으로 나오고, 윗줄을 다시 누르면 돌아가요.' },
  { id: 'pink', name: 'Reserve', bg: 'var(--pink)', fg: '#3a160c', text: '방문 예약은 여기서.' },
  { id: 'board', name: 'Bring a Book', bg: 'var(--board)', fg: 'var(--light)', text: '다 읽은 소설을 가져오면 사거나 기부받아요.' },
];
const lguide = $('#lguide'), lgNotes = $('#lgNotes');
const narrowMQ = matchMedia('(max-width: 820px)');
let lgOpen = false, lgTimer = 0, lgReturn = null, lgRaf = 0;
lgNotes.innerHTML = GUIDE.map((g, k) => `<p class="lg-note" data-g="${g.id}" style="--bg:${g.bg};--fg:${g.fg};--r:${[.8, -1, 1.2, -.7][k]}deg;transition-delay:${k * 60}ms">${g.text}</p>`).join('');
$('#lgList').innerHTML = GUIDE.map(g => `<li style="--c:${g.bg}"><b>${g.name}</b><span>${g.text}</span></li>`).join('');
const lgNote = Object.fromEntries($$('.lg-note', lgNotes).map(n => [n.dataset.g, n]));

function showLayerGuide({ force = false } = {}) {   // force: "?" 버튼 (본 적이 있어도 띄움)
  if (!force && store.get('guide', false)) return;
  if (view !== 'layers' || !ticketPop.hidden) return;
  if (!menu.hidden) { setTimeout(() => showLayerGuide({ force }), 400); return; }   // 메뉴가 닫히는 중이면 다 닫힌 뒤에
  store.set('guide', true);
  clearTimeout(lgTimer);
  lgReturn = document.activeElement;
  lgOpen = true; lguide.hidden = false; updateTabs();
  layoutGuide();
  requestAnimationFrame(() => requestAnimationFrame(() => lguide.classList.add('on')));
  lguide.focus({ preventScroll: true });
}
function hideLayerGuide() {
  if (!lgOpen) return;
  // 포스트잇 자리를 기억해 두었다가, 탭이 그 자리에서 줄어들며 레이어 옆으로 감
  const from = narrowMQ.matches ? null : Object.fromEntries(GUIDE.map(g => [g.id, lgNote[g.id].getBoundingClientRect()]));
  lgOpen = false; lguide.classList.remove('on');
  clearTimeout(lgTimer);
  if (from) lguide.classList.add('morph');
  if (reduce) lguide.hidden = true; else lgTimer = setTimeout(() => { lguide.hidden = true; lguide.classList.remove('morph'); }, 400);
  if (lgReturn) lgReturn.focus({ preventScroll: true });
  updateTabs(from);
}

/* 포스트잇 탭: 안내를 한 번 본 뒤 레이어 화면(넓은 화면)에서 항상 보임. 화면에 고정
   자리: 각 레이어의 맨 위(페이지 처음 위치) 높이, 레이어가 튀어나온 쪽 바깥에 딱 붙음 */
var lgTabs = $('#lgTabs');   // var: 이 줄보다 먼저 불릴 수 있는 updateTabs에서 안전하게 확인
lgTabs.innerHTML = GUIDE.map(g => `<button type="button" class="lg-tab" data-g="${g.id}" style="--bg:${g.bg};--fg:${g.fg}" aria-label="${g.name} 앞으로">${g.name}</button>`).join('');
var lgTab = Object.fromEntries($$('.lg-tab', lgTabs).map(t => [t.dataset.g, t]));
$$('.lg-tab', lgTabs).forEach(t => t.addEventListener('click', e => { e.stopPropagation(); toggleLayer(t.dataset.g); }));
function layoutTabs() {
  const stTop = stage.getBoundingClientRect().top + scrollY, mainLeft = sheets.main.getBoundingClientRect().left;
  GUIDE.forEach(g => {
    const t = lgTab[g.id], r = sheets[g.id].getBoundingClientRect(), left = r.left < mainLeft - 1;
    t.classList.toggle('from-left', left);
    t.style.top = (stTop + slotPos(DEFAULT_ORDER.indexOf(g.id)).y) + 'px';
    t.style.left = (left ? r.left - t.offsetWidth : r.right) + 'px';
  });
}
function updateTabs(from) {
  if (!lgTabs) return;
  const on = store.get('guide', false) && view === 'layers' && !lgOpen && !narrowMQ.matches;
  lgTabs.classList.toggle('on', on);
  if (!on) return;
  layoutTabs();
  if (!from || reduce) return;
  GUIDE.forEach((g, k) => {
    const t = lgTab[g.id], a = from[g.id], b = t.getBoundingClientRect();
    if (!a || !a.width) return;
    t.animate([
      { translate: `${a.left - b.left}px ${a.top - b.top}px`, width: a.width + 'px', height: a.height + 'px', color: 'transparent' },
      { translate: '0 0', width: b.width + 'px', height: b.height + 'px', color: 'transparent', offset: .75 },
      { translate: '0 0', width: b.width + 'px', height: b.height + 'px' }
    ], { duration: 650, delay: k * 50, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'backwards' });
  });
}
/* 포스트잇 자리: 각 레이어의 윗줄 높이에서, 그 레이어가 튀어나온 쪽 바깥에 책갈피처럼 붙음
   (메인보다 왼쪽에 놓인 레이어는 왼쪽, 나머지는 오른쪽 → 윗줄 글자를 가리지 않음)
   자리는 레이어마다 고정이라 겹침 순서가 바뀌어도 같은 곳. 스크롤로 윗줄이 화면 밖이면 화면 안쪽 끝에 붙어 있음 */
function layoutGuide() {
  if (!lgOpen || narrowMQ.matches) return;
  const W = innerWidth, H = innerHeight, top0 = $('#nav').offsetHeight + 8, mainLeft = sheets.main.getBoundingClientRect().left;
  const placed = [];
  GUIDE.map(g => ({ g, r: sheets[g.id].getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top).forEach(({ g, r }) => {
    const n = lgNote[g.id], left = r.left < mainLeft - 1;
    const room = left ? r.left - 12 : W - r.right - 12;   // 레이어 옆 빈 곳 너비
    n.style.width = clamp(room, 130, 210) + 'px';
    const w = n.offsetWidth, h = n.offsetHeight;
    const x = left ? Math.max(12, r.left - w) : Math.min(W - 12 - w, r.right);
    let y = clamp(r.top, top0, H - 16 - h);
    placed.forEach(p => { if (x < p.x + p.w && p.x < x + w && y < p.y + p.h + 8 && p.y < y + h) y = p.y + p.h + 8; });   // 위 포스트잇과 겹치면 그 아래로
    placed.push({ x, y, w, h });
    n.classList.toggle('from-left', left);
    n.style.left = x + 'px'; n.style.top = y + 'px';
  });
}
$('#guideQ').addEventListener('click', () => showLayerGuide({ force: true }));
lguide.addEventListener('click', hideLayerGuide);
addEventListener('keydown', e => { if (e.key === 'Escape') hideLayerGuide(); });
const relayoutGuide = () => { if (!lgOpen) return; cancelAnimationFrame(lgRaf); lgRaf = requestAnimationFrame(layoutGuide); };
addEventListener('resize', relayoutGuide);
addEventListener('resize', () => updateTabs());
addEventListener('scroll', relayoutGuide, { passive: true });
narrowMQ.addEventListener('change', relayoutGuide);
narrowMQ.addEventListener('change', () => updateTabs());
/* 회색(헌책) 레이어 책등 띠: 두께·높이가 제각각인 책등, 가끔 비스듬히 기댄 책. 같은 세트를 두 번 이어 붙여 끝없이 흐르게 */
(function makeSpines() {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // 기울어진 책은 위 끝이 옆으로 밀려난 만큼(높이 × tan 각도) 그쪽에 여백을 더 줘서 이웃 책과 겹치지 않게
  const MAXH = 210;   // 책등 띠 안쪽 최대 높이(px) 기준으로 넉넉하게 계산
  let one = '';
  for (let i = 0; i < 26; i++) {
    const w = 30 + Math.round(rnd() * 34), h = 78 + Math.round(rnd() * 22);
    const lean = rnd() < .18 ? (rnd() < .5 ? -1 : 1) * (3 + rnd() * 4) : 0;   // 다섯 권 중 한 권쯤 기울어짐
    const push = Math.ceil(MAXH * h / 100 * Math.tan(Math.abs(lean) * Math.PI / 180)) + 2;
    const ml = lean < 0 ? push : 0, mr = 10 + (lean > 0 ? push : 0);
    const tone = Math.round(30 + rnd() * 22);   // 불투명한 색(배경 회색과 섞은 밝기) → 혹시 닿아도 비쳐 보이지 않음
    one += `<i style="width:${w}px;height:${h}%;rotate:${lean.toFixed(1)}deg;margin:0 ${mr}px 0 ${ml}px;background:color-mix(in srgb,#F1ECE2 ${tone}%,var(--board))"></i>`;
  }
  $('#spinesTrack').innerHTML = one + one;
})();

/* 분홍 레이어 위쪽 막대 3열 (길이 조금씩 다르게) */
(function () {
  const top = $('#pkTop'); const w = [96, 82, 70, 100, 88, 74, 100, 100, 100, 100, 100, 82];
  w.forEach(v => { const i = document.createElement('i'); i.style.width = v + '%'; top.appendChild(i); });
})();

/* 분홍 레이어 옆 막대: 길이가 들쭉날쭉한 막대 (스크롤할 때 그래프처럼 흘러 내려가는 느낌) */
(function makeBars() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const W = 300, STEP = 58, BAR = 36, N = 30;
  let r = '';
  for (let i = 0; i < N; i++) {
    const len = W * (.42 + rnd() * .58);
    const off = rnd() < .25 ? W * .08 * rnd() : 0;               // 가끔 살짝 안쪽에서 시작
    r += `<rect x='${off.toFixed(0)}' y='${i * STEP + 12}' width='${(len - off).toFixed(0)}' height='${BAR}' fill='%23D7714F'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${N * STEP}' viewBox='0 0 ${W} ${N * STEP}' preserveAspectRatio='none'>${r}</svg>`;
  sheets.pink.style.setProperty('--bars', `url("data:image/svg+xml;utf8,${svg}")`);
})();

$$('[data-front]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggleLayer(b.dataset.front); }));

/* 색 바꾸기 */
function setTheme(i) {
  theme = i; store.set('theme', i);
  const t = THEMES[i], root = document.documentElement.style;
  root.setProperty('--split', t.split); root.setProperty('--panel', t.panel);
  $('#tPages').textContent = t.pages; $('#tTitle').textContent = t.title;
  $('#tKo').textContent = t.ko; $('#tEn').textContent = t.en;
  $('#lPrice').textContent = t.price;
  flyImg.src = img(t.id);
  buildRow();
}
/* 책 4권 가로 배치: 두 번째 칸(#aRow)은 비워 두고 떠 있는 선택 책이 들어감, 나머지 칸은 다른 색 책 */
function buildRow() {
  const others = THEMES.filter((_, i) => i !== theme);
  $$('#rowBooks .rb').filter(el => el.id !== 'aRow').forEach((el, i) => {
    el.innerHTML = `<img src="${img(others[i].id)}" alt="">`;
  });
}

/* 크기 계산 (페이지 기준 좌표) */
function pageRect(el) {
  if (!el) return { cx: 0, cy: 0, h: 0, w: 0 };   // 자리 표시가 없어도 계산이 멈추지 않게
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + scrollY + r.height / 2, h: r.height, w: r.width };
}
function measure() {
  if (view !== 'layers') return;
  document.documentElement.style.setProperty('--vh', innerHeight + 'px');
  setOrder(order);
  Object.values(sheets).forEach(s => { s.style.transform = 'none'; s.style.transition = 'none'; });
  const tops = {}, hs = {};
  for (const id in sheets) { tops[id] = parseFloat(sheets[id].style.top); hs[id] = sheets[id].offsetHeight; }
  // 메인 레이어가 끝나는 스크롤 위치 = 기준
  const end = Math.max(1, tops.main + hs.main - innerHeight + 40);
  geo.end = end;
  for (const id in sheets) {
    // 각 레이어의 끝이 같은 순간(end) 화면 아래에 닿도록 하는 속도
    geo.speed[id] = id === 'main' ? 1 : clamp((tops[id] + hs[id] - innerHeight + 40) / end, 0.05, 1.3);
  }
  const sy = scrollY; 
  for (const k in anchors) geo.a[k] = pageRect(anchors[k]);
  stage.style.height = (tops.main + hs.main) + 'px';
  // 뒤 레이어: 각자 길이로 계산한 이동량을 스크롤에 직접 연결 (메인을 따라가지 않음)
  for (const id in sheets) {
    const s = sheets[id];
    s.style.setProperty('--lag', (end * (1 - geo.speed[id])).toFixed(1) + 'px');
    s.style.setProperty('--end', end.toFixed(0) + 'px');
  }
  placeLayers();
  requestAnimationFrame(() => Object.values(sheets).forEach(s => { s.style.transition = ''; }));
}
addEventListener('resize', () => { measure(); });

/* 보던 위치 기억: 새로고침하거나 로고로 나갔다 다시 들어와도 마지막 스크롤 위치에서 이어짐 */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
let saveT = 0;
addEventListener('scroll', () => {
  $('#nav').classList.toggle('scrolled', view === 'layers' && scrollY > 40);
  if (view !== 'layers') return;
  clearTimeout(saveT); saveT = setTimeout(() => store.set('y', Math.round(scrollY)), 120);
}, { passive: true });
function restoreY() {
  const y = store.get('y', 0);
  scrollTo(0, y); sp = y;
}

/* 매 프레임: 레이어별 속도, 책 위치, 갤러리 */
/* 브라우저가 스크롤 연동 애니메이션을 지원하면 CSS가 처리(가장 부드러움), 아니면 스크롤할 때마다 직접 계산 */
const cssScroll = window.CSS && CSS.supports('animation-timeline: scroll()');
if (cssScroll) document.documentElement.classList.add('scroll-tl');
function placeLayers() {
  if (cssScroll || view !== 'layers') return;
  const y = Math.min(scrollY, geo.end);
  for (const id in sheets) {
    const lag = y * (1 - geo.speed[id]);
    sheets[id].style.transform = Math.abs(lag) > .1 ? `translate3d(0,${lag.toFixed(1)}px,0)` : '';
  }
}
addEventListener('scroll', placeLayers, { passive: true });

let sp = 0;
const snapState = { key: null };
const backOut = t => { const s = 1.6; t = t - 1; return t * t * ((s + 1) * t + s) + 1; };
function snap(cls) { fly.classList.remove('land', 'snap'); void fly.offsetWidth; fly.classList.add(cls); }
const wrapCredit = $('.sheet-orange .credit'), wrapSteps = $('.sheet-orange .steps');
const landMeta = $('.land-meta'), noteCard = $('#noteCard'), afterGap = $('#afterGap'), agBar = $('#agBar'), visitEl = $('#visit');
function drawLayers(dt) {
  sp = scrollY;

  // 책: 화면 가운데에 떠서 따라 내려오다가, 맞춰야 할 자리(끈 ↔ 경계선, 설명 옆 자리)가 가운데에 오면
  //      그 자리에 딱 붙어 페이지와 함께 잠깐 올라감(안착) → 다시 떨어져 가운데로 내려와 다음 자리로
  const A = geo.a; if (!A.land) return;
  const V = innerHeight, C = V / 2, HOLD = V * .28, BACK = V * .45;
  const twineOf = a => a.cy - a.h / 2 + a.h * .471;          // 각 자리에서 끈이 와야 할 높이(페이지 기준)
  // RANDOM BOOK 글자(잠깐만) → 경계선 → 테마 설명 → 크레딧 → 책 4권 줄의 두 번째 칸(마지막)
  const pts = [twineOf(A.cover), twineOf(A.land), twineOf(A.theme), twineOf(A.credit), twineOf(A.row)];
  const holds = [V * .16, HOLD, HOLD, HOLD, HOLD], backs = [V * .3, BACK, BACK, BACK, BACK];
  let y = C, k = 0;
  for (; k < pts.length; k++) {
    const s = pts[k] - sp, H = holds[k], B = backs[k];
    if (s > C) { y = C; break; }                             // 아직 도착 전: 가운데에서 기다림
    if (s > C - H || k === pts.length - 1) { y = s; break; } // 안착: 자리와 함께 움직임 (마지막은 그대로 떠나보냄)
    if (s > C - H - B) { y = C - H + H * smooth((C - H - s) / B); break; } // 다시 가운데로
  }
  // RANDOM BOOK 글자: 책이 다가오면 살짝 커지고, 붙어 있는 동안 유지, 떠나면 원래대로
  const sG = pts[0] - sp, HG = holds[0];
  const grow = sG > C ? 1 - smooth(clamp((sG - C) / (V * .3)))
             : sG > C - HG ? 1 : 1 - smooth(clamp((C - HG - sG) / (V * .3)));
  coverTitle.style.scale = (1 + .07 * grow).toFixed(4);
  // 크기·가로 위치 전환은 경계선에서 쉬고 난 뒤부터 테마 자리 도착 전까지
  const sC = pts[1] - sp, HC = holds[1];
  const tRaw = clamp((C - HC - sC) / ((pts[2] - pts[1] - HC) * .85));
  const tT = backOut(tRaw);
  // 크레딧 옆에서 쉬고 난 뒤부터 줄 칸 도착 전까지: 줄 칸 크기·가로 위치로
  const sCr = pts[3] - sp, HCr = holds[3];
  const rRaw = clamp((C - HCr - sCr) / ((pts[4] - pts[3] - HCr) * .85));
  const hB = lerp(lerp(A.land.h, A.theme.h, smooth(tRaw)), A.row.h, smooth(rRaw)), wB = hB * 737 / 1176;
  const x = lerp(lerp(A.land.cx, A.theme.cx, tT), A.row.cx, backOut(rRaw));
  fly.style.height = hB.toFixed(1) + 'px';
  fly.style.transform = `translate3d(${(x - wB / 2).toFixed(1)}px,${(y - hB * .471).toFixed(1)}px,0)`;
  const kk = Math.min(k, pts.length - 1), sNow = pts[kk] - sp, attached = sNow <= C + .5 && sNow > C - holds[kk];
  const near = attached ? 1 : 1 - smooth(clamp((sNow - C) / (V * .25)));
  fly.style.filter = `drop-shadow(${(18 - 12 * near).toFixed(1)}px ${(30 - 20 * near).toFixed(1)}px ${(28 - 18 * near).toFixed(1)}px rgba(30,20,10,${(.3 + .1 * near).toFixed(2)}))`;
  const hitKey = attached ? k : -1;
  if (hitKey !== snapState.key) { if (hitKey >= 0 && snapState.key !== null) snap('land'); snapState.key = hitKey; }
  const s1 = pts[1] - sp;
  landMeta.classList.toggle('show', s1 <= C + V * .12 && s1 > C - HOLD - BACK * .3);   // 책이 경계선에 닿기 조금 전부터 가격 표시

  // 레이어 끝: 레이어는 그냥 스크롤대로 올라가고, 그 바로 아래 흰 선이 왼쪽→오른쪽으로 그어짐 (레이어 끝이 화면 아래에서 .35장 올라오는 동안)
  //            → 그 아래 빈 배경에 푸터 글자가 올라옴 (덮는 면 없음)
  const g = afterGap.getBoundingClientRect().top;
  agBar.style.width = (clamp((V - g) / (V * .35)) * 100).toFixed(2) + '%';
  // 푸터 문구: 흰 선이 다 그어지는 순간 바로 쫙 올라옴 (선이 줄어들 만큼 위로 올리면 다시 숨음)
  const barDone = (V - g) / (V * .35);
  if (barDone >= 1) visitEl.classList.add('up');
  else if (barDone < .8) visitEl.classList.remove('up');

  // 포장 레이어 크레딧 밑줄: 포장 레이어가 맨 앞이고 크레딧이 화면 아래 20% 안쪽으로 들어오면 한 번 그어짐 (올려도 안 지워짐)
  // 단계 목록 선도 같은 규칙
  if (sheets.orange.classList.contains('front')) [wrapCredit, wrapSteps].forEach(el => {
    if (!el.classList.contains('drawn') && el.getBoundingClientRect().top < V * .8) el.classList.add('drawn');
  });

  // 메모 카드: 화면 아래(글자 반쯤 보임) → 레이어 끝에서 화면 위쪽(14%)
  const noteP = smooth(clamp(sp / geo.end));
  noteCard.style.top = lerp(V - 42, V * .14, noteP).toFixed(1) + 'px';
}


/* 맨 위로 */
// 맨 위로: 지금 앞에 있는 레이어 그대로 페이지 맨 위로 (책을 고른 직후 화면). 첫 화면으로는 돌아가지 않음
$('#toTop').addEventListener('click', () => {
  if (reduce) { smoothTo(0); scrollTo(0, 0); } else { cur = scrollY; target = 0; gliding = true; }
});

/* =========================================================
   4) 사전 예약 (시연용: 이 브라우저에만 저장)
   ========================================================= */
const DATES = [{ d: '11.14', w: '금' }, { d: '11.15', w: '토' }, { d: '11.16', w: '일' }];
const TIMES = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const CAP = 20;
let pick = { date: null, time: null };
function baseCount(di, ti) { const s = Math.sin((di + 1) * 12.9898 + (ti + 1) * 78.233) * 43758.5453; const r = s - Math.floor(s); return di === 1 && (ti === 3 || ti === 4) ? CAP : Math.floor(r * 19); }
function booked(di, ti) { const mine = store.get('rsv', []).filter(r => r.di === di && r.ti === ti).reduce((a, r) => a + r.people, 0); return baseCount(di, ti) + mine; }
function renderDates() {
  $('#dates').innerHTML = DATES.map((x, i) => `<button type="button" data-d="${i}" aria-pressed="${pick.date === i}"><b>${x.d}</b><small>${x.w}요일</small></button>`).join('');
  $$('#dates button').forEach(b => b.addEventListener('click', () => { pick.date = +b.dataset.d; pick.time = null; renderDates(); renderSlots(); }));
}
function renderSlots() {
  const box = $('#slots');
  if (pick.date === null) { box.innerHTML = ''; return; }
  box.innerHTML = TIMES.map((t, i) => {
    const n = booked(pick.date, i), left = CAP - n;
    return `<button type="button" data-t="${i}" class="${left <= 0 ? 'full' : ''}" aria-pressed="${pick.time === i}"><b>${t}</b><small>${left > 0 ? '예약 가능' : '마감 · 대기 접수'}</small></button>`;
  }).join('');
  $$('#slots button').forEach(b => b.addEventListener('click', () => { pick.time = +b.dataset.t; renderSlots(); }));
  $('#slotNote').textContent = '자리가 다 찬 회차는 대기 순번으로 접수됩니다.';
}
$('#rsvForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#rName').value.trim(), phone = $('#rPhone').value.trim(), people = +$('#rPeople').value;
  const err = $('#rErr');
  if (pick.date === null || pick.time === null) { err.textContent = '날짜와 시간을 골라 주세요.'; return; }
  if (!name) { err.textContent = '이름을 적어 주세요.'; return; }
  if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone)) { err.textContent = '연락처를 010-0000-0000 형식으로 적어 주세요.'; return; }
  if (!$('#rAgree').checked) { err.textContent = '개인정보 수집에 동의해 주세요.'; return; }
  err.textContent = '';
  const before = booked(pick.date, pick.time), wait = before + people > CAP ? before - CAP + 1 + (before < CAP ? 0 : 0) : 0;
  const list = store.get('rsv', []);
  const no = `BB-${DATES[pick.date].d.replace('.', '')}-${String(1000 + list.length + Math.floor(Math.random() * 900)).slice(-4)}`;
  list.push({ di: pick.date, ti: pick.time, people, no }); store.set('rsv', list);
  $('#rNo').textContent = no;
  $('#rSummary').innerHTML = `<dt>날짜</dt><dd>${DATES[pick.date].d} ${DATES[pick.date].w}요일</dd><dt>시간</dt><dd>${TIMES[pick.time]}</dd><dt>인원</dt><dd>${people}명</dd><dt>상태</dt><dd>${wait > 0 ? `대기 ${Math.max(1, wait)}번째` : '확정'}</dd>`;
  $('#rsvForm').hidden = true; $('#rDone').hidden = false; measure();
});
$('#rAgain').addEventListener('click', () => {
  pick = { date: null, time: null }; $('#rsvForm').reset(); renderDates(); renderSlots();
  $('#rsvForm').hidden = false; $('#rDone').hidden = true; measure();
});
renderDates();

/* =========================================================
   5) 메뉴
   ========================================================= */
const menu = $('#menu'), burger = $('#burger');
function openMenu() { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open')); burger.setAttribute('aria-expanded', 'true'); $('#menuClose').focus(); }
function closeMenu() { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); setTimeout(() => { menu.hidden = true; }, 700); burger.focus(); }
burger.addEventListener('click', openMenu);
$('#menuClose').addEventListener('click', closeMenu);
addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });
function go(where) {
  if (where === 'hero') { showHero(true, S_TOTAL); return; }   // 메뉴 Choose again: 책 4권 화면으로
  if (view !== 'layers') {
    if (where === 'visit') { setTheme(theme); showLayers(true); openTicket(); return; }
    enterLayers(theme, null, where); return;
  }
  if (where === 'visit') { openTicket(); return; }   // 방문 안내 = 메모 카드와 같은 입장권 팝업
  if (order[0] !== where) swapTo(bringOrder(where));
}
$$('.menu [data-go]').forEach(b => b.addEventListener('click', () => { closeMenu(); setTimeout(() => go(b.dataset.go), 300); }));
$$('.nav-dot').forEach(d => d.addEventListener('click', () => go(d.dataset.go)));   // 휴대폰 네비 동그라미: 메뉴와 같은 레이어 바꾸기

/* =========================================================
   시작
   ========================================================= */
/* 미끄러지듯 스크롤: 휠 입력을 목표 위치로 모아 두고 매 프레임 조금씩 따라감 (레이어 화면에서만) */
let target = scrollY, cur = scrollY, gliding = false;
function maxY() { return document.documentElement.scrollHeight - innerHeight; }
function smoothTo(y) { target = cur = y; gliding = false; }
addEventListener('wheel', e => {
  if (lgOpen) { e.preventDefault(); return; }   // 레이어 안내가 떠 있는 동안은 뒤 페이지 고정
  // 입장권이 떠 있을 땐 입장권 안에서만 스크롤 (뒤 페이지는 고정)
  if (!ticketPop.hidden) { if (tpScroll.scrollHeight <= tpScroll.clientHeight + 1) e.preventDefault(); return; }
  if (view !== 'layers' || reduce || e.ctrlKey || swapping || !$('#menu').hidden) return;
  e.preventDefault();
  if (!gliding) { cur = scrollY; target = scrollY; }
  target = clamp(target + e.deltaY * (e.deltaMode === 1 ? 40 : 1), 0, maxY());
  gliding = true;
}, { passive: false });
addEventListener('scroll', () => {
  // 휠이 아닌 다른 방법(키보드, 스크롤바, 메뉴 이동)으로 움직였으면 미끄러짐을 멈추고 그 위치를 따름
  if (!gliding || Math.abs(scrollY - cur) > 3) { gliding = false; target = cur = scrollY; }
}, { passive: true });
function glide(dt) {
  if (!gliding) return;
  cur += (target - cur) * Math.min(1, dt * 7);
  if (Math.abs(target - cur) < .5) { cur = target; gliding = false; }
  scrollTo(0, cur);
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);   // 먼저 다음 프레임을 예약: 아래에서 오류가 나도 반복이 멈추지 않음 (멈추면 휠 스크롤이 막혀 화면이 고정됨)
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  try { if (view === 'hero') drawEdges(dt); else { glide(dt); drawLayers(dt); } }
  catch (err) { if (!frame.warned) { frame.warned = true; console.error(err); } }
}
setTheme(theme);
if (view === 'layers') { document.body.classList.replace('view-hero', 'view-layers'); }
setOrder(order);
addEventListener('load', () => { measure(); if (view === 'layers') restoreY(); });
// 글꼴이 늦게 도착하면 레이어 길이가 바뀜 → 새로고침 직후 길이 계산이 어긋나지 않게 한 번 더 계산
if (document.fonts) document.fonts.ready.then(() => { measure(); });
if (document.fonts) document.fonts.ready.then(measure);
measure();
if (view === 'layers') restoreY();
requestAnimationFrame(frame);
