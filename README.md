# ⚡ SportHub — Sistema de Inscripción Deportiva

Aplicación web para inscripción de alumnos a deportes escolares (básquet, vóley, natación) con asignación automática de categorías por edad y panel de administración protegido con contraseña.

---

## 🚀 Cómo subir a GitHub y publicar en Vercel

### Paso 1 — Subir a GitHub

1. Entrá a [github.com](https://github.com) y creá una cuenta si no tenés
2. Hacé clic en **"New repository"** (botón verde)
3. Poné de nombre: `sporthub`
4. Dejalo en **Public** y hacé clic en **"Create repository"**
5. Descargá e instalá [Git](https://git-scm.com/downloads) si no lo tenés
6. Abrí una terminal en la carpeta de este proyecto y ejecutá:

```bash
git init
git add .
git commit -m "primer commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sporthub.git
git push -u origin main
```

> Reemplazá `TU_USUARIO` con tu nombre de usuario de GitHub

---

### Paso 2 — Publicar en Vercel (gratis)

1. Entrá a [vercel.com](https://vercel.com) y creá una cuenta con tu cuenta de GitHub
2. Hacé clic en **"Add New Project"**
3. Seleccioná el repositorio `sporthub`
4. Dejá todo por defecto y hacé clic en **"Deploy"**
5. En 2 minutos te da una URL como: `https://sporthub-tu-usuario.vercel.app`

¡Esa URL la compartís por WhatsApp y los alumnos se inscriben desde el celular! 📱

---

## 🔐 Credenciales del panel admin

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `sporthub2024` |

> Para cambiar la contraseña, editá el archivo `src/App.jsx` y buscá la línea `ADMIN_CREDENTIALS`.

---

## 🛠️ Desarrollo local

```bash
npm install
npm run dev
```

Abrí http://localhost:5173 en el navegador.

---

## 📦 Tecnologías

- React 18
- Vite
- CSS inline (sin dependencias extra)
