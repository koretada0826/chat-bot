// 外部サイトに1行で貼る読み込みスクリプト（/widget.js）。
// 右下にボタンを出し、押すと /widget をiframeで開く。
const SCRIPT = `(function(){
  var s = document.currentScript;
  var project = s && s.getAttribute('data-project');
  var base = s && s.src ? new URL(s.src).origin : '';
  if(!project){ console.error('[AnswerOps] data-project がありません'); return; }

  var open = false;

  var btn = document.createElement('button');
  btn.setAttribute('aria-label','チャットを開く');
  btn.textContent = '💬';
  Object.assign(btn.style, {position:'fixed',right:'20px',bottom:'20px',width:'56px',height:'56px',borderRadius:'9999px',background:'#171717',color:'#fff',border:'none',cursor:'pointer',zIndex:2147483000,boxShadow:'0 4px 12px rgba(0,0,0,.2)',fontSize:'22px',lineHeight:'56px',textAlign:'center'});

  var frame = document.createElement('iframe');
  frame.src = base + '/widget?k=' + encodeURIComponent(project);
  frame.setAttribute('title','サポートチャット');
  Object.assign(frame.style, {position:'fixed',right:'20px',bottom:'88px',width:'400px',height:'620px',maxWidth:'calc(100vw - 40px)',maxHeight:'calc(100vh - 120px)',border:'none',borderRadius:'12px',zIndex:2147483000,boxShadow:'0 8px 30px rgba(0,0,0,.18)',display:'none',background:'transparent',colorScheme:'normal'});

  function toggle(){ open=!open; frame.style.display = open?'block':'none'; btn.textContent = open?'×':'💬'; }
  btn.addEventListener('click', toggle);

  function mount(){ document.body.appendChild(frame); document.body.appendChild(btn); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', mount); } else { mount(); }
})();`;

export async function GET() {
  return new Response(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
