// ==== TuNuevaNarrativa – assets/app.js ====
// Router muy simple que carga parciales HTML según el hash de la URL.

const routes = {
  'inicio': 'partials/inicio.html',
  'quienes-somos': 'partials/quienes-somos.html',
  'historias': 'partials/historias.html',
  'recursos': 'partials/recursos.html',
  'conta-tu-historia': 'partials/conta-tu-historia.html'
};

// Marca el link activo en la barra de navegación
function setActive(view){
  document.querySelectorAll('header nav a').forEach(a => {
    const active = a.getAttribute('href') === '#/' + view;
    a.classList.toggle('active', active);
    if(active){ a.setAttribute('aria-current','page'); } else { a.removeAttribute('aria-current'); }
  });
}

// Animación suave del ticker del hero (respeta reduce motion)
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

// Manejo del formulario de "Contá tu historia"
// - Validación mínima
// - Guardado local (localStorage) como respaldo
// - Envío a Formspree si existe data-endpoint en el <form>
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

    // 1) Guardado local como backup
    try{
      const historias = JSON.parse(localStorage.getItem('tnn_historias') || '[]');
      historias.push({ ...data, fecha: new Date().toISOString() });
      localStorage.setItem('tnn_historias', JSON.stringify(historias));
    }catch(_){ /* sin drama si falla */ }

    // 2) Envío a Formspree (si hay endpoint)
    const endpoint = form.dataset.endpoint;
    if(endpoint){
      try{
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: data.nombre || '',
            email: data.email || '',
            historia: data.historia || '',
            _subject: 'Nueva historia desde TuNuevaNarrativa'
          })
        });
        if(res.ok){
          if(ok){ ok.textContent = '¡Gracias! Tu historia fue enviada y guardada.'; ok.style.display = 'block'; }
          form.reset();
          return;
        }else{
          const j = await res.json().catch(()=>({}));
          throw new Error(j.error || 'No se pudo enviar el formulario.');
        }
      }catch(e){
        if(err){ err.textContent = 'No pude enviar por email ahora, pero tu historia quedó guardada localmente. Probá nuevamente en unos minutos.'; err.style.display = 'block'; }
        return;
      }
    }else{
      if(ok){ ok.textContent = '¡Gracias por compartir! Tu historia quedó guardada (local).'; ok.style.display = 'block'; }
      form.reset();
    }
  });
}

// === Completa títulos con oEmbed de YouTube (sin API key) ===
// Busca tarjetas .yt-card con atributo data-yt="URL" y reemplaza el texto
// del elemento .yt-title con el título real devuelto por oEmbed.
async function initYouTubeTitles(){
  const cards = document.querySelectorAll('.yt-card[data-yt]');
  if(!cards.length) return;

  for (const card of cards) {
    const url = card.getAttribute('data-yt');
    const titleEl = card.querySelector('.yt-title');
    if(!url || !titleEl) continue;

    try {
      // Endpoint público de oEmbed (CORS habilitado)
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (!res.ok) throw new Error('oembed error');
      const data = await res.json();
      titleEl.textContent = data.title || 'Ver en YouTube';
      // Si quisieras usar el thumbnail de oEmbed en vez del de img.youtube.com:
      // const img = card.querySelector('.yt-thumb');
      // if (img && data.thumbnail_url) img.src = data.thumbnail_url;
    } catch (_e) {
      // Fallback elegante
      titleEl.textContent = 'Ver en YouTube';
    }
  }
}

// Carga la vista en #app según el hash (#/vista)
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
  if(view === 'recursos') initYouTubeTitles();

  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
}

// Inicialización
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
