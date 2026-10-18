/*
 * LIMEIRA TOMAHAWK — FUTEBOL AMERICANO
 * JavaScript vanilla — sem dependências externas.
 * Responsável por: menu mobile, destaque da página atual,
 * animação leve ao revelar seções, botão voltar ao topo
 * e interfaces dos formulários de contato e da seletiva.
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
  safeInit(initTryoutForm);
});

function safeInit(fn) {
  try {
    fn();
  } catch (err) {
    console.error('Falha ao iniciar "' + fn.name + '":', err);
  }
}

/* ------------------------------------------------------------------ */
/* Regras comuns de entrada                                            */
/* ------------------------------------------------------------------ */
function onlyDigits(value, maxLength) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLength);
}

function bindDigitsOnly(field, maxLength) {
  if (!field) return;

  field.addEventListener('input', function () {
    var cleaned = onlyDigits(field.value, maxLength);
    if (field.value !== cleaned) field.value = cleaned;
    field.setCustomValidity('');
  });
}

function isValidCPF(value) {
  var cpf = onlyDigits(value, 11);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  var sum = 0;
  var i;
  for (i = 0; i < 9; i++) sum += Number(cpf.charAt(i)) * (10 - i);
  var firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(cpf.charAt(9))) return false;

  sum = 0;
  for (i = 0; i < 10; i++) sum += Number(cpf.charAt(i)) * (11 - i);
  var secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;
  return secondDigit === Number(cpf.charAt(10));
}

function clearCustomValidity(fields) {
  for (var i = 0; i < fields.length; i++) {
    if (fields[i]) fields[i].setCustomValidity('');
  }
}

function trimFieldValue(field) {
  if (field && typeof field.value === 'string') field.value = field.value.trim();
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
    trimFieldValue(form.querySelector('#nome'));
    trimFieldValue(form.querySelector('#email'));
    trimFieldValue(form.querySelector('#assunto'));
    trimFieldValue(form.querySelector('#mensagem'));

    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity();
      return;
    }

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

/* ------------------------------------------------------------------ */
/* Formulário da Seletiva 2026                                        */
/* ------------------------------------------------------------------ */
function initTryoutForm() {
  var form = document.querySelector('#tryout-form');
  if (!form) return;

  var status = document.querySelector('#tryout-form-status');
  var sendButton = form.querySelector('[data-tryout-submit]');
  var birthDate = form.querySelector('#nascimento');
  var birthYear = form.querySelector('#nascimento-ano');
  var birthMonth = form.querySelector('#nascimento-mes');
  var birthDay = form.querySelector('#nascimento-dia');
  var honey = form.querySelector('#tryout-website');
  var cpf = form.querySelector('#cpf');
  var phone = form.querySelector('#telefone');
  var rg = form.querySelector('#rg');
  var uniformNumber = form.querySelector('#numero-uniforme');
  var specialTeams = form.querySelector('#special-teams');
  var restrictionRadios = form.querySelectorAll('input[name="entry.1494405221"]');
  var restrictionDetails = document.querySelector('#restricao-detalhes');
  var restrictionDescription = document.querySelector('#descricao-restricao');

  bindDigitsOnly(cpf, 11);
  bindDigitsOnly(phone, 11);
  bindDigitsOnly(uniformNumber, 2);

  if (rg) {
    rg.addEventListener('input', function () {
      var cleaned = rg.value.replace(/[^0-9A-Za-z.\-]/g, '').slice(0, 20);
      if (rg.value !== cleaned) rg.value = cleaned;
      rg.setCustomValidity('');
    });
  }

  function updateBirthDateFields() {
    var parts = birthDate && birthDate.value ? birthDate.value.split('-') : [];
    birthYear.value = parts[0] || '';
    birthMonth.value = parts[1] || '';
    birthDay.value = parts[2] || '';
  }

  function updateRestrictionField() {
    var selected = form.querySelector('input[name="entry.1494405221"]:checked');
    var shouldShow = selected && selected.value === 'Sim';

    restrictionDetails.hidden = !shouldShow;
    restrictionDescription.disabled = !shouldShow;
    restrictionDescription.required = shouldShow;
    if (!shouldShow) restrictionDescription.value = '';
  }

  for (var i = 0; i < restrictionRadios.length; i++) {
    restrictionRadios[i].addEventListener('change', updateRestrictionField);
  }

  function validateStructuredFields() {
    clearCustomValidity([cpf, phone, uniformNumber]);
    var valid = true;

    if (cpf && !isValidCPF(cpf.value)) {
      cpf.setCustomValidity('Informe um CPF válido com exatamente 11 números.');
      valid = false;
    }

    if (phone && !/^\d{11}$/.test(phone.value)) {
      phone.setCustomValidity('Informe o telefone com exatamente 11 números, incluindo o DDD.');
      valid = false;
    }

    if (uniformNumber && !/^[1-9]\d?$/.test(uniformNumber.value)) {
      uniformNumber.setCustomValidity('Informe um número inteiro de 1 a 99.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    trimFieldValue(form.querySelector('#nome-completo'));
    trimFieldValue(form.querySelector('#email-seletiva'));
    trimFieldValue(form.querySelector('#endereco'));
    trimFieldValue(form.querySelector('#cidade'));
    trimFieldValue(form.querySelector('#nome-uniforme'));
    trimFieldValue(restrictionDescription);
    updateBirthDateFields();
    updateRestrictionField();

    if (!validateStructuredFields() || !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (honey && honey.value) return;

    if (window.location.protocol === 'file:') {
      status.textContent = 'Abra o site pelo endereço publicado ou por um servidor local para enviar sua inscrição.';
      status.classList.add('visible');
      return;
    }

    sendButton.disabled = true;
    sendButton.textContent = 'Enviando…';
    status.textContent = 'Enviando sua inscrição para a equipe…';
    status.classList.add('visible');

    var formData = new FormData(form);
    if (specialTeams && !specialTeams.value) {
      formData.delete('entry.1551743960');
    }

    fetch(form.action, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'omit',
      body: formData
    }).then(function () {
      form.reset();
      updateRestrictionField();
      updateBirthDateFields();
      status.textContent = 'Inscrição enviada com sucesso! Seus dados já foram registrados pela equipe.';
    }).catch(function () {
      status.textContent = 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.';
    }).finally(function () {
      sendButton.disabled = false;
      sendButton.textContent = 'Enviar inscrição';
    });
  });

  window.addEventListener('pageshow', function () {
    sendButton.disabled = false;
    sendButton.textContent = 'Enviar inscrição';
    updateBirthDateFields();
  });

  updateBirthDateFields();
  updateRestrictionField();
}
