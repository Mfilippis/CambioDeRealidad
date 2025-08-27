// ==== TuNuevaNarrativa – assets/app.js ====

const routes = {
  'inicio': 'partials/inicio.html',
  'quienes-somos': 'partials/quienes-somos.html',
  'historias': 'partials/historias.html',
  'recursos': 'partials/recursos.html',
  'conta-tu-historia': 'partials/conta-tu-historia.html'
};

function setActive(view){
  document.querySelectorAll('header nav a').forEach(a => {
    const active = a.getAttribute('href') === '#/' + view;
    a.classList.toggle('active', active);
    if(active){ a.setAttribute('aria-current','page'); } else { a.removeAttribute('aria-current'); }
  });
}

function initTicker(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  const ticker = document.querySelector('.ticker');
  if(!ticker) return;
  let x = 0;
  function step(){
    x -= 0.5;
    ticker.style.transform = `translateX(${x}px)`;
    if(Math.abs(x) > ticker.scrollWidth / 2){ x = 0; }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// --- Formulario (ahora permite historias o recomendaciones) ---
function initStoryForm(){
  const form = document.getElementById('storyForm');
  if(!form || form.dataset.bound) return;
  form.dataset.bound = '1';

  const ok = document.getElementById('msgOk');
  const err = document.getElementById('msgErr');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(err) err.style.display = 'none';
    if(ok) ok.style.display = 'none';

    const data = Object.fromEntries(new FormData(form).entries());
    const texto = (data.historia || '').trim();
    if(texto.length < 30){
      if(err){ err.textContent = 'Por favor escribí al menos 30 caracteres.'; err.style.display = 'block'; }
      return;
    }

    // backup local
    try{
      const historias = JSON.parse(localStorage.getItem('tnn_historias') || '[]');
      historias.push({ ...data, fecha: new Date().toISOString() });
      localStorage.setItem('tnn_historias', JSON.stringify(historias));
    }catch(_){}

    // Formspree
    const endpoint = form.dataset.endpoint;
    if(endpoint){
      try{
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: data.nombre || '',
            email: data.email || '',
            tipo: data.tipo || 'Historia',
            link: data.link || '',
            historia: data.historia || '',
            _subject: 'Nuevo envío (Historia o Recomendación) — TuNuevaNarrativa'
          })
        });
        if(res.ok){
          if(ok){ ok.textContent = '¡Gracias! Lo recibí por email y quedó guardado.'; ok.style.display = 'block'; }
          form.reset();
          return;
        }else{
          const j = await res.json().catch(()=>({}));
          throw new Error(j.error || 'No se pudo enviar el formulario.');
        }
      }catch(e){
        if(err){ err.textContent = 'No pude enviar por email ahora, pero quedó guardado localmente. Probá de nuevo en unos minutos.'; err.style.display = 'block'; }
        return;
      }
    }else{
      if(ok){ ok.textContent = '¡Gracias por compartir!'; ok.style.display = 'block'; }
      form.reset();
    }
  });
}

// --- Títulos reales de YouTube vía oEmbed ---
async function initYouTubeTitles(){
  const cards = document.querySelectorAll('.yt-card[data-yt]');
  if(!cards.length) return;

  for (const card of cards) {
    const url = card.getAttribute('data-yt');
    const titleEl = card.querySelector('.yt-title');
    if(!url || !titleEl) continue;
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (!res.ok) throw new Error('oembed error');
      const data = await res.json();
      titleEl.textContent = data.title || 'Ver en YouTube';
    } catch (_e) {
      titleEl.textContent = 'Ver en YouTube';
    }
  }
}

// --- Mostrar solo N y expandir con "Ver más" ---
function initCollapsers(){
  // para cada grid con data-limit
  document.querySelectorAll('[data-limit]').forEach(box=>{
    const limit = parseInt(box.dataset.limit || '6', 10);
    const items = Array.from(box.children);
    if(items.length <= limit) return;

    items.slice(limit).forEach(el => el.classList.add('is-hidden'));

    // botón "Ver más" asociado (lo busco cerca)
    let btn = box.parentElement.querySelector('.btn-more');
    if(!btn){
      btn = document.createElement('button');
      btn.className = 'btn btn-outline btn-more';
      btn.type = 'button';
      btn.textContent = 'Ver más';
      const holder = document.createElement('div');
      holder.className = 'section-actions';
      holder.appendChild(btn);
      box.parentElement.appendChild(holder);
    }
    btn.style.display = 'inline-flex';

    let expanded = false;
    btn.addEventListener('click', ()=>{
      expanded = !expanded;
      if(expanded){
        items.slice(limit).forEach(el => el.classList.remove('is-hidden'));
        btn.textContent = 'Ver menos';
      }else{
        items.slice(limit).forEach(el => el.classList.add('is-hidden'));
        btn.textContent = 'Ver más';
        window.scrollBy({ top: -40, behavior: 'smooth' });
      }
    });
  });
}

async function render(){
  let view = (location.hash || '#/inicio').replace('#/','');
  if(!routes[view]) view = 'inicio';

  try{
    const res = await fetch(routes[view], { cache: 'no-cache' });
    const html = await res.text();
    const app = document.getElementById('app');
    app.innerHTML = html;
  }catch(e){
    document.getElementById('app').innerHTML = '<section class="container"><p>Ups, no pude cargar esta sección.</p></section>';
  }

  setActive(view);
  window.scrollTo(0,0);

  if(view === 'inicio') initTicker();
  if(view === 'conta-tu-historia') initStoryForm();
  if(view === 'recursos'){ initYouTubeTitles(); initCollapsers(); }

  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);


