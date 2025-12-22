function setMessage(el, text, type) {
  if (!el) return;
  el.textContent = text || '';
  el.classList.remove('error', 'success');
  if (type) {
    el.classList.add(type);
  }
}

async function handleLoginPage() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const messageEl = document.getElementById('login-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage(messageEl, 'Iniciando sesión...', '');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }),
      });

      if (res.status === 200) {
        setMessage(messageEl, 'Sesión iniciada. Redirigiendo...', 'success');
        window.location.href = '/new-story.html';
      } else if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setMessage(messageEl, data.message || 'Datos inválidos', 'error');
      } else if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        setMessage(messageEl, data.message || 'Credenciales inválidas', 'error');
      } else {
        setMessage(messageEl, 'Error al iniciar sesión', 'error');
      }
    } catch (err) {
      setMessage(messageEl, 'Error de red al iniciar sesión', 'error');
    }
  });
}

async function handleRegisterPage() {
  const form = document.getElementById('register-form');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const messageEl = document.getElementById('register-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage(messageEl, 'Creando cuenta...', '');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }),
      });

      if (res.status === 201) {
        setMessage(messageEl, 'Cuenta creada. Redirigiendo...', 'success');
        window.location.href = '/new-story.html';
      } else if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setMessage(messageEl, data.message || 'Datos inválidos', 'error');
      } else if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setMessage(messageEl, data.message || 'Email ya registrado', 'error');
      } else {
        setMessage(messageEl, 'Error al crear cuenta', 'error');
      }
    } catch (err) {
      setMessage(messageEl, 'Error de red al crear cuenta', 'error');
    }
  });
}

function disableStoryEditing() {
  const titleInput = document.getElementById('story-title');
  const bodyTextarea = document.getElementById('story-body');
  const saveBtn = document.getElementById('save-draft-btn');
  const publishBtn = document.getElementById('publish-btn');

  if (titleInput) titleInput.disabled = true;
  if (bodyTextarea) bodyTextarea.disabled = true;
  if (saveBtn) saveBtn.disabled = true;
  if (publishBtn) publishBtn.disabled = true;
}
function showPublicUrl(slug) {
  const container = document.getElementById('public-url-container');
  const link = document.getElementById('public-url');
  if (!container || !link || !slug) return;

  const url = `/s/${encodeURIComponent(slug)}`;
  container.classList.remove('hidden');
  link.href = url;
  link.textContent = window.location.origin + url;
}

async function loadMyStory() {
  const titleInput = document.getElementById('story-title');
  const bodyTextarea = document.getElementById('story-body');
  const statusEl = document.getElementById('story-status');
  const messageEl = document.getElementById('story-message');

  try {
    const res = await fetch('/api/stories/me', {
      credentials: 'include',
    });

    if (res.status === 401) {
      window.location.href = '/index.html';
      return;
    }

    if (res.status === 404) {
      setMessage(statusEl, 'Aún no tienes historia. Empieza a escribir.', '');
      return;
    }

    if (res.status !== 200) {
      setMessage(messageEl, 'Error al cargar tu historia', 'error');
      return;
    }

    const data = await res.json();
    if (titleInput) titleInput.value = data.title || '';
    if (bodyTextarea) bodyTextarea.value = data.body || '';

    if (data.publishedAt) {
      setMessage(
        statusEl,
        'Tu historia ha sido publicada.\nEste texto ya no puede cambiar.',
        ''
      );
      disableStoryEditing();
      showPublicUrl(data.slug);
    } else {
      setMessage(statusEl, 'Borrador sin publicar.', '');
    }
  } catch (err) {
    setMessage(messageEl, 'Error de red al cargar tu historia', 'error');
  }
}

async function handleNewStoryPage() {
  const saveBtn = document.getElementById('save-draft-btn');
  const publishBtn = document.getElementById('publish-btn');
  const titleInput = document.getElementById('story-title');
  const bodyTextarea = document.getElementById('story-body');
  const messageEl = document.getElementById('story-message');
  const statusEl = document.getElementById('story-status');

  if (!titleInput || !bodyTextarea) return;

  await loadMyStory();

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const title = titleInput.value.trim();
      const body = bodyTextarea.value;

      if (!title) {
        setMessage(messageEl, 'El título es obligatorio', 'error');
        return;
      }

      if (!body || body.length < 500) {
        setMessage(
          messageEl,
          'El cuerpo debe tener al menos 500 caracteres',
          'error'
        );
        return;
      }

      setMessage(messageEl, 'Guardando borrador...', '');

      try {
        const res = await fetch('/api/stories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ title, body }),
        });

        if (res.status === 401) {
          window.location.href = '/index.html';
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (res.status === 200) {
          setMessage(messageEl, 'Borrador guardado.', 'success');
          setMessage(statusEl, 'Borrador sin publicar.', '');
        } else if (res.status === 400) {
          setMessage(
            messageEl,
            data.message || 'Datos inválidos al guardar borrador',
            'error'
          );
        } else if (res.status === 409) {
          setMessage(
            messageEl,
            data.message || 'Ya tienes una historia publicada',
            'error'
          );
          disableStoryEditing();
        } else {
          setMessage(messageEl, 'Error al guardar borrador', 'error');
        }
      } catch (err) {
        setMessage(messageEl, 'Error de red al guardar borrador', 'error');
      }
    });
  }

  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      const confirmed = window.confirm(
        '¿Deseas publicar esta historia?\nUna vez publicada no podrá editarse.'
      );

      if (!confirmed) {
        return;
      }

      // Guardar automáticamente el borrador actual antes de publicar
      const title = titleInput.value.trim();
      const body = bodyTextarea.value;

      setMessage(messageEl, 'Guardando borrador antes de publicar...', '');

      try {
        const saveRes = await fetch('/api/stories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ title, body }),
        });

        if (saveRes.status === 401) {
          window.location.href = '/index.html';
          return;
        }

        if (saveRes.status !== 200) {
          setMessage(
            messageEl,
            'Debes guardar un borrador válido antes de publicar.',
            'error'
          );
          return;
        }

        // Solo si el borrador se guardó correctamente, intentar publicar
        setMessage(messageEl, 'Publicando historia...', '');

        const res = await fetch('/api/stories/publish', {
          method: 'POST',
          credentials: 'include',
        });

        if (res.status === 401) {
          window.location.href = '/index.html';
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (res.status === 200) {
          setMessage(messageEl, 'Historia publicada.', 'success');
          setMessage(
            statusEl,
            'Tu historia ha sido publicada.\nEste texto ya no puede cambiar.',
            ''
          );
          disableStoryEditing();
          showPublicUrl(data.slug);
          window.location.href = '/stories.html';
        } else if (res.status === 400) {
          setMessage(
            messageEl,
            data.message || 'No se pudo publicar la historia',
            'error'
          );
        } else {
          setMessage(messageEl, 'Error al publicar historia', 'error');
        }
      } catch (err) {
        setMessage(
          messageEl,
          'Error de red al guardar borrador o publicar historia',
          'error'
        );
      }
    });
  }
}

async function handlePublicStoryPage() {
  const titleEl = document.getElementById('public-title');
  const bodyEl = document.getElementById('public-body');
  const metaEl = document.getElementById('public-meta');
  const messageEl = document.getElementById('public-message');

  if (!titleEl || !bodyEl) return;

  const parts = window.location.pathname.split('/').filter(Boolean);
  const slug = parts[1]; // ['s', ':slug']

  if (!slug) {
    setMessage(messageEl, 'URL inválida', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/stories/public/${encodeURIComponent(slug)}`);

    if (res.status === 404) {
      setMessage(messageEl, 'Historia no encontrada', 'error');
      return;
    }

    if (res.status !== 200) {
      setMessage(messageEl, 'Error al cargar historia', 'error');
      return;
    }

    const data = await res.json();
    titleEl.textContent = data.title || '';
    bodyEl.textContent = data.body || '';

    if (data.publishedAt) {
      const date = new Date(data.publishedAt);
      metaEl.textContent = `Publicado el ${date.toLocaleDateString()}`;
    }
  } catch (err) {
    setMessage(messageEl, 'Error de red al cargar historia', 'error');
  }
}

async function handleStoriesListPage() {
  const listEl = document.getElementById('stories-list');
  const messageEl = document.getElementById('stories-message');

  if (!listEl || !messageEl) return;

  listEl.innerHTML = '';
  const showGateMessage = () => {
    listEl.innerHTML = '';
    setMessage(
      messageEl,
      'Para leer historias de otros, primero debes publicar la tuya.',
      ''
    );

    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Crear mi historia';
    btn.addEventListener('click', () => {
      window.location.href = '/new-story.html';
    });

    li.appendChild(btn);
    listEl.appendChild(li);
  };

  setMessage(messageEl, 'Verificando tu historia...', '');

  try {
    const meRes = await fetch('/api/stories/me', {
      credentials: 'include',
    });

    if (meRes.status === 401 || meRes.status === 404) {
      showGateMessage();
      return;
    }

    if (meRes.status !== 200) {
      setMessage(messageEl, 'Error al verificar tu historia', 'error');
      return;
    }

    const meData = await meRes.json().catch(() => null);

    if (!meData || !meData.publishedAt) {
      showGateMessage();
      return;
    }

    // El usuario tiene al menos una historia publicada; cargar listado público
    setMessage(messageEl, 'Cargando historias publicadas...', '');

    const res = await fetch('/api/stories/public');

    if (res.status !== 200) {
      setMessage(messageEl, 'Error al cargar historias publicadas', 'error');
      return;
    }

    const data = await res.json().catch(() => []);

    if (!Array.isArray(data) || data.length === 0) {
      setMessage(messageEl, 'Aún no hay historias publicadas.', '');
      return;
    }

    setMessage(messageEl, '', '');

    data.forEach((story) => {
      const li = document.createElement('li');

      const link = document.createElement('a');
      link.href = `/s/${encodeURIComponent(story.slug)}`;
      link.textContent = story.title || '';

      const meta = document.createElement('span');
      meta.className = 'small';
      if (story.publishedAt) {
        const d = new Date(story.publishedAt);
        meta.textContent = ` — ${d.toLocaleDateString()}`;
      }

      li.appendChild(link);
      li.appendChild(meta);
      listEl.appendChild(li);
    });
  } catch (err) {
    setMessage(
      messageEl,
      'Error de red al verificar tu historia o cargar historias publicadas',
      'error'
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'login') {
    handleLoginPage();
  } else if (page === 'register') {
    handleRegisterPage();
  } else if (page === 'new-story') {
    handleNewStoryPage();
  } else if (page === 'public-story') {
    handlePublicStoryPage();
  } else if (page === 'stories') {
    handleStoriesListPage();
  }
});
