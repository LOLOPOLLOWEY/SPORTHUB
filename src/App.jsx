import { useState, useEffect } from "react";

const SUPABASE_URL = "https://rcldtxehnlfgloqiunlw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbGR0eGVobmxmZ2xvcWl1bmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjEwNjUsImV4cCI6MjA4ODU5NzA2NX0.ZhdhUnGBSHYqT3Y_FKTjOTL8Ud3vN3j8xeGF8Be8Ino";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const SPORTS = [
  { id: "basquet", name: "Básquet", icon: "🏀", color: "#E85A00" },
  { id: "voley", name: "Vóley", icon: "🏐", color: "#0066CC" },
  { id: "natacion", name: "Natación", icon: "🏊", color: "#00A896" },
];

const CATEGORIES = [
  { id: "mini", label: "Mini", range: "6 a 8 años", min: 6, max: 8 },
  { id: "infantil", label: "Infantil", range: "9 a 11 años", min: 9, max: 11 },
  { id: "cadete", label: "Cadete", range: "12 a 14 años", min: 12, max: 14 },
  { id: "juvenil", label: "Juvenil", range: "15 a 17 años", min: 15, max: 17 },
  { id: "mayor", label: "Mayor", range: "18 años o más", min: 18, max: 99 },
];

const ADMIN_CREDENTIALS = { user: "admin", password: "sporthub2024" };

function getAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getCategory(age) {
  return CATEGORIES.find((c) => age >= c.min && age <= c.max);
}

export default function App() {
  const [view, setView] = useState("home");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", dni: "", dob: "", tutor: "", tutorPhone: "", sport: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [adminFilter, setAdminFilter] = useState("all");
  const [adminView, setAdminView] = useState("list");
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dbError, setDbError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Cargar inscriptos desde Supabase
  const loadStudents = async () => {
    setLoading(true);
    setDbError("");
    try {
      const data = await sbFetch("/inscriptos?select=*&order=created_at.desc");
      setStudents(data || []);
    } catch (e) {
      setDbError("No se pudieron cargar los inscriptos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleAdminLogin = () => {
    if (loginForm.user === ADMIN_CREDENTIALS.user && loginForm.password === ADMIN_CREDENTIALS.password) {
      setIsAdminLogged(true);
      setLoginError("");
      loadStudents();
    } else {
      setLoginError("Usuario o contraseña incorrectos");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLogged(false);
    setLoginForm({ user: "", password: "" });
    setView("home");
    setMenuOpen(false);
  };

  const navigate = (v) => {
    setView(v);
    setMenuOpen(false);
    if (v === "register") setSubmitted(false);
    if (v === "admin" && isAdminLogged) loadStudents();
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (!form.dni.match(/^\d{7,8}$/)) e.dni = "DNI inválido (7 u 8 dígitos)";
    if (!form.dob) e.dob = "Requerido";
    else {
      const age = getAge(form.dob);
      if (age < 6 || age > 99) e.dob = "Edad fuera de rango (6–99 años)";
    }
    if (!form.tutor.trim()) e.tutor = "Requerido";
    if (!form.tutorPhone.match(/^\d{10,}$/)) e.tutorPhone = "Ingresá al menos 10 dígitos";
    if (!form.sport) e.sport = "Seleccioná un deporte";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const age = getAge(form.dob);
    const cat = getCategory(age);
    setLoading(true);
    setDbError("");
    try {
      await sbFetch("/inscriptos", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({
          name: form.name,
          dni: form.dni,
          dob: form.dob,
          tutor: form.tutor,
          tutor_phone: form.tutorPhone,
          sport: form.sport,
          category: cat?.id || "mayor",
        }),
      });
      await loadStudents();
      setSubmitted(true);
    } catch (err) {
      setDbError("Error al guardar la inscripción. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", dni: "", dob: "", tutor: "", tutorPhone: "", sport: "" });
    setErrors({});
    setSubmitted(false);
    setDbError("");
    setView("home");
  };

  const handleDelete = async (id) => {
    try {
      await sbFetch(`/inscriptos?id=eq.${id}`, { method: "DELETE" });
      setStudents(prev => prev.filter(s => s.id !== id));
      setConfirmDelete(null);
    } catch (e) {
      setDbError("Error al eliminar. Intentá de nuevo.");
    }
  };

  const filteredStudents = adminFilter === "all" ? students : students.filter((s) => s.sport === adminFilter);
  const stats = SPORTS.map((sport) => ({
    ...sport,
    count: students.filter((s) => s.sport === sport.id).length,
    byCategory: CATEGORIES.map((cat) => ({
      ...cat,
      count: students.filter((s) => s.sport === sport.id && s.category === cat.id).length,
    })),
  }));
  const totalStudents = students.length;

  // Last submitted student
  const lastStudent = students[0];

  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#0f0f0f", color: "#f0ece4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        .btn-primary {
          background: #f0ece4; color: #0f0f0f; border: none; padding: 14px 32px;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
          cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s;
        }
        .btn-primary:hover { background: #d4c9b8; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline {
          background: transparent; color: #f0ece4; border: 1px solid #f0ece4;
          padding: 13px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px;
          cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s;
        }
        .btn-outline:hover { background: rgba(240,236,228,0.08); }
        .btn-danger {
          background: transparent; color: #e05a5a; border: 1px solid #e05a5a;
          padding: 8px 16px; font-family: 'DM Sans', sans-serif; font-size: 12px;
          cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s;
        }
        .btn-danger:hover { background: rgba(224,90,90,0.1); }
        .input-field {
          width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; color: #f0ece4;
          padding: 14px 16px; font-family: 'DM Sans', sans-serif; font-size: 15px;
          outline: none; transition: border 0.2s; border-radius: 0; -webkit-appearance: none;
        }
        .input-field:focus { border-color: #f0ece4; }
        .input-field::placeholder { color: #555; }
        .error-text { color: #e05a5a; font-size: 12px; margin-top: 4px; font-family: 'DM Sans', sans-serif; }
        .tab-btn {
          background: none; border: none; color: #888; font-family: 'DM Sans', sans-serif;
          font-size: 14px; cursor: pointer; padding: 10px 20px; letter-spacing: 0.05em;
          border-bottom: 2px solid transparent; transition: all 0.2s;
        }
        .tab-btn.active { color: #f0ece4; border-bottom-color: #f0ece4; }
        .sport-card {
          border: 1px solid #2a2a2a; padding: 18px 20px; cursor: pointer; transition: all 0.2s;
          background: #141414; display: flex; align-items: center; gap: 16px;
        }
        .sport-card:hover { border-color: #555; background: #1c1c1c; }
        .sport-card.selected { border-color: #f0ece4; background: #1c1c1c; }
        .nav-link {
          background: none; border: none; color: #888; font-family: 'DM Sans', sans-serif;
          font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
          padding: 8px 14px; transition: color 0.2s; display: block; width: 100%; text-align: left;
        }
        .nav-link:hover, .nav-link.active { color: #f0ece4; }
        .stat-bar { height: 6px; background: #2a2a2a; overflow: hidden; margin-top: 4px; }
        .stat-fill { height: 100%; transition: width 0.6s ease; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px 14px; font-family: 'DM Sans', sans-serif; font-size: 11px;
             letter-spacing: 0.1em; text-transform: uppercase; color: #666; border-bottom: 1px solid #2a2a2a; font-weight: 400; }
        td { padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: #ccc;
             border-bottom: 1px solid #1a1a1a; }
        tr:hover td { background: #141414; color: #f0ece4; }
        .badge { display: inline-block; padding: 3px 10px; font-size: 11px; letter-spacing: 0.06em;
                 font-family: 'DM Sans', sans-serif; font-weight: 500; text-transform: uppercase; }
        .pw-wrap { position: relative; }
        .pw-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #555; cursor: pointer; font-size: 16px; padding: 0; }
        .label { font-family: 'DM Sans', sans-serif; font-size: 11px; letter-spacing: 0.1em;
                 color: #888; text-transform: uppercase; display: block; margin-bottom: 8px; }
        .section-tag { font-family: 'DM Sans', sans-serif; font-size: 11px; letter-spacing: 0.15em;
                       color: #555; text-transform: uppercase; margin-bottom: 16px; display: block; }
        .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #333;
                   border-top-color: #f0ece4; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .table-scroll { overflow-x: auto; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-5 { grid-template-columns: repeat(2, 1fr) !important; }
          .hero-btns { flex-direction: column !important; }
          .admin-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
        }
        @media (min-width: 641px) {
          .mobile-only { display: none !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ borderBottom: "1px solid #1f1f1f", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, background: "#0f0f0f", zIndex: 99 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("home")}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>SportHub</span>
        </div>
        <div className="desktop-nav" style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button className={`nav-link ${view === "home" ? "active" : ""}`} onClick={() => navigate("home")}>Inicio</button>
          <button className={`nav-link ${view === "register" ? "active" : ""}`} onClick={() => navigate("register")}>Inscripción</button>
          <button className={`nav-link ${view === "admin" ? "active" : ""}`} onClick={() => navigate("admin")}>
            {isAdminLogged ? "🔓" : "🔒"} Admin
          </button>
          {isAdminLogged && <button className="btn-danger" style={{ marginLeft: 8 }} onClick={handleAdminLogout}>Salir</button>}
        </div>
        <button className="mobile-only" onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", color: "#f0ece4", cursor: "pointer", fontSize: 20, padding: 8 }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-only" style={{ position: "fixed", top: 64, left: 0, right: 0, background: "#0f0f0f", borderBottom: "1px solid #1f1f1f", zIndex: 100, padding: "12px 0" }}>
          <button className={`nav-link ${view === "home" ? "active" : ""}`} onClick={() => navigate("home")}>Inicio</button>
          <button className={`nav-link ${view === "register" ? "active" : ""}`} onClick={() => navigate("register")}>Inscripción</button>
          <button className={`nav-link ${view === "admin" ? "active" : ""}`} onClick={() => navigate("admin")}>{isAdminLogged ? "🔓" : "🔒"} Administración</button>
          {isAdminLogged && <button className="nav-link" style={{ color: "#e05a5a" }} onClick={handleAdminLogout}>Cerrar sesión</button>}
        </div>
      )}

      {/* HOME */}
      {view === "home" && (
        <div>
          <div style={{ padding: "70px 24px 60px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
            <span className="section-tag">Sistema de Inscripción Deportiva</span>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(40px, 8vw, 80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 28 }}>
              Tu deporte,<br />tu categoría.
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#888", maxWidth: 460, margin: "0 auto 40px", lineHeight: 1.7 }}>
              Inscribite en básquet, vóley o natación. La categoría se asigna automáticamente según tu edad.
            </p>
            <div className="hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn-primary" style={{ padding: "14px 32px" }} onClick={() => navigate("register")}>Inscribirme ahora</button>
              <button className="btn-outline" onClick={() => navigate("admin")}>Panel admin</button>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1f1f1f", padding: "50px 24px", maxWidth: 960, margin: "0 auto" }}>
            <span className="section-tag">Disciplinas disponibles</span>
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {SPORTS.map((sport) => (
                <div key={sport.id} style={{ borderTop: `3px solid ${sport.color}`, background: "#141414", padding: 24 }}>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{sport.icon}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{sport.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#666" }}>
                    {loading ? <span className="spinner" /> : `${students.filter((s) => s.sport === sport.id).length} inscriptos`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1f1f1f", padding: "50px 24px", maxWidth: 960, margin: "0 auto" }}>
            <span className="section-tag">Categorías por edad</span>
            <div className="grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {CATEGORIES.map((cat) => (
                <div key={cat.id} style={{ background: "#141414", border: "1px solid #2a2a2a", padding: 18, textAlign: "center" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{cat.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#666" }}>{cat.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REGISTER */}
      {view === "register" && (
        <div style={{ maxWidth: 580, margin: "0 auto", padding: "50px 24px" }}>
          {!submitted ? (
            <>
              <span className="section-tag">Formulario de inscripción</span>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 900, marginBottom: 36 }}>Inscribite</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label className="label">Nombre y Apellido</label>
                  <input className="input-field" placeholder="Ej: Lucía García" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  {errors.name && <p className="error-text">{errors.name}</p>}
                </div>
                <div>
                  <label className="label">DNI</label>
                  <input className="input-field" placeholder="Ej: 45123456" value={form.dni} inputMode="numeric" onChange={(e) => setForm({ ...form, dni: e.target.value })} />
                  {errors.dni && <p className="error-text">{errors.dni}</p>}
                </div>
                <div>
                  <label className="label">Fecha de Nacimiento</label>
                  <input type="date" className="input-field" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} style={{ colorScheme: "dark" }} />
                  {errors.dob && <p className="error-text">{errors.dob}</p>}
                  {form.dob && !errors.dob && (() => {
                    const age = getAge(form.dob);
                    const cat = getCategory(age);
                    return cat ? (
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", marginTop: 6 }}>
                        {age} años → Categoría <strong style={{ color: "#f0ece4" }}>{cat.label}</strong>
                      </p>
                    ) : null;
                  })()}
                </div>
                <div>
                  <label className="label">Nombre del Tutor/a</label>
                  <input className="input-field" placeholder="Ej: María García" value={form.tutor} onChange={(e) => setForm({ ...form, tutor: e.target.value })} />
                  {errors.tutor && <p className="error-text">{errors.tutor}</p>}
                </div>
                <div>
                  <label className="label">Teléfono del Tutor/a</label>
                  <input className="input-field" placeholder="Ej: 1145678901" value={form.tutorPhone} inputMode="numeric" onChange={(e) => setForm({ ...form, tutorPhone: e.target.value })} />
                  {errors.tutorPhone && <p className="error-text">{errors.tutorPhone}</p>}
                </div>
                <div>
                  <label className="label">Elegí tu deporte</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {SPORTS.map((sport) => (
                      <div key={sport.id} className={`sport-card ${form.sport === sport.id ? "selected" : ""}`} onClick={() => setForm({ ...form, sport: sport.id })}>
                        <span style={{ fontSize: 26 }}>{sport.icon}</span>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{sport.name}</span>
                        {form.sport === sport.id && <span style={{ marginLeft: "auto", color: "#f0ece4" }}>✓</span>}
                      </div>
                    ))}
                  </div>
                  {errors.sport && <p className="error-text" style={{ marginTop: 6 }}>{errors.sport}</p>}
                </div>
                {dbError && <p className="error-text" style={{ textAlign: "center" }}>{dbError}</p>}
                <button className="btn-primary" style={{ marginTop: 8, width: "100%" }} onClick={handleSubmit} disabled={loading}>
                  {loading ? "Guardando..." : "Confirmar inscripción"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 40 }}>
              <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, marginBottom: 14 }}>¡Inscripción confirmada!</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#888", marginBottom: 6 }}>
                {form.name} fue inscripto/a en <strong style={{ color: "#f0ece4" }}>{SPORTS.find((s) => s.id === form.sport)?.name}</strong>
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#666", marginBottom: 36 }}>
                Categoría asignada: <strong style={{ color: "#f0ece4" }}>{CATEGORIES.find((c) => c.id === lastStudent?.category)?.label}</strong>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 300, margin: "0 auto" }}>
                <button className="btn-primary" onClick={resetForm}>Volver al inicio</button>
                <button className="btn-outline" onClick={() => { setSubmitted(false); setForm({ name: "", dni: "", dob: "", tutor: "", tutorPhone: "", sport: "" }); setErrors({}); }}>
                  Nueva inscripción
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN — Login */}
      {view === "admin" && !isAdminLogged && (
        <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ border: "1px solid #2a2a2a", background: "#141414", padding: "40px 32px", width: "100%", maxWidth: 400 }}>
            <span className="section-tag">Acceso restringido</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, marginBottom: 6 }}>Panel Admin</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#555", marginBottom: 32 }}>Ingresá tus credenciales para acceder.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">Usuario</label>
                <input className="input-field" placeholder="admin" value={loginForm.user} onChange={(e) => setLoginForm({ ...loginForm, user: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <div className="pw-wrap">
                  <input className="input-field" type={showPassword ? "text" : "password"} placeholder="••••••••" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} style={{ paddingRight: 44 }} />
                  <button className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</button>
                </div>
              </div>
              {loginError && (
                <div style={{ background: "rgba(224,90,90,0.08)", border: "1px solid rgba(224,90,90,0.25)", padding: "12px 14px" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#e05a5a" }}>⚠️ {loginError}</p>
                </div>
              )}
              <button className="btn-primary" style={{ width: "100%", marginTop: 4 }} onClick={handleAdminLogin}>Ingresar</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN — Panel */}
      {view === "admin" && isAdminLogged && (
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "50px 24px" }}>
          <span className="section-tag">Panel administrativo</span>
          <div className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 900 }}>Inscriptos</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#555" }}>{loading ? "..." : `${totalStudents} alumnos`}</span>
              <button style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18 }} onClick={loadStudents} title="Actualizar">🔄</button>
              <button className="btn-danger" onClick={handleAdminLogout}>Salir</button>
            </div>
          </div>

          {dbError && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#e05a5a", marginBottom: 16 }}>{dbError}</p>}

          <div style={{ borderBottom: "1px solid #2a2a2a", marginBottom: 28, display: "flex", gap: 4 }}>
            <button className={`tab-btn ${adminView === "list" ? "active" : ""}`} onClick={() => setAdminView("list")}>Lista</button>
            <button className={`tab-btn ${adminView === "stats" ? "active" : ""}`} onClick={() => setAdminView("stats")}>Estadísticas</button>
          </div>

          {adminView === "list" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {[{ id: "all", label: "Todos" }, ...SPORTS].map((f) => (
                  <button key={f.id} onClick={() => setAdminFilter(f.id)}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "7px 16px", cursor: "pointer", border: "1px solid", transition: "all 0.2s",
                      borderColor: adminFilter === f.id ? "#f0ece4" : "#2a2a2a",
                      background: adminFilter === f.id ? "#f0ece4" : "transparent",
                      color: adminFilter === f.id ? "#0f0f0f" : "#888" }}>
                    {f.icon && <span style={{ marginRight: 5 }}>{f.icon}</span>}{f.label || f.name}
                  </button>
                ))}
              </div>
              <div className="table-scroll" style={{ border: "1px solid #1f1f1f", overflow: "hidden" }}>
                {loading ? (
                  <div style={{ padding: 40, textAlign: "center" }}><span className="spinner" /></div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>DNI</th>
                        <th>Edad</th>
                        <th>Categoría</th>
                        <th>Deporte</th>
                        <th>Tutor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => {
                        const age = getAge(s.dob);
                        const sport = SPORTS.find((sp) => sp.id === s.sport);
                        const cat = CATEGORIES.find((c) => c.id === s.category);
                        return (
                          <tr key={s.id}>
                            <td style={{ color: "#f0ece4", fontWeight: 500 }}>{s.name}</td>
                            <td>{s.dni}</td>
                            <td>{age} años</td>
                            <td><span className="badge" style={{ background: "#1f1f1f", color: "#aaa" }}>{cat?.label}</span></td>
                            <td><span className="badge" style={{ background: sport?.color + "22", color: sport?.color }}>{sport?.icon} {sport?.name}</span></td>
                            <td style={{ fontSize: 12 }}>
                              <div>{s.tutor}</div>
                              <div style={{ color: "#555" }}>{s.tutor_phone}</div>
                            </td>
                            <td>
                              <button onClick={() => setConfirmDelete(s.id)}
                                style={{ background: "none", border: "1px solid #3a1a1a", color: "#e05a5a",
                                  cursor: "pointer", padding: "6px 10px", fontSize: 13, transition: "all 0.2s" }}
                                onMouseOver={e => e.target.style.background = "rgba(224,90,90,0.1)"}
                                onMouseOut={e => e.target.style.background = "none"}>
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", color: "#444", padding: 36 }}>Sin inscriptos</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {adminView === "stats" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {stats.map((sport) => (
                  <div key={sport.id} style={{ border: "1px solid #2a2a2a", background: "#141414", padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.1em", color: "#555", textTransform: "uppercase", marginBottom: 4 }}>{sport.name}</p>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{sport.count}</p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#555", marginTop: 2 }}>inscriptos</p>
                      </div>
                      <span style={{ fontSize: 28 }}>{sport.icon}</span>
                    </div>
                    {sport.byCategory.filter((c) => c.count > 0).map((cat) => (
                      <div key={cat.id} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", marginBottom: 3 }}>
                          <span>{cat.label}</span><span>{cat.count}</span>
                        </div>
                        <div className="stat-bar">
                          <div className="stat-fill" style={{ width: `${sport.count > 0 ? (cat.count / sport.count) * 100 : 0}%`, background: sport.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ border: "1px solid #2a2a2a", background: "#141414", padding: 26 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.1em", color: "#555", textTransform: "uppercase", marginBottom: 20 }}>Distribución por categoría</p>
                {CATEGORIES.map((cat) => {
                  const count = students.filter((s) => s.category === cat.id).length;
                  return (
                    <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 72, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", flexShrink: 0 }}>{cat.label}</div>
                      <div style={{ flex: 1, height: 8, background: "#1a1a1a" }}>
                        <div style={{ height: "100%", background: "#f0ece4", width: `${totalStudents > 0 ? (count / totalStudents) * 100 : 0}%`, transition: "width 0.6s" }} />
                      </div>
                      <div style={{ width: 24, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#f0ece4", textAlign: "right" }}>{count}</div>
                      <div style={{ width: 100, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444" }}>{cat.range}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
          <div style={{ background: "#141414", border: "1px solid #2a2a2a", padding: "36px 32px", maxWidth: 380, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>¿Eliminar inscripto?</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888", marginBottom: 28 }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#888",
                  padding: "12px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                style={{ flex: 1, background: "#e05a5a", border: "none", color: "#fff",
                  padding: "12px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
