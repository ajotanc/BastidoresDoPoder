import { ref, readonly, watch, type DeepReadonly, type Ref } from 'vue';
import { useRoute } from 'vue-router';

const STORAGE_KEY = 'bdp_developer_mode_hash';

/**
 * Lê o hash configurado no ambiente (.env).
 * Suporta tanto VITE_DEVELOPMENT_HASH quanto DEVELOPMENT_HASH.
 */
const EXPECTED_HASH = (
  (import.meta.env.VITE_DEVELOPMENT_HASH as string | undefined) ||
  (import.meta.env.DEVELOPMENT_HASH as string | undefined) ||
  ''
).trim();

// Estado reativo compartilhado (singleton global)
const isDeveloperState = ref<boolean>(false);
let isInitialized = false;

/**
 * Compara e valida se o hash informado confere com o esperado.
 */
function validateHash(candidate: string | null | undefined): boolean {
  if (!candidate || !EXPECTED_HASH) return false;
  return candidate.trim() === EXPECTED_HASH;
}

/**
 * Lê do storage local/sessão se já foi autenticado anteriormente.
 */
function checkPersistedAuth(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return validateHash(saved);
  } catch {
    return false;
  }
}

/**
 * Persiste ou remove a credencial de desenvolvedor no storage.
 */
function setPersistedAuth(validHash: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (validHash) {
      localStorage.setItem(STORAGE_KEY, validHash);
      sessionStorage.setItem(STORAGE_KEY, validHash);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Falha silenciosa caso o storage esteja restrito
  }
}

/**
 * Remove parâmetros sensíveis da query da URL sem recarregar a página.
 */
function cleanUrlParam(paramName: string): void {
  if (typeof window === 'undefined' || !window.location.search) return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has(paramName)) {
      url.searchParams.delete(paramName);
      const newQuery = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';
      const newUrl = url.pathname + newQuery + url.hash;
      window.history.replaceState(window.history.state, '', newUrl);
    }
  } catch {
    // Falha silenciosa de URL
  }
}

/**
 * Processa um hash vindo da URL (ex: ?hash=... ou ?dev=...)
 */
function processQueryCandidate(candidate: string | string[] | null | undefined): boolean {
  const value = Array.isArray(candidate) ? candidate[0] : candidate;
  if (!value) return false;

  // Permite revogar passando ?hash=clear ou ?hash=off
  if (value === 'clear' || value === 'off' || value === 'false') {
    setPersistedAuth(null);
    isDeveloperState.value = false;
    cleanUrlParam('hash');
    cleanUrlParam('dev');
    return false;
  }

  if (validateHash(value)) {
    setPersistedAuth(value);
    isDeveloperState.value = true;
    cleanUrlParam('hash');
    cleanUrlParam('dev');
    return true;
  }

  return false;
}

/**
 * Inicialização imediata ao carregar o módulo
 */
function initializeDeveloperState(): void {
  if (isInitialized) return;
  isInitialized = true;

  // 1. Verifica query string da URL no carregamento inicial
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    const urlHash = searchParams.get('hash') || searchParams.get('dev');
    if (urlHash) {
      processQueryCandidate(urlHash);
    }
  }

  // 2. Se não ativou por parâmetro, recupera credencial persistida
  if (!isDeveloperState.value) {
    isDeveloperState.value = checkPersistedAuth();
  }
}

// Executa a inicialização do singleton
initializeDeveloperState();

export interface DeveloperModeReturn {
  isDeveloper: DeepReadonly<Ref<boolean>>;
  enableDeveloperMode: (candidateHash: string) => boolean;
  disableDeveloperMode: () => void;
}

/**
 * Composable global reutilizável para verificação do modo desenvolvedor.
 */
export function useDeveloperMode(): DeveloperModeReturn {
  // Observa mudanças de rota caso executado dentro de componente Vue Router
  try {
    const route = useRoute();
    if (route) {
      watch(
        () => route.query,
        (query) => {
          const queryHash = query.hash || query.dev;
          if (queryHash) {
            processQueryCandidate(queryHash as string);
          }
        },
        { immediate: true }
      );
    }
  } catch {
    // Ambiente sem contexto de setup de rota ativo
  }

  const enableDeveloperMode = (candidateHash: string): boolean => {
    if (validateHash(candidateHash)) {
      setPersistedAuth(candidateHash);
      isDeveloperState.value = true;
      return true;
    }
    return false;
  };

  const disableDeveloperMode = (): void => {
    setPersistedAuth(null);
    isDeveloperState.value = false;
  };

  return {
    isDeveloper: readonly(isDeveloperState),
    enableDeveloperMode,
    disableDeveloperMode,
  };
}

/**
 * Plugin do Vue para registro global no main.ts via app.use(...)
 */
export const developerModePlugin = {
  install(app: import('vue').App): void {
    initializeDeveloperState();
    const router = app.config.globalProperties.$router as { beforeEach?: (guard: (to: { query: Record<string, string | string[] | undefined> }) => void) => void } | undefined;
    if (router && typeof router.beforeEach === 'function') {
      router.beforeEach((to) => {
        const queryHash = to.query.hash || to.query.dev;
        if (queryHash) {
          processQueryCandidate(queryHash);
        }
      });
    }
  },
};

// Permite usar tanto app.use(useDeveloperMode) quanto app.use(developerModePlugin)
useDeveloperMode.install = developerModePlugin.install;

