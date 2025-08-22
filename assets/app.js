// ==== TuNuevaNarrativa – router simple por hash y comportamientos ====
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

function initStoryForm(){
  const form = document.getElementById('storyForm');
  if(!form || form.dataset.bound) return;
  form.dataset.bound = '1';
  const ok = document.getElementById('msgOk');
  const err = document.getElementById('msgErr');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(err) err.style.display = 'none';
    if(ok) ok.style.display = 'none';
    const data = Object.fromEntries(new FormData(form).entries());
    const texto = (data.historia || '').trim();
    if(texto.length < 30){
      if(err) err.style.display = 'block';
      return;
    }
    const historias = JSON.parse(localStorage.getItem('tnn_historias') || '[]');
    historias.push({ ...data, fecha: new Date().toISOString() });
    localStorage.setItem('tnn_historias', JSON.stringify(historias));
    if(ok) ok.style.display = 'block';
    form.reset();
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
  // init features depending on view
  if(view === 'inicio') initTicker();
  if(view === 'conta-tu-historia') initStoryForm();
  // year
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);