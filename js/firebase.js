/* ═══════════════════════════════════════════
   GEP — Gestão de Eventos Pro
   firebase.js — Conexão e sincronização
   ═══════════════════════════════════════════ */

/* ── Configuração Firebase ── */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBEHMRYp9dCzWFGoUeJQobZv3Qhk6I0UN8",
  authDomain:        "gep-pro-1214e.firebaseapp.com",
  projectId:         "gep-pro-1214e",
  storageBucket:     "gep-pro-1214e.firebasestorage.app",
  messagingSenderId: "55351979028",
  appId:             "1:55351979028:web:5398ff99aecb6125ed0b01"
};

/* ── Instâncias globais ── */
let firebaseApp  = null;
let firebaseAuth = null;
let firebaseDb   = null;

/* ── Inicializar Firebase ── */
function inicializarFirebase() {
  try {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.apps[0];
    }
    firebaseAuth = firebase.auth();
    firebaseDb   = firebase.firestore();
    console.log('✅ Firebase inicializado');
    return true;
  } catch (e) {
    console.error('❌ Erro ao inicializar Firebase:', e);
    return false;
  }
}

/* ══════════════════════════════════════
   AUTENTICAÇÃO
══════════════════════════════════════ */

/* Fazer login com e-mail e senha */
function fbLogin(email, senha) {
  return firebaseAuth.signInWithEmailAndPassword(email, senha);
}

/* Fazer logout */
function fbLogout() {
  return firebaseAuth.signOut();
}

/* Observar mudanças de autenticação */
function fbObservarAuth(callback) {
  return firebaseAuth.onAuthStateChanged(callback);
}

/* Enviar e-mail de redefinição de senha */
function fbRedefinirSenha(email) {
  return firebaseAuth.sendPasswordResetEmail(email);
}

/* ══════════════════════════════════════
   FIRESTORE — OPERAÇÕES BÁSICAS
══════════════════════════════════════ */

/* Salvar documento */
function fbSalvar(colecao, id, dados) {
  const doc = {
    ...dados,
    atualizadoEm: new Date().toISOString()
  };
  return firebaseDb.collection(colecao).doc(id).set(doc);
}

/* Buscar documento por ID */
function fbBuscar(colecao, id) {
  return firebaseDb.collection(colecao).doc(id).get()
    .then(doc => doc.exists ? { id: doc.id, ...doc.data() } : null);
}

/* Buscar todos os documentos de uma coleção */
function fbListar(colecao, filtros = []) {
  let query = firebaseDb.collection(colecao);
  filtros.forEach(f => {
    query = query.where(f.campo, f.op, f.valor);
  });
  return query.get().then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

/* Excluir documento */
function fbExcluir(colecao, id) {
  return firebaseDb.collection(colecao).doc(id).delete();
}

/* Observar coleção em tempo real */
function fbObservar(colecao, filtros = [], callback) {
  let query = firebaseDb.collection(colecao);
  filtros.forEach(f => {
    query = query.where(f.campo, f.op, f.valor);
  });
  return query.onSnapshot(snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

/* ══════════════════════════════════════
   USUÁRIOS NO FIRESTORE
══════════════════════════════════════ */

/* Buscar perfil do usuário pelo UID do Firebase Auth */
function fbBuscarPerfil(uid) {
  return fbBuscar('usuarios', uid);
}

/* Salvar perfil do usuário */
function fbSalvarPerfil(uid, dados) {
  return fbSalvar('usuarios', uid, dados);
}

/* Listar todos os usuários (só admin) */
function fbListarUsuarios() {
  return fbListar('usuarios');
}

/* ══════════════════════════════════════
   CONFIGURAÇÃO DO SISTEMA
══════════════════════════════════════ */

/* Buscar configuração (manutenção, etc.) */
function fbBuscarConfig() {
  return fbBuscar('config', 'sistema');
}

/* Salvar configuração */
function fbSalvarConfig(dados) {
  return fbSalvar('config', 'sistema', dados);
}

/* Observar configuração em tempo real (para modo manutenção) */
function fbObservarConfig(callback) {
  return firebaseDb.collection('config').doc('sistema')
    .onSnapshot(doc => {
      callback(doc.exists ? doc.data() : null);
    });
}

/* ── Exportar ── */
window.GepFirebase = {
  inicializar: inicializarFirebase,
  login:        fbLogin,
  logout:       fbLogout,
  observarAuth: fbObservarAuth,
  redefinirSenha: fbRedefinirSenha,
  salvar:       fbSalvar,
  buscar:       fbBuscar,
  listar:       fbListar,
  excluir:      fbExcluir,
  observar:     fbObservar,
  buscarPerfil: fbBuscarPerfil,
  salvarPerfil: fbSalvarPerfil,
  listarUsuarios: fbListarUsuarios,
  buscarConfig:   fbBuscarConfig,
  salvarConfig:   fbSalvarConfig,
  observarConfig: fbObservarConfig,
  get db()   { return firebaseDb; },
  get auth() { return firebaseAuth; }
};
