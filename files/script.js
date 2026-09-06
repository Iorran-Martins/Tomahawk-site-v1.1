/*
 * LIMEIRA TOMAHAWK — FUTEBOL AMERICANO
 * JavaScript vanilla — sem dependências externas.
 * Responsável por: menu mobile, destaque da página atual,
 * animação leve ao revelar seções, botão voltar ao topo
 * e interface visual do formulário de contato.
 */

/* Mantém o conteúdo visível quando o JavaScript estiver desativado. */
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  /* Cada inicialização roda isolada: se uma falhar por algum motivo
     inesperado, as demais funcionalidades da página continuam
     funcionando normalmente em vez de parar todas em cadeia. */
  safeInit(initMobileNav);
  safeInit(highlightActiveNav);
  safeInit(initRevealOnScroll);
  safeInit(initBackToTop);
  safeInit(initContactForm);
});

function safeInit(fn) {
  try {
    fn();
  } catch (err) {
    console.error('Falha ao iniciar "' + fn.name + '":', err);
  }
}

/* ------------------------------------------------------------------ */
/* Menu mobile                                                         */
/* ------------------------------------------------------------------ */
function initMobileNav() {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  var navLinks = nav.querySelectorAll('a');
  var header = document.querySelector('.site-header');
  function updateNavTop() {
    if (header) {
      nav.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
    }
  }

  function closeNav(shouldRestoreFocus) {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('nav-open');
    if (shouldRestoreFocus) toggle.focus();
  }

  function openNav() {
    updateNavTop();
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu');
    document.body.classList.add('nav-open');
    requestAnimationFrame(function () {
      if (nav.classList.contains('open') && navLinks.length) navLinks[0].focus();
    });
  }

  toggle.addEventListener('click', function () {
    if (nav.classList.contains('open')) {
      closeNav(false);
    } else {
      openNav();
    }
  });

  /* Fecha o menu ao clicar em um link (navegação para outra página ou âncora) */
  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener('click', function () {
      closeNav();
    });
  }

  /* Fecha o menu com a tecla Esc, por acessibilidade */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      closeNav(true);
      return;
    }

    if (e.key !== 'Tab' || !nav.classList.contains('open') || !navLinks.length) return;

    var firstLink = navLinks[0];
    var lastLink = navLinks[navLinks.length - 1];
    if (document.activeElement === toggle) {
      e.preventDefault();
      (e.shiftKey ? lastLink : firstLink).focus();
    } else if (e.shiftKey && document.activeElement === firstLink) {
      e.preventDefault();
      lastLink.focus();
    } else if (!e.shiftKey && document.activeElement === lastLink) {
      e.preventDefault();
      firstLink.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) closeNav();
    else updateNavTop();
  });
}

/* ------------------------------------------------------------------ */
/* Destaque da página atual no menu                                    */
/* ------------------------------------------------------------------ */
function highlightActiveNav() {
  var current = (window.location.pathname.split('/').pop() || 'index.html');
  var navLinks = document.querySelectorAll('.main-nav a[data-page]');
  for (var i = 0; i < navLinks.length; i++) {
    if (navLinks[i].getAttribute('data-page') === current) {
      navLinks[i].classList.add('active');
      navLinks[i].setAttribute('aria-current', 'page');
    }
  }
}

/* ------------------------------------------------------------------ */
/* Revelação leve de seções ao rolar a página                          */
/* ------------------------------------------------------------------ */
function initRevealOnScroll() {
  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  var i;

  if (!('IntersectionObserver' in window)) {
    for (i = 0; i < items.length; i++) { items[i].classList.add('is-visible'); }
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    for (var j = 0; j < entries.length; j++) {
      if (entries[j].isIntersecting) {
        entries[j].target.classList.add('is-visible');
        observer.unobserve(entries[j].target);
      }
    }
  }, { threshold: 0.15 });

  for (i = 0; i < items.length; i++) { observer.observe(items[i]); }
}

/* ------------------------------------------------------------------ */
/* Botão "voltar ao topo"                                               */
/* ------------------------------------------------------------------ */
function initBackToTop() {
  var btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ------------------------------------------------------------------ */
/* Formulário de contato — envio via FormSubmit                         */
/* ------------------------------------------------------------------ */
function initContactForm() {
  var form = document.querySelector('#contact-form');
  if (!form) return;

  var status = document.querySelector('#contact-form-status');
  var sendButton = form.querySelector('[data-contact-submit]');
  var subject = document.querySelector('#assunto');
  var product = new URLSearchParams(window.location.search).get('produto');
  var productNames = {
    'jersey-jogo': 'Jersey de jogo',
    'jersey-torcedor': 'Jersey torcedor',
    'agasalho': 'Agasalho',
    'chinelo': 'Chinelo'
  };

  if (subject && product && productNames[product] && !subject.value) {
    subject.value = 'Tenho interesse: ' + productNames[product];
  }

  /* POST nativo permite que o serviço apresente CAPTCHA e confirmação.
     Não depende de uma requisição AJAX entre domínios. */
  form.addEventListener('submit', function (e) {
    if (window.location.protocol === 'file:') {
      e.preventDefault();
      status.textContent = 'Abra o site pelo endereço publicado ou pelo servidor local para enviar. ' +
        'Você também pode escrever para flagtomahawk@gmail.com.';
      status.classList.add('visible');
      return;
    }
    sendButton.textContent = 'Continuando para envio…';
  });
  window.addEventListener('pageshow', function () {
    sendButton.textContent = 'Enviar mensagem';
  });
}
