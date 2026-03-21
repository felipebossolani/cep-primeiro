const cepInput = document.getElementById('cep');
const logradouro = document.getElementById('logradouro');
const bairro = document.getElementById('bairro');
const cidade = document.getElementById('cidade');
const estado = document.getElementById('estado');
const cepError = document.getElementById('cep-error');
const demoResult = document.getElementById('demo-result');
const mapaContainer = document.getElementById('mapa-container');
const autoFields = [logradouro, bairro, cidade, estado];

let debounceTimer = null;

function maskCep(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return digits.slice(0, 5) + '-' + digits.slice(5);
  }
  return digits;
}

function clearFields() {
  autoFields.forEach(f => {
    f.value = '';
    f.classList.remove('filled');
  });
  cepError.textContent = '';
  demoResult.style.display = 'none';
  mapaContainer.innerHTML = '';
}

async function fetchCep(rawCep) {
  if (rawCep.length !== 8 || !/^\d{8}$/.test(rawCep)) {
    cepError.textContent = 'CEP inválido. São 8 números. Só isso.';
    return;
  }

  clearFields();
  autoFields.forEach(f => f.classList.add('loading'));

  try {
    const res = await fetch(`https://cep.awesomeapi.com.br/json/${rawCep}`);
    if (!res.ok) {
      autoFields.forEach(f => f.classList.remove('loading'));
      if (res.status === 404 || res.status === 400) {
        cepError.textContent = 'CEP não encontrado. Confere aí.';
      } else {
        cepError.textContent = 'Deu ruim na API. Tenta de novo.';
      }
      return;
    }
    const data = await res.json();
    autoFields.forEach(f => f.classList.remove('loading'));
    logradouro.value = data.address || '';
    bairro.value = data.district || '';
    cidade.value = data.city || '';
    estado.value = data.state || '';
    autoFields.forEach(f => {
      if (f.value) f.classList.add('filled');
    });

    if (data.lat && data.lng) {
      mapaContainer.innerHTML = `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${data.lng - 0.005},${data.lat - 0.003},${Number(data.lng) + 0.005},${Number(data.lat) + 0.003}&layer=mapnik&marker=${data.lat},${data.lng}" loading="lazy"></iframe>`;
    }

    demoResult.style.display = 'block';
  } catch {
    autoFields.forEach(f => f.classList.remove('loading'));
    cepError.textContent = 'Deu ruim na API. Tenta de novo.';
  }
}

cepInput.addEventListener('input', () => {
  const masked = maskCep(cepInput.value);
  cepInput.value = masked;
  const raw = masked.replace(/\D/g, '');

  clearTimeout(debounceTimer);

  if (raw.length === 8) {
    fetchCep(raw);
  } else if (raw.length < 8) {
    clearFields();
  } else {
    debounceTimer = setTimeout(() => fetchCep(raw), 300);
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('section').forEach(s => observer.observe(s));

